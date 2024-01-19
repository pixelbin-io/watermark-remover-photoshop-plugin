import React, { useState } from "react";
import { PixelbinClient, PixelbinConfig } from "@pixelbin/admin";

import { handle } from "../utils";
import { WC } from "./WC";
import { constants } from "../constants";

const styles = {
    wrapper: { display: "flex", gap: "1rem", flexDirection: "column" },
    main: {
        display: "flex",
        gap: "1rem",
        flexDirection: "column",
        alignItems: "center",
    },
    header: {
        display: "flex",
        alignItems: "center",
        margin: "1rem 0",
        color: "var(--uxp-host-text-color)",
        fontSize: "20px",
    },
    productImage: { marginRight: "0.5rem", height: "32px" },
    submitButton: { marginTop: "0.5rem" },
    apiTokenLink: { marginTop: "2rem" },
    errorMessage: {
        borderRadius: "4px",
        margin: "1rem",
        padding: "1rem",
        color: "rgb(255, 255, 255)",
        backgroundColor: "rgb(244, 67, 54)",
    },
};

export function Login({ setToken, setAppOrgDetails }) {
    const [errorMessage, setErrorMessage] = useState("");
    const [submitButtonDisabled, setSubmitButtonDisabled] = useState(false);
    const [tokenInputValue, setTokenInputValue] = useState("");

    const handleSubmitClick = async (e) => {
        e.preventDefault();

        setSubmitButtonDisabled(true);

        const config = new PixelbinConfig({
            domain: constants.urls.apiDomain,
            apiSecret: tokenInputValue,
        });

        const pixelbin = new PixelbinClient(config);

        const [appOrgDetails, error] = await handle(
            pixelbin.organization.getAppOrgDetails()
        );

        setSubmitButtonDisabled(false);

        if (error?.code === 401) {
            setErrorMessage("Invalid Token");
            return;
        }

        setToken(tokenInputValue);
        setAppOrgDetails(appOrgDetails);
    };

    const handleTokenInputValueChange = (e) => {
        setTokenInputValue(e.target.value);
    };

    return (
        <div style={styles.wrapper}>
            <main style={styles.main}>
                <header style={styles.header}>
                    <img
                        src="./icons/watermarkremover.png"
                        style={styles.productImage}
                    />
                    Login
                </header>
                <WC onInput={handleTokenInputValueChange}>
                    <sp-textfield
                        name="token"
                        placeholder="Enter API Token"
                        type="password"
                    ></sp-textfield>
                </WC>
                <sp-action-button
                    style={styles.submitButton}
                    disabled={
                        !tokenInputValue || submitButtonDisabled
                            ? true
                            : undefined
                    }
                    onClick={handleSubmitClick}
                >
                    Submit
                </sp-action-button>
                <sp-link
                    quiet
                    style={styles.apiTokenLink}
                    href={constants.urls.redirectToAppsPage}
                >
                    Get your API token
                </sp-link>
            </main>

            {errorMessage && (
                <sp-body style={styles.errorMessage}>{errorMessage}</sp-body>
            )}
        </div>
    );
}
