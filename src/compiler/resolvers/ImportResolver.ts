import fs from "fs";
import path from "path";
import { Lexer } from "../lexer/Lexer.js";
import { Parser } from "../parser/Parser.js";
import { ProgramNode } from "../ast/Nodes.js";

export class ImportResolver {
    private visitedFiles = new Set<string>();
    private loadingStack: string[] = [];

    public resolveFile(filePath: string): ProgramNode {
        const absolutePath = path.resolve(filePath);
        return this.resolvePath(absolutePath);
    }

    public resolveSource(source: string, baseDir: string = process.cwd()): ProgramNode {
        const lexer = new Lexer(source);
        const tokens = lexer.tokenize();
        const parser = new Parser(tokens);
        const ast = parser.parse();

        return this.processASTImports(ast, baseDir);
    }

    private resolvePath(absolutePath: string): ProgramNode {
        if (this.loadingStack.includes(absolutePath)) {
            const cyclePath = [...this.loadingStack, absolutePath]
                .map(p => path.basename(p))
                .join(" -> ");
            throw new Error(`Semantic Error: Circular import detected: ${cyclePath}`);
        }

        if (this.visitedFiles.has(absolutePath)) {
            return {
                nodeType: "Program",
                imports: [],
                modules: [],
                namespaces: [],
                subjects: [],
                resources: [],
                line: 1,
                column: 1
            };
        }

        this.visitedFiles.add(absolutePath);
        this.loadingStack.push(absolutePath);

        if (!fs.existsSync(absolutePath)) {
            throw new Error(`Import Error: Cannot resolve import file '${absolutePath}'`);
        }

        const source = fs.readFileSync(absolutePath, "utf-8");
        const lexer = new Lexer(source);
        const tokens = lexer.tokenize();
        const parser = new Parser(tokens);
        const ast = parser.parse();

        const baseDir = path.dirname(absolutePath);
        const resolvedAST = this.processASTImports(ast, baseDir);

        this.loadingStack.pop();
        return resolvedAST;
    }

    private processASTImports(ast: ProgramNode, baseDir: string): ProgramNode {
        const mergedSubjects = [...ast.subjects];
        const mergedResources = [...ast.resources];
        const mergedModules = [...ast.modules];
        const mergedNamespaces = [...ast.namespaces];

        for (const importDecl of ast.imports) {
            const targetPath = path.resolve(baseDir, importDecl.path);
            const importedAST = this.resolvePath(targetPath);

            mergedSubjects.push(...importedAST.subjects);
            mergedResources.push(...importedAST.resources);
            mergedModules.push(...importedAST.modules);
            mergedNamespaces.push(...importedAST.namespaces);
        }

        // Flatten resources defined inside namespace blocks into root resources with namespace prefixes if needed
        for (const ns of ast.namespaces) {
            for (const res of ns.resources) {
                mergedResources.push({
                    ...res,
                    name: `${ns.name}::${res.name}`
                });
            }
        }

        return {
            ...ast,
            subjects: mergedSubjects,
            resources: mergedResources,
            modules: mergedModules,
            namespaces: mergedNamespaces
        };
    }
}
