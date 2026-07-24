import { Lexer } from "./lexer/Lexer.js";
import { Parser } from "./parser/Parser.js";
import { SemanticAnalyzer } from "./semantic/SemanticAnalyzer.js";
import { ASTOptimizer } from "./optimizer/ASTOptimizer.js";
import { ADSLLinter, LintDiagnostic } from "./linter/ADSLLinter.js";
import { RuleGroupTransformer } from "./transformer/RuleGroupTransformer.js";
import { ExplainPlanGenerator } from "./explain/ExplainPlanGenerator.js";
import { ImportResolver } from "./resolvers/ImportResolver.js";
import { InheritanceResolver } from "./resolvers/InheritanceResolver.js";
import { RebacSchema } from "../authorization/Schema.js";
import { ProgramNode } from "./ast/Nodes.js";
import { SymbolTable } from "./symbol/SymbolTable.js";

export function analyzeAuthDSL(source: string, baseDir: string = process.cwd()): { ast: ProgramNode; symbolTable: SymbolTable } {
    const importResolver = new ImportResolver();
    const mergedAST = importResolver.resolveSource(source, baseDir);

    const inheritanceResolver = new InheritanceResolver();
    const expandedAST = inheritanceResolver.resolve(mergedAST);

    const analyzer = new SemanticAnalyzer();
    const symbolTable = analyzer.analyze(expandedAST);

    return { ast: expandedAST, symbolTable };
}

export function analyzeAuthDSLFile(filePath: string): { ast: ProgramNode; symbolTable: SymbolTable } {
    const importResolver = new ImportResolver();
    const mergedAST = importResolver.resolveFile(filePath);

    const inheritanceResolver = new InheritanceResolver();
    const expandedAST = inheritanceResolver.resolve(mergedAST);

    const analyzer = new SemanticAnalyzer();
    const symbolTable = analyzer.analyze(expandedAST);

    return { ast: expandedAST, symbolTable };
}

export function parseAuthDSLToAST(source: string, baseDir: string = process.cwd()): ProgramNode {
    return analyzeAuthDSL(source, baseDir).ast;
}

export function lintAuthDSL(source: string, baseDir: string = process.cwd()): LintDiagnostic[] {
    const { ast, symbolTable } = analyzeAuthDSL(source, baseDir);
    const linter = new ADSLLinter();
    return linter.lint(ast, symbolTable);
}

export function compileAuthDSL(source: string, baseDir: string = process.cwd()): RebacSchema {
    const { ast } = analyzeAuthDSL(source, baseDir);

    const optimizer = new ASTOptimizer();
    const optimizedAST = optimizer.optimize(ast);

    const transformer = new RuleGroupTransformer();
    return transformer.transform(optimizedAST);
}

export function compileAuthDSLFile(filePath: string): RebacSchema {
    const { ast } = analyzeAuthDSLFile(filePath);

    const optimizer = new ASTOptimizer();
    const optimizedAST = optimizer.optimize(ast);

    const transformer = new RuleGroupTransformer();
    return transformer.transform(optimizedAST);
}

export function explainAuthDSL(source: string, resourceName: string, permissionName: string, baseDir: string = process.cwd()): string {
    const { ast } = analyzeAuthDSL(source, baseDir);
    const explainGenerator = new ExplainPlanGenerator();
    return explainGenerator.generateExplainPlan(ast, resourceName, permissionName);
}
