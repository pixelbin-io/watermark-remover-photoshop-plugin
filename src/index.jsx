import React from "react";
import { entrypoints, shell } from "uxp";

import { ConfirmationDialog } from "./components/ConfirmationDialog";
import { CommandController } from "./controllers/CommandController";
import { PanelController } from "./controllers/PanelController";
import { App } from "./panels/App";
import "./styles.css";
import { storage } from "./utils";
import { constants } from "./constants";

const isUserLoggedIn = Boolean(storage.getItem("token"));

const appPanelController = new PanelController(
    ({ panel }) => <App panel={panel} />,
    {
        id: "app",
        menuItems: [
            {
                id: "logout",
                label: "Logout",
                enabled: isUserLoggedIn,
                checked: false,
                onInvoke: async (panel) => {
                    const confirmationDialogController = new CommandController(
                        ({ dialog }) => <ConfirmationDialog dialog={dialog} />
                    );

                    const logout = await confirmationDialogController.run();

                    if (logout === "YES") {
                        await panel.biref.removeBoxLayers();
                        localStorage.clear();
                        location.reload();
                    }
                },
            },
        ],
    }
);

entrypoints.setup({
    plugin: {
        create(plugin) {
            console.log("created", { plugin });
        },
        destroy() {
            console.log("destroyed");
        },
    },
    commands: {
        async goToDashboard() {
            await shell.openExternal(constants.urls.redirectToDashboardPage);
        },
        async buyCredits() {
            await shell.openExternal(constants.urls.redirectToPricingPage);
        },
        async howItWorks() {
            await shell.openExternal(constants.urls.pluginDoc);
        },
    },
    panels: {
        app: appPanelController,
    },
});
