import * as vscode from 'vscode';
import { Plugin } from './plugin';
import { getConfigValue, ThemeConfig, updateConfig } from './config/config';
import { Particles } from './config/particles';
import { Fireworks } from './config/fireworks';
import { Flames } from './config/flames';
import { Magic } from './config/magic';
import { Clippy } from './config/clippy';
import { SimpleRift, ExplodingRift } from './config/rift';
import { ScreenShaker } from './screen-shaker/screen-shaker';
import { CursorExploder } from './cursor-exploder/cursor-exploder';
import { ComboPlugin } from './combo/combo-plugin';
import { migrateConfiguration } from './config/configuration-migrator';

// Config values
let enabled = false;
let comboThreshold: number;
let comboTimeout: number;
let comboTimeoutHandle: NodeJS.Timer;

// Native plugins
let screenShaker: ScreenShaker;
let cursorExploder: CursorExploder;
let comboPlugin: ComboPlugin;

// PowerMode components
let plugins: Plugin[] = [];

let documentChangeListenerDisposer: vscode.Disposable;

// Themes
let themes: {[key: string]: ThemeConfig} = {
    fireworks: Fireworks,
    particles: Particles,
    flames: Flames,
    magic: Magic,
    clippy: Clippy,
    ["simple-rift"]: SimpleRift,
    ["exploding-rift"]: ExplodingRift,
};

// Current combo count
let combo = 0;
let isPowermodeActive = false;

export function activate(context: vscode.ExtensionContext) {
    // Try to migrate any existing configuration files
    migrateConfiguration();

    const enableCommand = 'powermode.enablePowerMode';
    const disableCommand = 'powermode.disablePowerMode';

    const setEnabled = (value: boolean) => {
        const config = vscode.workspace.getConfiguration("powermode");
        updateConfig("enabled", value, config);
    };

    // Register enable/disable commands
    context.subscriptions.push(vscode.commands.registerCommand(enableCommand, () => setEnabled(true)));
    context.subscriptions.push(vscode.commands.registerCommand(disableCommand, () => setEnabled(false)));

    // Subscribe to configuration changes
    context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(onDidChangeConfiguration));

    // Initialize from the current configuration
    onDidChangeConfiguration();
}

function init(config: vscode.WorkspaceConfiguration, activeTheme: ThemeConfig) {
    // Just in case something was left behind, clean it up
    resetState();

    // The native plugins need this special theme, a subset of the config
    screenShaker = new ScreenShaker(activeTheme),
    cursorExploder = new CursorExploder(activeTheme),
    comboPlugin = new ComboPlugin();

    plugins.push(
        screenShaker,
        cursorExploder,
        comboPlugin,
    );


    plugins.forEach(plugin => plugin.onDidChangeConfiguration(config));


    documentChangeListenerDisposer = vscode.workspace.onDidChangeTextDocument(onDidChangeTextDocument);
}

/**
 * Note: this method is also called automatically
 * when the extension is deactivated
 */
export function deactivate() {
    resetState();
}

function resetState() {
    combo = 0;

    stopTimer();

    documentChangeListenerDisposer?.dispose();

    while (plugins.length > 0) {
        plugins.shift().dispose();
    }
}

function onDidChangeConfiguration() {
    const config = vscode.workspace.getConfiguration('powermode');
    const themeId = getConfigValue<string>("presets", config);
    const theme = getThemeConfig(themeId)

    const oldEnabled = enabled;

    enabled = getConfigValue<boolean>('enabled', config);
    comboThreshold = getConfigValue<number>('combo.threshold', config);
    comboTimeout = getConfigValue<number>('combo.timeout', config);

    // Switching from disabled to enabled
    if (!oldEnabled && enabled) {
        init(config, theme);
        return;
    }

    // Switching from enabled to disabled
    if (oldEnabled && !enabled) {
        resetState();
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
}

// This will be exposed so other extensions can contribute their own themes
// function registerTheme(themeId: string, config: ThemeConfig) {
//     themes[themeId] = config;
// }

function getThemeConfig(themeId: string): ThemeConfig {
    return themes[themeId];
}

const onComboTimerExpired = () => {
    plugins.forEach(plugin => plugin.onPowermodeStop(combo));

    plugins.forEach(plugin => plugin.onComboStop(combo));

    combo = 0;
}

function isPowerMode() {
    return enabled && combo >= comboThreshold;
}

function onDidChangeTextDocument(event: vscode.TextDocumentChangeEvent) {

    const activeEditor = vscode.window.activeTextEditor;

    if (!activeEditor) {
        return;
    }

    combo++;
    const powermode = isPowerMode();

    startTimer();

    if (powermode != isPowermodeActive) {
        isPowermodeActive = powermode;

        isPowermodeActive ?
            plugins.forEach(plugin => plugin.onPowermodeStart(combo)) :
            plugins.forEach(plugin => plugin.onPowermodeStop(combo));
    }

    plugins.forEach(plugin => plugin.onDidChangeTextDocument({
        isPowermodeActive,
        comboTimeout,
        currentCombo: combo,
        activeEditor,
    }, event));
}


/**
 * Starts a "progress" in the bottom of the vscode window
 * which displays the time remaining for the current combo
 */
function startTimer() {
    stopTimer();

    if (comboTimeout === 0) {
        return;
    }

    comboTimeoutHandle = setTimeout(onComboTimerExpired, comboTimeout * 1000)
}

function stopTimer() {
    clearInterval(comboTimeoutHandle);
    comboTimeoutHandle = null;
}