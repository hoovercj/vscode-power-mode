'use strict';
import * as vscode from 'vscode';
import { Plugin } from './plugin';
import { ThemeConfig, getConfigValue } from './config/config';
import { Particles } from './config/particles';
import { Fireworks } from './config/fireworks';
import { Flames } from './config/flames';
import { Magic } from './config/magic';
import { Clippy } from './config/clippy';
import { ScreenShaker } from './screen-shaker/screen-shaker';
import { CursorExploder } from './cursor-exploder/cursor-exploder';
import { ProgressBarTimer } from './progress-bar-timer';
import { StatusBarItem } from './status-bar-item';
import { SettingsSuggester } from './settings-suggester';

const DEFAULT_THEME_ID = 'particles';
const DEFAULT_THEME_CONFIG = Particles;

// Config values
let documentChangeListenerDisposer: vscode.Disposable = null;
let enabled = false;
let comboTimeout;
let comboThreshold;
let settingSuggestions: boolean;

// Native plugins
let screenShaker: ScreenShaker;
let cursorExploder: CursorExploder;

// PowerMode components
let plugins: Plugin[] = [];
let progressBarTimer: ProgressBarTimer;
let statusBarItem: StatusBarItem;
let settingsSuggester: SettingsSuggester;

// Themes
let themes: {[key: string]: ThemeConfig} = {
    fireworks: Fireworks,
    particles: Particles,
    flames: Flames,
    magic: Magic,
    clippy: Clippy,
    [DEFAULT_THEME_ID]: DEFAULT_THEME_CONFIG,
};

// Current combo count
let combo = 0;

export function activate(context: vscode.ExtensionContext) {
    vscode.workspace.onDidChangeConfiguration(onDidChangeConfiguration)
    onDidChangeConfiguration();
}

function init(config: vscode.WorkspaceConfiguration, activeTheme: ThemeConfig) {
    // Just in case something was left behind, clean it up
    deactivate();
    combo = 0;

    // The native plugins need this special theme, a subset of the config
    screenShaker = new ScreenShaker(activeTheme),
    cursorExploder = new CursorExploder(activeTheme),

    plugins.push(
        screenShaker,
        cursorExploder,
        new StatusBarItem(),
    );

    plugins.forEach(plugin => plugin.onDidChangeConfiguration(config));

    progressBarTimer = new ProgressBarTimer();
    statusBarItem = new StatusBarItem();
    settingsSuggester = new SettingsSuggester();

    vscode.languages.registerCompletionItemProvider({ language: 'json', pattern: '**/settings.json' }, settingsSuggester)

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

    while (plugins.length > 0) {
        plugins.shift().dispose();
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

    if (settingsSuggester) {
        settingsSuggester = null;
    }
}

function onDidChangeConfiguration() {
    const config = vscode.workspace.getConfiguration('powermode');
    const themeId = config.get<string>('presets');
    const theme = getThemeConfig(themeId)

    const oldEnabled = enabled;

    enabled = config.get<boolean>('enabled', false);
    comboThreshold = config.get<number>('comboThreshold', 0);
    comboTimeout = config.get<number>('comboTimeout', 10);
    settingSuggestions = config.get<boolean>('settingSuggestions', true);

    // Switching from disabled to enabled
    if (!oldEnabled && enabled) {
        init(config, theme);
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

    // The theme needs set BEFORE onDidChangeConfiguration is called
    screenShaker.themeConfig = theme;
    cursorExploder.themeConfig = theme;

    plugins.forEach(plugin => plugin.onDidChangeConfiguration(config));

    // Update the SettingsSuggester settings
    settingsSuggester.settingSuggestions = settingSuggestions;
}

// This will be exposed so other extensions can contribute their own themes
// function registerTheme(themeId: string, config: ThemeConfig) {
//     themes[themeId] = config;
// }

function getThemeConfig(themeId: string): ThemeConfig {
    return themes[themeId];
}

function onProgressTimerExpired() {
    plugins.forEach(plugin => plugin.onPowermodeStop(combo));

    // TODO: Evaluate if this event is needed
    // plugins.forEach(plugin => plugin.onComboReset(combo));

    combo = 0;
}

function isPowerMode() {
    return enabled && combo >= comboThreshold;
}

function onDidChangeTextDocument(event: vscode.TextDocumentChangeEvent) {
    combo++;

    // TODO: Move to a plugin
    if (progressBarTimer) {
        if (!progressBarTimer.active) {
            progressBarTimer.startTimer(comboTimeout, onProgressTimerExpired);
        } else {
            progressBarTimer.extendTimer(comboTimeout);
        }
    }

    const powermode = isPowerMode();
    plugins.forEach(plugin => plugin.onDidChangeTextDocument(combo, powermode, event));
}


