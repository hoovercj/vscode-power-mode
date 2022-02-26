import * as vscode from 'vscode';
import { Plugin } from './plugin';
import { ThemeConfig, getConfigValue } from './config/config';
import { Particles } from './config/particles';
import { Fireworks } from './config/fireworks';
import { Flames } from './config/flames';
import { Magic } from './config/magic';
import { Clippy } from './config/clippy';
import { SimpleRift, ExplodingRift } from './config/rift';
import { ScreenShaker } from './screen-shaker/screen-shaker';
import { CursorExploder } from './cursor-exploder/cursor-exploder';
import { ProgressBarTimer } from './progress-bar-timer';
import { StatusBarItem } from './status-bar-item';
import { ComboMeter } from './combo-meter';

const DEFAULT_THEME_ID = 'particles';
const DEFAULT_THEME_CONFIG = Particles;

// Config values
let documentChangeListenerDisposer: vscode.Disposable = null;
let enabled = false;
let comboThreshold: number;

// Native plugins
let screenShaker: ScreenShaker;
let cursorExploder: CursorExploder;
let statusBarItem: StatusBarItem;
let progressBarTimer: ProgressBarTimer;
let comboMeter: ComboMeter;

// PowerMode components
let plugins: Plugin[] = [];

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
    vscode.workspace.onDidChangeConfiguration(onDidChangeConfiguration);
    onDidChangeConfiguration();
}

function init(config: vscode.WorkspaceConfiguration, activeTheme: ThemeConfig) {
    // Just in case something was left behind, clean it up
    deactivate();
    combo = 0;

    // The native plugins need this special theme, a subset of the config
    screenShaker = new ScreenShaker(activeTheme),
    cursorExploder = new CursorExploder(activeTheme),
    statusBarItem = new StatusBarItem();
    progressBarTimer = new ProgressBarTimer(onProgressTimerExpired);
    comboMeter = new ComboMeter();

    plugins.push(
        screenShaker,
        cursorExploder,
        statusBarItem,
        progressBarTimer,
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
    const config = vscode.workspace.getConfiguration('powermode');
    const themeId = config.get<string>('presets');
    const theme = getThemeConfig(themeId)

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

const onProgressTimerExpired = () => {
    plugins.forEach(plugin => plugin.onPowermodeStop(combo));

    plugins.forEach(plugin => plugin.onComboStop(combo));

    combo = 0;
}

function isPowerMode() {
    return enabled && combo >= comboThreshold;
}

function onDidChangeTextDocument(event: vscode.TextDocumentChangeEvent) {
    combo++;
    const powermode = isPowerMode();

    if (powermode != isPowermodeActive) {
        isPowermodeActive = powermode;

        isPowermodeActive ?
            plugins.forEach(plugin => plugin.onPowermodeStart(combo)) :
            plugins.forEach(plugin => plugin.onPowermodeStop(combo));
    }

    plugins.forEach(plugin => plugin.onDidChangeTextDocument(combo, powermode, event));
}


