import React, { useCallback, useEffect, useState } from "react";
import photoshop from "photoshop";

import { HelpIcon, RefreshIcon } from "./Icons";
import {
    getUsage,
    applyTransformation,
    drawBoxLayer,
    createBoxLayersGroup,
    getActiveDoc,
    boxPixelsToPercent,
    boundsToBoxInPixels,
    convertBoxesForSelectedLayer,
    selectLayerById,
    deleteLayerById,
    getLayer,
} from "../utils";
import { CommandController } from "../controllers/CommandController";
import { ErrorAlertDialog } from "./ErrorAlertDialog";
import Loader from "./Loader";
import { CreditsInformation } from "./CreditsInformation";
import { constants } from "../constants";
import InputField from "./InputField";
import AccordionItem from "./AccordionItem";

const styles = {
    loadingBackdrop: {
        position: "fixed",
        height: "100%",
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0, 0, 0, 0.9)",
    },
    header: {
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "2rem",
    },
    wrapper: {
        display: "flex",
        flexDirection: "column",
        height: "100%",
        position: "relative",
        padding: "1rem",
    },
    footer: {
        marginTop: "2rem",
        display: "flex",
        flexDirection: "column",
    },
    actions: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "1rem",
        width: "100%",
        marginTop: "auto",
    },
    form: {
        flex: 1,
        display: "flex",
        flexDirection: "column",
        margin: "-16px -12px",
        padding: "16px",
        borderRadius: "4px",
        border: "0.5px solid var(--uxp-host-text-color-secondary)",
    },
    fields: {
        flex: 1,
        marginBottom: "1.5rem",
        display: "flex",
        flexDirection: "column",
    },
    helpIcon: {
        fill: "currentcolor",
        marginRight: "0.2rem",
        display: "inline-block",
    },
    helpLink: {
        display: "flex",
        alignItems: "center",
        alignSelf: "end",
        marginTop: "1rem",
        color: "var(--uxp-host-text-color)",
        fontSize: "var(--uxp-host-font-size)",
    },
    productFullLogo: {
        display: "flex",
        alignItems: "center",
        color: "var(--uxp-host-text-color)",
        fontSize: "20px",
    },
    productLogo: { height: "28px", marginRight: "0.2rem" },
    resetButton: { padding: 0 },
};

const params = [
    {
        name: "Remove Text",
        type: "boolean",
        default: false,
        identifier: "removeText",
        title: "Remove text",
    },
    {
        name: "Remove Logo",
        type: "boolean",
        default: false,
        identifier: "removeLogo",
        title: "Remove logo",
    },
];

const advancedParams = [
    {
        name: "Box 1",
        tooltip:
            "(x-axis_y-axis_width_height) if not applying use: 0_0_0_0 & on full image use: 0_0_100_100",
        type: "string",
        default: "",
        maxLength: 255,
        identifier: "box1",
        title: "Box 1",
    },
    {
        name: "Box 2",
        tooltip:
            "(x-axis_y-axis_width_height) if not applying use: 0_0_0_0 & on full image use: 0_0_100_100",
        type: "string",
        default: "",
        maxLength: 255,
        identifier: "box2",
        title: "Box 2",
    },
    {
        name: "Box 3",
        tooltip:
            "(x-axis_y-axis_width_height) if not applying use: 0_0_0_0 & on full image use: 0_0_100_100",
        type: "string",
        default: "",
        maxLength: 255,
        identifier: "box3",
        title: "Box 3",
    },
    {
        name: "Box 4",
        tooltip:
            "(x-axis_y-axis_width_height) if not applying use: 0_0_0_0 & on full image use: 0_0_100_100",
        type: "string",
        default: "",
        maxLength: 255,
        identifier: "box4",
        title: "Box 4",
    },
    {
        name: "Box 5",
        tooltip:
            "(x-axis_y-axis_width_height) if not applying use: 0_0_0_0 & on full image use: 0_0_100_100",
        type: "string",
        default: "",
        maxLength: 255,
        identifier: "box5",
        title: "Box 5",
    },
];

const defaultParamValues = {};

for (const param of [...params, ...advancedParams]) {
    defaultParamValues[param.identifier] = param.default;
}

const stringifyBox = (box) => {
    // left_top_width_height
    return `${box.left}_${box.top}_${box.width}_${box.height}`;
};

