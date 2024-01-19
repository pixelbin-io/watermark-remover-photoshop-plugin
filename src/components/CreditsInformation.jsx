import React from "react";
import { shell } from "uxp";

import { abbreviateNumber } from "../utils";
import { constants } from "../constants";

const styles = {
    info: {
        width: "100%",
        display: "flex",
        justifyContent: "space-between",
        color: "var(--uxp-host-text-color)",
        fontSize: "var(--uxp-host-font-size-larger)",
        marginBottom: "1rem",
    },
    credits: { marginLeft: "auto" },
    buyButton: { width: "100%" },
};

export function CreditsInformation({ appOrgDetails, usage }) {
    const handleBuyCreditsButtonClick = async () => {
        await shell.openExternal(
            constants.urls.orgPricingPage.replace(
                ":orgId",
                appOrgDetails.app.orgId
            )
        );
    };

    return (
        <>
            <div style={styles.info}>
                <span>Credits</span>{" "}
                <span style={styles.credits}>
                    {abbreviateNumber(Math.round(usage.credits.used || 0))}/
                    {abbreviateNumber(usage.total.credits)} used
                </span>
            </div>
            <sp-button
                style={styles.buyButton}
                variant="primary"
                onClick={handleBuyCreditsButtonClick}
            >
                Buy more credits
            </sp-button>
        </>
    );
}
