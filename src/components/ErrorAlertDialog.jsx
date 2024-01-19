import React from "react";

const styles = {
    errorAlertDialog: {
        display: "flex",
        justifyContent: "center",
    },
};

export function ErrorAlertDialog({ error }) {
    return (
        <div style={styles.errorAlertDialog}>
            <sp-body size="L">{error}</sp-body>
        </div>
    );
}
