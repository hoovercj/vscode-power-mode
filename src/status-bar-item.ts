'use strict';
import * as vscode from 'vscode';
import { Plugin } from './plugin';

const ENABLED = false;

export class StatusBarItem implements Plugin {

    private statusBarItem: vscode.StatusBarItem;

    public activate = () => {
        this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
        this.statusBarItem.show();
    }

    dispose = () => {
        if (!this.statusBarItem) {
            return;
        }
        this.statusBarItem.dispose();
        this.statusBarItem = null;
    }

    public onPowermodeStart = (combo: number) => {
        // Do nothing
    }

    public onPowermodeStop = (combo: number) => {
        // Do nothing
    }

    public onComboStart = (combo: number) => {
        this.updateStatusBar(combo);
    }

    public onComboStop = (combo: number) => {
        this.updateStatusBar(combo);
    }

    public onDidChangeTextDocument = (combo: number, powermode: boolean, event: vscode.TextDocumentChangeEvent) => {
        if (!powermode) {
            return;
        }

        this.updateStatusBar(combo, powermode);
    }

    public onDidChangeConfiguration = (config: vscode.WorkspaceConfiguration) => {
        // Do nothing
    }

    private updateStatusBar = (combo: number, powermode?: boolean) => {
        if (!this.statusBarItem) {
            return;
        }
        const prefix = powermode ? 'POWER MODE!!! ' : '';
        this.statusBarItem.text = `${prefix}Combo: ${combo}`;
    }
}