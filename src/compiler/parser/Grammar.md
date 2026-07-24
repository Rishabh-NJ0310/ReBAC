# Authorization DSL (ADSL) EBNF Grammar Specification v1.0

## EBNF Grammar Rules

```ebnf
Program
    ::= ResourceDefinition* EOF

ResourceDefinition
    ::= "resource" Identifier "{" MemberDefinition* "}"

MemberDefinition
    ::= RelationDeclaration
      | PermissionDefinition

RelationDeclaration
    ::= "relation" Identifier

PermissionDefinition
    ::= "permission" Identifier "=" Expression

Expression
    ::= OrExpression

OrExpression
    ::= AndExpression ("OR" AndExpression)*

AndExpression
    ::= UnaryExpression ("AND" UnaryExpression)*

UnaryExpression
    ::= "NOT" UnaryExpression
      | Primary

Primary
    ::= Relation
      | "(" Expression ")"

Relation
    ::= Identifier ("->" Identifier)?

Identifier
    ::= IDENTIFIER
```

## Operator Precedence Table

| Precedence | Operator / Structure | Associativity |
| :--- | :--- | :--- |
| **1 (Highest)** | Primary (`()`, Relations, `contains -> view`) | N/A |
| **2** | `NOT` | Right |
| **3** | `AND` | Left |
| **4 (Lowest)** | `OR` | Left |
