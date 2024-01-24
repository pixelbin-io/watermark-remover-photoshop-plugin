import React, { useEffect, useState } from "react";
import { ChevronDownIcon, ChevronUpIcon } from "./Icons";

const styles = {
    wrapper: {
        flex: 1,
        display: "flex",
        flexDirection: "column",
        marginTop: "8px",
    },
    label: {
        color: "var(--uxp-host-text-color)",
        fontSize: "var(--uxp-host-font-size)",
    },
    head: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "4px 0",
    },
    body: {
        marginRight: "-16px",
        overflow: "auto",
        flex: 1,
    },
    directionIcon: {
        color: "var(--uxp-host-text-color)",
        fill: "currentcolor",
        marginLeft: "0.2rem",
        display: "inline-block",
    },
};

export default function AccordionItem({ children }) {
    const [open, setOpen] = useState(false);

    useEffect(() => {
        // HACK!!!
        // to hide overdrawn text fields
        // ref: https://forums.creativeclouddeveloper.com/t/sp-textfield-always-on-top-of-absolute-sp-menu-and-z-index-wouldnt-help/3957/5
        document.getElementById("fields-end")?.scrollIntoView();
        document.getElementById("fields-start")?.scrollIntoView();
    }, [open]);

    return (
        <div style={styles.wrapper}>
            <sp-divider></sp-divider>
            <div style={styles.head} onClick={() => setOpen(!open)}>
                <sp-label style={styles.label} size="m">
                    Advanced Settings
                </sp-label>
                <span style={styles.directionIcon}>
                    {open ? <ChevronUpIcon /> : <ChevronDownIcon />}
                </span>
            </div>
            {open && (
                <div style={styles.body}>
                    <div id="fields-start" />
                    {children}
                    <div id="fields-end" />
                </div>
            )}
            <sp-divider></sp-divider>
        </div>
    );
}
