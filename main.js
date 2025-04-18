var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/main.ts
var main_exports = {};
__export(main_exports, {
  default: () => BetterPropertiesLookupPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian4 = require("obsidian");

// src/view.ts
var import_obsidian = require("obsidian");
var VIEW_TYPE_BETTER_PROPERTIES = "better-properties-lookup-view";
var BetterPropertiesLookupView = class extends import_obsidian.ItemView {
  constructor(leaf, propertiesManager, settings) {
    super(leaf);
    this.propertiesManager = propertiesManager;
    this.settings = settings;
  }
  getViewType() {
    return VIEW_TYPE_BETTER_PROPERTIES;
  }
  getDisplayText() {
    return "Better Properties";
  }
  getIcon() {
    return "list-plus";
  }
  async onOpen() {
    const { containerEl } = this;
    this.viewContentEl = this.contentEl;
    this.viewContentEl.empty();
    this.viewContentEl.addClass("better-properties-container");
    this.createToolbar();
    const toolbarContainer = this.toolbarEl;
    this.createSearchBar(toolbarContainer);
    this.updateToolbarVisibility();
    this.updateSearchVisibility();
    this.renderPropertyTree();
    await this.propertiesManager.loadProperties();
    this.renderPropertyTree();
  }
  refresh() {
    this.renderPropertyTree();
    this.updateToolbarVisibility();
    this.updateSearchVisibility();
  }
  createToolbar() {
    this.toolbarEl = this.viewContentEl.createDiv("better-properties-toolbar");
    const leftSection = this.toolbarEl.createDiv("toolbar-section left-section");
    const sortDropdownContainer = leftSection.createDiv("sort-dropdown-container");
    const sortDropdownButton = sortDropdownContainer.createDiv("toolbar-button sort-dropdown-button");
    (0, import_obsidian.setIcon)(sortDropdownButton, "arrow-down-wide-narrow");
    sortDropdownButton.setAttribute("title", "Sort options");
    const dropdownMenu = sortDropdownContainer.createDiv("sort-dropdown-menu");
    dropdownMenu.style.display = "none";
    const sortNameAsc = dropdownMenu.createDiv("sort-option");
    sortNameAsc.textContent = "A\u2192Z (Name ascending)";
    sortNameAsc.addEventListener("click", () => {
      this.settings.sortOrder = "nameAsc";
      dropdownMenu.style.display = "none";
      this.renderPropertyTree();
    });
    const sortNameDesc = dropdownMenu.createDiv("sort-option");
    sortNameDesc.textContent = "Z\u2192A (Name descending)";
    sortNameDesc.addEventListener("click", () => {
      this.settings.sortOrder = "nameDesc";
      dropdownMenu.style.display = "none";
      this.renderPropertyTree();
    });
    const sortFreqDesc = dropdownMenu.createDiv("sort-option");
    sortFreqDesc.textContent = "9\u21921 (Frequency high to low)";
    sortFreqDesc.addEventListener("click", () => {
      this.settings.sortOrder = "freqDesc";
      dropdownMenu.style.display = "none";
      this.renderPropertyTree();
    });
    const sortFreqAsc = dropdownMenu.createDiv("sort-option");
    sortFreqAsc.textContent = "1\u21929 (Frequency low to high)";
    sortFreqAsc.addEventListener("click", () => {
      this.settings.sortOrder = "freqAsc";
      dropdownMenu.style.display = "none";
      this.renderPropertyTree();
    });
    sortDropdownButton.addEventListener("click", (e) => {
      e.stopPropagation();
      dropdownMenu.style.display = dropdownMenu.style.display === "none" ? "block" : "none";
    });
    document.addEventListener("click", () => {
      dropdownMenu.style.display = "none";
    });
    const expandCollapseBtn = leftSection.createDiv("toolbar-button");
    expandCollapseBtn.setAttribute("title", "Toggle expand/collapse all");
    this.updateExpandCollapseIcon(expandCollapseBtn);
    expandCollapseBtn.addEventListener("click", () => {
      this.toggleExpandCollapse(expandCollapseBtn);
    });
    const toggleSearchBtn = leftSection.createDiv("toolbar-button");
    toggleSearchBtn.setAttribute("title", "Toggle search");
    (0, import_obsidian.setIcon)(toggleSearchBtn, "search");
    toggleSearchBtn.addEventListener("click", () => {
      this.settings.enableSearch = !this.settings.enableSearch;
      toggleSearchBtn.toggleClass("active", this.settings.enableSearch);
      this.searchContainer.style.display = this.settings.enableSearch ? "block" : "none";
    });
    const rightSection = this.toolbarEl.createDiv("toolbar-section right-section");
    const reindexBtn = rightSection.createDiv("toolbar-button");
    reindexBtn.setAttribute("title", "Reindex properties");
    (0, import_obsidian.setIcon)(reindexBtn, "refresh-cw");
    reindexBtn.addEventListener("click", async () => {
      reindexBtn.addClass("loading");
      reindexBtn.style.pointerEvents = "none";
      try {
        const plugin = this.app.plugins.plugins["better-properties-lookup"];
        if (plugin && plugin.reloadProperties) {
          await plugin.reloadProperties();
          new import_obsidian.Notice("Properties reindexed successfully");
        }
      } catch (error) {
        console.error("Error reindexing properties:", error);
        new import_obsidian.Notice("Error reindexing properties");
      } finally {
        reindexBtn.removeClass("loading");
        reindexBtn.style.pointerEvents = "auto";
      }
    });
    this.settings.enableSearch = false;
  }
  updateActiveSort() {
    const sortDropdownButton = this.toolbarEl.querySelector(".sort-dropdown-button");
    if (sortDropdownButton) {
    }
  }
  createSearchBar(parentEl) {
    const container = parentEl || this.viewContentEl;
    this.searchContainer = container.createDiv("search-container");
    this.searchContainer.style.display = "none";
    const searchWrapper = this.searchContainer.createDiv("search-input-wrapper");
    this.searchInput = searchWrapper.createEl("input", {
      type: "text",
      placeholder: "Search properties...",
      cls: "better-properties-search"
    });
    const clearButton = searchWrapper.createDiv("search-clear-button");
    clearButton.setAttribute("title", "Clear search");
    (0, import_obsidian.setIcon)(clearButton, "x");
    clearButton.style.display = "none";
    this.searchInput.addEventListener("input", () => {
      clearButton.style.display = this.searchInput.value ? "flex" : "none";
      this.renderPropertyTree();
    });
    clearButton.addEventListener("click", (e) => {
      e.stopPropagation();
      this.searchInput.value = "";
      clearButton.style.display = "none";
      this.searchInput.dispatchEvent(new Event("input"));
      this.searchInput.focus();
    });
  }
  areAllSectionsExpanded() {
    const foldContents = this.viewContentEl.querySelectorAll(".fold-content, .node-content");
    for (let i = 0; i < foldContents.length; i++) {
      const content = foldContents[i];
      if (content.style.display !== "block") {
        return false;
      }
    }
    return foldContents.length > 0;
  }
  updateExpandCollapseIcon(button) {
    button.empty();
    if (this.areAllSectionsExpanded()) {
      (0, import_obsidian.setIcon)(button, "chevrons-down-up");
      button.setAttribute("title", "Collapse all");
    } else {
      (0, import_obsidian.setIcon)(button, "chevrons-up-down");
      button.setAttribute("title", "Expand all");
    }
  }
  toggleExpandCollapse(button) {
    if (this.areAllSectionsExpanded()) {
      this.collapseAllSections();
    } else {
      this.expandAllSections();
    }
    this.updateExpandCollapseIcon(button);
  }
  expandAllSections() {
    const toggles = this.viewContentEl.querySelectorAll(".fold-toggle");
    const foldContents = this.viewContentEl.querySelectorAll(".fold-content, .node-content");
    toggles.forEach((toggle) => {
      toggle.empty();
      (0, import_obsidian.setIcon)(toggle, "chevron-down");
    });
    foldContents.forEach((content) => {
      const element = content;
      element.style.display = "block";
    });
  }
  collapseAllSections() {
    const toggles = this.viewContentEl.querySelectorAll(".fold-toggle");
    const foldContents = this.viewContentEl.querySelectorAll(".fold-content, .node-content");
    toggles.forEach((toggle) => {
      toggle.empty();
      (0, import_obsidian.setIcon)(toggle, "chevron-right");
    });
    foldContents.forEach((content) => {
      const element = content;
      element.style.display = "none";
    });
  }
  renderPropertyTree() {
    const nodes = this.viewContentEl.querySelectorAll(".property-section");
    nodes.forEach((node) => node.remove());
    const propertyTree = this.propertiesManager.getPropertyTree();
    const searchValue = this.settings.enableSearch && this.searchInput ? this.searchInput.value.toLowerCase() : "";
    const sortedEntries = this.propertiesManager.getSortedProperties(propertyTree);
    for (const [name, node] of sortedEntries) {
      if (searchValue && !this.matchesSearch(node, searchValue)) {
        continue;
      }
      this.renderPropertySection(node);
    }
    if (this.settings.expandPropertiesByDefault) {
      this.expandAllSections();
    }
  }
  renderPropertySection(node) {
    const section = this.viewContentEl.createDiv("property-section");
    const header = section.createDiv("fold-header");
    const toggle = header.createSpan("fold-toggle");
    (0, import_obsidian.setIcon)(toggle, "chevron-right");
    const textContainer = header.createSpan("property-text");
    if (this.settings.showPropertyCounts) {
      textContainer.textContent = `${node.name} ( ${node.count} \u{1F4C4}, ${Math.round(node.percentage)}%)`;
    } else {
      textContainer.textContent = node.name;
    }
    header.setAttribute("data-path", node.fullPath);
    if (node.values.size > 0) {
      const distinctValuesSpan = header.createSpan("distinct-values");
      if (this.settings.useCondensedDisplay) {
        distinctValuesSpan.textContent = `${node.values.size} dvs`;
      } else {
        distinctValuesSpan.textContent = `${node.values.size} distinct values`;
      }
    }
    const content = section.createDiv("fold-content");
    content.style.display = "none";
    if (node.values.size > 0) {
      this.createValuesTable(content, node);
    }
    if (node.children.size > 0) {
      const childrenContainer = content.createDiv("property-children");
      const sortedChildren = this.propertiesManager.getSortedProperties(node);
      for (const [, childNode] of sortedChildren) {
        this.renderPropertyNode(childrenContainer, childNode);
      }
    }
    header.addEventListener("click", (e) => {
      const isVisible = content.style.display === "block";
      content.style.display = isVisible ? "none" : "block";
      toggle.empty();
      (0, import_obsidian.setIcon)(toggle, isVisible ? "chevron-right" : "chevron-down");
    });
  }
  renderPropertyNode(container, node) {
    const nodeEl = container.createDiv("property-node");
    const header = nodeEl.createDiv("node-header");
    header.setAttribute("data-path", node.fullPath);
    if (node.children.size > 0 || node.values.size > 0) {
      const toggle = header.createSpan("fold-toggle");
      (0, import_obsidian.setIcon)(toggle, "chevron-right");
      const label = header.createSpan("node-label");
      if (this.settings.showPropertyCounts) {
        label.textContent = `${node.name} (${node.count})`;
      } else {
        label.textContent = node.name;
      }
      const content = nodeEl.createDiv("node-content");
      content.style.display = "none";
      if (node.values.size > 0) {
        this.createValuesTable(content, node);
      }
      if (node.children.size > 0) {
        const childrenContainer = content.createDiv("node-children");
        const sortedChildren = this.propertiesManager.getSortedProperties(node);
        for (const [, childNode] of sortedChildren) {
          this.renderPropertyNode(childrenContainer, childNode);
        }
      }
      header.addEventListener("click", () => {
        const isVisible = content.style.display === "block";
        content.style.display = isVisible ? "none" : "block";
        toggle.empty();
        (0, import_obsidian.setIcon)(toggle, isVisible ? "chevron-right" : "chevron-down");
      });
    } else {
      const label = header.createSpan("node-label");
      if (this.settings.showPropertyCounts) {
        label.textContent = `${node.name} (${node.count})`;
      } else {
        label.textContent = node.name;
      }
    }
  }
  createValuesTable(container, node) {
    const table = container.createEl("table");
    table.addClass("values-table");
    const thead = table.createEl("thead");
    const headerRow = thead.createEl("tr");
    ["Value", "Count", "%"].forEach((col) => {
      const th = headerRow.createEl("th");
      th.textContent = col;
    });
    const tbody = table.createEl("tbody");
    const totalValues = Array.from(node.values.values()).reduce((sum, count) => sum + count, 0);
    const sortedValues = Array.from(node.values.entries()).sort(([_a, countA], [_b, countB]) => countB - countA);
    for (const [value, count] of sortedValues) {
      const row = tbody.createEl("tr");
      const valueCell = row.createEl("td");
      valueCell.textContent = value;
      const countCell = row.createEl("td");
      countCell.textContent = String(count);
      const percentCell = row.createEl("td");
      const percentage = totalValues > 0 ? count / totalValues * 100 : 0;
      percentCell.textContent = `${Math.round(percentage)}%`;
      row.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.showValueContextMenu(e, node.fullPath, value);
      });
    }
  }
  // Method to show context menu for property values
  showValueContextMenu(event, propertyPath, value) {
    document.querySelectorAll(".value-context-menu").forEach((menu2) => menu2.remove());
    const menu = document.body.createDiv("value-context-menu");
    menu.style.left = `${event.pageX}px`;
    menu.style.top = `${event.pageY}px`;
    const newSearchItem = menu.createDiv("context-menu-item");
    const newSearchIcon = newSearchItem.createSpan("context-menu-icon");
    (0, import_obsidian.setIcon)(newSearchIcon, "search");
    newSearchItem.createSpan().textContent = "New search for this value";
    newSearchItem.addEventListener("click", () => {
      this.filterByPropertyValue(propertyPath, value);
      menu.remove();
    });
    const addToSearchItem = menu.createDiv("context-menu-item");
    const addToSearchIcon = addToSearchItem.createSpan("context-menu-icon");
    (0, import_obsidian.setIcon)(addToSearchIcon, "plus-circle");
    addToSearchItem.createSpan().textContent = "Add to current search";
    addToSearchItem.addEventListener("click", () => {
      const syntheticEvent = new MouseEvent("click", { ctrlKey: true });
      this.filterByPropertyValue(propertyPath, value, syntheticEvent);
      menu.remove();
    });
    const excludeFromSearchItem = menu.createDiv("context-menu-item");
    const excludeFromSearchIcon = excludeFromSearchItem.createSpan("context-menu-icon");
    (0, import_obsidian.setIcon)(excludeFromSearchIcon, "minus-circle");
    excludeFromSearchItem.createSpan().textContent = "Add exclusion to search";
    excludeFromSearchItem.addEventListener("click", () => {
      this.filterByPropertyValueExclude(propertyPath, value);
      menu.remove();
    });
    const divider = menu.createDiv("context-menu-divider");
    const copyHeader = menu.createDiv("context-menu-header");
    copyHeader.textContent = "Copy to clipboard:";
    const copyValueItem = menu.createDiv("context-menu-item");
    const valueIcon = copyValueItem.createSpan("context-menu-icon");
    (0, import_obsidian.setIcon)(valueIcon, "clipboard");
    copyValueItem.createSpan().textContent = "Value only";
    copyValueItem.addEventListener("click", () => {
      navigator.clipboard.writeText(value).then(
        () => new import_obsidian.Notice(`Copied value: ${value}`),
        (err) => {
          console.error("Could not copy text: ", err);
          new import_obsidian.Notice("Failed to copy to clipboard");
        }
      );
      menu.remove();
    });
    const copyPropertyValueItem = menu.createDiv("context-menu-item");
    const propValueIcon = copyPropertyValueItem.createSpan("context-menu-icon");
    (0, import_obsidian.setIcon)(propValueIcon, "clipboard-copy");
    const segments = propertyPath.split("/");
    const propertyName = segments[segments.length - 1];
    copyPropertyValueItem.createSpan().textContent = "Property and value";
    copyPropertyValueItem.addEventListener("click", () => {
      const clipboardData = `${propertyName}: ${value}`;
      navigator.clipboard.writeText(clipboardData).then(
        () => new import_obsidian.Notice(`Copied: ${clipboardData}`),
        (err) => {
          console.error("Could not copy text: ", err);
          new import_obsidian.Notice("Failed to copy to clipboard");
        }
      );
      menu.remove();
    });
    document.addEventListener("click", () => {
      menu.remove();
    }, { once: true });
  }
  matchesSearch(node, searchValue) {
    if (node.name.toLowerCase().includes(searchValue)) {
      return true;
    }
    for (const value of node.values.keys()) {
      if (value.toLowerCase().includes(searchValue)) {
        return true;
      }
    }
    for (const child of node.children.values()) {
      if (this.matchesSearch(child, searchValue)) {
        return true;
      }
    }
    return false;
  }
  filterByProperty(propertyPath, event) {
    const app = this.app;
    const files = this.propertiesManager.searchForFiles(propertyPath);
    if (files.length > 0) {
      const searchLeaves = app.workspace.getLeavesOfType("search");
      const isCtrlPressed = (event == null ? void 0 : event.ctrlKey) || false;
      try {
        if ("commands" in app) {
          app.commands.executeCommandById("global-search:open");
        } else {
          app.workspace.getLeaf("tab").setViewState({
            type: "search",
            state: { query: this.formatSearchTerm(propertyPath) }
          });
        }
        setTimeout(() => {
          const searchInputEl = document.querySelector(".search-input-container input");
          if (searchInputEl) {
            const searchInput = searchInputEl;
            const formattedPath = this.formatSearchTerm(propertyPath);
            if (isCtrlPressed && searchInput.value) {
              searchInput.value = `${searchInput.value} ${formattedPath}`;
            } else {
              searchInput.value = formattedPath;
            }
            searchInput.dispatchEvent(new Event("input"));
            searchInput.focus();
          }
        }, 100);
      } catch (error) {
        new import_obsidian.Notice("Could not open search. Try clicking the search icon first.");
        console.error("Search error:", error);
      }
    }
  }
  filterByPropertyValue(propertyPath, value, event) {
    const app = this.app;
    const files = this.propertiesManager.searchForFiles(propertyPath, value);
    if (files.length > 0) {
      const isCtrlPressed = (event == null ? void 0 : event.ctrlKey) || false;
      try {
        if ("commands" in app) {
          app.commands.executeCommandById("global-search:open");
        } else {
          app.workspace.getLeaf("tab").setViewState({
            type: "search",
            state: { query: this.formatSearchTermWithValue(propertyPath, value) }
          });
        }
        setTimeout(() => {
          const searchInputEl = document.querySelector(".search-input-container input");
          if (searchInputEl) {
            const searchInput = searchInputEl;
            const formattedTerm = this.formatSearchTermWithValue(propertyPath, value);
            if (isCtrlPressed && searchInput.value) {
              searchInput.value = `${searchInput.value} ${formattedTerm}`;
            } else {
              searchInput.value = formattedTerm;
            }
            searchInput.dispatchEvent(new Event("input"));
            searchInput.focus();
          }
        }, 100);
      } catch (error) {
        new import_obsidian.Notice("Could not open search. Try clicking the search icon first.");
        console.error("Search error:", error);
      }
    }
  }
  formatSearchTerm(propertyPath) {
    const segments = propertyPath.split("/");
    const propertyName = segments[segments.length - 1];
    return `["${propertyName}":""]`;
  }
  formatSearchTermWithValue(propertyPath, value) {
    const segments = propertyPath.split("/");
    const propertyName = segments[segments.length - 1];
    const escapedValue = value.replace(/"/g, '\\"');
    return `["${propertyName}":"${escapedValue}"]`;
  }
  // Updated method to handle excluding a property value from search
  filterByPropertyValueExclude(propertyPath, value) {
    const app = this.app;
    try {
      if ("commands" in app) {
        app.commands.executeCommandById("global-search:open");
      } else {
        app.workspace.getLeaf("tab").setViewState({
          type: "search",
          state: { query: this.formatSearchTermWithValueExclude(propertyPath, value) }
        });
      }
      setTimeout(() => {
        const searchInputEl = document.querySelector(".search-input-container input");
        if (searchInputEl) {
          const searchInput = searchInputEl;
          const formattedTerm = this.formatSearchTermWithValueExclude(propertyPath, value);
          if (searchInput.value && searchInput.value.trim().length > 0) {
            searchInput.value = `${searchInput.value} ${formattedTerm}`;
          } else {
            searchInput.value = formattedTerm;
          }
          searchInput.dispatchEvent(new Event("input"));
          searchInput.focus();
        }
      }, 100);
    } catch (error) {
      new import_obsidian.Notice("Could not open search. Try clicking the search icon first.");
      console.error("Search error:", error);
    }
  }
  // Helper method to format the exclude search term
  formatSearchTermWithValueExclude(propertyPath, value) {
    const segments = propertyPath.split("/");
    const propertyName = segments[segments.length - 1];
    const escapedValue = value.replace(/"/g, '\\"');
    return `-["${propertyName}":"${escapedValue}"]`;
  }
  // Method to update toolbar fixed position based on settings
  updateToolbarVisibility() {
    if (!this.toolbarEl)
      return;
    if (this.settings.fixedToolbar) {
      this.toolbarEl.addClass("toolbar-fixed");
      this.viewContentEl.addClass("with-fixed-toolbar");
    } else {
      this.toolbarEl.removeClass("toolbar-fixed");
      this.viewContentEl.removeClass("with-fixed-toolbar");
    }
  }
  // Method to update search visibility based on settings
  updateSearchVisibility() {
    if (!this.searchContainer)
      return;
    if (this.settings.fixedToolbar && this.settings.keepSearchVisible) {
      this.searchContainer.addClass("search-fixed");
      if (this.settings.enableSearch) {
        this.searchContainer.style.display = "block";
      }
    } else {
      this.searchContainer.removeClass("search-fixed");
      this.searchContainer.style.display = this.settings.enableSearch ? "block" : "none";
    }
  }
};

// src/properties-manager.ts
var import_obsidian2 = require("obsidian");
var PropertiesManager = class {
  constructor(app, settings) {
    this.app = app;
    this.settings = settings;
    this.fileProperties = /* @__PURE__ */ new Map();
    this.totalFiles = 0;
    this.propertyTree = this.createPropertyNode("root", "");
  }
  createPropertyNode(name, fullPath) {
    return {
      name,
      fullPath,
      count: 0,
      percentage: 0,
      children: /* @__PURE__ */ new Map(),
      values: /* @__PURE__ */ new Map(),
      totalFiles: 0
    };
  }
  async loadProperties() {
    const files = this.app.vault.getMarkdownFiles();
    this.totalFiles = files.length;
    this.propertyTree = this.createPropertyNode("root", "");
    this.fileProperties.clear();
    for (const file of files) {
      await this.processFile(file);
    }
    this.calculatePercentages(this.propertyTree);
  }
  async processFile(file) {
    try {
      const content = await this.app.vault.read(file);
      const frontmatter = this.extractFrontmatter(content);
      if (frontmatter) {
        this.fileProperties.set(file.path, frontmatter);
        this.addPropertiesToTree(frontmatter);
      } else {
        if (this.fileProperties.has(file.path)) {
          this.removeFile(file);
        }
      }
    } catch (error) {
      console.error(`Error processing file ${file.path}:`, error);
    }
  }
  removeFile(file) {
    const properties = this.fileProperties.get(file.path);
    if (properties) {
      this.fileProperties.delete(file.path);
      this.calculatePercentages(this.propertyTree);
    }
  }
  extractFrontmatter(content) {
    const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n/;
    const match = content.match(frontmatterRegex);
    if (match && match[1]) {
      try {
        return (0, import_obsidian2.parseYaml)(match[1]);
      } catch (error) {
        console.error("Error parsing frontmatter YAML:", error);
        return null;
      }
    }
    return null;
  }
  addPropertiesToTree(properties, prefix = "") {
    for (const [key, value] of Object.entries(properties)) {
      if (prefix === "") {
        if (this.settings.includedProperties.length > 0) {
          if (!this.settings.includedProperties.includes(key)) {
            continue;
          }
        } else if (this.settings.excludedProperties.length > 0) {
          if (this.settings.excludedProperties.includes(key)) {
            continue;
          }
        }
      }
      const fullPath = prefix ? `${prefix}/${key}` : key;
      this.addPropertyNode(fullPath, key, value);
      if (value && typeof value === "object" && !Array.isArray(value) && this.settings.showNestedProperties) {
        this.addPropertiesToTree(value, fullPath);
      }
    }
  }
  addPropertyNode(fullPath, name, value) {
    const segments = fullPath.split("/");
    let currentNode = this.propertyTree;
    let currentPath = "";
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      currentPath = currentPath ? `${currentPath}/${segment}` : segment;
      if (!currentNode.children.has(segment)) {
        currentNode.children.set(segment, this.createPropertyNode(segment, currentPath));
      }
      const node = currentNode.children.get(segment);
      node.count += 1;
      if (i === segments.length - 1 && value !== null && value !== void 0) {
        if (Array.isArray(value)) {
          for (const item of value) {
            const stringValue = String(item);
            node.values.set(stringValue, (node.values.get(stringValue) || 0) + 1);
          }
        } else {
          const stringValue = String(value);
          node.values.set(stringValue, (node.values.get(stringValue) || 0) + 1);
        }
      }
      currentNode = node;
    }
  }
  calculatePercentages(node) {
    node.percentage = this.totalFiles > 0 ? node.count / this.totalFiles * 100 : 0;
    for (const child of node.children.values()) {
      this.calculatePercentages(child);
    }
  }
  getPropertyTree() {
    return this.propertyTree;
  }
  getSortedProperties(node) {
    const entries = Array.from(node.children.entries());
    switch (this.settings.sortOrder) {
      case "nameAsc":
        return entries.sort(([a], [b]) => a.localeCompare(b));
      case "nameDesc":
        return entries.sort(([a], [b]) => b.localeCompare(a));
      case "freqDesc":
        return entries.sort(([, a], [, b]) => b.count - a.count);
      case "freqAsc":
        return entries.sort(([, a], [, b]) => a.count - b.count);
      default:
        return entries.sort(([, a], [, b]) => b.count - a.count);
    }
  }
  getPropertyValues(propertyPath) {
    const segments = propertyPath.split("/");
    let currentNode = this.propertyTree;
    for (const segment of segments) {
      if (segment === "root")
        continue;
      if (!currentNode.children.has(segment)) {
        return null;
      }
      currentNode = currentNode.children.get(segment);
    }
    return currentNode.values;
  }
  searchForFiles(propertyPath, value) {
    const matchingFiles = [];
    for (const [filePath, properties] of this.fileProperties.entries()) {
      const segments = propertyPath.split("/");
      let current = properties;
      let match = true;
      for (const segment of segments) {
        if (segment === "root")
          continue;
        if (current && typeof current === "object" && segment in current) {
          current = current[segment];
        } else {
          match = false;
          break;
        }
      }
      if (match && (value === void 0 || this.valueMatches(current, value))) {
        const file = this.app.vault.getAbstractFileByPath(filePath);
        if (file instanceof import_obsidian2.TFile) {
          matchingFiles.push(file);
        }
      }
    }
    return matchingFiles;
  }
  valueMatches(actual, expected) {
    if (Array.isArray(actual)) {
      return actual.some((item) => String(item) === expected);
    }
    return String(actual) === expected;
  }
};

// src/settings.ts
var import_obsidian3 = require("obsidian");
var DEFAULT_SETTINGS = {
  showPropertyCounts: true,
  expandPropertiesByDefault: false,
  enableSearch: true,
  showNestedProperties: true,
  includedProperties: [],
  excludedProperties: [],
  sortOrder: "freqDesc",
  useCondensedDisplay: false,
  fixedToolbar: false,
  keepSearchVisible: false
};
var BetterPropertiesLookupSettingTab = class extends import_obsidian3.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "Better Properties Lookup Settings" });
    containerEl.createEl("h3", { text: "Display Settings" });
    new import_obsidian3.Setting(containerEl).setName("Show property counts").setDesc("Display the number of files for each property").addToggle((toggle) => toggle.setValue(this.plugin.settings.showPropertyCounts).onChange(async (value) => {
      this.plugin.settings.showPropertyCounts = value;
      await this.plugin.saveSettings();
      this.plugin.refreshView();
    }));
    new import_obsidian3.Setting(containerEl).setName("Use condensed display").setDesc('Show "N dvs" instead of "N distinct values" for more compact display').addToggle((toggle) => toggle.setValue(this.plugin.settings.useCondensedDisplay).onChange(async (value) => {
      this.plugin.settings.useCondensedDisplay = value;
      await this.plugin.saveSettings();
      this.plugin.refreshView();
    }));
    new import_obsidian3.Setting(containerEl).setName("Fixed toolbar").setDesc("Keep the toolbar fixed at the top when scrolling").addToggle((toggle) => toggle.setValue(this.plugin.settings.fixedToolbar).onChange(async (value) => {
      this.plugin.settings.fixedToolbar = value;
      await this.plugin.saveSettings();
      this.plugin.refreshView();
      if (this.plugin.view && this.plugin.view.toolbarEl) {
        this.plugin.view.updateToolbarVisibility();
      }
    }));
    new import_obsidian3.Setting(containerEl).setName("Keep search bar visible").setDesc("Keep the search bar visible when toolbar is fixed (requires fixed toolbar)").addToggle((toggle) => toggle.setValue(this.plugin.settings.keepSearchVisible).onChange(async (value) => {
      this.plugin.settings.keepSearchVisible = value;
      await this.plugin.saveSettings();
      this.plugin.refreshView();
      if (this.plugin.view && this.plugin.view.searchContainer) {
        this.plugin.view.updateSearchVisibility();
      }
    }));
    containerEl.createEl("h3", { text: "Behavior Settings" });
    new import_obsidian3.Setting(containerEl).setName("Expand properties by default").setDesc("Automatically expand all property groups when the view is loaded").addToggle((toggle) => toggle.setValue(this.plugin.settings.expandPropertiesByDefault).onChange(async (value) => {
      this.plugin.settings.expandPropertiesByDefault = value;
      await this.plugin.saveSettings();
      this.plugin.refreshView();
    }));
    new import_obsidian3.Setting(containerEl).setName("Enable search").setDesc("Show search bar to filter properties").addToggle((toggle) => toggle.setValue(this.plugin.settings.enableSearch).onChange(async (value) => {
      this.plugin.settings.enableSearch = value;
      await this.plugin.saveSettings();
      this.plugin.refreshView();
    }));
    new import_obsidian3.Setting(containerEl).setName("Show nested properties").setDesc("Display properties with nested structure").addToggle((toggle) => toggle.setValue(this.plugin.settings.showNestedProperties).onChange(async (value) => {
      this.plugin.settings.showNestedProperties = value;
      await this.plugin.saveSettings();
      this.plugin.refreshView();
    }));
    containerEl.createEl("h3", { text: "Sorting & Filtering" });
    new import_obsidian3.Setting(containerEl).setName("Default sort order").setDesc("Choose how properties are sorted by default").addDropdown((dropdown) => dropdown.addOption("nameAsc", "Name (A to Z)").addOption("nameDesc", "Name (Z to A)").addOption("freqDesc", "Frequency (high to low)").addOption("freqAsc", "Frequency (low to high)").setValue(this.plugin.settings.sortOrder).onChange(async (value) => {
      this.plugin.settings.sortOrder = value;
      await this.plugin.saveSettings();
      this.plugin.refreshView();
    }));
    const includedInfo = containerEl.createEl("div", {
      cls: "setting-item-info",
      text: "Note: If both included and excluded properties are specified, inclusions take precedence."
    });
    includedInfo.style.marginBottom = "12px";
    includedInfo.style.fontStyle = "italic";
    includedInfo.style.fontSize = "0.85em";
    includedInfo.style.color = "var(--text-muted)";
    new import_obsidian3.Setting(containerEl).setName("Included properties").setDesc("List of top-level properties to include (comma-separated). If empty, all properties will be shown except excluded ones.").addText((text) => text.setPlaceholder("type, status, priority").setValue(this.plugin.settings.includedProperties.join(", ")).onChange(async (value) => {
      this.plugin.settings.includedProperties = value.split(",").map((item) => item.trim()).filter((item) => item.length > 0);
      await this.plugin.saveSettings();
      this.plugin.refreshView();
    }));
    new import_obsidian3.Setting(containerEl).setName("Excluded properties").setDesc("List of top-level properties to exclude (comma-separated). These will not show up in the view unless specifically included above.").addText((text) => text.setPlaceholder("created, modified").setValue(this.plugin.settings.excludedProperties.join(", ")).onChange(async (value) => {
      this.plugin.settings.excludedProperties = value.split(",").map((item) => item.trim()).filter((item) => item.length > 0);
      await this.plugin.saveSettings();
      this.plugin.refreshView();
    }));
    containerEl.createEl("h3", { text: "Maintenance" });
    new import_obsidian3.Setting(containerEl).setName("Reindex properties").setDesc("Manually rebuild the property index from all files").addButton((button) => button.setButtonText("Reindex").onClick(async () => {
      await this.plugin.reloadProperties();
    }));
  }
};

