import { Lexer } from "./lexer/Lexer.js";
import { Parser } from "./parser/Parser.js";
import { SemanticAnalyzer } from "./semantic/SemanticAnalyzer.js";
import { RuleGroupTransformer } from "./transformer/RuleGroupTransformer.js";
import { RebacSchema } from "../authorization/Schema.js";
import { ProgramNode } from "./ast/Nodes.js";

export function parseAuthDSLToAST(source: string): ProgramNode {
    const lexer = new Lexer(source);
    const tokens = lexer.tokenize();

    const parser = new Parser(tokens);
    const ast = parser.parse();

    const analyzer = new SemanticAnalyzer();
    analyzer.analyze(ast);

    return ast;
}

export function compileAuthDSL(source: string): RebacSchema {
    const ast = parseAuthDSLToAST(source);
    const transformer = new RuleGroupTransformer();
    return transformer.transform(ast);
}
