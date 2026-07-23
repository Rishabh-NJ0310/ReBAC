import { Token } from "../lexer/Token.js";
import { TokenType } from "../lexer/TokenType.js";
import {
    ProgramNode,
    ImportDeclNode,
    ModuleDeclNode,
    NamespaceDeclNode,
    SubjectDeclNode,
    ResourceNode,
    RelationDeclNode,
    PermissionNode,
    ExpressionNode,
    BinaryExpressionNode,
    UnaryExpressionNode,
    RelationNode,
    CaveatExpressionNode,
    AttributeConditionNode,
    AttributePathNode,
    ComparisonOperator,
    BooleanLiteralNode
} from "../ast/Nodes.js";

export class Parser {
    private current: number = 0;

    constructor(private tokens: Token[]) {}

    public parse(): ProgramNode {
        const startToken = this.peek();
        const imports: ImportDeclNode[] = [];
        const modules: ModuleDeclNode[] = [];
        const namespaces: NamespaceDeclNode[] = [];
        const subjects: SubjectDeclNode[] = [];
        const resources: ResourceNode[] = [];

        while (!this.isAtEnd()) {
            if (this.match(TokenType.IMPORT)) {
                imports.push(this.parseImportDecl());
            } else if (this.match(TokenType.MODULE)) {
                modules.push(this.parseModuleDecl());
            } else if (this.match(TokenType.NAMESPACE)) {
                namespaces.push(this.parseNamespaceDecl());
            } else if (this.match(TokenType.SUBJECT)) {
                subjects.push(this.parseSubjectDecl());
            } else if (this.match(TokenType.RESOURCE)) {
                resources.push(this.parseResource());
            } else {
                const token = this.peek();
                throw new Error(`Parse Error: Unexpected token '${token.value}' at line ${token.line}, column ${token.column}`);
            }
        }

        return {
            nodeType: "Program",
            imports,
            modules,
            namespaces,
            subjects,
            resources,
            line: startToken.line,
            column: startToken.column
        };
    }

    private parseImportDecl(): ImportDeclNode {
        const importToken = this.previous();
        const pathToken = this.consume(TokenType.STRING_LITERAL, "Expected string literal path after 'import'");
        return {
            nodeType: "ImportDecl",
            path: pathToken.value,
            line: importToken.line,
            column: importToken.column
        };
    }

    private parseModuleDecl(): ModuleDeclNode {
        const moduleToken = this.previous();
        const nameToken = this.consume(TokenType.IDENTIFIER, "Expected module name identifier after 'module'");
        return {
            nodeType: "ModuleDecl",
            name: nameToken.value,
            line: moduleToken.line,
            column: moduleToken.column
        };
    }

    private parseNamespaceDecl(): NamespaceDeclNode {
        const nsToken = this.previous();
        const nameToken = this.consume(TokenType.IDENTIFIER, "Expected namespace name identifier after 'namespace'");
        const resources: ResourceNode[] = [];

        if (this.match(TokenType.LBRACE)) {
            while (!this.check(TokenType.RBRACE) && !this.isAtEnd()) {
                if (this.match(TokenType.RESOURCE)) {
                    resources.push(this.parseResource());
                } else {
                    const token = this.peek();
                    throw new Error(`Parse Error: Expected 'resource' inside namespace '${nameToken.value}' at line ${token.line}, column ${token.column}`);
                }
            }
            this.consume(TokenType.RBRACE, "Expected '}' to close namespace block");
        }

        return {
            nodeType: "NamespaceDecl",
            name: nameToken.value,
            resources,
            line: nsToken.line,
            column: nsToken.column
        };
    }

    private parseSubjectDecl(): SubjectDeclNode {
        const subjectToken = this.previous();
        const nameToken = this.consume(TokenType.IDENTIFIER, "Expected subject type identifier after 'subject'");
        return {
            nodeType: "SubjectDecl",
            name: nameToken.value,
            line: subjectToken.line,
            column: subjectToken.column
        };
    }

