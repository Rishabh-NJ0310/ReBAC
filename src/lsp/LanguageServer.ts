/**
 * ADSL Language Server
 *
 * Provides IDE support for .auth schema files:
 * - Diagnostics (lint errors → squiggles)
 * - Hover documentation
 * - Keyword + symbol completion
 * - Document Outline (resource / relation / permission symbols)
 *
 * Start with: npx tsx src/lsp/LanguageServer.ts
 * (connects over stdio, recognized by VS Code LSP client)
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const lsp = require("vscode-languageserver/node") as typeof import("vscode-languageserver/node");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { TextDocument } = require("vscode-languageserver-textdocument") as typeof import("vscode-languageserver-textdocument");

import { LspDiagnosticsProvider } from "./LspDiagnosticsProvider";
import { analyzeAuthDSL } from "../compiler/CompilerFacade.js";
import path from "path";

const {
    createConnection,
    TextDocuments,
    ProposedFeatures,
    CompletionItemKind,
    TextDocumentSyncKind,
    MarkupKind,
    Location,
    SymbolKind,
    DidChangeConfigurationNotification
} = lsp;

const connection = createConnection(ProposedFeatures.all);
const documents = new TextDocuments(TextDocument);
const diagnosticsProvider = new LspDiagnosticsProvider();

const KEYWORDS = [
    "resource", "relation", "permission", "subject",
    "import", "module", "namespace", "extends",
    "AND", "OR", "NOT", "IF",
    "true", "false"
].map((kw) => ({ label: kw, kind: CompletionItemKind.Keyword }));

connection.onInitialize((_params: any) => ({
    capabilities: {
        textDocumentSync: TextDocumentSyncKind.Incremental,
        completionProvider: { resolveProvider: false, triggerCharacters: [" ", "."] },
        hoverProvider: true,
        definitionProvider: true,
        referencesProvider: true,
        documentSymbolProvider: true
    }
}));

connection.onInitialized(() => {
    connection.client.register(DidChangeConfigurationNotification.type, undefined);
});

// ─── Diagnostics ─────────────────────────────────────────────────────────────

documents.onDidChangeContent(async (change: any) => {
    const doc = change.document;
    if (!doc.uri.endsWith(".auth")) return;
    const source: string = doc.getText();
    const baseDir = path.dirname(doc.uri.replace("file://", ""));
    const diagnostics = diagnosticsProvider.getDiagnostics(source, baseDir);
    connection.sendDiagnostics({ uri: doc.uri, diagnostics });
});

// ─── Completion ───────────────────────────────────────────────────────────────

connection.onCompletion((params: any) => {
    const doc = documents.get(params.textDocument.uri);
    if (!doc) return [];
    const source: string = doc.getText();
    const baseDir = path.dirname(doc.uri.replace("file://", ""));
    const dynamicItems: any[] = [];
    try {
        const { symbolTable } = analyzeAuthDSL(source, baseDir);
        for (const res of symbolTable.getAllResources()) {
            dynamicItems.push({ label: res.name, kind: CompletionItemKind.Class });
        }
    } catch { /* mid-edit — keywords only */ }
    return [...KEYWORDS, ...dynamicItems];
});

// ─── Hover ────────────────────────────────────────────────────────────────────

connection.onHover((params: any) => {
    const doc = documents.get(params.textDocument.uri);
    if (!doc) return null;
    const lines: string[] = doc.getText().split("\n");
    const line: string = lines[params.position.line] ?? "";
    let s = params.position.character;
    let e = params.position.character;
    while (s > 0 && /\w/.test(line[s - 1])) s--;
    while (e < line.length && /\w/.test(line[e])) e++;
    const word = line.slice(s, e);

    const docs: Record<string, string> = {
        resource: "**resource** *name* `{ ... }`\nDeclares a new authorization resource type.",
        relation: "**relation** *name* `:` *type*\nDeclares a named relationship edge.",
        permission: "**permission** *name* `=` *expr*\nDeclares a computed authorization rule.",
        subject: "**subject** *type*\nDeclares a principal type (user, group, etc.).",
        import: "**import** *\"path.auth\"*\nImports another .auth schema file.",
        namespace: "**namespace** *name* `{ ... }`\nGroups resources under a qualified namespace.",
        extends: "**extends** *ParentResource*\nInherits relations and permissions from a parent resource.",
        IF: "**IF** *caveat*\nConditional guard — permission only granted if caveat evaluates to true."
    };

    const text = docs[word];
    if (!text) return null;
    return { contents: { kind: MarkupKind.Markdown, value: text } };
});

// ─── Document Symbols (Outline) ───────────────────────────────────────────────

connection.onDocumentSymbol((params: any) => {
    const doc = documents.get(params.textDocument.uri);
    if (!doc) return [];
    const source = doc.getText();
    const symbols: any[] = [];

    const patterns: Array<{ re: RegExp; kind: any }> = [
        { re: /^resource\s+(\w+)/gm, kind: SymbolKind.Class },
        { re: /^\s+relation\s+(\w+)/gm, kind: SymbolKind.Field },
        { re: /^\s+permission\s+(\w+)/gm, kind: SymbolKind.Function }
    ];

    for (const { re, kind } of patterns) {
        let match: RegExpExecArray | null;
        while ((match = re.exec(source)) !== null) {
            symbols.push({
                name: match[1],
                kind,
                location: Location.create(params.textDocument.uri, {
                    start: doc.positionAt(match.index),
                    end: doc.positionAt(match.index + match[0].length)
                })
            });
        }
    }
    return symbols;
});

documents.listen(connection);
connection.listen();
