import { Lexer } from "./lexer/Lexer.js";
import { Parser } from "./parser/Parser.js";
import { SemanticAnalyzer } from "./semantic/SemanticAnalyzer.js";
import { ASTOptimizer } from "./optimizer/ASTOptimizer.js";
import { ADSLLinter, LintDiagnostic } from "./linter/ADSLLinter.js";
import { RuleGroupTransformer } from "./transformer/RuleGroupTransformer.js";
import { ExplainPlanGenerator } from "./explain/ExplainPlanGenerator.js";
import { RebacSchema } from "../authorization/Schema.js";
import { ProgramNode } from "./ast/Nodes.js";
import { SymbolTable } from "./symbol/SymbolTable.js";

export function analyzeAuthDSL(source: string): { ast: ProgramNode; symbolTable: SymbolTable } {
    const lexer = new Lexer(source);
    const tokens = lexer.tokenize();

    const parser = new Parser(tokens);
    const ast = parser.parse();

    const analyzer = new SemanticAnalyzer();
    const symbolTable = analyzer.analyze(ast);

    return { ast, symbolTable };
}

export function parseAuthDSLToAST(source: string): ProgramNode {
    return analyzeAuthDSL(source).ast;
}

export function lintAuthDSL(source: string): LintDiagnostic[] {
    const { ast, symbolTable } = analyzeAuthDSL(source);
    const linter = new ADSLLinter();
    return linter.lint(ast, symbolTable);
}

export function compileAuthDSL(source: string): RebacSchema {
    const { ast } = analyzeAuthDSL(source);

    const optimizer = new ASTOptimizer();
    const optimizedAST = optimizer.optimize(ast);

    const transformer = new RuleGroupTransformer();
    return transformer.transform(optimizedAST);
}

export function explainAuthDSL(source: string, resourceName: string, permissionName: string): string {
    const { ast } = analyzeAuthDSL(source);
    const explainGenerator = new ExplainPlanGenerator();
    return explainGenerator.generateExplainPlan(ast, resourceName, permissionName);
}
