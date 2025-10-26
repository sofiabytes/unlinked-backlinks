import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, TFolder} from 'obsidian';
import { CustomSidebarView, VIEW_TYPE_CUSTOM_SIDEBAR } from "./SidebarView"

// Remember to rename these classes and interfaces!

interface MyPluginSettings {
	mySetting: string;
	selectedFolders: string[];
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	mySetting: 'default',
	selectedFolders: []
}

export default class MyPlugin extends Plugin {
	settings: MyPluginSettings;

	async onload() {
		await this.loadSettings();

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SampleSettingTab(this.app, this));

		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		//this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
		//	console.log('click', evt);
		//});

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		//this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));

		this.registerView(
			VIEW_TYPE_CUSTOM_SIDEBAR,
			(leaf) => new CustomSidebarView(leaf)
		);

//		this.app.workspace.getRightLeaf(false).setViewState({
//			type: VIEW_TYPE_CUSTOM_SIDEBAR,
//			active: true,
//		});
	async function activateView(app: App) {
		let leaf = app.workspace.getLeavesOfType(VIEW_TYPE_CUSTOM_SIDEBAR)[0];

		if (!leaf) {
			leaf = app.workspace.getRightLeaf(false); // false means do not split
			await leaf.setViewState({
				type: VIEW_TYPE_CUSTOM_SIDEBAR,
				active: false,
			});
		}

		app.workspace.revealLeaf(leaf);
	}





//		this.app.workspace.onLayoutReady(() => {
//		    const leaf = this.app.workspace.getRightLeaf(false);
//			if (leaf) {
//				leaf.setViewState({
//					type: VIEW_TYPE_CUSTOM_SIDEBAR,
//					active: true
//				});
//			}
//		});

	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class SampleModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	onOpen() {
		const {contentEl} = this;
		contentEl.setText('Woah!');
	}

	onClose() {
		const {contentEl} = this;
		contentEl.empty();
	}
}

class SampleSettingTab extends PluginSettingTab {
	plugin: MyPlugin;

	constructor(app: App, plugin: MyPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		// clear previous entries
		containerEl.empty();
	


		new Setting(containerEl)
			.setName("Select folders")
			.setDesc("Choose one or more folders from your vault")
			.addDropdown((dropdown) => {
				const folders = this.app.vault.getAllLoadedFiles()
					.filter((f) => f instanceof TFolder)
					.map((f) => f.path);

				folders.forEach((path) => {
					dropdown.addOption(path, path);
				});

				dropdown.setValue("");

				dropdown.onChange(async (value) => {
					// Initialize if undefined
					if (!Array.isArray(this.plugin.settings.selectedFolders)) {
						this.plugin.settings.selectedFolders = [];
					}

					// Add the new folder only if it's not already included
					if (value && !this.plugin.settings.selectedFolders.includes(value)) {
						this.plugin.settings.selectedFolders.push(value);
						await this.plugin.saveSettings();
						this.renderSelectedFolders(containerEl);
					}
					dropdown.setValue("")
				});
			});

		// --- Selected folders list ---
		this.renderSelectedFolders(containerEl);

	}


	private renderSelectedFolders(containerEl: HTMLElement) {
		// Remove existing display if present (prevents duplicates)
		const oldSection = containerEl.querySelector(".selected-folders-section");
		if (oldSection) oldSection.remove();

		// Create a fresh section
		const section = containerEl.createDiv({ cls: "selected-folders-section" });
		section.createEl("h3", { text: "Selected folders:" });

		const selected = this.plugin.settings.selectedFolders || [];
		if (selected.length === 0) {
			section.createEl("p", { text: "No folders selected." });
			return;
		}

		selected.forEach((folder, index) => {
			const folderLine = section.createDiv({ cls: "folder-line" });
			folderLine.createEl("span", { text: folder });

			const removeBtn = folderLine.createEl("button", {
				text: "Remove",
				cls: "mod-warning",
			});
			removeBtn.onclick = async () => {
				this.plugin.settings.selectedFolders.splice(index, 1);
				await this.plugin.saveSettings();
				this.renderSelectedFolders(containerEl); // Refresh display
			};
		});
}
}
