import { Token } from "./Token.js";
import { TokenType } from "./TokenType.js";

export class Lexer {
    private position: number = 0;
    private line: number = 1;
    private column: number = 1;

    private readonly keywords: Record<string, TokenType> = {
        resource: TokenType.RESOURCE,
        subject: TokenType.SUBJECT,
        relation: TokenType.RELATION,
        permission: TokenType.PERMISSION,
        import: TokenType.IMPORT,
        module: TokenType.MODULE,
        namespace: TokenType.NAMESPACE,
        extends: TokenType.EXTENDS,
        if: TokenType.IF,
        IF: TokenType.IF,
        AND: TokenType.AND,
        OR: TokenType.OR,
        NOT: TokenType.NOT,
        true: TokenType.BOOLEAN_LITERAL,
        false: TokenType.BOOLEAN_LITERAL
    };

    constructor(private source: string) {}

    public tokenize(): Token[] {
        const tokens: Token[] = [];

        while (this.position < this.source.length) {
            const char = this.source[this.position];

            // 1. Whitespace & Newlines
            if (this.isWhitespace(char)) {
                this.advance();
                continue;
            }

            // 2. Comments (# or //)
            if (char === '#' || (char === '/' && this.peek() === '/')) {
                this.skipComment();
                continue;
            }

            // 3. Two-character symbols (-> or :: or == or != or <= or >=)
            if (char === '-' && this.peek() === '>') {
                tokens.push(this.makeToken(TokenType.ARROW, "->", 2));
                continue;
            }
            if (char === ':' && this.peek() === ':') {
                tokens.push(this.makeToken(TokenType.COLON_COLON, "::", 2));
                continue;
            }
            if (char === '=' && this.peek() === '=') {
                tokens.push(this.makeToken(TokenType.EQEQ, "==", 2));
                continue;
            }
            if (char === '!' && this.peek() === '=') {
                tokens.push(this.makeToken(TokenType.NEQ, "!=", 2));
                continue;
            }
            if (char === '<' && this.peek() === '=') {
                tokens.push(this.makeToken(TokenType.LTE, "<=", 2));
                continue;
            }
            if (char === '>' && this.peek() === '=') {
                tokens.push(this.makeToken(TokenType.GTE, ">=", 2));
                continue;
            }

            // 4. Single-character symbols
            if (char === '{') {
                tokens.push(this.makeToken(TokenType.LBRACE, "{"));
                continue;
            }
            if (char === '}') {
                tokens.push(this.makeToken(TokenType.RBRACE, "}"));
                continue;
            }
            if (char === '(') {
                tokens.push(this.makeToken(TokenType.LPAREN, "("));
                continue;
            }
            if (char === ')') {
                tokens.push(this.makeToken(TokenType.RPAREN, ")"));
                continue;
            }
            if (char === '=') {
                tokens.push(this.makeToken(TokenType.EQUALS, "="));
                continue;
            }
            if (char === ':') {
                tokens.push(this.makeToken(TokenType.COLON, ":"));
                continue;
            }
            if (char === '.') {
                tokens.push(this.makeToken(TokenType.DOT, "."));
                continue;
            }
            if (char === '<') {
                tokens.push(this.makeToken(TokenType.LT, "<"));
                continue;
            }
            if (char === '>') {
                tokens.push(this.makeToken(TokenType.GT, ">"));
                continue;
            }

            // 5. String Literals ("..." or '...')
            if (char === '"' || char === "'") {
                tokens.push(this.readString(char));
                continue;
            }

            // 6. Identifiers & Keywords
            if (this.isAlphaOrUnderscore(char)) {
                tokens.push(this.readIdentifier());
                continue;
            }

            throw new Error(`Lexical Error: Unexpected character '${char}' at line ${this.line}, column ${this.column}`);
        }

        tokens.push({
            type: TokenType.EOF,
            value: "",
            line: this.line,
            column: this.column
        });

        return tokens;
    }

    private readString(quoteChar: string): Token {
        const startLine = this.line;
        const startColumn = this.column;
        this.advance(); // Skip opening quote

        let value = "";
        while (this.position < this.source.length && this.source[this.position] !== quoteChar) {
            value += this.source[this.position];
            this.advance();
        }

        if (this.position >= this.source.length) {
            throw new Error(`Lexical Error: Unterminated string literal at line ${startLine}, column ${startColumn}`);
        }

        this.advance(); // Skip closing quote

        return {
            type: TokenType.STRING_LITERAL,
            value,
            line: startLine,
            column: startColumn
        };
    }

    private isWhitespace(char: string): boolean {
        return char === ' ' || char === '\t' || char === '\r' || char === '\n';
    }

    private isAlphaOrUnderscore(char: string): boolean {
        return /[a-zA-Z_]/.test(char);
    }

    private isAlphaNumericOrUnderscore(char: string): boolean {
        return /[a-zA-Z0-9_]/.test(char);
    }

    private peek(): string {
        if (this.position + 1 < this.source.length) {
            return this.source[this.position + 1];
        }
        return '\0';
    }

    private advance(length: number = 1): void {
        for (let i = 0; i < length; i++) {
            if (this.position < this.source.length) {
                if (this.source[this.position] === '\n') {
                    this.line++;
                    this.column = 1;
                } else {
                    this.column++;
                }
                this.position++;
            }
        }
    }

    private skipComment(): void {
        while (this.position < this.source.length && this.source[this.position] !== '\n') {
            this.advance();
        }
    }

    private makeToken(type: TokenType, value: string, length: number = 1): Token {
        const token: Token = {
            type,
            value,
            line: this.line,
            column: this.column
        };
        this.advance(length);
        return token;
    }

    private readIdentifier(): Token {
        const startLine = this.line;
        const startColumn = this.column;
        let value = "";

        while (this.position < this.source.length && this.isAlphaNumericOrUnderscore(this.source[this.position])) {
            value += this.source[this.position];
            this.advance();
        }

        const type = this.keywords[value] || TokenType.IDENTIFIER;

        return {
            type,
            value,
            line: startLine,
            column: startColumn
        };
    }
}
