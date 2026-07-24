import fs from "fs";
import path from "path";
import { compileAuthDSL, compileAuthDSLFile } from "../compiler/CompilerFacade.js";

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

export function loadSchemaFromDSL(filePath?: string): RebacSchema {
    try {
        const targetPath = filePath || path.join(process.cwd(), "src", "schema", "hospital.auth");
        if (fs.existsSync(targetPath)) {
            return compileAuthDSLFile(targetPath);
        }
    } catch (err) {
        console.warn("Failed to load schema from DSL file, using fallback:", err);
    }
    return fallbackSchema;
}

export const schema: RebacSchema = loadSchemaFromDSL();
