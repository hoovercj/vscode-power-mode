import * as vscode from 'vscode';
import { Plugin } from './plugin';

const ENABLED = false;

export interface ComboMeterConfig {
    enableEditorComboCounter?: boolean;
}

export class ComboMeter implements Plugin {

    private config: ComboMeterConfig = {};
    private comboTitle: vscode.TextEditorDecorationType;
    private comboCount: vscode.TextEditorDecorationType;

    private static readonly DEFAULT_CSS = ComboMeter.objectToCssString({
        position: 'absolute',
        right: "5%",
        // width: "50px",
        ['z-index']: 1,
        ['pointer-events']: 'none',
        ["text-align"]: "right",
    });

    constructor() {
        this.activate();
    }

    public activate = () => {
        vscode.window.onDidChangeTextEditorVisibleRanges((e: vscode.TextEditorVisibleRangesChangeEvent) => {
            const ranges = [e.visibleRanges.sort()[0]];
            if (this.comboTitle) {
                e.textEditor.setDecorations(this.comboTitle, ranges);
            }

            if (this.comboCount) {
                e.textEditor.setDecorations(this.comboCount, ranges);
            }
        });
    }

    dispose = () => {
        if (this.comboCount) {
            this.comboCount.dispose();
            this.comboCount = null;
        }

        if (this.comboTitle) {
            this.comboTitle.dispose();
            this.comboTitle = null;
        }
    }

    public onPowermodeStart = (combo: number) => {
        // Do nothing
    }

    public onPowermodeStop = (combo: number) => {
        // Do nothing
    }

    public onComboStart = (combo: number) => {
        this.updateDecorations(combo);
    }

    public onComboStop = (combo: number) => {
        this.updateDecorations(combo);
    }

    public onDidChangeTextDocument = (combo: number, powermode: boolean, event: vscode.TextDocumentChangeEvent) => {
        this.updateDecorations(combo, powermode);
    }

    public onDidChangeConfiguration = (config: vscode.WorkspaceConfiguration) => {
        this.config.enableEditorComboCounter = config.get<boolean>('enableStatusBarComboCounter', true);
        if (this.config.enableEditorComboCounter) {
            this.activate();
        } else {
            this.dispose();
        }
    }

    private updateDecorations = (combo: number, powermode?: boolean) => {
        this.dispose();

        this.createComboCountDecoration(combo);
        this.createComboTitleDecoration();

        const activeEditor = vscode.window.activeTextEditor;
        const ranges = [activeEditor.visibleRanges.sort()[0]];
        activeEditor.setDecorations(this.comboTitle, ranges);
        activeEditor.setDecorations(this.comboCount, ranges);
    }

    private createComboTitleDecoration() {
        const titleCss = ComboMeter.objectToCssString({
            ["font-size"]: "2em"
        });

        this.comboTitle = vscode.window.createTextEditorDecorationType({
            before: {
                contentText: "Combo:",
                color: "white",
                textDecoration: `none; ${ComboMeter.DEFAULT_CSS} ${titleCss}`,
            },
            rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed,
        });
    }

    private createComboCountDecoration(count: number) {
        const countCss = ComboMeter.objectToCssString({
            ["font-size"]: "4em"
        });

        this.comboCount = vscode.window.createTextEditorDecorationType({
            before: {
                margin: ".6em 0 0 0",
                contentText: count.toString(),
                color: "#9cdcfe",
                textDecoration: `none; ${ComboMeter.DEFAULT_CSS} ${countCss}`,
            },
            rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed,
        });
    }

    private static objectToCssString(settings: any): string {
        let value = '';
        const cssString = Object.keys(settings).map(setting => {
            value = settings[setting];
            if (typeof value === 'string' || typeof value === 'number') {
                return `${setting}: ${value};`
            }
        }).join(' ');

        return cssString;
    }
}