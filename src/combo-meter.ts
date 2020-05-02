import * as vscode from 'vscode';
import { Plugin } from './plugin';

export interface ComboMeterConfig {
    enableEditorComboCounter?: boolean;
}

export class ComboMeter implements Plugin {

    private config: ComboMeterConfig = {};
    private comboTitleDecoration: vscode.TextEditorDecorationType;
    private comboCountDecoration: vscode.TextEditorDecorationType;
    
    private renderedComboCount: number = undefined;
    private combo: number = 0;
    // TODO: Currently unused. Use this to style the combo
    private powermode: boolean = false;
    private enabled: boolean = false;

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
            this.updateDecorations(e.textEditor);
        });
    }

    dispose = () => {
        if (this.comboCountDecoration) {
            this.comboCountDecoration.dispose();
            this.comboCountDecoration = null;
        }

        if (this.comboTitleDecoration) {
            this.comboTitleDecoration.dispose();
            this.comboTitleDecoration = null;
        }
    }

    public onPowermodeStart = (combo: number) => {
        this.powermode = true;
    }

    public onPowermodeStop = (combo: number) => {
        this.powermode = false;
    }

    public onComboStart = (combo: number) => {
        this.combo = combo;
        this.updateDecorations();
    }

    public onComboStop = (combo: number) => {
        this.combo = combo;
        this.updateDecorations();
    }

    public onDidChangeTextDocument = (combo: number, powermode: boolean, event: vscode.TextDocumentChangeEvent) => {
        this.combo = combo;
        this.powermode = powermode;
        this.updateDecorations();
    }

    public onDidChangeConfiguration = (config: vscode.WorkspaceConfiguration) => {
        this.config.enableEditorComboCounter = config.get<boolean>('enableEditorComboCounter', false);
        if (this.config.enableEditorComboCounter) {
            this.enabled = true;
            this.activate();
        } else {
            this.enabled = false;
            this.dispose();
        }
    }

    private updateDecorations = (editor: vscode.TextEditor = vscode.window.activeTextEditor) => {
        if (!this.enabled) {
            return;
        }

        const firstVisibleRange = editor.visibleRanges.sort()[0];
        if (!firstVisibleRange) {
            this.dispose();
            return;
        }

        // The combo title doesn't ever change, so only create it once
        !!this.comboTitleDecoration || this.createComboTitleDecoration();
        // If the combo count changes, however, create a new decoration
        if (this.combo !== this.renderedComboCount) {
            this.createComboCountDecoration(this.combo);
        }

        const position = firstVisibleRange.start;
        const ranges = [new vscode.Range(position, position)];
        editor.setDecorations(this.comboTitleDecoration, ranges);
        editor.setDecorations(this.comboCountDecoration, ranges);
    }

    private createComboTitleDecoration() {
        this.comboTitleDecoration && this.comboTitleDecoration.dispose();

        const titleCss = ComboMeter.objectToCssString({
            ["font-size"]: "2em"
        });

        this.comboTitleDecoration = vscode.window.createTextEditorDecorationType({
            // Title and Count cannot use the same pseudoelement
            before: {
                contentText: "Combo:",
                color: "white",
                textDecoration: `none; ${ComboMeter.DEFAULT_CSS} ${titleCss}`,
            },
            rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed,
        });
    }

    private createComboCountDecoration(count: number) {
        this.comboCountDecoration && this.comboCountDecoration.dispose();

        const countCss = ComboMeter.objectToCssString({
            ["font-size"]: "4em"
        });

        this.comboCountDecoration = vscode.window.createTextEditorDecorationType({
            // Title and Count cannot use the same pseudoelement
            after: {
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