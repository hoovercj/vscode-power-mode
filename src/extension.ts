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
let shakeIntensity: number;

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

    const oldEnableShake = enableShake;
    const oldShakeIntensity = shakeIntensity;
    const oldEnabled = enabled;

    enabled = config.get<boolean>('enabled');
    comboThreshold = config.get<number>('comboThreshold', 0);
    comboTimeout = config.get<number>('comboTimeout', 10);
    customExplosions = config.get<string[]>('customExplosions');
    enableExplosions = config.get<boolean>('enableExplosions', true);
    shakeIntensity = config.get<number>('shakeIntensity', 5);
    enableShake = config.get<boolean>('enableShake', true);

    // Switching from disabled to enabled
    if (!oldEnabled && enabled) {
        init();
        return;
    }

    // Switching from enabled to disabled
    if (oldEnabled && !enabled) {
        deactivate();
        return;
    }

    // If not enabled, nothing matters
    // because it will be taken care of
    // when it gets reenabled
    if (!enabled) {
        return;
    }

    // If shake was enabled and now it isn't, unshake the screen
    if (screenShaker && oldEnableShake && !enableShake) {
        screenShaker.unshake();
    }

    // If the shake intensity changed recreate the screen shaker
    if (enabled && oldShakeIntensity !== shakeIntensity) {
        screenShaker.dispose();
        screenShaker = new ScreenShaker(shakeIntensity);
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


