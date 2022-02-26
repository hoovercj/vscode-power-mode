import * as vscode from 'vscode';
import { Plugin } from './plugin';

export interface ComboMeterConfig {
    enableEditorComboCounter?: boolean;
}

export class ComboMeter implements Plugin {

    private config: ComboMeterConfig = {};
    // private comboTitleDecoration: vscode.TextEditorDecorationType;
    private comboCountDecoration: vscode.TextEditorDecorationType;

    private renderedComboCount: number = undefined;
    private combo: number = 0;
    private powermodeActive: boolean = false;
    private initialPowermodeCombo: number = 0;
    private enabled: boolean = false;

    private disposeTimer = undefined;

    private comboCountAnimationTimer = undefined;

    private static readonly DEFAULT_CSS = ComboMeter.objectToCssString({
        position: 'absolute',
        // NOTE: This positions the element off the screen when there is horizontal scroll
        // so this feature works best when "word wrap" is enabled.
        // Using "5vw" instead did not help.
        right: "5%",
        top: "20px",

        ['font-family']: "monospace",
        ['font-weight']: "900",

        // NOTE: Suggestion UI will still appear on top of the combo which is probaly a good thing
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
            clearTimeout(this.comboCountAnimationTimer);
            this.comboCountDecoration.dispose();
            this.comboCountDecoration = null;
        }

        // if (this.comboTitleDecoration) {
        //     this.comboTitleDecoration.dispose();
        //     this.comboTitleDecoration = null;
        // }
    }

    public onPowermodeStart = (combo: number) => {
        this.powermodeActive = true;
        this.initialPowermodeCombo = combo;
    }

    public onPowermodeStop = (finalCombo: number) => {
        this.powermodeActive = false;
        this.initialPowermodeCombo = 0;
    }

    public onComboStop = (finalCombo: number) => {
        this.combo = 0;
        this.updateDecorations();
    }

    public onDidChangeTextDocument = (currentCombo: number, powermode: boolean, event: vscode.TextDocumentChangeEvent) => {
        this.combo = currentCombo;
        this.powermodeActive = powermode;
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

        if (!firstVisibleRange || this.combo <= 1) {
            this.dispose();
            return;
        }

        // clearTimeout(this.disposeTimer);
        // this.disposeTimer = setTimeout(() => {
        //     this.dispose();
        // }, 10000);

        const position = firstVisibleRange.start;
        const ranges = [new vscode.Range(position, position)];

        if (this.combo !== this.renderedComboCount) {
            this.renderedComboCount = this.combo;
            this.createComboCountDecoration(this.combo, ranges, editor);
            // this.createComboTimerDecoration(this.combo, ranges, editor);
        }

    }

    // private createComboTimerDecoration(count: number, ranges: vscode.Range[], editor: vscode.TextEditor = vscode.window.activeTextEditor) {
    //     // TODO: Create "timer" decoration
    // }

    private createComboCountDecoration = (count: number, ranges: vscode.Range[], editor: vscode.TextEditor = vscode.window.activeTextEditor) => {
        const animateComboCountDecoration = (frameCount: number) => {
            this.comboCountDecoration?.dispose();

            // Because the size and color do not start to change until Power Mode starts, we cannot use the raw "count" to calculate those values
            // or else there will be a large jump when powermode activates, so instead use the value relative to the combo at which Power Mode started.
            const powerModeCombo = this.powermodeActive ? count - this.initialPowermodeCombo : 0;

            const baseTextSize = 6;
            const styleCount = Math.min(powerModeCombo, 50);
            // TODO: Explain how this formula works
            let textSize = this.powermodeActive ? ((styleCount * baseTextSize) / 100 * Math.pow(0.5, frameCount * 0.2) + baseTextSize) : baseTextSize;
            // Only change color in power mode
            const styleColor = `hsl(${(100 - (this.powermodeActive ? powerModeCombo : 0) * 1.2)}, 100%, 45%)`;

            const countCss = ComboMeter.objectToCssString({
                ["font-size"]: `${textSize}em`,
                ["text-align"]: "center",
                ["text-shadow"]: `0px 0px 15px ${styleColor}`,
            });

            const lightThemeCss = ComboMeter.objectToCssString({
                // Because the text is a very light color, a colored stroke is needed
                // to make it stand out sufficiently on a light theme
                ["-webkit-text-stroke"]: `2px ${styleColor}`,
            })

            const createComboCountAfterDecoration = (lightTheme?: boolean): vscode.DecorationRenderOptions => {
                return {
                    after: {
                        margin: ".8em 0 0 0",
                        contentText: `${count}×`,
                        color: "#FFFFFF",
                        textDecoration: `none; ${ComboMeter.DEFAULT_CSS} ${countCss} ${lightTheme ? lightThemeCss : ""}`,
                    }
                };
            }

            this.comboCountDecoration = vscode.window.createTextEditorDecorationType({
                // Note: Different decorations cannot use the same pseudoelement
                ...createComboCountAfterDecoration(),
                rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed,
                light: createComboCountAfterDecoration(true),
            });

            editor.setDecorations(this.comboCountDecoration, ranges);

            // Only animate in power mode
            if (this.powermodeActive && frameCount < 100) {
                this.comboCountAnimationTimer = setTimeout(() => {
                    animateComboCountDecoration(frameCount + 1);
                },
                // Ease-out the animation
                20 + (0.5 * frameCount));
            }
        }

        clearTimeout(this.comboCountAnimationTimer);
        animateComboCountDecoration(0);
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