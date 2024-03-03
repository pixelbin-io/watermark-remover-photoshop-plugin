import React from "react";
import { WC } from "./WC";

const styles = {
    paramSection: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "1rem",
        width: "100%",
    },
    paramGap: { marginBottom: "6px" },
    resetButton: { padding: 0 },
    drawButton: { marginLeft: "0.2rem" },
    fullWidth: { width: "100%" },
    label: {
        color: "var(--uxp-host-text-color-secondary)",
        fontSize: "var(--uxp-host-font-size)",
    },
};

function Picker({ value, param, handleChange, handleResetClick }) {
    return (
        <WC
            onChange={(e) => handleChange(e.target.value)}
            style={styles.paramGap}
        >
            <div style={styles.paramSection}>
                <sp-label for={param.identifier} size="m" style={styles.label}>
                    {param.title}
                </sp-label>
                <sp-action-button
                    variant="secondary"
                    quiet
                    onClick={handleResetClick}
                    style={styles.resetButton}
                >
                    <span>Reset</span>
                </sp-action-button>
            </div>
            <sp-picker
                id={param.identifier}
                size="m"
                label={param.title}
                style={styles.fullWidth}
            >
                <sp-menu>
                    {param.enum.map((option) => (
                        <sp-menu-item
                            key={option}
                            value={option}
                            selected={option === value ? true : undefined}
                        >
                            {option}
                        </sp-menu-item>
                    ))}
                </sp-menu>
            </sp-picker>
        </WC>
    );
}

function Checkbox({ value, param, handleChange, handleResetClick }) {
    return (
        <WC onChange={(e) => handleChange(e.target.checked)}>
            <div style={styles.paramSection}>
                <sp-checkbox
                    style={styles.paramGap}
                    checked={value ? true : undefined}
                >
                    {param.title}
                </sp-checkbox>
                <sp-action-button
                    variant="secondary"
                    quiet
                    onClick={handleResetClick}
                    style={styles.resetButton}
                >
                    <span>Reset</span>
                </sp-action-button>
            </div>
        </WC>
    );
}

function Text({
    value,
    param,
    handleChange,
    handleResetClick,
    handleDrawClick,
    drawButtonDisabled,
    handleLabelClick,
    disabled,
}) {
    return (
        <WC onInput={(e) => handleChange(e.target.value)}>
            <div style={styles.paramSection}>
                <sp-label
                    for={param.identifier}
                    size="m"
                    style={styles.label}
                    onClick={handleLabelClick}
                >
                    {param.title}
                </sp-label>
                <sp-action-button
                    variant="secondary"
                    quiet
                    onClick={handleResetClick}
                    style={styles.resetButton}
                >
                    <span>Reset</span>
                </sp-action-button>
            </div>
            <div style={{ display: "flex" }}>
                <sp-textfield
                    id={param.identifier}
                    size="m"
                    label={param.title}
                    style={styles.fullWidth}
                    value={value}
                    disabled={disabled}
                ></sp-textfield>
                <sp-action-button
                    variant="secondary"
                    onClick={handleDrawClick}
                    style={styles.drawButton}
                    disabled={drawButtonDisabled ? true : undefined}
                >
                    <span>Draw</span>
                </sp-action-button>
            </div>
        </WC>
    );
}

export default function InputField({
    value,
    param,
    handleChange,
    handleResetClick,
    handleDrawClick,
    handleLabelClick,
    drawButtonDisabled,
    disabled,
}) {
    let Field;

    if (param.type === "enum") {
        Field = Picker;
    }

    if (param.type === "boolean") {
        Field = Checkbox;
    }

    if (param.type === "string") {
        Field = Text;
    }

    return (
        <Field
            value={value}
            param={param}
            handleChange={(e) => handleChange(param.identifier, e)}
            handleResetClick={() => handleResetClick(param.identifier)}
            handleDrawClick={() => handleDrawClick(param.identifier)}
            handleLabelClick={() => handleLabelClick(param.identifier)}
            drawButtonDisabled={drawButtonDisabled}
            disabled={disabled}
        />
    );
}
