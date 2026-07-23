export type SymbolKind = "resource" | "relation" | "permission";

export interface BaseSymbol {
    kind: SymbolKind;
    name: string;
    line: number;
    column: number;
}

export interface RelationSymbol extends BaseSymbol {
    kind: "relation";
    targetType?: string;
}

export interface PermissionSymbol extends BaseSymbol {
    kind: "permission";
}

export interface ResourceSymbol extends BaseSymbol {
    kind: "resource";
    relations: Map<string, RelationSymbol>;
    permissions: Map<string, PermissionSymbol>;
}

export class SymbolTable {
    private resources = new Map<string, ResourceSymbol>();

    public defineResource(name: string, line: number, column: number): ResourceSymbol {
        const symbol: ResourceSymbol = {
            kind: "resource",
            name,
            line,
            column,
            relations: new Map(),
            permissions: new Map()
        };
        this.resources.set(name, symbol);
        return symbol;
    }

    public getResource(name: string): ResourceSymbol | undefined {
        return this.resources.get(name);
    }

    public hasResource(name: string): boolean {
        return this.resources.has(name);
    }

    public getAllResources(): ResourceSymbol[] {
        return Array.from(this.resources.values());
    }

    public clear(): void {
        this.resources.clear();
    }
}
