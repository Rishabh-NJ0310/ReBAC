export interface Rule {
    relation: string;
    permission?: string;
}

export interface ResourceTypeRules {
    [permission: string]: Rule[];
}

export interface RebacSchema {
    [resourceType: string]: ResourceTypeRules;
}

export const schema: RebacSchema = {
    patient: {
        view: [
            {
                relation: "doctor"
            },
            {
                relation: "admitted_in",
                permission: "view"
            }
        ]
    },
    ward: {
        view: [
            {
                relation: "assigned_nurse"
            }
        ]
    }
};
