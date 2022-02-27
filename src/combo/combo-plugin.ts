import * as vscode from 'vscode';
import { getConfigValue, isConfigSet } from '../config/config';
import { Plugin, PowermodeChangeTextDocumentEventData } from '../plugin';
import { ComboFeatureConfig, ComboLocation, ComboLocationConfig, ComboPluginConfig } from './config';
import { EditorComboMeter } from './editor-combo-meter';
import { StatusBarComboMeter } from './status-bar/status-bar-combo-meter';
import { StatusBarTimer } from './status-bar/status-bar-timer';

export class ComboPlugin implements Plugin {

    private plugins: Plugin<ComboPluginConfig>[] = [];
    private config: ComboPluginConfig | undefined;

    public onDidChangeConfiguration = (config: vscode.WorkspaceConfiguration) => {
        const oldLocation = this.config?.comboLocation ?? "off";

        this.config = {
            comboLocation: comboLocationConfigToComboLocation(getConfigValue<ComboLocationConfig>("combo.location", config)),
            enableComboTimer: comboFeatureConfigToBoolean(getConfigValue<ComboFeatureConfig>("combo.timerEnabled", config)),
            enableComboCounter: comboFeatureConfigToBoolean(getConfigValue<ComboFeatureConfig>("combo.counterEnabled", config)),
            comboCounterSize: getConfigValue<number>("combo.counterSize", config),
        }

        if (this.config.comboLocation !== oldLocation) {
            this.dispose();

            switch (this.config.comboLocation) {
                case 'editor':
                    this.plugins.push(new EditorComboMeter());
                    break;
                case 'statusbar':
                    this.plugins.push(new StatusBarComboMeter(), new StatusBarTimer());
                    break;
            }
        }

        this.plugins.forEach(plugin => plugin.onDidChangeConfiguration(this.config));
    }

    public dispose(): void {
        while (this.plugins.length > 0) {
            this.plugins.shift().dispose();
        }
    }

    public onPowermodeStart(combo: number): void {
        this.plugins.forEach(plugin => plugin.onPowermodeStart(combo));
    }

    public onPowermodeStop(combo: number): void {
        this.plugins.forEach(plugin => plugin.onPowermodeStop(combo));
    }

    public onComboStop(finalCombo: number): void {
        this.plugins.forEach(plugin => plugin.onComboStop(finalCombo));
    }

    public onDidChangeTextDocument(data: PowermodeChangeTextDocumentEventData, event: vscode.TextDocumentChangeEvent): void {
        this.plugins.forEach(plugin => plugin.onDidChangeTextDocument(data, event));
    }
}

const comboLocationConfigToComboLocation = (configLocation: ComboLocationConfig): ComboLocation => {
    // TODO: Add support for "default" to read a value from a preset
    switch (configLocation) {
        case 'editor':
        case 'off':
        case 'statusbar':
            return configLocation;
        case 'default':
        default:
            return 'editor';
    }
}

const comboFeatureConfigToBoolean = (value: ComboFeatureConfig): boolean => {
    // TODO: Add support for "default" to read a value from a preset
    switch (value) {
        case 'hide':
            return false;
        case 'default':
        case 'show':
        default:
            return true;
    }
}
