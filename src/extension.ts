import * as vscode from 'vscode';
import { Plugin } from './plugin';
import { ThemeConfig, getConfigValue } from './config/config';
import { CursorExploder } from './cursor-exploder/cursor-exploder';
import { ComboMeter } from './combo-meter';
import { Ridiculous } from './config/ridiculous';

const DEFAULT_THEME_ID = 'particles';
const DEFAULT_THEME_CONFIG = Ridiculous;

// Config values
let documentChangeListenerDisposer: vscode.Disposable = null;
let enabled = false;
let comboThreshold: number;

// Native plugins
let cursorExploder: CursorExploder;
let comboMeter: ComboMeter;

// OsuMode components
let plugins: Plugin[] = [];

// Themes
let themes: {[key: string]: ThemeConfig} = {
    ["ridiculous"]: Ridiculous,
};

// Current combo count
let combo = 0;

export function activate(context: vscode.ExtensionContext) {
    vscode.workspace.onDidChangeConfiguration(onDidChangeConfiguration);
    onDidChangeConfiguration();
}

function init(config: vscode.WorkspaceConfiguration, activeTheme: ThemeConfig) {
    // Just in case something was left behind, clean it up
    deactivate();
    combo = 0;

    // The native plugins need this special theme, a subset of the config
    cursorExploder = new CursorExploder(activeTheme),
    comboMeter = new ComboMeter();

    plugins.push(
        cursorExploder,
        comboMeter,
    );

    plugins.forEach(plugin => plugin.onDidChangeConfiguration(config));

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
}

function onDidChangeConfiguration() {
    const config = vscode.workspace.getConfiguration('osumode');
    const theme = Ridiculous;

    const oldEnabled = enabled;

    enabled = config.get<boolean>('enabled', false);
    comboThreshold = config.get<number>('comboThreshold', 0);

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
    cursorExploder.themeConfig = theme;

    plugins.forEach(plugin => plugin.onDidChangeConfiguration(config));
}

// This will be exposed so other extensions can contribute their own themes
// function registerTheme(themeId: string, config: ThemeConfig) {
//     themes[themeId] = config;
// }

function getThemeConfig(themeId: string): ThemeConfig {
    return themes[themeId];
}

const onComboEnd = () => {
    plugins.forEach(plugin => plugin.onOsumodeStop(combo));

    // TODO: Evaluate if this event is needed
    // plugins.forEach(plugin => plugin.onComboReset(combo));

    combo = 0;
}

function isOsumode() {
    return enabled && combo >= comboThreshold;
}

function onDidChangeTextDocument(event: vscode.TextDocumentChangeEvent) {

    const changes = event.contentChanges[0].text;
    if(changes.length == 0) {
        onComboEnd();
    } else {
        combo++;
    }

    const osumode = isOsumode();
    plugins.forEach(plugin => plugin.onDidChangeTextDocument(combo, osumode, event));
}