export const Home = ({
    appOrgDetails,
    token,
    filters = defaultParamValues,
    setFilters,
    biref,
}) => {
    const [formValues, setFormValues] = useState(filters);
    const [loading, setLoading] = useState(false);
    const [usage, setUsage] = useState({
        credits: { used: 0 },
        total: { credits: 0 },
    });
    /**
     * {
     *      [docId_1]: {
     *          groupId: "",
     *          boxIds: {
     *              box1: "",
     *              box2: "",
     *              box3: "",
     *              box4: "",
     *              box5: "",
     *          }
     *      }
     *      ...
     * }
     */
    const [docsBoxIds, setDocsBoxIds] = useState({});

    const updateUsage = useCallback(
        () => getUsage(token).then(setUsage),
        [token]
    );

    useEffect(() => {
        updateUsage();
    }, [updateUsage]);

    const removeBoxLayers = useCallback(async () => {
        for (const [docId, docValue] of Object.entries(docsBoxIds)) {
            Object.values(docValue.boxIds).forEach(
                async (boxId) => await deleteLayerById(boxId, docId)
            );

            await deleteLayerById(docValue.groupId, docId);
        }
    }, [docsBoxIds]);

    useEffect(() => {
        biref.removeBoxLayers = removeBoxLayers;
    }, [biref, removeBoxLayers]);

    const getOrCreateDocBoxIds = () => {
        const activeDoc = getActiveDoc();

        let docBoxIds = docsBoxIds[activeDoc.id];

        if (!docBoxIds) {
            docBoxIds = { groupId: null, boxIds: {} };

            setDocsBoxIds((docsBoxIds) => ({
                ...docsBoxIds,
                [activeDoc.id]: docBoxIds,
            }));
        }

        return docBoxIds;
    };

    const layerExists = (lyrId, docId) => {
        try {
            // .visible throws error if layer is not found
            getLayer(lyrId, docId).visible;
            return true;
        } catch (err) {
            return false;
        }
    };

    const getLayerBox = (lyrId, docId) => {
        const lyr = getLayer(lyrId, docId);

        const newBox = boxPixelsToPercent(
            boundsToBoxInPixels(lyr.boundsNoEffects),
            boundsToBoxInPixels(getActiveDoc(), true)
        );

        return stringifyBox(newBox);
    };

    useEffect(() => {
        const listener = () => {
            const docBoxes = getOrCreateDocBoxIds();

            const paramsFormValues = {};

            for (const { identifier } of params) {
                params[identifier] = filters[identifier];
            }

            const advancedParamsFormValues = {};
            const activeDoc = getActiveDoc();

            for (let [identifier, lyrId] of Object.entries(docBoxes.boxIds)) {
                if (layerExists(lyrId, activeDoc.id)) {
                    advancedParamsFormValues[identifier] = getLayerBox(
                        lyrId,
                        activeDoc.id
                    );
                }
            }

            setFormValues({
                ...paramsFormValues,
                ...advancedParamsFormValues,
            });
        };

        photoshop.action.addNotificationListener(
            ["layersFiltered", "historyStateChanged"],
            listener
        );

        return () =>
            photoshop.action.removeNotificationListener(
                ["layersFiltered", "historyStateChanged"],
                listener
            );
    }, [docsBoxIds]);

    const handleApply = async (e) => {
        e.preventDefault();

        setLoading(true);

        try {
            const { activeLayers } = photoshop.app.activeDocument;

            if (!activeLayers.length) {
                throw Error("No layer selected");
            }

            if (activeLayers.length > 1) {
                throw Error(
                    "Only one layer can be selected for transformation"
                );
            }

            const convertedBoxes = {};
            const activeDoc = getActiveDoc();

            for (const [identifier, boxLayerId] of Object.entries(
                docsBoxIds[activeDoc.id].boxIds
            )) {
                convertedBoxes[identifier] = stringifyBox(
                    await convertBoxesForSelectedLayer(boxLayerId)
                );
            }

            await applyTransformation({
                appOrgDetails,
                parameters: { ...formValues, ...convertedBoxes },
                token,
            });

            updateUsage();

            // only save simple params values
            const savedFilters = {};

            for (const param of params) {
                savedFilters[param.identifier] = formValues[param.identifier];
            }

            setFilters(savedFilters);
        } catch (error) {
            const errorAlertDialogController = new CommandController(
                ({ dialog }) => (
                    <ErrorAlertDialog
                        dialog={dialog}
                        error={error?.message || "Something went wrong"}
                    />
                ),
                { id: "Transformation error" }
            );

            await errorAlertDialogController.run();
        } finally {
            setLoading(false);
        }
    };

    const handleResetClick = async (key) => {
        const isAdvancedIdentifier = advancedParams.find(
            (param) => param.identifier === key
        );

        if (isAdvancedIdentifier) {
            const activeDoc = getActiveDoc();
            const docBoxIds = docsBoxIds[activeDoc.id];

            if (docBoxIds) {
                const [identifier, lyrId] = Object.entries(
                    docBoxIds.boxIds
                ).find(([identifier]) => identifier === key);

                if (layerExists(lyrId, activeDoc.id)) {
                    await deleteLayerById(lyrId, activeDoc.id);

                    const newDocsBoxIds = JSON.parse(
                        JSON.stringify(docsBoxIds)
                    );
                    delete newDocsBoxIds[activeDoc.id].boxIds[identifier];

                    setDocsBoxIds(newDocsBoxIds);
                }
            }
        }

        setFormValues((formValues) => ({
            ...formValues,
            [key]: filters[key],
        }));
    };

    const handleResetAll = async () => {
        const activeDoc = getActiveDoc();
        const docBoxIds = docsBoxIds[activeDoc.id];

        if (docBoxIds) {
            for (const [, lyrId] of Object.entries(docBoxIds.boxIds)) {
                if (layerExists(lyrId, activeDoc.id)) {
                    await deleteLayerById(lyrId, activeDoc.id);
                }
            }

            if (layerExists(docBoxIds.groupId, activeDoc.id)) {
                await deleteLayerById(docBoxIds.groupId, activeDoc.id);
            }

            const newDocsBoxIds = JSON.parse(JSON.stringify(docsBoxIds));
            delete newDocsBoxIds[activeDoc.id];
            setDocsBoxIds(newDocsBoxIds);
        }

        setFormValues(filters);
    };

    if (loading) {
        return (
            <div style={styles.loadingBackdrop}>
                <Loader />
            </div>
        );
    }

    const handleDrawClick = async (identifier) => {
        const activeDoc = getActiveDoc();

        const docBoxIds = getOrCreateDocBoxIds();

        let { groupId } = docBoxIds;

        if (!groupId) {
            groupId = await createBoxLayersGroup();

            setDocsBoxIds((docsBoxIds) => ({
                ...docsBoxIds,
                [activeDoc.id]: {
                    ...docsBoxIds[activeDoc.id],
                    groupId,
                },
            }));
        }

        if (!docBoxIds.boxIds[identifier]) {
            const box = await drawBoxLayer(identifier, groupId);

            setDocsBoxIds((docsBoxIds) => ({
                ...docsBoxIds,
                [activeDoc.id]: {
                    ...docsBoxIds[activeDoc.id],
                    boxIds: {
                        ...docsBoxIds[activeDoc.id].boxIds,
                        [identifier]: box.layerID,
                    },
                },
            }));

            setFormValues((formValues) => ({
                ...formValues,
                [identifier]: stringifyBox(box.box),
            }));
        }
    };

    const handleLabelClick = async (identifier) => {
        const activeDoc = getActiveDoc();
        const boxLayerId = docsBoxIds[activeDoc.id].boxIds[identifier];

        await selectLayerById(boxLayerId);
    };

    const handleChange = async (key, value) => {
        setFormValues({ ...formValues, [key]: value });
    };

    return (
        <div style={styles.wrapper}>
            <header style={styles.header}>
                <a
                    href={constants.urls.pluginHomePage}
                    style={styles.productFullLogo}
                >
                    <img
                        style={styles.productLogo}
                        src="./icons/watermarkremover.png"
                    />
                    WatermarkRemover.io
                </a>
                <a href={constants.urls.pluginDoc} style={styles.helpLink}>
                    <span style={styles.helpIcon}>
                        <HelpIcon />
                    </span>
                    How it works?
                </a>
            </header>

            <main style={styles.form}>
                <div style={styles.fields}>
                    {params.map((param) => (
                        <InputField
                            key={param.identifier}
                            value={formValues[param.identifier]}
                            param={param}
                            handleChange={handleChange}
                            handleResetClick={handleResetClick}
                        />
                    ))}

                    <AccordionItem>
                        {advancedParams.map((param) => {
                            const doc = getActiveDoc();

                            const layerIdExists =
                                docsBoxIds[doc.id]?.boxIds[param.identifier];

                            // layer exists in photoshop because 'formValues' is synced with layers
                            const value = formValues[param.identifier];

                            const boxDrawn = layerIdExists && value;

                            return (
                                <InputField
                                    key={param.identifier}
                                    value={formValues[param.identifier]}
                                    param={param}
                                    handleChange={handleChange}
                                    handleResetClick={handleResetClick}
                                    handleDrawClick={handleDrawClick}
                                    handleLabelClick={handleLabelClick}
                                    drawButtonDisabled={boxDrawn}
                                    disabled={true}
                                />
                            );
                        })}
                    </AccordionItem>
                </div>

                <div style={styles.actions}>
                    <sp-action-button
                        variant="secondary"
                        onClick={handleResetAll}
                        quiet
                        style={styles.resetButton}
                    >
                        <div slot="icon">
                            <RefreshIcon />
                        </div>
                        <span>Reset all</span>
                    </sp-action-button>
                    <sp-button
                        onClick={handleApply}
                        disabled={loading ? true : undefined}
                    >
                        Apply
                    </sp-button>
                </div>
            </main>

            <footer style={styles.footer}>
                <CreditsInformation
                    appOrgDetails={appOrgDetails}
                    usage={usage}
                />
            </footer>
        </div>
    );
};
