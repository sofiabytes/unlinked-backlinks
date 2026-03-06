export const normalizePath = (path: string) => path;
export const parseLinktext = (link: string) => {
    const [path, subpath] = link.split('#');
    return { path: path || '', subpath: subpath || '' };
};
export class ItemView {
    containerEl: any;
    constructor() {
        this.containerEl = {
            children: [null, { empty: () => {}, createEl: () => ({ append: () => {} }) }]
        };
    }
}
export class WorkspaceLeaf {}
export class TFile {}
export class TFolder {}
export const VIEW_TYPE_CUSTOM_SIDEBAR = "filtered-backlinks-sidebar";
