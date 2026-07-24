import { AttributeConditionNode, AttributePathNode, ComparisonOperator } from "../compiler/ast/Nodes.js";

export interface ABACContext {
    user?: Record<string, any>;
    resource?: Record<string, any>;
    [entity: string]: Record<string, any> | undefined;
}

export class ABACEvaluator {
    public evaluate(node: AttributeConditionNode, ctx: ABACContext): boolean {
        const leftVal = this.resolveValue(node.left, ctx);
        const rightVal = this.resolveValue(node.right, ctx);
        return this.compare(leftVal, node.operator, rightVal);
    }

    private resolveValue(val: AttributePathNode | string, ctx: ABACContext): any {
        if (typeof val === "string") {
            return val;
        }
        // AttributePathNode: ctx[object][field]
        const obj = ctx[val.object];
        if (obj === undefined) {
            throw new Error(`ABAC Error: Unknown attribute object '${val.object}'. Pass it in attributes context.`);
        }
        return obj[val.field];
    }

    private compare(left: any, op: ComparisonOperator, right: any): boolean {
        switch (op) {
            case "==": return left == right;
            case "!=": return left != right;
            case "<":  return left < right;
            case ">":  return left > right;
            case "<=": return left <= right;
            case ">=": return left >= right;
            default:
                throw new Error(`ABAC Error: Unknown comparison operator '${op}'`);
        }
    }
}
