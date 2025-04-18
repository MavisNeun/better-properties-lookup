import { App, TFile, parseYaml } from 'obsidian';
import { BetterPropertiesLookupSettings } from './settings';

export interface PropertyNode {
    name: string;
    fullPath: string;
    count: number;
    percentage: number;
    children: Map<string, PropertyNode>;
    values: Map<string, number>;
    totalFiles: number;
}

export class PropertiesManager {
    private app: App;
    private propertyTree: PropertyNode;
    private fileProperties: Map<string, Record<string, any>>;
    private totalFiles: number;
    private settings: BetterPropertiesLookupSettings;

    constructor(app: App, settings: BetterPropertiesLookupSettings) {
        this.app = app;
        this.settings = settings;
        this.fileProperties = new Map();
        this.totalFiles = 0;
        this.propertyTree = this.createPropertyNode('root', '');
    }

    private createPropertyNode(name: string, fullPath: string): PropertyNode {
        return {
            name,
            fullPath,
            count: 0,
            percentage: 0,
            children: new Map(),
            values: new Map(),
            totalFiles: 0
        };
    }

    async loadProperties() {
        const files = this.app.vault.getMarkdownFiles();
        this.totalFiles = files.length;
        
        // Reset the property tree
        this.propertyTree = this.createPropertyNode('root', '');
        this.fileProperties.clear();

        // Process each file
        for (const file of files) {
            await this.processFile(file);
        }

        // Calculate percentages
        this.calculatePercentages(this.propertyTree);
    }

    async processFile(file: TFile) {
        try {
            const content = await this.app.vault.read(file);
            const frontmatter = this.extractFrontmatter(content);
            
            if (frontmatter) {
                // Store the properties for this file
                this.fileProperties.set(file.path, frontmatter);
                
                // Add properties to the tree
                this.addPropertiesToTree(frontmatter);
            } else {
                // If the file previously had properties but no longer does, remove it
                if (this.fileProperties.has(file.path)) {
                    this.removeFile(file);
                }
            }
        } catch (error) {
            console.error(`Error processing file ${file.path}:`, error);
        }
    }

    removeFile(file: TFile) {
        const properties = this.fileProperties.get(file.path);
        if (properties) {
            // TODO: Implement removal of properties from the tree
            this.fileProperties.delete(file.path);
            
            // Recalculate percentages after removal
            this.calculatePercentages(this.propertyTree);
        }
    }

    private extractFrontmatter(content: string): Record<string, any> | null {
        const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n/;
        const match = content.match(frontmatterRegex);
        
        if (match && match[1]) {
            try {
                return parseYaml(match[1]);
            } catch (error) {
                console.error("Error parsing frontmatter YAML:", error);
                return null;
            }
        }
        
        return null;
    }

    private addPropertiesToTree(properties: Record<string, any>, prefix = '') {
        for (const [key, value] of Object.entries(properties)) {
            // Only process top-level properties based on inclusion/exclusion settings
            if (prefix === '') {
                // If includedProperties has items, only include those specific properties
                if (this.settings.includedProperties.length > 0) {
                    if (!this.settings.includedProperties.includes(key)) {
                        continue;
                    }
                } 
                // If no inclusions specified, check exclusions
                else if (this.settings.excludedProperties.length > 0) {
                    if (this.settings.excludedProperties.includes(key)) {
                        continue;
                    }
                }
            }
            
            const fullPath = prefix ? `${prefix}/${key}` : key;
            
            // Add or update the current property node
            this.addPropertyNode(fullPath, key, value);
            
            // If the value is an object and nested properties are enabled, recurse into it
            if (value && typeof value === 'object' && !Array.isArray(value) && this.settings.showNestedProperties) {
                this.addPropertiesToTree(value, fullPath);
            }
        }
    }

    private addPropertyNode(fullPath: string, name: string, value: any) {
        // Split the path into segments
        const segments = fullPath.split('/');
        
        // Start at the root
        let currentNode = this.propertyTree;
        let currentPath = '';
        
        // Navigate or create the path in the tree
        for (let i = 0; i < segments.length; i++) {
            const segment = segments[i];
            currentPath = currentPath ? `${currentPath}/${segment}` : segment;
            
            // If this node doesn't exist, create it
            if (!currentNode.children.has(segment)) {
                currentNode.children.set(segment, this.createPropertyNode(segment, currentPath));
            }
            
            // Update the count at this level
            const node = currentNode.children.get(segment)!;
            node.count += 1;
            
            // If this is the leaf node, record the value
            if (i === segments.length - 1 && value !== null && value !== undefined) {
                // Handle array values
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
            
            // Move to the next node
            currentNode = node;
        }
    }

    private calculatePercentages(node: PropertyNode) {
        // Calculate the percentage for this node
        node.percentage = this.totalFiles > 0 ? (node.count / this.totalFiles) * 100 : 0;
        
        // Calculate for each child
        for (const child of node.children.values()) {
            this.calculatePercentages(child);
        }
    }

    getPropertyTree(): PropertyNode {
        return this.propertyTree;
    }

    getSortedProperties(node: PropertyNode): [string, PropertyNode][] {
        const entries = Array.from(node.children.entries());
        
        switch (this.settings.sortOrder) {
            case 'nameAsc':
                return entries.sort(([a], [b]) => a.localeCompare(b));
            case 'nameDesc':
                return entries.sort(([a], [b]) => b.localeCompare(a));
            case 'freqDesc':
                return entries.sort(([, a], [, b]) => b.count - a.count);
            case 'freqAsc':
                return entries.sort(([, a], [, b]) => a.count - b.count);
            default:
                return entries.sort(([, a], [, b]) => b.count - a.count);
        }
    }

    getPropertyValues(propertyPath: string): Map<string, number> | null {
        const segments = propertyPath.split('/');
        let currentNode = this.propertyTree;
        
        // Navigate down the tree
        for (const segment of segments) {
            if (segment === 'root') continue;
            
            if (!currentNode.children.has(segment)) {
                return null;
            }
            
            currentNode = currentNode.children.get(segment)!;
        }
        
        return currentNode.values;
    }

    searchForFiles(propertyPath: string, value?: string): TFile[] {
        const matchingFiles: TFile[] = [];
        
        for (const [filePath, properties] of this.fileProperties.entries()) {
            // Check if this file has the property
            const segments = propertyPath.split('/');
            let current = properties;
            let match = true;
            
            for (const segment of segments) {
                if (segment === 'root') continue;
                
                if (current && typeof current === 'object' && segment in current) {
                    current = current[segment];
                } else {
                    match = false;
                    break;
                }
            }
            
            // If we found the property and either no value is specified or the value matches
            if (match && (value === undefined || this.valueMatches(current, value))) {
                const file = this.app.vault.getAbstractFileByPath(filePath);
                if (file instanceof TFile) {
                    matchingFiles.push(file);
                }
            }
        }
        
        return matchingFiles;
    }

    private valueMatches(actual: any, expected: string): boolean {
        // If the actual value is an array, check if any element matches
        if (Array.isArray(actual)) {
            return actual.some(item => String(item) === expected);
        }
        
        // Otherwise just compare as strings
        return String(actual) === expected;
    }
} 