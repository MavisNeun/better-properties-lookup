import { App, PluginSettingTab, Setting } from 'obsidian';
import BetterPropertiesLookupPlugin from './main';

export interface BetterPropertiesLookupSettings {
    showPropertyCounts: boolean;
    expandPropertiesByDefault: boolean;
    enableSearch: boolean;
    showNestedProperties: boolean;
    includedProperties: string[];
    excludedProperties: string[];
    sortOrder: 'nameAsc' | 'nameDesc' | 'freqDesc' | 'freqAsc';
    useCondensedDisplay: boolean;
    fixedToolbar: boolean;
    keepSearchVisible: boolean;
}

export const DEFAULT_SETTINGS: BetterPropertiesLookupSettings = {
    showPropertyCounts: true,
    expandPropertiesByDefault: false,
    enableSearch: true,
    showNestedProperties: true,
    includedProperties: [],
    excludedProperties: [],
    sortOrder: 'freqDesc',
    useCondensedDisplay: false,
    fixedToolbar: false,
    keepSearchVisible: false,
};

export class BetterPropertiesLookupSettingTab extends PluginSettingTab {
    plugin: BetterPropertiesLookupPlugin;

    constructor(app: App, plugin: BetterPropertiesLookupPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();

        containerEl.createEl('h2', { text: 'Better Properties Lookup Settings' });

        // User Interface section
        containerEl.createEl('h3', { text: 'Display Settings' });

        new Setting(containerEl)
            .setName('Show property counts')
            .setDesc('Display the number of files for each property')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.showPropertyCounts)
                .onChange(async value => {
                    this.plugin.settings.showPropertyCounts = value;
                    await this.plugin.saveSettings();
                    this.plugin.refreshView();
                }));

        new Setting(containerEl)
            .setName('Use condensed display')
            .setDesc('Show "N dvs" instead of "N distinct values" for more compact display')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.useCondensedDisplay)
                .onChange(async value => {
                    this.plugin.settings.useCondensedDisplay = value;
                    await this.plugin.saveSettings();
                    this.plugin.refreshView();
                }));

        new Setting(containerEl)
            .setName('Fixed toolbar')
            .setDesc('Keep the toolbar fixed at the top when scrolling')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.fixedToolbar)
                .onChange(async value => {
                    this.plugin.settings.fixedToolbar = value;
                    await this.plugin.saveSettings();
                    this.plugin.refreshView();
                    // Apply or remove fixed class based on setting
                    if (this.plugin.view && this.plugin.view.toolbarEl) {
                        this.plugin.view.updateToolbarVisibility();
                    }
                }));
                
        new Setting(containerEl)
            .setName('Keep search bar visible')
            .setDesc('Keep the search bar visible when toolbar is fixed (requires fixed toolbar)')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.keepSearchVisible)
                .onChange(async value => {
                    this.plugin.settings.keepSearchVisible = value;
                    await this.plugin.saveSettings();
                    this.plugin.refreshView();
                    // Apply changes to search visibility
                    if (this.plugin.view && this.plugin.view.searchContainer) {
                        this.plugin.view.updateSearchVisibility();
                    }
                }));

        // Behavior Section
        containerEl.createEl('h3', { text: 'Behavior Settings' });

        new Setting(containerEl)
            .setName('Expand properties by default')
            .setDesc('Automatically expand all property groups when the view is loaded')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.expandPropertiesByDefault)
                .onChange(async value => {
                    this.plugin.settings.expandPropertiesByDefault = value;
                    await this.plugin.saveSettings();
                    this.plugin.refreshView();
                }));
        
        new Setting(containerEl)
            .setName('Enable search')
            .setDesc('Show search bar to filter properties')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.enableSearch)
                .onChange(async value => {
                    this.plugin.settings.enableSearch = value;
                    await this.plugin.saveSettings();
                    this.plugin.refreshView();
                }));
        
        new Setting(containerEl)
            .setName('Show nested properties')
            .setDesc('Display properties with nested structure')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.showNestedProperties)
                .onChange(async value => {
                    this.plugin.settings.showNestedProperties = value;
                    await this.plugin.saveSettings();
                    this.plugin.refreshView();
                }));

        // Sorting & Filtering Section  
        containerEl.createEl('h3', { text: 'Sorting & Filtering' });
        
        new Setting(containerEl)
            .setName('Default sort order')
            .setDesc('Choose how properties are sorted by default')
            .addDropdown(dropdown => dropdown
                .addOption('nameAsc', 'Name (A to Z)')
                .addOption('nameDesc', 'Name (Z to A)')
                .addOption('freqDesc', 'Frequency (high to low)')
                .addOption('freqAsc', 'Frequency (low to high)')
                .setValue(this.plugin.settings.sortOrder)
                .onChange(async value => {
                    this.plugin.settings.sortOrder = value as 'nameAsc' | 'nameDesc' | 'freqDesc' | 'freqAsc';
                    await this.plugin.saveSettings();
                    this.plugin.refreshView();
                }));
        
        const includedInfo = containerEl.createEl('div', {
            cls: 'setting-item-info',
            text: 'Note: If both included and excluded properties are specified, inclusions take precedence.'
        });
        includedInfo.style.marginBottom = '12px';
        includedInfo.style.fontStyle = 'italic';
        includedInfo.style.fontSize = '0.85em';
        includedInfo.style.color = 'var(--text-muted)';

        new Setting(containerEl)
            .setName('Included properties')
            .setDesc('List of top-level properties to include (comma-separated). If empty, all properties will be shown except excluded ones.')
            .addText(text => text
                .setPlaceholder('type, status, priority')
                .setValue(this.plugin.settings.includedProperties.join(', '))
                .onChange(async value => {
                    this.plugin.settings.includedProperties = value.split(',')
                        .map(item => item.trim())
                        .filter(item => item.length > 0);
                    await this.plugin.saveSettings();
                    this.plugin.refreshView();
                }));
        
        new Setting(containerEl)
            .setName('Excluded properties')
            .setDesc('List of top-level properties to exclude (comma-separated). These will not show up in the view unless specifically included above.')
            .addText(text => text
                .setPlaceholder('created, modified')
                .setValue(this.plugin.settings.excludedProperties.join(', '))
                .onChange(async value => {
                    this.plugin.settings.excludedProperties = value.split(',')
                        .map(item => item.trim())
                        .filter(item => item.length > 0);
                    await this.plugin.saveSettings();
                    this.plugin.refreshView();
                }));

        // Maintenance Section
        containerEl.createEl('h3', { text: 'Maintenance' });
        
        new Setting(containerEl)
            .setName('Reindex properties')
            .setDesc('Manually rebuild the property index from all files')
            .addButton(button => button
                .setButtonText('Reindex')
                .onClick(async () => {
                    await this.plugin.reloadProperties();
                }));
    }
} 