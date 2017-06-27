'use strict';
import * as vscode from 'vscode';

export class StatusBarItem {

    private statusBarItem: vscode.StatusBarItem;

    /**
     * Creates a "status bar" item in the bottom left of the window
     * This status bar holds the current combo information
     */
    constructor() {
        this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
        this.statusBarItem.show();
    }

    updateStatusBar = (combo: number, powerMode = false) => {
        if (!this.statusBarItem) {
            return;
        }
        const prefix = powerMode ? 'POWER MODE!!! ' : '';
        this.statusBarItem.text = `${prefix}Combo: ${combo}`;
    }

    dispose = () => {
        if (!this.statusBarItem) {
            return;
        }
        this.statusBarItem.dispose();
        this.statusBarItem = null;
    }
}