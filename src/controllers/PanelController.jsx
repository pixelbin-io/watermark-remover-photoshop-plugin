import { createRoot } from "react-dom/client";

const _id = Symbol("_id");
const _root = Symbol("_root");
const _attachment = Symbol("_attachment");
const _Component = Symbol("_Component");
const _menuItems = Symbol("_menuItems");

export class PanelController {
    constructor(Component, { id, menuItems = [] } = {}) {
        this[_root] = null;
        this[_attachment] = null;
        this[_id] = id;
        this[_Component] = Component;
        this[_menuItems] = menuItems;

        this.menuItems = this[_menuItems].map((menuItem) => ({
            id: menuItem.id,
            label: menuItem.label,
            enabled: menuItem.enabled ?? true,
            checked: menuItem.checked ?? false,
        }));

        ["create", "show", "hide", "destroy", "invokeMenu"].forEach(
            (fn) => (this[fn] = this[fn].bind(this))
        );
    }

    create() {
        const domNode = document.createElement("div");
        domNode.id = "root";
        domNode.style.height = "100vh";
        domNode.style.overflow = "auto";

        const root = createRoot(domNode);

        root.render(this[_Component]({ panel: { ...this, id: this[_id] } }));

        this[_root] = domNode;

        return this[_root];
    }

    show(event) {
        if (!this[_root]) this.create();
        this[_attachment] = event;
        this[_attachment].appendChild(this[_root]);
    }

    hide() {
        if (this[_attachment] && this[_root]) {
            this[_attachment].removeChild(this[_root]);
            this[_attachment] = null;
        }
    }

    destroy() {}

    invokeMenu(id) {
        const menuItem = this[_menuItems].find(
            (menuItem) => menuItem.id === id
        );

        menuItem?.onInvoke?.();
    }
}
