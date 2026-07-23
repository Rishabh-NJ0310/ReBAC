import { Diagnostic, DiagnosticSeverity, Range } from "vscode-languageserver";
import { lintAuthDSL } from "../compiler/CompilerFacade.js";
import { LintDiagnostic } from "../compiler/linter/ADSLLinter.js";

export class LspDiagnosticsProvider {
    public getDiagnostics(source: string, baseDir: string = process.cwd()): Diagnostic[] {
        try {
            const lintDiagnostics: LintDiagnostic[] = lintAuthDSL(source, baseDir);
            return lintDiagnostics.map((d) => this.toLspDiagnostic(d));
        } catch (err: any) {
            return [this.errorToDiagnostic(err.message)];
        }
    }

    private toLspDiagnostic(d: LintDiagnostic): Diagnostic {
        const line = (d.line ?? 1) - 1;
        const col = (d.column ?? 1) - 1;
        const range: Range = {
            start: { line: Math.max(0, line), character: Math.max(0, col) },
            end: { line: Math.max(0, line), character: Math.max(0, col) + 10 }
        };
        return {
            range,
            severity: DiagnosticSeverity.Warning,
            source: "adsl",
            message: `[${d.code}] ${d.message}`
        };
    }

    private errorToDiagnostic(message: string): Diagnostic {
        const lineMatch = message.match(/line (\d+)/);
        const colMatch = message.match(/column (\d+)/);
        const line = lineMatch ? parseInt(lineMatch[1], 10) - 1 : 0;
        const col = colMatch ? parseInt(colMatch[1], 10) - 1 : 0;
        return {
            range: {
                start: { line: Math.max(0, line), character: Math.max(0, col) },
                end: { line: Math.max(0, line), character: Math.max(0, col) + 10 }
            },
            severity: DiagnosticSeverity.Error,
            source: "adsl",
            message
        };
    }
}
