import Pixelbin, { transformations } from "@pixelbin/core";
import { PixelbinClient, PixelbinConfig } from "@pixelbin/admin";
import axios from "axios";
import photoshop from "photoshop";
import uxp from "uxp";
import { constants } from "./constants";

// async function getSmartObjectInfo(layerId, docId) {
//     const [res] = await photoshop.action.batchPlay(
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

export function getActiveDoc() {
    return photoshop.app.activeDocument;
}

export function getActiveLayer() {
    return getActiveDoc().activeLayers.at(0);
}

export function getLayer(lyrId, docId) {
    return new photoshop.app.Layer(Number(lyrId), Number(docId));
}

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

export async function convertBoxesForSelectedLayer(boxLayerId) {
    let modalError = null;
    let returnValue = null;

    await photoshop.core.executeAsModal(
        async () => {
            try {
                const [boxLayer] = await photoshop.action.batchPlay(
                    [
                        {
                            _obj: "get",
                            _target: [
                                {
                                    _ref: "layer",
                                    _id: boxLayerId,
                                },
                            ],
                        },
                    ],
                    {}
                );

                const imageLayer = getActiveLayer();

                // check if box is within bounds
                const within =
                    boxLayer.boundsNoEffects.top._value >
                        imageLayer.boundsNoEffects.top &&
                    boxLayer.boundsNoEffects.left._value >
                        imageLayer.boundsNoEffects.left &&
                    boxLayer.boundsNoEffects.right._value <
                        imageLayer.boundsNoEffects.right &&
                    boxLayer.boundsNoEffects.bottom._value <
                        imageLayer.boundsNoEffects.bottom;

                if (!within) {
                    throw Error("Box(s) are outside the selected layer.");
                }

                const withinBox = {
                    top:
                        boxLayer.boundsNoEffects.top._value -
                        imageLayer.boundsNoEffects.top,
                    left:
                        boxLayer.boundsNoEffects.left._value -
                        imageLayer.boundsNoEffects.left,
                    right:
                        boxLayer.boundsNoEffects.right._value -
                        imageLayer.boundsNoEffects.left,
                    bottom:
                        boxLayer.boundsNoEffects.bottom._value -
                        imageLayer.boundsNoEffects.top,
                };

                returnValue = boxPixelsToPercent(
                    boundsToBoxInPixels(withinBox),
                    boundsToBoxInPixels(imageLayer.boundsNoEffects)
                );
            } catch (error) {
                modalError = error;
            }
        },
        { interactive: true }
    );

    if (modalError) {
        throw modalError;
    }

    return returnValue;
}

export function boundsToBoxInPixels(bounds, isDocument) {
    if (isDocument) {
        return {
            top: 0,
            left: 0,
            height: bounds.height,
            width: bounds.width,
        };
    }

    // layer bounds is respective to document
    return {
        top: bounds.top,
        left: bounds.left,
        height: bounds.bottom - bounds.top,
        width: bounds.right - bounds.left,
    };
}

export function boxPixelsToPercent(box, bounds) {
    return {
        top: Math.round((box.top / bounds.height) * 100),
        left: Math.round((box.left / bounds.width) * 100),
        height: Math.round((box.height / bounds.height) * 100),
        width: Math.round((box.width / bounds.width) * 100),
    };
}

export async function createBoxLayersGroup() {
    let modalError = null;
    let returnValue = null;

    await photoshop.core.executeAsModal(async () => {
        try {
            await photoshop.action.batchPlay(
                [
                    {
                        _obj: "selectNoLayers",
                        _target: [
                            {
                                _ref: "layer",
                                _enum: "ordinal",
                                _value: "targetEnum",
                            },
                        ],
                    },
                ],
                {}
            );

            const boxLayerGroup =
                await photoshop.app.activeDocument.createLayerGroup({
                    name: "WatermarkRemover.io - Boxes",
                });

            returnValue = boxLayerGroup.id;

            await photoshop.action.batchPlay(
                [
                    {
                        _obj: "selectNoLayers",
                        _target: [
                            {
                                _ref: "layer",
                                _enum: "ordinal",
                                _value: "targetEnum",
                            },
                        ],
                    },
                ],
                {}
            );
        } catch (error) {
            modalError = error;
        }
    });

    if (modalError) {
        throw modalError;
    }

    return returnValue;
}

export async function selectLayerById(layerId) {
    let modalError = null;

    await photoshop.core.executeAsModal(
        async () => {
            try {
                await photoshop.action.batchPlay(
                    [
                        {
                            _obj: "select",
                            _target: [
                                {
                                    _ref: "layer",
                                    _id: layerId,
                                },
                            ],
                        },
                    ],
                    {}
                );
            } catch (error) {
                modalError = error;
            }
        },
        { interactive: true }
    );

    if (modalError) {
        throw modalError;
    }
}

export async function deleteLayerById(lyrId, docId) {
    let modalError = null;

    await photoshop.core.executeAsModal(
        () => {
            try {
                getLayer(lyrId, docId)?.delete();
            } catch (error) {
                modalError = error;
            }
        },
        { interactive: true }
    );

    if (modalError) {
        throw modalError;
    }
}

