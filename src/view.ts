import { ItemView, WorkspaceLeaf, setIcon, Notice, App } from 'obsidian';
import { PropertiesManager, PropertyNode } from './properties-manager';
import { BetterPropertiesLookupSettings } from './settings';

export const VIEW_TYPE_BETTER_PROPERTIES = 'better-properties-lookup-view';

export class BetterPropertiesLookupView extends ItemView {
    private propertiesManager: PropertiesManager;
    private viewContentEl: HTMLElement;
    private searchInput: HTMLInputElement;
    public searchContainer: HTMLElement;
    public toolbarEl: HTMLElement;
    private settings: BetterPropertiesLookupSettings;

    constructor(leaf: WorkspaceLeaf, propertiesManager: PropertiesManager, settings: BetterPropertiesLookupSettings) {
        super(leaf);
        this.propertiesManager = propertiesManager;
        this.settings = settings;
    }

    getViewType(): string {
        return VIEW_TYPE_BETTER_PROPERTIES;
    }

    getDisplayText(): string {
        return 'Better Properties';
    }

    getIcon(): string {
        return 'list-plus';
    }

    async onOpen() {
        const { containerEl } = this;
        this.viewContentEl = this.contentEl;
        this.viewContentEl.empty();
        this.viewContentEl.addClass('better-properties-container');

        // Add toolbar
        this.createToolbar();

        // Create a toolbar container for adding the search bar
        const toolbarContainer = this.toolbarEl;
        
        // Add search input to the toolbar container
        this.createSearchBar(toolbarContainer);

        // Apply fixed toolbar if setting is enabled
        this.updateToolbarVisibility();
        
        // Update search visibility based on settings
        this.updateSearchVisibility();

        // Render the property tree - initial load
        this.renderPropertyTree();
        
        // Explicitly load properties on view open
        await this.propertiesManager.loadProperties();
        this.renderPropertyTree();
    }

    refresh(): void {
        this.renderPropertyTree();
        // Update toolbar and search visibility when refreshing
        this.updateToolbarVisibility();
        this.updateSearchVisibility();
    }

