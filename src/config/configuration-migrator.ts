import * as vscode from 'vscode';
import { ComboFeatureConfig, ComboLocationConfig } from '../combo/config';
import { getDeprecatedConfigValue, isConfigSet } from './config';

import { ConfigurationKeys, DeprecatedConfigurationKeys } from "./configuration-keys";

export const migrateConfiguration = () => {
    const config = vscode.workspace.getConfiguration("powermode");

    DeprecatedConfigurationKeys.forEach((key) => {
        const configTarget = isConfigSet(key, config);
        if (!configTarget) {
            return;
        }

        switch (key) {
            case "comboThreshold":
                migrateKey(config, configTarget, key, "combo.threshold");
                break;
            case "comboTimeout":
                migrateKey(config, configTarget, key, "combo.timeout");
                break;
            case "enableStatusBarComboCounter":
            case "enableStatusBarComboTimer":
                const newCounterEnabledKey: ConfigurationKeys = "combo.counterEnabled";
                const newTimerEnabledKey: ConfigurationKeys = "combo.timerEnabled";
                const newLocationKey: ConfigurationKeys = "combo.location";
                const isNewConfigSet = !![newCounterEnabledKey, newTimerEnabledKey, newLocationKey].find(newKey => isConfigSet(newKey, config));

                // If any of the new values are set, ignore the others.
                // This can occur if both legacy keys were set and the settings were migrated earlier in the foreach iteration.
                // It can also occur if the user has already migrated some keys themselves
                if (isNewConfigSet) {
                    return;
                }

                const oldCounterEnabledKey: DeprecatedConfigurationKeys = "enableStatusBarComboCounter";
                const oldTimerEnabledKey: DeprecatedConfigurationKeys = "enableStatusBarComboTimer";

                const oldCounterEnabledValue: boolean | null = getDeprecatedConfigValue<boolean>(oldCounterEnabledKey, config);
                const oldTimerEnabledValue: boolean | null = getDeprecatedConfigValue<boolean>(oldTimerEnabledKey, config);

                const newLocationValue: ComboLocationConfig = "statusbar";
                const newCounterEnabledValue: ComboFeatureConfig = legacyValueToComboFeatureConfig(oldCounterEnabledValue);
                const newTimerEnabledValue: ComboFeatureConfig = legacyValueToComboFeatureConfig(oldTimerEnabledValue);

                config.update(newLocationKey, newLocationValue, configTarget);
                config.update(newCounterEnabledKey, newCounterEnabledValue, configTarget);
                config.update(newTimerEnabledKey, newTimerEnabledValue, configTarget);

                config.update(oldCounterEnabledKey, undefined, configTarget);
                config.update(oldCounterEnabledKey, undefined, configTarget);
                break;
            case "enableShake":
                migrateKey(config, configTarget, key, "shake.enabled");
                break;
            case "shakeIntensity":
                migrateKey(config, configTarget, key, "shake.intensity");
                break;
            case "explosionSize":
                migrateKey(config, configTarget, key, "explosions.size");
                break;
            case "explosionFrequency":
                migrateKey(config, configTarget, key, "explosions.frequency");
                break;
            case "explosionOffset":
                migrateKey(config, configTarget, key, "explosions.offset");
                break;
            case "customExplosions":
                migrateKey(config, configTarget, key, "explosions.customExplosions");
                break;
            case "backgroundMode":
                migrateKey(config, configTarget, key, "explosions.backgroundMode");
                break;
            case "gifMode":
                migrateKey(config, configTarget, key, "explosions.gifMode");
                break;
            case "explosionOrder":
                migrateKey(config, configTarget, key, "explosions.explosionOrder");
                break;
            case "explosionDuration":
                migrateKey(config, configTarget, key, "explosions.duration");
                break;
            case "customCss":
                migrateKey(config, configTarget, key, "explosions.customCss");
                break;
            default:
                assertUnreachable(key);
        }
    });
}

const legacyValueToComboFeatureConfig = (value: boolean | null): ComboFeatureConfig => {
    // TODO: Add support for "default" to read a value from a preset
    switch (value) {
        case true:
            return "show";
        case false:
            return "hide";
        case null:
            return "default";
        default:
            assertUnreachable(value);
    }
}

const migrateKey = (config: vscode.WorkspaceConfiguration, target: vscode.ConfigurationTarget, oldKey: string, newKey: ConfigurationKeys) => {
    // If the new key is already present, that means the user has explicitly added back the old key.
    // Respect whatever the user is doing.
    if (isConfigSet(newKey, config)) {
        return;
    }

    const oldValue = config.get(oldKey);

    config.update(newKey, oldValue, target);
    config.update(oldKey, undefined, target);
}

const assertUnreachable = (x: never): never => {
    throw new Error("Didn't expect to get here");
}