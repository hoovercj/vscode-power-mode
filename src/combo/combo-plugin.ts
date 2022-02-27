import * as vscode from 'vscode';
import { getConfigValue, isConfigSet } from '../config/config';
import { Plugin, PowermodeChangeTextDocumentEventData } from '../plugin';
import { ComboFeatureConfig, ComboLocation, ComboLocationConfig, ComboPluginConfig, COMBO_COUNTER_CONFIG_KEY, COMBO_LOCATION_CONFIG_KEY, COMBO_TIMER_CONFIG_KEY, LEGACY_COMBO_COUNTER_CONFIG_KEY, LEGACY_COMBO_TIMER_CONFIG_KEY } from './config';
import { EditorComboMeter } from './editor-combo-meter';
import { StatusBarComboMeter } from './status-bar/status-bar-combo-meter';
import { StatusBarTimer } from './status-bar/status-bar-timer';

export class ComboPlugin implements Plugin {

    private plugins: Plugin<ComboPluginConfig>[] = [];
    private config: ComboPluginConfig | undefined;

    public onDidChangeConfiguration = (config: vscode.WorkspaceConfiguration) => {
        const oldLocation = this.config?.comboLocation ?? "off";

        const isComboLocationSet = isConfigSet(COMBO_LOCATION_CONFIG_KEY, config);
        const isLegacyEnableStatusBarComboCounterSet = isConfigSet("enableStatusBarComboCounter", config);
        const isLegacyEnableStatusBarComboTimerSet = isConfigSet("enableStatusBarComboTimer", config);
        const isLegacyConfigSet = isLegacyEnableStatusBarComboCounterSet || isLegacyEnableStatusBarComboTimerSet;

        // If a legacy setting is present and the new setting is not explicitly set to override it,
        // calculate the new settings from the legacy settings
        if (isLegacyConfigSet && !isComboLocationSet) {
            this.config = {
                comboLocation: "statusbar",
                enableComboCounter: getConfigValue<boolean | null>(LEGACY_COMBO_COUNTER_CONFIG_KEY, config) ?? true,
                enableComboTimer: getConfigValue<boolean | null>(LEGACY_COMBO_TIMER_CONFIG_KEY, config) ?? true,
            }
        }
        // Otherwise, use new explicitly set values or their defaults
        else {
            this.config = {
                comboLocation: comboLocationConfigToComboLocation(getConfigValue<ComboLocationConfig>(COMBO_LOCATION_CONFIG_KEY, config)),
                enableComboTimer: comboFeatureConfigToBoolean(getConfigValue<ComboFeatureConfig>(COMBO_TIMER_CONFIG_KEY, config)),
                enableComboCounter: comboFeatureConfigToBoolean(getConfigValue<ComboFeatureConfig>(COMBO_COUNTER_CONFIG_KEY, config)),
            }
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