    private parseResource(): ResourceNode {
        const resourceToken = this.previous();
        const nameToken = this.consume(TokenType.IDENTIFIER, "Expected resource identifier after 'resource'");
        let extendsParent: string | undefined = undefined;

        if (this.match(TokenType.EXTENDS)) {
            const parentToken = this.consume(TokenType.IDENTIFIER, "Expected parent resource identifier after 'extends'");
            extendsParent = parentToken.value;
        }

        this.consume(TokenType.LBRACE, "Expected '{' to start resource block");

        const relations: RelationDeclNode[] = [];
        const permissions: PermissionNode[] = [];

        while (!this.check(TokenType.RBRACE) && !this.isAtEnd()) {
            if (this.match(TokenType.RELATION)) {
                const relToken = this.previous();
                const relName = this.consume(TokenType.IDENTIFIER, "Expected relation identifier after 'relation'");
                let targetType: string | undefined = undefined;

                if (this.match(TokenType.COLON)) {
                    const targetTypeToken = this.consume(TokenType.IDENTIFIER, "Expected target resource or subject type identifier after ':'");
                    targetType = targetTypeToken.value;
                }

                relations.push({
                    nodeType: "RelationDecl",
                    name: relName.value,
                    targetType,
                    line: relToken.line,
                    column: relToken.column
                });
            } else if (this.match(TokenType.PERMISSION)) {
                const permToken = this.previous();
                const permName = this.consume(TokenType.IDENTIFIER, "Expected permission identifier after 'permission'");
                this.consume(TokenType.EQUALS, "Expected '=' after permission identifier");
                const expr = this.parseExpression();
                permissions.push({
                    nodeType: "Permission",
                    name: permName.value,
                    expression: expr,
                    line: permToken.line,
                    column: permToken.column
                });
            } else {
                const token = this.peek();
                throw new Error(`Parse Error: Expected 'relation' or 'permission' inside resource '${nameToken.value}' at line ${token.line}, column ${token.column}`);
            }
        }

        this.consume(TokenType.RBRACE, "Expected '}' to close resource block");

        return {
            nodeType: "Resource",
            name: nameToken.value,
            extends: extendsParent,
            relations,
            permissions,
            line: resourceToken.line,
            column: resourceToken.column
        };
    }

    // ─── Expression Parsing (Pratt-style precedence) ─────────────────────────

    private parseExpression(): ExpressionNode {
        return this.parseOrExpression();
    }

    private parseOrExpression(): ExpressionNode {
        let left = this.parseAndExpression();

        while (this.match(TokenType.OR)) {
            const operatorToken = this.previous();
            const right = this.parseAndExpression();
            left = {
                nodeType: "BinaryExpression",
                operator: "OR",
                left,
                right,
                line: operatorToken.line,
                column: operatorToken.column
            } as BinaryExpressionNode;
        }

        return left;
    }

    private parseAndExpression(): ExpressionNode {
        let left = this.parseUnaryExpression();

        while (this.match(TokenType.AND)) {
            const operatorToken = this.previous();

            // After AND, check if next is an attribute condition (identifier.field op value)
            if (this.isAttributeConditionAhead()) {
                const attrCond = this.parseAttributeCondition();
                left = {
                    nodeType: "BinaryExpression",
                    operator: "AND",
                    left,
                    right: attrCond,
                    line: operatorToken.line,
                    column: operatorToken.column
                } as BinaryExpressionNode;
            } else {
                const right = this.parseUnaryExpression();
                left = {
                    nodeType: "BinaryExpression",
                    operator: "AND",
                    left,
                    right,
                    line: operatorToken.line,
                    column: operatorToken.column
                } as BinaryExpressionNode;
            }
        }

        return left;
    }

    private parseUnaryExpression(): ExpressionNode {
        if (this.match(TokenType.NOT)) {
            const operatorToken = this.previous();
            const operand = this.parseUnaryExpression();
            return {
                nodeType: "UnaryExpression",
                operator: "NOT",
                operand,
                line: operatorToken.line,
                column: operatorToken.column
            } as UnaryExpressionNode;
        }

        return this.parsePrimary();
    }

    private parsePrimary(): ExpressionNode {
        if (this.match(TokenType.LPAREN)) {
            const expr = this.parseExpression();
            this.consume(TokenType.RPAREN, "Expected ')' after expression");
            return expr;
        }

        if (this.match(TokenType.BOOLEAN_LITERAL)) {
            const token = this.previous();
            return {
                nodeType: "BooleanLiteral",
                value: token.value === "true",
                line: token.line,
                column: token.column
            } as BooleanLiteralNode;
        }

        if (this.match(TokenType.IDENTIFIER)) {
            const identToken = this.previous();

            // Could be: attribute.field == value (ABAC standalone)
            if (this.check(TokenType.DOT) && this.isAttributeConditionAheadFromIdent()) {
                return this.parseAttributeConditionFromIdent(identToken);
            }

            // Otherwise parse as relation (with optional ->permission or IF caveat)
            return this.parseRelationFromToken(identToken);
        }

        const token = this.peek();
        throw new Error(`Parse Error: Unexpected token '${token.value}' at line ${token.line}, column ${token.column}`);
    }

    // ─── Relation & Caveat Parsing ────────────────────────────────────────────

