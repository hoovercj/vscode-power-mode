import * as vscode from 'vscode';
import { Plugin } from '../plugin';
import { ThemeConfig, getConfigValue } from '../config/config';

const ENABLED = true;
const SHAKE_INTENSITY = 5;

export class ScreenShakerConfig {
    enableShake: boolean;
    shakeIntensity?: number;
}

export class ScreenShaker implements Plugin {

    private negativeX: vscode.TextEditorDecorationType;
    private positiveX: vscode.TextEditorDecorationType;
    private negativeY: vscode.TextEditorDecorationType;
    private positiveY: vscode.TextEditorDecorationType;
    private shakeDecorations: vscode.TextEditorDecorationType[] = [];
    private shakeTimeout: NodeJS.Timer;
    private config: ScreenShakerConfig = {} as ScreenShakerConfig;

    // A range that represents the full document. A top margin is applied
    // to this range which will push every line down the desired amount
    private fullRange = [new vscode.Range(new vscode.Position(0, 0), new vscode.Position(Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER))];

    constructor(public themeConfig: ThemeConfig) {}

    public activate = () => {
        this.dispose();
        this.negativeX = vscode.window.createTextEditorDecorationType(<vscode.DecorationRenderOptions>{
            textDecoration: `none; margin-left: 0px;`
        });

        this.positiveX = vscode.window.createTextEditorDecorationType(<vscode.DecorationRenderOptions>{
            textDecoration: `none; margin-left: ${this.config.shakeIntensity}px;`
        });

        this.negativeY = vscode.window.createTextEditorDecorationType(<vscode.DecorationRenderOptions>{
            textDecoration: `none; margin-top: 0px;`
        });

        this.positiveY = vscode.window.createTextEditorDecorationType(<vscode.DecorationRenderOptions>{
            textDecoration: `none; margin-top: ${this.config.shakeIntensity}px;`
        });

        this.shakeDecorations = [
            this.negativeX,
            this.positiveX,
            this.negativeY,
            this.positiveY
        ];
    }

    public dispose = () => {
        clearTimeout(this.shakeTimeout);
        this.shakeDecorations.forEach(decoration => decoration.dispose());
    }

    public onPowermodeStart = (combo: number) => {
        // Do nothing
    }

    public onPowermodeStop = (combo: number) => {
        this.unshake();
    }

    public onDidChangeTextDocument = (combo: number, powermode: boolean, event: vscode.TextDocumentChangeEvent) => {
        if (!this.config.enableShake || !powermode) {
            return;
        }

        this.shake();
    }

    public onDidChangeConfiguration = (config: vscode.WorkspaceConfiguration) => {

        const newConfig: ScreenShakerConfig = {
            enableShake: getConfigValue<boolean>('enableShake', config, this.themeConfig),
            shakeIntensity: getConfigValue<number>('shakeIntensity', config, this.themeConfig),
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
        if (this.config.enableShake && !oldConfig.enableShake) {
            this.activate();
            return;
        }

        // If the shake intensity changed recreate the screen shaker
        if (this.config.shakeIntensity !== oldConfig.shakeIntensity) {
            this.activate();
            return;
        }

        // If it is now disabled, unshake the screen
        if (!this.config.enableShake) {
            this.dispose();
            return;
        }
    }

    /**
     * "Shake" the screen by applying decorations that set margins
     * to move them horizontally or vertically
     */
    private shake = () => {
        if (!this.config.enableShake) {
            return;
        }

        const activeEditor = vscode.window.activeTextEditor;

        // A range is created for each line in the document that only applies to the first character
        // This pushes each line to the right by the desired amount without adding spacing between characters
        const xRanges = [];
        for (let i = 0; i < activeEditor.document.lineCount; i++) {
            xRanges.push(new vscode.Range(new vscode.Position(i, 0), new vscode.Position(i, 1)));
        }

        // For each direction, the "opposite" decoration needs cleared
        // before applying the chosen decoration.
        // This approach is used so that the decorations themselves can
        // be reused. My assumption is that this is more performant than
        // disposing and creating a new decoration each time.
        if (Math.random() > 0.5) {
            activeEditor.setDecorations(this.negativeX, []);
            activeEditor.setDecorations(this.positiveX, xRanges);
        } else {
            activeEditor.setDecorations(this.positiveX, []);
            activeEditor.setDecorations(this.negativeX, xRanges);
        }

        if (Math.random() > 0.5) {
            activeEditor.setDecorations(this.negativeY, []);
            activeEditor.setDecorations(this.positiveY, this.fullRange);
        } else {
            activeEditor.setDecorations(this.positiveY, []);
            activeEditor.setDecorations(this.negativeY, this.fullRange);
        }

        clearTimeout(this.shakeTimeout);
        this.shakeTimeout = setTimeout(() => {
            this.unshake();
        }, 1000);
    }

    /**
     * Unset all shake decorations
     */
    private unshake = () => {
        this.shakeDecorations.forEach(decoration => {
            vscode.window.activeTextEditor.setDecorations(decoration, []);
        });
    }
}