export async function drawBoxLayer(identifier, boxLayersGroupId) {
    const activeDocument = getActiveDoc();

    const shapeBounds = {
        top: 0,
        left: 0,
        bottom: activeDocument.height,
        right: activeDocument.width,
    };

    let modalError = null;
    let returnValue = { layerID: null, box: {} };

    await photoshop.core.executeAsModal(
        async (executionContext) => {
            const suspensionID =
                await executionContext.hostControl.suspendHistory({
                    documentID: activeDocument.id,
                    name: "WatermarkRemover.io - Draw " + identifier,
                });

            try {
                await photoshop.action.batchPlay(
                    [
                        {
                            _obj: "select",
                            _target: [
                                {
                                    _ref: "layer",
                                    _id: boxLayersGroupId,
                                },
                            ],
                        },
                    ],
                    {}
                );

                await photoshop.action.batchPlay(
                    [
                        {
                            _obj: "select",
                            _target: {
                                _ref: "rectangleTool",
                            },
                            dontRecord: true,
                        },
                    ],
                    {}
                );

                await photoshop.action.batchPlay(
                    [
                        {
                            _obj: "make",
                            _target: [{ _ref: "contentLayer" }],
                            using: {
                                _obj: "contentLayer",
                                type: {
                                    _obj: "solidColorLayer",
                                    color: {
                                        _obj: "RGBColor",
                                        red: 255,
                                        grain: 255,
                                        blue: 255,
                                    },
                                },
                                shape: {
                                    _obj: "rectangle",
                                    unitValueQuadVersion: 1,
                                    top: {
                                        _unit: "pixelsUnit",
                                        _value: shapeBounds.top,
                                    },
                                    left: {
                                        _unit: "pixelsUnit",
                                        _value: shapeBounds.left,
                                    },
                                    bottom: {
                                        _unit: "pixelsUnit",
                                        _value: shapeBounds.bottom,
                                    },
                                    right: {
                                        _unit: "pixelsUnit",
                                        _value: shapeBounds.right,
                                    },
                                },
                                strokeStyle: {
                                    _obj: "strokeStyle",
                                    strokeStyleVersion: 2,
                                    strokeEnabled: true,
                                    fillEnabled: true,
                                    strokeStyleLineWidth: {
                                        _unit: "pixelsUnit",
                                        _value: 4,
                                    },
                                    strokeStyleLineDashOffset: {
                                        _unit: "pointsUnit",
                                        _value: 0,
                                    },
                                    strokeStyleMiterLimit: 100,
                                    strokeStyleLineCapType: {
                                        _enum: "strokeStyleLineCapType",
                                        _value: "strokeStyleButtCap",
                                    },
                                    strokeStyleLineJoinType: {
                                        _enum: "strokeStyleLineJoinType",
                                        _value: "strokeStyleMiterJoin",
                                    },
                                    strokeStyleLineAlignment: {
                                        _enum: "strokeStyleLineAlignment",
                                        _value: "strokeStyleAlignInside",
                                    },
                                    strokeStyleScaleLock: false,
                                    strokeStyleStrokeAdjust: false,
                                    strokeStyleLineDashSet: [
                                        {
                                            _unit: "noneUnit",
                                            _value: 4,
                                        },
                                        {
                                            _unit: "noneUnit",
                                            _value: 2,
                                        },
                                    ],
                                    strokeStyleBlendMode: {
                                        _enum: "blendMode",
                                        _value: "normal",
                                    },
                                    strokeStyleOpacity: {
                                        _unit: "percentUnit",
                                        _value: 100,
                                    },
                                    strokeStyleContent: {
                                        _obj: "solidColorLayer",
                                        color: {
                                            _obj: "RGBColor",
                                            red: 0,
                                            grain: 0,
                                            blue: 0,
                                        },
                                    },
                                    strokeStyleResolution: 72,
                                },
                            },
                        },
                    ],
                    {}
                );

                await photoshop.action.batchPlay(
                    [
                        {
                            _obj: "set",
                            _target: [
                                {
                                    _ref: "layer",
                                    _enum: "ordinal",
                                    _value: "targetEnum",
                                },
                            ],
                            to: {
                                _obj: "layer",
                                opacity: {
                                    _unit: "percentUnit",
                                    _value: 30,
                                },
                            },
                        },
                    ],
                    {}
                );

                const boxLayer = getActiveLayer();

                boxLayer.name = identifier;

                returnValue = {
                    layerID: boxLayer.id,
                    box: boxPixelsToPercent(
                        boundsToBoxInPixels(activeDocument, true),
                        boundsToBoxInPixels(activeDocument, true)
                    ),
                };
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

    return returnValue;
}

export const applyTransformation = async ({
    appOrgDetails,
    parameters,
    token,
}) => {
    // errors are not properly thrown from inside executeAsModal function
    // ref: https://forums.creativeclouddeveloper.com/t/bug-errors-thrown-inside-of-executeasmodal-are-being-converted-to-strings/5431
    let modalError = null;

    await photoshop.core.executeAsModal(
        async (executionContext) => {
            const originalImageLayer =
                photoshop.app.activeDocument.activeLayers.at(0);

            const suspensionID =
                await executionContext.hostControl.suspendHistory({
                    documentID: originalImageLayer._docId,
                    name: "WatermarkRemover.io",
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

                const config = new PixelbinConfig({
                    domain: constants.urls.apiDomain,
                    apiSecret: token,
                });

                const pixelbin = new PixelbinClient(config);

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
