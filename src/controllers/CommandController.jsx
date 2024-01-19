import { createRoot } from "react-dom/client";

const _id = Symbol("_id");
const _root = Symbol("_root");
const _Component = Symbol("_Component");
const _dialogOpts = Symbol("_dialogOpts");

export class CommandController {
    constructor(Component, { id, ...dialogOpts } = {}) {
        this[_id] = null;
        this[_root] = null;
        this[_Component] = null;
        this[_dialogOpts] = {};

        this[_Component] = Component;
        this[_id] = id;
        this[_dialogOpts] = Object.assign(
            {},
            {
                title: id,
                resize: "both",
                size: {
                    width: 480,
                    height: 120,
                },
            },
            dialogOpts
        );

        ["run"].forEach((fn) => (this[fn] = this[fn].bind(this)));
    }

    async run() {
        if (!this[_root]) {
            this[_root] = document.createElement("dialog");

            const root = createRoot(this[_root]);

            root.render(this[_Component]({ dialog: this[_root] }));
        }

        document.body.appendChild(this[_root]);

        const closeReason = await this[_root].showModal(this[_dialogOpts]);

        this[_root].remove();

        return closeReason;
    }
}
