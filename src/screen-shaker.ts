'use strict';
import * as vscode from 'vscode';

export const SHAKE_INTENSITY = 5;

export class ScreenShaker {

    private negativeX: vscode.TextEditorDecorationType;
    private positiveX: vscode.TextEditorDecorationType;
    private negativeY: vscode.TextEditorDecorationType;
    private positiveY: vscode.TextEditorDecorationType;
    private shakeDecorations: vscode.TextEditorDecorationType[] = [];
    private shakeTimeout: NodeJS.Timer;

    // A range that represents the full document. A top margin is applied
    // to this range which will push every line down the desired amount
    private fullRange = [new vscode.Range(new vscode.Position(0, 0), new vscode.Position(Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER))];

    constructor(shakeIntensity: number = SHAKE_INTENSITY) {
        this.negativeX = vscode.window.createTextEditorDecorationType(<vscode.DecorationRenderOptions>{
            textDecoration: `none; margin-left: 0px;`
        });

        this.positiveX = vscode.window.createTextEditorDecorationType(<vscode.DecorationRenderOptions>{
            textDecoration: `none; margin-left: ${shakeIntensity}px;`
        });

        this.negativeY = vscode.window.createTextEditorDecorationType(<vscode.DecorationRenderOptions>{
            textDecoration: `none; margin-top: 0px;`
        });

        this.positiveY = vscode.window.createTextEditorDecorationType(<vscode.DecorationRenderOptions>{
            textDecoration: `none; margin-top: ${shakeIntensity}px;`
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
    shake = () => {
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
    unshake = () => {
        this.shakeDecorations.forEach(decoration => {
            vscode.window.activeTextEditor.setDecorations(decoration, []);
        });
    }

    dispose = () => {
        clearTimeout(this.shakeTimeout);
        this.shakeDecorations.forEach(decoration => decoration.dispose());
    }
}

