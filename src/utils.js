import Pixelbin, { transformations } from "@pixelbin/core";
import { PixelbinClient, PixelbinConfig } from "@pixelbin/admin";
import axios from "axios";
import photoshop from "photoshop";
import uxp from "uxp";
import { constants } from "./constants";

// async function getSmartObjectInfo(layerId, docId) {
//     const [res] = await require("photoshop").action.batchPlay(
//         [
//             {
//                 _obj: "get",
//                 _target: [
//                     { _ref: "layer", _id: layerId },
//                     { _ref: "document", _id: docId },
//                 ],
//             },
//         ],
//         { synchronousExecution: false }
//     );

//     if (res.hasOwnProperty("smartObjectMore")) {
//         console.log(res.smartObjectMore);
//     } else {
//         console.error("Layer with id " + layerId + " is not a smart object");
//     }
// }

async function changeLayerPosition(sourceLayer, targetBounds) {
    await photoshop.app.batchPlay(
        [
            {
                _obj: "select",
                _target: [
                    {
                        _ref: "layer",
                        _name: sourceLayer.name,
                    },
                ],
                makeVisible: false,
                layerID: [sourceLayer.id],
                _isCommand: false,
            },
            {
                _obj: "move",
                _target: [
                    {
                        _ref: "layer",
                        _enum: "ordinal",
                        _value: "targetEnum",
                    },
                ],
                to: {
                    _obj: "offset",
                    horizontal: {
                        _unit: "pixelsUnit",
                        _value: targetBounds.left,
                    },
                    vertical: {
                        _unit: "pixelsUnit",
                        _value: targetBounds.top,
                    },
                },
                _options: {
                    dialogOptions: "dontDisplay",
                },
            },
            {
                _obj: "selectNoLayers",
                _target: [
                    {
                        _ref: "layer",
                        _enum: "ordinal",
                        _value: "targetEnum",
                    },
                ],
                _options: {
                    dialogOptions: "dontDisplay",
                },
            },
        ],
        {}
    );
}

function base64ToArrayBuffer(base64) {
    const binaryString = window.atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);

    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }

    return bytes.buffer;
}

const wait = (ms) => new Promise((res) => setTimeout(res, ms));

const MAX_RETRIES = 3;

export async function fetchLazyTransformation(url, attempt = 0) {
    let response;

    try {
        response = await axios.get(url, { responseType: "arraybuffer" });
    } catch (error) {
        if (error.response) {
            // response would be a arraybuffer, hence parsing
            const blob = new Blob([error.response.data]);
            const parsedError = JSON.parse(await blob.text());

            throw Error(parsedError.message);
        }

        throw error;
    }

    if (response.status === 202) {
        if (attempt > MAX_RETRIES) {
            throw Error("Your transformation took too long to process");
        }

        await wait(2 ** attempt * 500); // Will retry after 500, 1000, 2000 ... milliseconds, upto 2 minutes

        return await fetchLazyTransformation(url, attempt + 1);
    }

    return response;
}

