import { TextDocumentChangeEvent, WorkspaceConfiguration } from 'vscode';

export interface Plugin {
    dispose(): void;
    onOsumodeStart(combo: number): void;
    onOsumodeStop(combo: number): void;
    onDidChangeTextDocument(combo: number, osumode: boolean, event: TextDocumentChangeEvent): void;
    onDidChangeConfiguration(osumodeConfig: WorkspaceConfiguration): void;
}