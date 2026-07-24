export interface ExplainNode {
    type: "OR" | "AND" | "NOT" | "Rule" | "Caveat" | "ABAC";
    label: string;
    result: boolean;
    durationMs?: number;
    children?: ExplainNode[];
}

export class ExplainTreeBuilder {
    private root: ExplainNode | null = null;
    private stack: ExplainNode[] = [];

    public open(type: ExplainNode["type"], label: string): void {
        const node: ExplainNode = { type, label, result: false, children: [] };
        if (this.stack.length > 0) {
            const parent = this.stack[this.stack.length - 1];
            parent.children = parent.children ?? [];
            parent.children.push(node);
        } else {
            this.root = node;
        }
        this.stack.push(node);
    }

    public close(result: boolean, durationMs?: number): void {
        const node = this.stack.pop();
        if (node) {
            node.result = result;
            if (durationMs !== undefined) node.durationMs = Number(durationMs.toFixed(3));
        }
    }

    public leaf(type: ExplainNode["type"], label: string, result: boolean, durationMs?: number): void {
        const node: ExplainNode = {
            type,
            label,
            result,
            durationMs: durationMs !== undefined ? Number(durationMs.toFixed(3)) : undefined
        };
        if (this.stack.length > 0) {
            const parent = this.stack[this.stack.length - 1];
            parent.children = parent.children ?? [];
            parent.children.push(node);
        } else {
            this.root = node;
        }
    }

    public getTree(): ExplainNode | null {
        return this.root;
    }

    public renderText(node: ExplainNode | null = this.root, indent: string = ""): string {
        if (!node) return "(empty explain tree)";
        const icon = node.result ? "✔" : "✘";
        const timing = node.durationMs !== undefined ? ` [${node.durationMs}ms]` : "";
        let out = `${indent}${icon} ${node.label}${timing}\n`;
        if (node.children && node.children.length > 0) {
            for (let i = 0; i < node.children.length; i++) {
                const isLast = i === node.children.length - 1;
                const childPrefix = indent + (isLast ? "  └─ " : "  ├─ ");
                const grandChildIndent = indent + (isLast ? "     " : "  │  ");
                const child = node.children[i];
                const childIcon = child.result ? "✔" : "✘";
                const childTiming = child.durationMs !== undefined ? ` [${child.durationMs}ms]` : "";
                out += `${childPrefix}${childIcon} ${child.label}${childTiming}\n`;
                if (child.children && child.children.length > 0) {
                    out += this.renderChildren(child.children, grandChildIndent);
                }
            }
        }
        return out;
    }

    private renderChildren(children: ExplainNode[], indent: string): string {
        let out = "";
        for (let i = 0; i < children.length; i++) {
            const isLast = i === children.length - 1;
            const prefix = indent + (isLast ? "└─ " : "├─ ");
            const grandChildIndent = indent + (isLast ? "   " : "│  ");
            const child = children[i];
            const icon = child.result ? "✔" : "✘";
            const timing = child.durationMs !== undefined ? ` [${child.durationMs}ms]` : "";
            out += `${prefix}${icon} ${child.label}${timing}\n`;
            if (child.children && child.children.length > 0) {
                out += this.renderChildren(child.children, grandChildIndent);
            }
        }
        return out;
    }
}
