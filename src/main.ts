import { Plugin, TFile, WorkspaceLeaf, Notice } from 'obsidian';
import { BetterPropertiesLookupView, VIEW_TYPE_BETTER_PROPERTIES } from './view';
import { PropertiesManager } from './properties-manager';
import { BetterPropertiesLookupSettings, BetterPropertiesLookupSettingTab, DEFAULT_SETTINGS } from './settings';

export default class BetterPropertiesLookupPlugin extends Plugin {
	private propertiesManager: PropertiesManager;
	public settings: BetterPropertiesLookupSettings;
	public view: BetterPropertiesLookupView | null = null;

	async onload() {
		console.log('Loading Better Properties Lookup plugin');
		
		// Load settings
		await this.loadSettings();

		// Initialize the properties manager
		this.propertiesManager = new PropertiesManager(this.app, this.settings);

		// Register the custom view
		this.registerView(
			VIEW_TYPE_BETTER_PROPERTIES,
			(leaf) => {
				this.view = new BetterPropertiesLookupView(leaf, this.propertiesManager, this.settings);
				return this.view;
			}
		);

		// Add the settings tab
		this.addSettingTab(new BetterPropertiesLookupSettingTab(this.app, this));

		// Add the icon to the left sidebar
		this.addRibbonIcon('list-plus', 'Better Properties Lookup', () => {
			this.activateView();
		});

		// Register for file creation and modification events
		this.registerEvent(
			this.app.vault.on('create', (file) => {
				if (file instanceof TFile && file.extension === 'md') {
					this.propertiesManager.processFile(file);
				}
			})
		);

		this.registerEvent(
			this.app.vault.on('modify', (file) => {
				if (file instanceof TFile && file.extension === 'md') {
					this.propertiesManager.processFile(file);
				}
			})
		);

		this.registerEvent(
			this.app.vault.on('delete', (file) => {
				if (file instanceof TFile && file.extension === 'md') {
					this.propertiesManager.removeFile(file);
				}
			})
		);

		// Initial load of all properties in the vault
		this.propertiesManager.loadProperties();
	}

	async onunload() {
		console.log('Unloading Better Properties Lookup plugin');
		this.app.workspace.detachLeavesOfType(VIEW_TYPE_BETTER_PROPERTIES);
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	refreshView() {
		if (this.view) {
			this.view.refresh();
			// Ensure search container visibility matches settings
			if (this.view.searchContainer) {
				this.view.searchContainer.style.display = this.settings.enableSearch ? 'block' : 'none';
			}
		}
	}

	async reloadProperties() {
		await this.propertiesManager.loadProperties();
		this.refreshView();
	}

	async activateView() {
		const { workspace } = this.app;

		// If the view is already open in a leaf, reveal that leaf
		const leaves = workspace.getLeavesOfType(VIEW_TYPE_BETTER_PROPERTIES);
		if (leaves.length > 0) {
			workspace.revealLeaf(leaves[0]);
			return;
		}

		// Otherwise, create a new leaf in the left sidebar
		const leaf = workspace.getLeftLeaf(false);
		if (leaf) {
			await leaf.setViewState({
				type: VIEW_TYPE_BETTER_PROPERTIES,
				active: true,
			});

			// Reveal the new leaf
			const newLeaves = workspace.getLeavesOfType(VIEW_TYPE_BETTER_PROPERTIES);
			if (newLeaves.length > 0) {
				workspace.revealLeaf(newLeaves[0]);
			}
		} else {
			// Fallback if no left leaf is available
			new Notice("Could not create sidebar view. Please try again.");
		}
	}
} 