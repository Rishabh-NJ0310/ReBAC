import {
    ProgramNode,
    ResourceNode,
    RelationDeclNode,
    PermissionNode,
    BinaryExpressionNode,
    UnaryExpressionNode,
    RelationNode
} from "./Nodes.js";

export interface ASTVisitor<R = void> {
    visitProgram(node: ProgramNode): R;
    visitResource(node: ResourceNode): R;
    visitRelationDecl(node: RelationDeclNode): R;
    visitPermission(node: PermissionNode): R;
    visitBinaryExpression(node: BinaryExpressionNode): R;
    visitUnaryExpression(node: UnaryExpressionNode): R;
    visitRelation(node: RelationNode): R;
}
