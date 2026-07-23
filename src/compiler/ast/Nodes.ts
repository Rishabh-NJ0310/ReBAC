export type ASTNodeType =
    | "Program"
    | "ImportDecl"
    | "ModuleDecl"
    | "NamespaceDecl"
    | "SubjectDecl"
    | "Resource"
    | "RelationDecl"
    | "Permission"
    | "BinaryExpression"
    | "UnaryExpression"
    | "Relation"
    | "BooleanLiteral";

export interface ASTNode {
    nodeType: ASTNodeType;
    line: number;
    column: number;
}

export interface ImportDeclNode extends ASTNode {
    nodeType: "ImportDecl";
    path: string;
}

export interface ModuleDeclNode extends ASTNode {
    nodeType: "ModuleDecl";
    name: string;
}

export interface NamespaceDeclNode extends ASTNode {
    nodeType: "NamespaceDecl";
    name: string;
    resources: ResourceNode[];
}

export interface SubjectDeclNode extends ASTNode {
    nodeType: "SubjectDecl";
    name: string;
}

export interface ProgramNode extends ASTNode {
    nodeType: "Program";
    imports: ImportDeclNode[];
    modules: ModuleDeclNode[];
    namespaces: NamespaceDeclNode[];
    subjects: SubjectDeclNode[];
    resources: ResourceNode[];
}

export interface ResourceNode extends ASTNode {
    nodeType: "Resource";
    name: string;
    extends?: string;
    relations: RelationDeclNode[];
    permissions: PermissionNode[];
}

export interface RelationDeclNode extends ASTNode {
    nodeType: "RelationDecl";
    name: string;
    targetType?: string;
}

export interface PermissionNode extends ASTNode {
    nodeType: "Permission";
    name: string;
    expression: ExpressionNode;
}

export type ExpressionNode =
    | BinaryExpressionNode
    | UnaryExpressionNode
    | RelationNode
    | BooleanLiteralNode;

export interface BinaryExpressionNode extends ASTNode {
    nodeType: "BinaryExpression";
    operator: "AND" | "OR";
    left: ExpressionNode;
    right: ExpressionNode;
}

export interface UnaryExpressionNode extends ASTNode {
    nodeType: "UnaryExpression";
    operator: "NOT";
    operand: ExpressionNode;
}

export interface RelationNode extends ASTNode {
    nodeType: "Relation";
    relation: string;
    permission?: string;
}

export interface BooleanLiteralNode extends ASTNode {
    nodeType: "BooleanLiteral";
    value: boolean;
}