    private parseRelationFromToken(relToken: Token): RelationNode | CaveatExpressionNode {
        let permission: string | undefined = undefined;

        if (this.match(TokenType.ARROW) || this.match(TokenType.DOT)) {
            const permToken = this.consume(TokenType.IDENTIFIER, "Expected permission identifier after '->' or '.'");
            permission = permToken.value;
        }

        const relationNode: RelationNode = {
            nodeType: "Relation",
            relation: relToken.value,
            permission,
            line: relToken.line,
            column: relToken.column
        };

        // IF caveat: doctor_of IF shift_active
        if (this.match(TokenType.IF)) {
            const caveatToken = this.consume(TokenType.IDENTIFIER, "Expected caveat name after 'IF'");
            return {
                nodeType: "CaveatExpression",
                relation: relationNode,
                caveat: caveatToken.value,
                line: relToken.line,
                column: relToken.column
            } as CaveatExpressionNode;
        }

        return relationNode;
    }

    // ─── ABAC Attribute Condition Parsing ────────────────────────────────────

    /**
     * Looks ahead to determine if we have an attribute condition pattern:
     * IDENTIFIER DOT IDENTIFIER (EQEQ | NEQ | LT | GT | LTE | GTE) (STRING_LITERAL | IDENTIFIER)
     */
    private isAttributeConditionAhead(): boolean {
        // Save position, peek 4 tokens ahead
        const saved = this.current;
        try {
            if (!this.check(TokenType.IDENTIFIER)) return false;
            this.advance(); // IDENTIFIER (object)
            if (!this.check(TokenType.DOT)) return false;
            this.advance(); // DOT
            if (!this.check(TokenType.IDENTIFIER)) return false;
            this.advance(); // IDENTIFIER (field)
            return this.isComparisonOperator();
        } finally {
            this.current = saved;
        }
    }

    private isAttributeConditionAheadFromIdent(): boolean {
        const saved = this.current;
        try {
            this.advance(); // consume DOT
            if (!this.check(TokenType.IDENTIFIER)) return false;
            this.advance(); // field
            return this.isComparisonOperator();
        } finally {
            this.current = saved;
        }
    }

    private isComparisonOperator(): boolean {
        return this.check(TokenType.EQEQ)
            || this.check(TokenType.NEQ)
            || this.check(TokenType.LT)
            || this.check(TokenType.GT)
            || this.check(TokenType.LTE)
            || this.check(TokenType.GTE);
    }

    private parseAttributeCondition(): AttributeConditionNode {
        const objToken = this.consume(TokenType.IDENTIFIER, "Expected object identifier for attribute condition");
        return this.parseAttributeConditionFromIdent(objToken);
    }

    private parseAttributeConditionFromIdent(objToken: Token): AttributeConditionNode {
        this.consume(TokenType.DOT, "Expected '.' in attribute path");
        const fieldToken = this.consume(TokenType.IDENTIFIER, "Expected field name after '.'");

        const left: AttributePathNode = {
            nodeType: "AttributePath",
            object: objToken.value,
            field: fieldToken.value,
            line: objToken.line,
            column: objToken.column
        };

        const opToken = this.advance();
        const operator = opToken.value as ComparisonOperator;

        // Right side: string literal or attribute path
        let right: AttributePathNode | string;
        if (this.match(TokenType.STRING_LITERAL)) {
            right = this.previous().value;
        } else if (this.match(TokenType.IDENTIFIER)) {
            const rightObj = this.previous();
            if (this.match(TokenType.DOT)) {
                const rightField = this.consume(TokenType.IDENTIFIER, "Expected field name after '.' in right-hand attribute path");
                right = {
                    nodeType: "AttributePath",
                    object: rightObj.value,
                    field: rightField.value,
                    line: rightObj.line,
                    column: rightObj.column
                };
            } else {
                // treat as a plain string literal value
                right = rightObj.value;
            }
        } else {
            const tok = this.peek();
            throw new Error(`Parse Error: Expected string literal or attribute path in ABAC condition at line ${tok.line}, column ${tok.column}`);
        }

        return {
            nodeType: "AttributeCondition",
            left,
            operator,
            right,
            line: objToken.line,
            column: objToken.column
        };
    }

    // ─── Parser Primitives ────────────────────────────────────────────────────

    private match(...types: TokenType[]): boolean {
        for (const type of types) {
            if (this.check(type)) {
                this.advance();
                return true;
            }
        }
        return false;
    }

    private check(type: TokenType): boolean {
        if (this.isAtEnd()) return type === TokenType.EOF;
        return this.peek().type === type;
    }

    private advance(): Token {
        if (!this.isAtEnd()) this.current++;
        return this.previous();
    }

    private isAtEnd(): boolean {
        return this.peek().type === TokenType.EOF;
    }

    private peek(): Token {
        return this.tokens[this.current];
    }

    private previous(): Token {
        return this.tokens[this.current - 1];
    }

    private consume(type: TokenType, message: string): Token {
        if (this.check(type)) return this.advance();
        const token = this.peek();
        throw new Error(`Parse Error: ${message} at line ${token.line}, column ${token.column}, found '${token.value}'`);
    }
}
