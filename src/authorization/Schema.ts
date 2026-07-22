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

export const schema: RebacSchema = {
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
