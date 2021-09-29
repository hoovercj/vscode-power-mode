import { TextDocumentChangeEvent, WorkspaceConfiguration } from 'vscode';

export interface Plugin {
    dispose(): void;
    onPowermodeStart(combo: number): void;
    onPowermodeStop(combo: number): void;
    onDidChangeTextDocument(combo: number, powermode: boolean, event: TextDocumentChangeEvent): void;
    onDidChangeConfiguration(powermodeConfig: WorkspaceConfiguration): void;
}