export const applyTransformation = async ({
    appOrgDetails,
    parameters,
    token,
}) => {
    const config = new PixelbinConfig({
        domain: constants.urls.apiDomain,
        apiSecret: token,
    });

    const pixelbin = new PixelbinClient(config);

    const { activeLayers } = photoshop.app.activeDocument;

    if (!activeLayers.length) {
        throw Error("No layer selected");
    }

    if (activeLayers.length > 1) {
        throw Error("Only one layer can be selected for transformation");
    }

    const originalImageLayer = activeLayers.at(0);

    // errors are not properly thrown from inside executeAsModal function
    // ref: https://forums.creativeclouddeveloper.com/t/bug-errors-thrown-inside-of-executeasmodal-are-being-converted-to-strings/5431
    let modalError = null;

    await photoshop.core.executeAsModal(
        async (executionContext) => {
            const suspensionID =
                await executionContext.hostControl.suspendHistory({
                    documentID: originalImageLayer._docId,
                    name: "Watermarkremover.io",
                });

            try {
                // await getSmartObjectInfo(
                //     originalImageLayer._id,
                //     originalImageLayer._docId
                // );

                const originalImagePixels = await photoshop.imaging.getPixels({
                    layerID: originalImageLayer._id,
                    applyAlpha: true, // for image types with transparent backgrounds that cannot be handled by encodeImageData function below
                });

                const jpegData = await photoshop.imaging.encodeImageData({
                    imageData: originalImagePixels.imageData,
                    base64: true,
                });

                const imageBuffer = base64ToArrayBuffer(jpegData);
                const imageName = originalImageLayer.name + ".jpeg";

                const folder =
                    await uxp.storage.localFileSystem.getTemporaryFolder();

                const uploadImageFile = await folder.createFile(imageName, {
                    overwrite: true,
                });

                await uploadImageFile.write(imageBuffer, {
                    format: uxp.storage.formats.binary,
                });

                const { presignedUrl } =
                    await pixelbin.assets.createSignedUrlV2({
                        path: "__photoshop/__watermarkremover.io",
                        format: "jpeg",
                        filenameOverride: true,
                    });

                await Pixelbin.upload(imageBuffer, presignedUrl);

                const { fileId } = JSON.parse(
                    presignedUrl.fields["x-pixb-meta-assetdata"]
                );

                // const data = await pixelbin.assets.getFileByFileId({ fileId });

                const pixelbinCore = new Pixelbin({
                    cloudName: appOrgDetails.org.cloudName,
                });
                const pixelbinImage = pixelbinCore.image(fileId);
                const transformation =
                    transformations.WatermarkRemoval.remove(parameters);
                pixelbinImage.setTransformation(transformation);

                const transformationURL = pixelbinImage.getUrl();

                const { data: transformedImageBuffer } =
                    await fetchLazyTransformation(transformationURL);

                const transformedImageFile = await folder.createFile(
                    originalImageLayer.name + " - transformed",
                    { overwrite: true }
                );

                await transformedImageFile.write(transformedImageBuffer, {
                    format: uxp.storage.formats.binary,
                });

                const currentDocument = photoshop.app.activeDocument;
                const newDocument = await photoshop.app.open(
                    transformedImageFile
                );

                const transformedImageLayer = await newDocument.activeLayers
                    .at(0)
                    .duplicate(currentDocument);

                await newDocument.close(
                    photoshop.constants.SaveOptions.DONOTSAVECHANGES
                );

                transformedImageLayer.name =
                    originalImageLayer.name + " - transformed";

                await changeLayerPosition(
                    transformedImageLayer,
                    originalImageLayer.bounds
                );

                transformedImageLayer.move(
                    originalImageLayer,
                    photoshop.constants.ElementPlacement.PLACEBEFORE
                );

                originalImagePixels.imageData.dispose();

                originalImageLayer.visible = false;
            } catch (error) {
                modalError = error;
            }

            await executionContext.hostControl.resumeHistory(suspensionID);
        },
        { interactive: true }
    );

    if (modalError) {
        throw modalError;
    }
};

export const handle = (promise) => {
    return promise.then((data) => [data, null]).catch((error) => [null, error]);
};

export const getUsage = (token) => {
    const config = new PixelbinConfig({
        domain: constants.urls.apiDomain,
        apiSecret: token,
    });

    const pixelbin = new PixelbinClient(config);

    return pixelbin.billing.getUsage();
};

export function abbreviateNumber(number) {
    if (!number) return number;

    const SI_SYMBOL = ["", "K", "M", "G", "T", "P", "E"];

    // what tier? (determines SI symbol)
    const tier = Math.floor(Math.log10(Math.abs(number)) / 3);

    // if zero, we don't need a suffix
    if (tier == 0) return number;

    // get suffix and determine scale
    const suffix = SI_SYMBOL[tier];
    const scale = Math.pow(10, tier * 3);

    // scale the number
    const scaled = number / scale;

    // format number and add suffix
    return parseFloat(scaled.toFixed(1)) + suffix;
}

const parseJSON = (value) => {
    try {
        return JSON.parse(value);
    } catch (error) {
        return value;
    }
};

export const storage = {
    getItem(name) {
        const value = localStorage.getItem(name);
        return value ? parseJSON(value) : undefined;
    },
    setItem(name, value) {
        localStorage.setItem(name, JSON.stringify(value));
    },
};
