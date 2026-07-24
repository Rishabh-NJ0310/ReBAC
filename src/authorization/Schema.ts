import fs from "fs";
import path from "path";
import { compileAuthDSLFile } from "../compiler/CompilerFacade.js";

export interface Rule {
    relation: string;
    permission?: string;
}

export type Operator = "AND" | "OR" | "NOT";

export interface RuleGroup {
    operator: Operator;
    rules: (Rule | RuleGroup)[];
}

export interface ResourceTypeRules {
    [permission: string]: RuleGroup | Rule | Rule[];
}

export interface RebacSchema {
    [resourceType: string]: ResourceTypeRules;
}

const fallbackSchema: RebacSchema = {
    patient: {
        view: {
            operator: "OR",
            rules: [
                { relation: "doctor_of" },
                { relation: "contains", permission: "view" }
            ]
        }
    },
    ward: {
        view: {
            operator: "OR",
            rules: [
                { relation: "assigned_nurse" },
                { relation: "contains", permission: "view" }
            ]
        }
    },
    department: {
        view: {
            operator: "OR",
            rules: [
                { relation: "head_of" }
            ]
        }
    }
};

/**
 * SchemaManager provides Hot Schema Reloading for .auth files.
 * It monitors file modification timestamps (mtime) and watches the schema directory.
 * Any edits to .auth files dynamically trigger recompilation without restarting the server.
 */
export class SchemaManager {
    private activeSchema: RebacSchema | null = null;
    private lastCompiledTimestamp: number = 0;
    private defaultFilePath: string;
    private schemaDir: string;
    private watcher: fs.FSWatcher | null = null;

    constructor(defaultFilePath?: string) {
        this.defaultFilePath = defaultFilePath || path.join(process.cwd(), "src", "schema", "hospital.auth");
        this.schemaDir = path.dirname(this.defaultFilePath);
        this.initWatcher();
    }

    private initWatcher(): void {
        try {
            if (fs.existsSync(this.schemaDir)) {
                this.watcher = fs.watch(this.schemaDir, { recursive: true }, (eventType, filename) => {
                    if (filename && filename.endsWith(".auth")) {
                        console.log(`⚡ [SchemaManager] Hot-reloading schema: '${filename}' changed on disk.`);
                        this.recompile();
                    }
                });
            }
        } catch {
            // fs.watch fallback handled via mtime check
        }
    }

    private checkFilesModified(): boolean {
        try {
            if (!fs.existsSync(this.schemaDir)) return false;
            const files = fs.readdirSync(this.schemaDir, { recursive: true });
            for (const file of files) {
                if (typeof file === "string" && file.endsWith(".auth")) {
                    const fullPath = path.join(this.schemaDir, file);
                    const stat = fs.statSync(fullPath);
                    if (stat.mtimeMs > this.lastCompiledTimestamp) {
                        return true;
                    }
                }
            }
        } catch {
            // proceed
        }
        return false;
    }

    public recompile(filePath?: string): RebacSchema {
        const targetPath = filePath || this.defaultFilePath;
        try {
            if (fs.existsSync(targetPath)) {
                const compiled = compileAuthDSLFile(targetPath);
                this.activeSchema = compiled;
                this.lastCompiledTimestamp = Date.now();
                return compiled;
            }
        } catch (err) {
            console.warn("⚠️ [SchemaManager] Recompilation error, using active/fallback schema:", (err as Error).message);
        }

        if (!this.activeSchema) {
            this.activeSchema = fallbackSchema;
        }
        return this.activeSchema;
    }

    public getSchema(filePath?: string): RebacSchema {
        if (!this.activeSchema || this.checkFilesModified()) {
            return this.recompile(filePath);
        }
        return this.activeSchema;
    }
}

export const globalSchemaManager = new SchemaManager();

export function loadSchemaFromDSL(filePath?: string): RebacSchema {
    return globalSchemaManager.getSchema(filePath);
}

// Export dynamic schema getter so any access receives the latest hot-reloaded schema
export const schema: RebacSchema = globalSchemaManager.getSchema();
