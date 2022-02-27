import * as vscode from 'vscode';
import { Plugin, PowermodeChangeTextDocumentEventData } from '../plugin';
import { ThemeConfig, getConfigValue } from '../config/config';

export interface ScreenShakerConfig {
    "shake.enable": boolean;
    "shake.intensity"?: number;
}

export class ScreenShaker implements Plugin {
    private negativeX: vscode.TextEditorDecorationType;
    private positiveX: vscode.TextEditorDecorationType;
    private negativeY: vscode.TextEditorDecorationType;
    private positiveY: vscode.TextEditorDecorationType;
    private shakeDecorations: vscode.TextEditorDecorationType[] = [];
    private shakeTimeout: NodeJS.Timer;
    private config: ScreenShakerConfig = {} as ScreenShakerConfig;
    private unshake: () => void;

    // A range that represents the full document. A top margin is applied
    // to this range which will push every line down the desired amount
    private fullRange = [new vscode.Range(new vscode.Position(0, 0), new vscode.Position(Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER))];

    constructor(public themeConfig: ThemeConfig) {}

    public dispose = () => {
        clearTimeout(this.shakeTimeout);
        this.shakeDecorations.forEach(decoration => decoration.dispose());
    }

    public onPowermodeStart = (combo: number) => {
        // Do nothing
    }

    public onPowermodeStop = (combo: number) => {
        this.unshake?.();
    }

    public onComboStop = (finalCombo: number) => {
        // Do nothing
    }

    public onDidChangeTextDocument = (data: PowermodeChangeTextDocumentEventData, event: vscode.TextDocumentChangeEvent) => {
        if (!this.config["shake.enable"] || !data.isPowermodeActive) {
            return;
        }

        this.shake(data.activeEditor);
    }

    public onDidChangeConfiguration = (config: vscode.WorkspaceConfiguration) => {
        const newConfig: ScreenShakerConfig = {
            "shake.enable": getConfigValue<boolean>('shake.enabled', config, this.themeConfig),
            "shake.intensity": getConfigValue<number>('shake.intensity', config, this.themeConfig),
        };

        let changed = false;
        Object.keys(newConfig).forEach(key => {
            if (this.config[key] !== newConfig[key]) {
                changed = true;
            }
        });

        if (!changed) {
            return;
        }

        const oldConfig = this.config;
        this.config = newConfig;

        // If it is enabled but was not before, activate
        if (this.config["shake.enable"] && !oldConfig["shake.enable"]) {
            this.activate();
            return;
        }

        // If the shake intensity changed recreate the screen shaker
        if (this.config["shake.intensity"] !== oldConfig["shake.intensity"]) {
            this.activate();
            return;
        }

        // If it is now disabled, unshake the screen
        if (!this.config["shake.enable"]) {
            this.dispose();
            return;
        }
    }

    private activate = () => {
        this.dispose();
        this.negativeX = vscode.window.createTextEditorDecorationType(<vscode.DecorationRenderOptions>{
            textDecoration: `none; margin-left: 0px;`
        });

        this.positiveX = vscode.window.createTextEditorDecorationType(<vscode.DecorationRenderOptions>{
            textDecoration: `none; margin-left: ${this.config["shake.intensity"]}px;`
        });

        this.negativeY = vscode.window.createTextEditorDecorationType(<vscode.DecorationRenderOptions>{
            textDecoration: `none; line-height:inherit`
        });

        this.positiveY = vscode.window.createTextEditorDecorationType(<vscode.DecorationRenderOptions>{
            textDecoration: `none; line-height:${(this.config["shake.intensity"]/2)+1};`,
        });

        this.shakeDecorations = [
            this.negativeX,
            this.positiveX,
            this.negativeY,
            this.positiveY
        ];
    }

    /**
     * "Shake" the screen by applying decorations that set margins
     * to move them horizontally or vertically
     */
    private shake = (editor: vscode.TextEditor) => {
        if (!this.config["shake.enable"]) {
            return;
        }

        // A range is created for each line in the document that only applies to the first character
        // This pushes each line to the right by the desired amount without adding spacing between characters
        const xRanges = [];
        for (let i = 0; i < editor.document.lineCount; i++) {
            let textStart = editor.document.lineAt(i).firstNonWhitespaceCharacterIndex;
            xRanges.push(new vscode.Range(new vscode.Position(i, textStart), new vscode.Position(i, textStart + 1)));
        }

        // For each direction, the "opposite" decoration needs cleared
        // before applying the chosen decoration.
        // This approach is used so that the decorations themselves can
        // be reused. My assumption is that this is more performant than
        // disposing and creating a new decoration each time.
        if (Math.random() > 0.5) {
            editor.setDecorations(this.negativeX, []);
            editor.setDecorations(this.positiveX, xRanges);
        } else {
            editor.setDecorations(this.positiveX, []);
            editor.setDecorations(this.negativeX, xRanges);
        }

        if (Math.random() > 0.5) {
            editor.setDecorations(this.negativeY, []);
            editor.setDecorations(this.positiveY, this.fullRange);
        } else {
            editor.setDecorations(this.positiveY, []);
            editor.setDecorations(this.negativeY, this.fullRange);
        }

        this.unshake = () => {
            this.shakeDecorations.forEach(decoration => {
                // Decorations are set to an empty array insetad of being disposed
                // because it is cheaper to reuse the same decoration later than recreate it
                try {
                    editor.setDecorations(decoration, []);
                } catch {
                    // This might fail if the editor is no longer available.
                    // But at that point, there's no need to set decorations on it,
                    // so that's fine!
                }
            });
        }

        clearTimeout(this.shakeTimeout);
        this.shakeTimeout = setTimeout(this.unshake, 1000);
    }
}
