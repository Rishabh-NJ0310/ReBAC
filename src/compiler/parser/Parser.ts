import { Token } from "../lexer/Token.js";
import { TokenType } from "../lexer/TokenType.js";
import {
    ProgramNode,
    ResourceNode,
    RelationDeclNode,
    PermissionNode,
    ExpressionNode,
    BinaryExpressionNode,
    UnaryExpressionNode,
    RelationNode
} from "../ast/Nodes.js";

export class Parser {
    private current: number = 0;

    constructor(private tokens: Token[]) {}

    public parse(): ProgramNode {
        const startToken = this.peek();
        const resources: ResourceNode[] = [];

        while (!this.isAtEnd()) {
            if (this.match(TokenType.RESOURCE)) {
                resources.push(this.parseResource());
            } else {
                const token = this.peek();
                throw new Error(`Parse Error: Expected 'resource' keyword at line ${token.line}, column ${token.column}, found '${token.value}'`);
            }
        }

        return {
            nodeType: "Program",
            resources,
            line: startToken.line,
            column: startToken.column
        };
    }

    private parseResource(): ResourceNode {
        const resourceToken = this.previous();
        const nameToken = this.consume(TokenType.IDENTIFIER, "Expected resource identifier after 'resource'");
        this.consume(TokenType.LBRACE, "Expected '{' to start resource block");

        const relations: RelationDeclNode[] = [];
        const permissions: PermissionNode[] = [];

        while (!this.check(TokenType.RBRACE) && !this.isAtEnd()) {
            if (this.match(TokenType.RELATION)) {
                const relToken = this.previous();
                const relName = this.consume(TokenType.IDENTIFIER, "Expected relation identifier after 'relation'");
                relations.push({
                    nodeType: "RelationDecl",
                    name: relName.value,
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
            relations,
            permissions,
            line: resourceToken.line,
            column: resourceToken.column
        };
    }

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

        if (this.match(TokenType.IDENTIFIER)) {
            return this.parseRelationFromToken(this.previous());
        }

        const token = this.peek();
        throw new Error(`Parse Error: Unexpected token '${token.value}' at line ${token.line}, column ${token.column}`);
    }

    private parseRelationFromToken(relToken: Token): RelationNode {
        let permission: string | undefined = undefined;

        if (this.match(TokenType.ARROW)) {
            const permToken = this.consume(TokenType.IDENTIFIER, "Expected permission identifier after '->'");
            permission = permToken.value;
        }

        return {
            nodeType: "Relation",
            relation: relToken.value,
            permission,
            line: relToken.line,
            column: relToken.column
        };
    }

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