// src/main.ts
var BetterPropertiesLookupPlugin = class extends import_obsidian4.Plugin {
  constructor() {
    super(...arguments);
    this.view = null;
  }
  async onload() {
    console.log("Loading Better Properties Lookup plugin");
    await this.loadSettings();
    this.propertiesManager = new PropertiesManager(this.app, this.settings);
    this.registerView(
      VIEW_TYPE_BETTER_PROPERTIES,
      (leaf) => {
        this.view = new BetterPropertiesLookupView(leaf, this.propertiesManager, this.settings);
        return this.view;
      }
    );
    this.addSettingTab(new BetterPropertiesLookupSettingTab(this.app, this));
    this.addRibbonIcon("list-plus", "Better Properties Lookup", () => {
      this.activateView();
    });
    this.registerEvent(
      this.app.vault.on("create", (file) => {
        if (file instanceof import_obsidian4.TFile && file.extension === "md") {
          this.propertiesManager.processFile(file);
        }
      })
    );
    this.registerEvent(
      this.app.vault.on("modify", (file) => {
        if (file instanceof import_obsidian4.TFile && file.extension === "md") {
          this.propertiesManager.processFile(file);
        }
      })
    );
    this.registerEvent(
      this.app.vault.on("delete", (file) => {
        if (file instanceof import_obsidian4.TFile && file.extension === "md") {
          this.propertiesManager.removeFile(file);
        }
      })
    );
    this.propertiesManager.loadProperties();
  }
  async onunload() {
    console.log("Unloading Better Properties Lookup plugin");
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
      if (this.view.searchContainer) {
        this.view.searchContainer.style.display = this.settings.enableSearch ? "block" : "none";
      }
    }
  }
  async reloadProperties() {
    await this.propertiesManager.loadProperties();
    this.refreshView();
  }
  async activateView() {
    const { workspace } = this.app;
    const leaves = workspace.getLeavesOfType(VIEW_TYPE_BETTER_PROPERTIES);
    if (leaves.length > 0) {
      workspace.revealLeaf(leaves[0]);
      return;
    }
    const leaf = workspace.getLeftLeaf(false);
    if (leaf) {
      await leaf.setViewState({
        type: VIEW_TYPE_BETTER_PROPERTIES,
        active: true
      });
      const newLeaves = workspace.getLeavesOfType(VIEW_TYPE_BETTER_PROPERTIES);
      if (newLeaves.length > 0) {
        workspace.revealLeaf(newLeaves[0]);
      }
    } else {
      new import_obsidian4.Notice("Could not create sidebar view. Please try again.");
    }
  }
};