    private createToolbar() {
        this.toolbarEl = this.viewContentEl.createDiv('better-properties-toolbar');
        
        // Left section of toolbar
        const leftSection = this.toolbarEl.createDiv('toolbar-section left-section');
        
        // Replace individual sort buttons with a single dropdown button
        const sortDropdownContainer = leftSection.createDiv('sort-dropdown-container');
        const sortDropdownButton = sortDropdownContainer.createDiv('toolbar-button sort-dropdown-button');
        setIcon(sortDropdownButton, 'arrow-down-wide-narrow');
        sortDropdownButton.setAttribute('title', 'Sort options');
        
        // Create dropdown menu
        const dropdownMenu = sortDropdownContainer.createDiv('sort-dropdown-menu');
        dropdownMenu.style.display = 'none';
        
        // Add sort options to dropdown
        const sortNameAsc = dropdownMenu.createDiv('sort-option');
        sortNameAsc.textContent = 'A→Z (Name ascending)';
        sortNameAsc.addEventListener('click', () => {
            this.settings.sortOrder = 'nameAsc';
            dropdownMenu.style.display = 'none';
            this.renderPropertyTree();
        });
        
        const sortNameDesc = dropdownMenu.createDiv('sort-option');
        sortNameDesc.textContent = 'Z→A (Name descending)';
        sortNameDesc.addEventListener('click', () => {
            this.settings.sortOrder = 'nameDesc';
            dropdownMenu.style.display = 'none';
            this.renderPropertyTree();
        });
        
        const sortFreqDesc = dropdownMenu.createDiv('sort-option');
        sortFreqDesc.textContent = '9→1 (Frequency high to low)';
        sortFreqDesc.addEventListener('click', () => {
            this.settings.sortOrder = 'freqDesc';
            dropdownMenu.style.display = 'none';
            this.renderPropertyTree();
        });
        
        const sortFreqAsc = dropdownMenu.createDiv('sort-option');
        sortFreqAsc.textContent = '1→9 (Frequency low to high)';
        sortFreqAsc.addEventListener('click', () => {
            this.settings.sortOrder = 'freqAsc';
            dropdownMenu.style.display = 'none';
            this.renderPropertyTree();
        });
        
        // Toggle dropdown menu visibility
        sortDropdownButton.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdownMenu.style.display = dropdownMenu.style.display === 'none' ? 'block' : 'none';
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', () => {
            dropdownMenu.style.display = 'none';
        });
        
        // Toggle expand/collapse all - Keep using setIcon as this one works
        const expandCollapseBtn = leftSection.createDiv('toolbar-button');
        expandCollapseBtn.setAttribute('title', 'Toggle expand/collapse all');
        this.updateExpandCollapseIcon(expandCollapseBtn);
        expandCollapseBtn.addEventListener('click', () => {
            this.toggleExpandCollapse(expandCollapseBtn);
        });
        
        // Toggle search - Keep using setIcon as this one works
        const toggleSearchBtn = leftSection.createDiv('toolbar-button');
        toggleSearchBtn.setAttribute('title', 'Toggle search');
        setIcon(toggleSearchBtn, 'search');
        toggleSearchBtn.addEventListener('click', () => {
            this.settings.enableSearch = !this.settings.enableSearch;
            toggleSearchBtn.toggleClass('active', this.settings.enableSearch);
            this.searchContainer.style.display = this.settings.enableSearch ? 'block' : 'none';
        });
        
        // Right-aligned section for reindex button
        const rightSection = this.toolbarEl.createDiv('toolbar-section right-section');
        
        // Add reindex button
        const reindexBtn = rightSection.createDiv('toolbar-button');
        reindexBtn.setAttribute('title', 'Reindex properties');
        setIcon(reindexBtn, 'refresh-cw');
        reindexBtn.addEventListener('click', async () => {
            // Add loading indicator class
            reindexBtn.addClass('loading');
            
            // Disable the button during reindexing
            reindexBtn.style.pointerEvents = 'none';
            
            try {
                // Call the reloadProperties method from the plugin instance
                const plugin = (this.app as any).plugins.plugins['better-properties-lookup'];
                if (plugin && plugin.reloadProperties) {
                    await plugin.reloadProperties();
                    new Notice('Properties reindexed successfully');
                }
            } catch (error) {
                console.error('Error reindexing properties:', error);
                new Notice('Error reindexing properties');
            } finally {
                // Remove loading indicator and re-enable button
                reindexBtn.removeClass('loading');
                reindexBtn.style.pointerEvents = 'auto';
            }
        });
        
        // Initialize search field as hidden by default
        this.settings.enableSearch = false;
    }
    
    private updateActiveSort() {
        // Instead of updating buttons, we can update a label or the dropdown button
        const sortDropdownButton = this.toolbarEl.querySelector('.sort-dropdown-button') as HTMLElement;
        if (sortDropdownButton) {
            // Could add an indicator of current sort if desired
            // e.g., sortDropdownButton.setAttribute('data-current-sort', this.settings.sortOrder);
        }
    }

    private createSearchBar(parentEl?: HTMLElement) {
        // Use provided parent or the view content
        const container = parentEl || this.viewContentEl;
        
        this.searchContainer = container.createDiv('search-container');
        // Hide search by default
        this.searchContainer.style.display = 'none';
        
        // Create a wrapper for the search input and clear button
        const searchWrapper = this.searchContainer.createDiv('search-input-wrapper');
        
        this.searchInput = searchWrapper.createEl('input', {
            type: 'text',
            placeholder: 'Search properties...',
            cls: 'better-properties-search',
        });

        // Create clear button
        const clearButton = searchWrapper.createDiv('search-clear-button');
        clearButton.setAttribute('title', 'Clear search');
        setIcon(clearButton, 'x');
        
        // Hide clear button initially if there's no text
        clearButton.style.display = 'none';
        
        // Add input event listener to show/hide clear button and update results
        this.searchInput.addEventListener('input', () => {
            // Show/hide clear button based on input value
            clearButton.style.display = this.searchInput.value ? 'flex' : 'none';
            this.renderPropertyTree();
        });
        
        // Add click event to clear button
        clearButton.addEventListener('click', (e) => {
            // Prevent event from bubbling up
            e.stopPropagation();
            
            // Clear the input and hide the clear button
            this.searchInput.value = '';
            clearButton.style.display = 'none';
            
            // Trigger input event to update the view
            this.searchInput.dispatchEvent(new Event('input'));
            
            // Focus the input field after clearing
            this.searchInput.focus();
        });
    }

    private areAllSectionsExpanded(): boolean {
        const foldContents = this.viewContentEl.querySelectorAll('.fold-content, .node-content');
        for (let i = 0; i < foldContents.length; i++) {
            const content = foldContents[i] as HTMLElement;
            if (content.style.display !== 'block') {
                return false;
            }
        }
        return foldContents.length > 0;
    }
    
    private updateExpandCollapseIcon(button: HTMLElement): void {
        button.empty();
        
        if (this.areAllSectionsExpanded()) {
            setIcon(button, 'chevrons-down-up');
            button.setAttribute('title', 'Collapse all');
        } else {
            setIcon(button, 'chevrons-up-down');
            button.setAttribute('title', 'Expand all');
        }
    }
    
    private toggleExpandCollapse(button: HTMLElement): void {
        if (this.areAllSectionsExpanded()) {
            this.collapseAllSections();
        } else {
            this.expandAllSections();
        }
        
        this.updateExpandCollapseIcon(button);
    }

    private expandAllSections() {
        const toggles = this.viewContentEl.querySelectorAll('.fold-toggle');
        const foldContents = this.viewContentEl.querySelectorAll('.fold-content, .node-content');
        
        toggles.forEach(toggle => {
            // Replace triangle with chevron icons
            toggle.empty();
            setIcon(toggle as HTMLElement, 'chevron-down');
        });
        
        foldContents.forEach(content => {
            const element = content as HTMLElement;
            element.style.display = 'block';
        });
    }
    
    private collapseAllSections() {
        const toggles = this.viewContentEl.querySelectorAll('.fold-toggle');
        const foldContents = this.viewContentEl.querySelectorAll('.fold-content, .node-content');
        
        toggles.forEach(toggle => {
            // Replace triangle with chevron icons
            toggle.empty();
            setIcon(toggle as HTMLElement, 'chevron-right');
        });
        
        foldContents.forEach(content => {
            const element = content as HTMLElement;
            element.style.display = 'none';
        });
    }

    private renderPropertyTree() {
        // Clear existing content except search and toolbar
        const nodes = this.viewContentEl.querySelectorAll('.property-section');
        nodes.forEach(node => node.remove());

        const propertyTree = this.propertiesManager.getPropertyTree();
        const searchValue = this.settings.enableSearch && this.searchInput ? 
            this.searchInput.value.toLowerCase() : '';

        // Root level properties (direct children of the root node)
        // Use the sorted properties from PropertiesManager
        const sortedEntries = this.propertiesManager.getSortedProperties(propertyTree);
        
        for (const [name, node] of sortedEntries) {
            if (searchValue && !this.matchesSearch(node, searchValue)) {
                continue;
            }

            this.renderPropertySection(node);
        }

        // Expand sections by default if configured
        if (this.settings.expandPropertiesByDefault) {
            this.expandAllSections();
        }
    }

    private renderPropertySection(node: PropertyNode) {
        const section = this.viewContentEl.createDiv('property-section');
        
        // Create foldable header
        const header = section.createDiv('fold-header');
        
        // Add toggle with chevron icon instead of triangle
        const toggle = header.createSpan('fold-toggle');
        setIcon(toggle as HTMLElement, 'chevron-right');
        
        // Create text container for the property name and info
        const textContainer = header.createSpan('property-text');
        
        // Create name span
        if (this.settings.showPropertyCounts) {
            // Use file icon instead of "files" text and round percentage to full integer
            // Add whitespace after the opening parenthesis
            textContainer.textContent = `${node.name} ( ${node.count} 📄, ${Math.round(node.percentage)}%)`;
        } else {
            textContainer.textContent = node.name;
        }
        header.setAttribute('data-path', node.fullPath);
        
        // Show distinct values count for top hierarchy
        if (node.values.size > 0) {
            const distinctValuesSpan = header.createSpan('distinct-values');
            if (this.settings.useCondensedDisplay) {
                distinctValuesSpan.textContent = `${node.values.size} dvs`;
            } else {
                distinctValuesSpan.textContent = `${node.values.size} distinct values`;
            }
        }

        // Create content container (initially hidden)
        const content = section.createDiv('fold-content');
        content.style.display = 'none';

        // Create table for values if this node has values
        if (node.values.size > 0) {
            this.createValuesTable(content, node);
        }

        // Add child property nodes
        if (node.children.size > 0) {
            const childrenContainer = content.createDiv('property-children');
            
            // Use the sorted properties from PropertiesManager
            const sortedChildren = this.propertiesManager.getSortedProperties(node);
            
            for (const [, childNode] of sortedChildren) {
                this.renderPropertyNode(childrenContainer, childNode);
            }
        }

        // Toggle visibility on click
        header.addEventListener('click', (e) => {
            const isVisible = content.style.display === 'block';
            content.style.display = isVisible ? 'none' : 'block';
            
            // Update toggle icon
            toggle.empty();
            setIcon(toggle as HTMLElement, isVisible ? 'chevron-right' : 'chevron-down');
        });
    }

    private renderPropertyNode(container: HTMLElement, node: PropertyNode) {
        const nodeEl = container.createDiv('property-node');
        
        // Create node header
        const header = nodeEl.createDiv('node-header');
        header.setAttribute('data-path', node.fullPath);
        
        // Add toggle if the node has children or values
        if (node.children.size > 0 || node.values.size > 0) {
            // Add toggle with chevron icon
            const toggle = header.createSpan('fold-toggle');
            setIcon(toggle as HTMLElement, 'chevron-right');
            
            // Create node label
            const label = header.createSpan('node-label');
            // Use file icon and round percentage
            if (this.settings.showPropertyCounts) {
                label.textContent = `${node.name} (${node.count})`;
            } else {
                label.textContent = node.name;
            }
            
            // Create content container (initially hidden)
            const content = nodeEl.createDiv('node-content');
            content.style.display = 'none';
            
            // Create table for values if this node has values
            if (node.values.size > 0) {
                this.createValuesTable(content, node);
            }
            
            // Add child property nodes
            if (node.children.size > 0) {
                const childrenContainer = content.createDiv('node-children');
                
                // Use the sorted properties from PropertiesManager
                const sortedChildren = this.propertiesManager.getSortedProperties(node);
                
                for (const [, childNode] of sortedChildren) {
                    this.renderPropertyNode(childrenContainer, childNode);
                }
            }
            
            // Toggle visibility on click for the entire header
            header.addEventListener('click', () => {
                const isVisible = content.style.display === 'block';
                content.style.display = isVisible ? 'none' : 'block';
                
                // Update toggle icon
                toggle.empty();
                setIcon(toggle as HTMLElement, isVisible ? 'chevron-right' : 'chevron-down');
            });
        } else {
            // Node with no children or values, just show the label
            const label = header.createSpan('node-label');
            if (this.settings.showPropertyCounts) {
                label.textContent = `${node.name} (${node.count})`;
            } else {
                label.textContent = node.name;
            }
        }
    }

    private createValuesTable(container: HTMLElement, node: PropertyNode) {
        const table = container.createEl('table');
        table.addClass('values-table');
        
        // Create table header
        const thead = table.createEl('thead');
        const headerRow = thead.createEl('tr');
        // Change "Percentage" header to "%"
        ['Value', 'Count', '%'].forEach(col => {
            const th = headerRow.createEl('th');
            th.textContent = col;
        });
        
        // Create table body
        const tbody = table.createEl('tbody');
        
        // Sort values by count (descending)
        const totalValues = Array.from(node.values.values()).reduce((sum, count) => sum + count, 0);
        const sortedValues = Array.from(node.values.entries())
            .sort(([_a, countA], [_b, countB]) => countB - countA);
        
        // Add rows for each value
        for (const [value, count] of sortedValues) {
            const row = tbody.createEl('tr');
            
            // Value cell - now a regular text cell, not a link
            const valueCell = row.createEl('td');
            valueCell.textContent = value;
            
            // Count cell
            const countCell = row.createEl('td');
            countCell.textContent = String(count);
            
            // Percentage cell
            const percentCell = row.createEl('td');
            const percentage = totalValues > 0 ? (count / totalValues) * 100 : 0;
            // Round percentage to full integer
            percentCell.textContent = `${Math.round(percentage)}%`;
            
            // Add context menu for right click
            row.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                // Create and show context menu
                this.showValueContextMenu(e, node.fullPath, value);
            });
        }
    }
    
    // Method to show context menu for property values
    private showValueContextMenu(event: MouseEvent, propertyPath: string, value: string) {
        // Remove any existing context menus
        document.querySelectorAll('.value-context-menu').forEach(menu => menu.remove());
        
        // Create context menu
        const menu = document.body.createDiv('value-context-menu');
        
        // Position menu at mouse location
        menu.style.left = `${event.pageX}px`;
        menu.style.top = `${event.pageY}px`;
        
        // New search option
        const newSearchItem = menu.createDiv('context-menu-item');
        const newSearchIcon = newSearchItem.createSpan('context-menu-icon');
        setIcon(newSearchIcon, 'search');
        newSearchItem.createSpan().textContent = 'New search for this value';
        newSearchItem.addEventListener('click', () => {
            this.filterByPropertyValue(propertyPath, value);
            menu.remove();
        });
        
        // Add to search option
        const addToSearchItem = menu.createDiv('context-menu-item');
        const addToSearchIcon = addToSearchItem.createSpan('context-menu-icon');
        setIcon(addToSearchIcon, 'plus-circle');
        addToSearchItem.createSpan().textContent = 'Add to current search';
        addToSearchItem.addEventListener('click', () => {
            // Create synthetic event with ctrlKey = true
            const syntheticEvent = new MouseEvent('click', { ctrlKey: true });
            this.filterByPropertyValue(propertyPath, value, syntheticEvent);
            menu.remove();
        });
        
        // Exclude from search option
        const excludeFromSearchItem = menu.createDiv('context-menu-item');
        const excludeFromSearchIcon = excludeFromSearchItem.createSpan('context-menu-icon');
        setIcon(excludeFromSearchIcon, 'minus-circle');
        excludeFromSearchItem.createSpan().textContent = 'Add exclusion to search';
        excludeFromSearchItem.addEventListener('click', () => {
            this.filterByPropertyValueExclude(propertyPath, value);
            menu.remove();
        });
        
        // Add a divider
        const divider = menu.createDiv('context-menu-divider');
        
        // Copy menu header
        const copyHeader = menu.createDiv('context-menu-header');
        copyHeader.textContent = 'Copy to clipboard:';
        
        // Copy value only option
        const copyValueItem = menu.createDiv('context-menu-item');
        const valueIcon = copyValueItem.createSpan('context-menu-icon');
        setIcon(valueIcon, 'clipboard');
        copyValueItem.createSpan().textContent = 'Value only';
        copyValueItem.addEventListener('click', () => {
            navigator.clipboard.writeText(value).then(
                () => new Notice(`Copied value: ${value}`),
                (err) => {
                    console.error('Could not copy text: ', err);
                    new Notice('Failed to copy to clipboard');
                }
            );
            menu.remove();
        });
        
        // Copy property:value format option
        const copyPropertyValueItem = menu.createDiv('context-menu-item');
        const propValueIcon = copyPropertyValueItem.createSpan('context-menu-icon');
        setIcon(propValueIcon, 'clipboard-copy');
        
        const segments = propertyPath.split('/');
        const propertyName = segments[segments.length - 1];
        
        copyPropertyValueItem.createSpan().textContent = 'Property and value';
        copyPropertyValueItem.addEventListener('click', () => {
            const clipboardData = `${propertyName}: ${value}`;
            
            navigator.clipboard.writeText(clipboardData).then(
                () => new Notice(`Copied: ${clipboardData}`),
                (err) => {
                    console.error('Could not copy text: ', err);
                    new Notice('Failed to copy to clipboard');
                }
            );
            menu.remove();
        });
        
        // Close menu when clicking elsewhere
        document.addEventListener('click', () => {
            menu.remove();
        }, { once: true });
    }

    private matchesSearch(node: PropertyNode, searchValue: string): boolean {
        // Check if this node matches
        if (node.name.toLowerCase().includes(searchValue)) {
            return true;
        }
        
        // Check if any values match
        for (const value of node.values.keys()) {
            if (value.toLowerCase().includes(searchValue)) {
                return true;
            }
        }
        
        // Check if any children match
        for (const child of node.children.values()) {
            if (this.matchesSearch(child, searchValue)) {
                return true;
            }
        }
        
        return false;
    }

    private filterByProperty(propertyPath: string, event?: MouseEvent) {
        const app = this.app;
        const files = this.propertiesManager.searchForFiles(propertyPath);
        
        if (files.length > 0) {
            // First, try to focus the existing search view if it's open
            const searchLeaves = app.workspace.getLeavesOfType('search');
            
            // Check if Ctrl key is pressed
            const isCtrlPressed = event?.ctrlKey || false;
            
            // Open search with the property path using the workspace API instead of commands
            try {
                // Try to use the command API first
                if ('commands' in app) {
                    (app as any).commands.executeCommandById('global-search:open');
                } else {
                    // Fallback to opening a search leaf
                    app.workspace.getLeaf('tab').setViewState({
                        type: 'search',
                        state: { query: this.formatSearchTerm(propertyPath) }
                    });
                }
                
                setTimeout(() => {
                    const searchInputEl = document.querySelector('.search-input-container input');
                    if (searchInputEl) {
                        const searchInput = searchInputEl as HTMLInputElement;
                        const formattedPath = this.formatSearchTerm(propertyPath);
                        
                        // If Ctrl is pressed, append to existing query instead of replacing
                        if (isCtrlPressed && searchInput.value) {
                            searchInput.value = `${searchInput.value} ${formattedPath}`;
                        } else {
                            searchInput.value = formattedPath;
                        }
                        
                        searchInput.dispatchEvent(new Event('input'));
                        // Focus on the search input
                        searchInput.focus();
                    }
                }, 100);
            } catch (error) {
                new Notice("Could not open search. Try clicking the search icon first.");
                console.error("Search error:", error);
            }
        }
    }

    private filterByPropertyValue(propertyPath: string, value: string, event?: MouseEvent) {
        const app = this.app;
        const files = this.propertiesManager.searchForFiles(propertyPath, value);
        
        if (files.length > 0) {
            // Check if Ctrl key is pressed
            const isCtrlPressed = event?.ctrlKey || false;
            
            // Try to open or focus the search view
            try {
                // Try to use the command API first
                if ('commands' in app) {
                    (app as any).commands.executeCommandById('global-search:open');
                } else {
                    // Fallback to opening a search leaf
                    app.workspace.getLeaf('tab').setViewState({
                        type: 'search',
                        state: { query: this.formatSearchTermWithValue(propertyPath, value) }
                    });
                }
                
                setTimeout(() => {
                    const searchInputEl = document.querySelector('.search-input-container input');
                    if (searchInputEl) {
                        const searchInput = searchInputEl as HTMLInputElement;
                        const formattedTerm = this.formatSearchTermWithValue(propertyPath, value);
                        
                        // If Ctrl is pressed, append to existing query instead of replacing
                        if (isCtrlPressed && searchInput.value) {
                            searchInput.value = `${searchInput.value} ${formattedTerm}`;
                        } else {
                            searchInput.value = formattedTerm;
                        }
                        
                        searchInput.dispatchEvent(new Event('input'));
                        // Focus on the search input
                        searchInput.focus();
                    }
                }, 100);
            } catch (error) {
                new Notice("Could not open search. Try clicking the search icon first.");
                console.error("Search error:", error);
            }
        }
    }

    private formatSearchTerm(propertyPath: string): string {
        // Format the path for Obsidian search using the proper format ["property":"value"]
        const segments = propertyPath.split('/');
        const propertyName = segments[segments.length - 1];
        return `["${propertyName}":""]`;
    }

    private formatSearchTermWithValue(propertyPath: string, value: string): string {
        // Format the path and value for Obsidian search using the proper format ["property":"value"]
        const segments = propertyPath.split('/');
        const propertyName = segments[segments.length - 1];
        
        // Escape quotes in the value
        const escapedValue = value.replace(/"/g, '\\"');
        return `["${propertyName}":"${escapedValue}"]`;
    }

    // Updated method to handle excluding a property value from search
    private filterByPropertyValueExclude(propertyPath: string, value: string) {
        const app = this.app;
        
        try {
            // Try to use the command API first
            if ('commands' in app) {
                (app as any).commands.executeCommandById('global-search:open');
            } else {
                // Fallback to opening a search leaf
                app.workspace.getLeaf('tab').setViewState({
                    type: 'search',
                    state: { query: this.formatSearchTermWithValueExclude(propertyPath, value) }
                });
            }
            
            setTimeout(() => {
                const searchInputEl = document.querySelector('.search-input-container input');
                if (searchInputEl) {
                    const searchInput = searchInputEl as HTMLInputElement;
                    const formattedTerm = this.formatSearchTermWithValueExclude(propertyPath, value);
                    
                    // If there's already content in the search box, add to it
                    if (searchInput.value && searchInput.value.trim().length > 0) {
                        searchInput.value = `${searchInput.value} ${formattedTerm}`;
                    } else {
                        searchInput.value = formattedTerm;
                    }
                    
                    searchInput.dispatchEvent(new Event('input'));
                    // Focus on the search input
                    searchInput.focus();
                }
            }, 100);
        } catch (error) {
            new Notice("Could not open search. Try clicking the search icon first.");
            console.error("Search error:", error);
        }
    }
    
    // Helper method to format the exclude search term
    private formatSearchTermWithValueExclude(propertyPath: string, value: string): string {
        // Format the path and value for Obsidian search using the proper format -["property":"value"]
        const segments = propertyPath.split('/');
        const propertyName = segments[segments.length - 1];
        
        // Escape quotes in the value
        const escapedValue = value.replace(/"/g, '\\"');
        return `-["${propertyName}":"${escapedValue}"]`;
    }

    // Method to update toolbar fixed position based on settings
    public updateToolbarVisibility(): void {
        if (!this.toolbarEl) return;
        
        // Add or remove fixed class based on settings
        if (this.settings.fixedToolbar) {
            this.toolbarEl.addClass('toolbar-fixed');
            this.viewContentEl.addClass('with-fixed-toolbar');
        } else {
            this.toolbarEl.removeClass('toolbar-fixed');
            this.viewContentEl.removeClass('with-fixed-toolbar');
        }
    }
    
    // Method to update search visibility based on settings
    public updateSearchVisibility(): void {
        if (!this.searchContainer) return;
        
        // Only apply fixed search if toolbar is also fixed
        if (this.settings.fixedToolbar && this.settings.keepSearchVisible) {
            this.searchContainer.addClass('search-fixed');
            
            // Make search visible if both fixed toolbar and keep search visible are enabled
            if (this.settings.enableSearch) {
                this.searchContainer.style.display = 'block';
            }
        } else {
            this.searchContainer.removeClass('search-fixed');
            
            // Return to normal display rules
            this.searchContainer.style.display = this.settings.enableSearch ? 'block' : 'none';
        }
    }
}