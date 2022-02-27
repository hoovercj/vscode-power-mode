import { ConfigurationTarget, WorkspaceConfiguration } from 'vscode';
import { ExplosionConfig } from '../cursor-exploder/cursor-exploder'
import { ScreenShakerConfig } from '../screen-shaker/screen-shaker'
import { ConfigurationKeys, DeprecatedConfigurationKeys } from './configuration-keys';

export const CSS_LEFT = "margin-left";
export const CSS_TOP = "top";

export interface ThemeConfig extends ExplosionConfig, ScreenShakerConfig { }

export interface ExtensionConfig extends ThemeConfig {
    enabled?: boolean;
    comboThreshold?: number;
    comboTimeout?: number;
}

export function getConfigValue<V>(key: ConfigurationKeys, vscodeConfig: WorkspaceConfiguration, themeConfig: any = {}): V {
    return getConfigValueCore(key, vscodeConfig, themeConfig);
}

export function getDeprecatedConfigValue<V>(key: DeprecatedConfigurationKeys, vscodeConfig: WorkspaceConfiguration, themeConfig: any = {}): V {
    return getConfigValueCore(key, vscodeConfig, themeConfig);
}

function getConfigValueCore<V>(key: ConfigurationKeys | DeprecatedConfigurationKeys, vscodeConfig: WorkspaceConfiguration, themeConfig: any = {}): V {
    // If the config is explicitly set, use that value
    if (isConfigSet(key, vscodeConfig)) {
        return vscodeConfig.get<V>(key);
    }

    // Use the themeConfig value if set,
    const themeValue = themeConfig[key];
    if (!isNullOrUndefined(themeValue)) {
        return themeValue;
    }

    // Fall back to the package.json default value
    // as a last resort
    return vscodeConfig.get<V>(key);
}

export type InspectConfigData = ConfigurationTarget | false;

export function isConfigSet(key: ConfigurationKeys | DeprecatedConfigurationKeys, config: WorkspaceConfiguration): ConfigurationTarget | false {
    const inspectionResults = config.inspect(key);
    if (!isNullOrUndefined(inspectionResults.workspaceFolderValue)) {
        return ConfigurationTarget.WorkspaceFolder;
    } else if (!isNullOrUndefined(inspectionResults.workspaceValue)) {
        return ConfigurationTarget.Workspace;
    } else if (!isNullOrUndefined(inspectionResults.globalValue)) {
        return ConfigurationTarget.Global;
    } else {
        return false;
    }
}

export function updateConfig(key: ConfigurationKeys, value: any, config: WorkspaceConfiguration) {
    const target = isConfigSet(key, config) || ConfigurationTarget.Global;
    config.update(key, value, target);
}

function isNullOrUndefined(value: any) {
    return value === null || value === undefined;
}
