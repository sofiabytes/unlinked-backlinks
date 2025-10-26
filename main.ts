import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';
import { CustomSidebarView, VIEW_TYPE_CUSTOM_SIDEBAR } from "./SidebarView"

// Remember to rename these classes and interfaces!

interface MyPluginSettings {
	mySetting: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	mySetting: 'default'
}

export default class MyPlugin extends Plugin {
	settings: MyPluginSettings;

	async onload() {
		await this.loadSettings();

		// This adds a settings tab so the user can configure various aspects of the plugin
		//this.addSettingTab(new SampleSettingTab(this.app, this));

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





		this.app.workspace.onLayoutReady(() => {
		    const leaf = this.app.workspace.getRightLeaf(false);
			if (leaf) {
				leaf.setViewState({
					type: VIEW_TYPE_CUSTOM_SIDEBAR,
					active: true
				});
			}
		});

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

		containerEl.empty();

		//new Setting(containerEl)
		//	.setName('Setting #1')
		//	.setDesc('It\'s a secret')
		//	.addText(text => text
		//		.setPlaceholder('Enter your secret')
		//		.setValue(this.plugin.settings.mySetting)
		//		.onChange(async (value) => {
		//			this.plugin.settings.mySetting = value;
		//			await this.plugin.saveSettings();
		//		}));
	}
}
