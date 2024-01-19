import React, { useEffect, useState } from "react";

import { HelpIcon, RefreshIcon } from "./Icons";
import { getUsage, handle, applyTransformation } from "../utils";
import { CommandController } from "../controllers/CommandController";
import { ErrorAlertDialog } from "./ErrorAlertDialog";
import Loader from "./Loader";
import { CreditsInformation } from "./CreditsInformation";
import { constants } from "../constants";
import InputField from "./InputField";

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
        border: "0.2px solid var(--uxp-host-text-color-secondary)",
    },
    fields: {
        overflow: "auto",
        marginBottom: "1.5rem",
        marginRight: "-16px",
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
    {
        name: "Box 1",
        tooltip:
            "(x-axis_y-axis_width_height) if not applying use: 0_0_0_0 & on full image use: 0_0_100_100",
        type: "string",
        default: "0_0_100_100",
        maxLength: 255,
        identifier: "box1",
        title: "Box 1",
    },
    {
        name: "Box 2",
        tooltip:
            "(x-axis_y-axis_width_height) if not applying use: 0_0_0_0 & on full image use: 0_0_100_100",
        type: "string",
        default: "0_0_0_0",
        maxLength: 255,
        identifier: "box2",
        title: "Box 2",
    },
    {
        name: "Box 3",
        tooltip:
            "(x-axis_y-axis_width_height) if not applying use: 0_0_0_0 & on full image use: 0_0_100_100",
        type: "string",
        default: "0_0_0_0",
        maxLength: 255,
        identifier: "box3",
        title: "Box 3",
    },
    {
        name: "Box 4",
        tooltip:
            "(x-axis_y-axis_width_height) if not applying use: 0_0_0_0 & on full image use: 0_0_100_100",
        type: "string",
        default: "0_0_0_0",
        maxLength: 255,
        identifier: "box4",
        title: "Box 4",
    },
    {
        name: "Box 5",
        tooltip:
            "(x-axis_y-axis_width_height) if not applying use: 0_0_0_0 & on full image use: 0_0_100_100",
        type: "string",
        default: "0_0_0_0",
        maxLength: 255,
        identifier: "box5",
        title: "Box 5",
    },
];

const defaultParamValues = {};

for (const param of params) {
    defaultParamValues[param.identifier] = param.default;
}

export const Home = ({
    appOrgDetails,
    token,
    filters = defaultParamValues,
    setFilters,
}) => {
    const [formValues, setFormValues] = useState(filters);
    const [loading, setLoading] = useState(false);
    const [usage, setUsage] = useState({
        credits: { used: 0 },
        total: { credits: 0 },
    });

    const updateUsage = () => getUsage(token).then(setUsage);

    useEffect(() => {
        updateUsage();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        // HACK!!!
        // to hide overdrawn text fields
        // ref: https://forums.creativeclouddeveloper.com/t/sp-textfield-always-on-top-of-absolute-sp-menu-and-z-index-wouldnt-help/3957/5
        document.getElementById("fields-end")?.scrollIntoView();
        document.getElementById("fields-start")?.scrollIntoView();
    }, [loading]);

    const handleApply = async (e) => {
        e.preventDefault();

        setLoading(true);

        const [, error] = await handle(
            applyTransformation({
                appOrgDetails,
                parameters: formValues,
                token,
            })
        );

        updateUsage();
        setFilters(formValues);
        setLoading(false);

        if (error) {
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
        }
    };

    const handleChange = (key, value) => {
        setFormValues((formValues) => ({ ...formValues, [key]: value }));
    };

    const handleResetClick = (key) => {
        setFormValues((formValues) => ({
            ...formValues,
            [key]: filters[key],
        }));
    };

    const handleResetAll = () => {
        setFormValues(filters);
    };

    if (loading) {
        return (
            <div style={styles.loadingBackdrop}>
                <Loader />
            </div>
        );
    }

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
                    Watermarkremover.io
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
                    <div id="fields-start" />

                    {params.map((param) => (
                        <InputField
                            key={param.identifier}
                            value={formValues[param.identifier]}
                            param={param}
                            handleChange={handleChange}
                            handleResetClick={handleResetClick}
                        />
                    ))}

                    <div id="fields-end" />
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
