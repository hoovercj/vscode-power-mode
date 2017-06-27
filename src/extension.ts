'use strict';
import * as vscode from 'vscode';

import { ScreenShaker } from './screen-shaker';
import { CursorExploder } from './cursor-exploder';
import { ProgressBarTimer } from './progress-bar-timer';
import { StatusBarItem } from './status-bar-item';

// Config values
let documentChangeListenerDisposer: vscode.Disposable = null;
let enabled = false;
let comboTimeout;
let comboThreshold;
let customExplosions: string[];
let enableExplosions: boolean;
let enableShake: boolean;

// PowerMode components
let screenShaker: ScreenShaker;
let cursorExploder: CursorExploder;
let progressBarTimer: ProgressBarTimer;
let statusBarItem: StatusBarItem;

// Current combo count
let combo = 0;

export function activate(context: vscode.ExtensionContext) {
    vscode.workspace.onDidChangeConfiguration(onDidChangeConfiguration)
    onDidChangeConfiguration();
}

function init() {
    // Just in case something was left behind, clean it up
    deactivate();
    combo = 0;

    screenShaker = new ScreenShaker();
    cursorExploder = new CursorExploder(customExplosions);
    progressBarTimer = new ProgressBarTimer();
    statusBarItem = new StatusBarItem();

    documentChangeListenerDisposer = vscode.workspace.onDidChangeTextDocument(onDidChangeTextDocument);
}

/**
 * Note: this method is also called automatically
 * when the extension is deactivated
 */
export function deactivate() {

    combo = 0;

    if (documentChangeListenerDisposer) {
        documentChangeListenerDisposer.dispose();
        documentChangeListenerDisposer = null;
    }

    if (screenShaker) {
        screenShaker.dispose();
        screenShaker = null;
    }

    if (cursorExploder) {
        cursorExploder.dispose();
        cursorExploder = null;
    }

    if (statusBarItem) {
        statusBarItem.dispose();
        statusBarItem = null;
    }

    if (progressBarTimer) {
        progressBarTimer.stopTimer();
        progressBarTimer = null;
    }

    if (statusBarItem) {
        statusBarItem.dispose();
        statusBarItem = null;
    }
}

function onDidChangeConfiguration() {
    const config = vscode.workspace.getConfiguration('powermode');

    comboThreshold = config.get<number>('comboThreshold', 0);
    comboTimeout = config.get<number>('comboTimeout', 10);
    customExplosions = config.get<string[]>('customExplosions');
    enableExplosions = config.get<boolean>('enableExplosions', true);

    // If shake was enabled and now it isn't, unshake the screen
    const newEnableShake = config.get<boolean>('enableShake', true);
    if (screenShaker && enableShake && !newEnableShake) {
        screenShaker.unshake();
    }
    enableShake = newEnableShake;

    const newEnabled = config.get<boolean>('enabled');

    // Switching from disabled to enabled
    if (!enabled && newEnabled) {
        enabled = true;
        init();
        return;
    }

    // Switching from enabled to disabled
    if (enabled && !newEnabled) {
        enabled = false;
        deactivate();
        return;
    }

    if (screenShaker && enabled && !isPowerMode()) {
        screenShaker.unshake();
    }
}

function onProgressTimerExpired() {
    combo = 0;
    if (statusBarItem) {
        statusBarItem.updateStatusBar(0);
    }

    if (screenShaker) {
        screenShaker.unshake();
    }
}

function isPowerMode() {
    return enabled && combo >= comboThreshold;
}

function onDidChangeTextDocument(event: vscode.TextDocumentChangeEvent) {
    combo++;

    if (progressBarTimer) {
        if (!progressBarTimer.active) {
            progressBarTimer.startTimer(comboTimeout, onProgressTimerExpired);
        } else {
            progressBarTimer.extendTimer(comboTimeout);
        }
    }

    if (statusBarItem) {
        statusBarItem.updateStatusBar(combo, isPowerMode());
    }

    if (isPowerMode()) {
        if (enableExplosions && cursorExploder) {
            // If the content change is empty then it was likely a delete
            // This means there may not be text after the cursor, so do the
            // explosion before instead.
            const changes = event.contentChanges[0];
            const left = changes && changes.text.length === 0;
            cursorExploder.explode(left);
        }

        if (enableShake && screenShaker) {
            screenShaker.shake();
        }
    }
}


