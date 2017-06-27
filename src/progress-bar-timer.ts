'use strict';
import * as vscode from 'vscode';

export class ProgressBarTimer {

    private secondsRemaining = 0;
    private progressDisposer: () => void;
    private timerHandle: NodeJS.Timer;
    public active: boolean;

    /**
     * Starts a "progress" in the bottom of the vscode window
     * which displays the time remaining for the current combo
     */
    startTimer = (timeLimit: number, onTimerExpired: () => void) => {
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
                    if (this.secondsRemaining === 0) {
                        this.stopTimer();
                        onTimerExpired();
                    }
                }, 1000);
            });
        });
    }

    extendTimer = (timeLimit: number) => {
        this.secondsRemaining = timeLimit;
    }

    /**
     * Disposes the progress and clears the timer that controls it
     */
    stopTimer = () => {
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
    getProgressMessage = () => {
        return `Combo Timer: ${this.secondsRemaining} seconds`;
    }
}