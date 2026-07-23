export enum TokenType {
    RESOURCE = "RESOURCE",
    SUBJECT = "SUBJECT",
    RELATION = "RELATION",
    PERMISSION = "PERMISSION",

    IMPORT = "IMPORT",
    MODULE = "MODULE",
    NAMESPACE = "NAMESPACE",
    EXTENDS = "EXTENDS",
    IF = "IF",

    AND = "AND",
    OR = "OR",
    NOT = "NOT",

    BOOLEAN_LITERAL = "BOOLEAN_LITERAL",
    STRING_LITERAL = "STRING_LITERAL",
    IDENTIFIER = "IDENTIFIER",

    LBRACE = "LBRACE",
    RBRACE = "RBRACE",
    LPAREN = "LPAREN",
    RPAREN = "RPAREN",

    EQUALS = "EQUALS",
    EQEQ = "EQEQ",
    NEQ = "NEQ",
    LT = "LT",
    GT = "GT",
    LTE = "LTE",
    GTE = "GTE",
    COLON = "COLON",
    COLON_COLON = "COLON_COLON",
    DOT = "DOT",
    ARROW = "ARROW",

    EOF = "EOF"
}
