import * as vscode from 'vscode';
import { Plugin } from './plugin';

export interface ProgressBarTimerConfig {
    enableStatusBarComboTimer?: boolean;
    comboTimeout?: number;
}

export class ProgressBarTimer implements Plugin {

    static readonly DEFAULT_TIMEOUT = 10;

    private config: ProgressBarTimerConfig = {};
    private secondsRemaining = 0;
    private progressDisposer: () => void;
    private timerHandle: NodeJS.Timer;
    private active: boolean;

    constructor(private timerExpiredCallback: () => void) {}

    public onDidChangeConfiguration = (config: vscode.WorkspaceConfiguration) => {
        this.config.enableStatusBarComboTimer = config.get<boolean>('enableStatusBarComboTimer', true);
        this.config.comboTimeout = config.get<number>('comboTimeout', ProgressBarTimer.DEFAULT_TIMEOUT);
        if (isNaN(this.config.comboTimeout) || this.config.comboTimeout < 0) {
            this.config.comboTimeout = ProgressBarTimer.DEFAULT_TIMEOUT;
        }

        if (!this.config.enableStatusBarComboTimer) {
            this.stopTimer();
        }
    }

    public activate(): void {
        // Do nothing
    }

    public dispose(): void {
        this.stopTimer();
    }

    public onPowermodeStart(combo: number): void {
        // Do nothing
    }

    public onPowermodeStop(combo: number): void {
        // Do nothing
    }

    public onDidChangeTextDocument(combo: number, powermode: boolean, event: vscode.TextDocumentChangeEvent): void {
        if (!this.config.enableStatusBarComboTimer) {
            return;
        }

        if (!this.active) {
            this.startTimer(this.config.comboTimeout, this.timerExpiredCallback);
        } else {
            this.extendTimer(this.config.comboTimeout);
        }
    }

    /**
     * Starts a "progress" in the bottom of the vscode window
     * which displays the time remaining for the current combo
     */
    private startTimer = (timeLimit: number, onTimerExpired: () => void) => {
        if (!this.config.enableStatusBarComboTimer) {
            return;
        }

        if (timeLimit === 0) {
            return;
        }

        this.stopTimer();
        this.active = true;
        this.secondsRemaining = timeLimit;
        vscode.window.withProgress({
            location: vscode.ProgressLocation.Window,
        }, p => {
            return new Promise((resolve, reject) => {
                // Storing reject will allow us to
                // cancel the progress
                this.progressDisposer = reject;
                p.report({ message: this.getProgressMessage() });
                this.timerHandle = setInterval(() => {
                    this.secondsRemaining--;
                    p.report({ message: this.getProgressMessage() });
                    if (this.secondsRemaining <= 0) {
                        this.stopTimer();
                        onTimerExpired();
                    }
                }, 1000);
            });
        });
    }

    private extendTimer = (timeLimit: number) => {
        this.secondsRemaining = timeLimit;
    }

    /**
     * Disposes the progress and clears the timer that controls it
     */
    private stopTimer = () => {
        this.active = null;
        clearInterval(this.timerHandle);
        this.timerHandle = null;
        if (this.progressDisposer) {
            this.progressDisposer();
            this.progressDisposer = null;
        }
    }

    /**
     * Builds a message based on how much time is left on the timer
     * @returns The progress message
     */
    private getProgressMessage = () => {
        const secondsString = Math.floor(this.secondsRemaining);
        return `Combo Timer: ${secondsString} seconds`;
    }
}