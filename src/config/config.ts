import { WorkspaceConfiguration} from 'vscode';
import { ExplosionConfig } from '../cursor-exploder/cursor-exploder'
import { ScreenShakerConfig } from '../screen-shaker/screen-shaker'

export interface ThemeConfig extends ExplosionConfig, ScreenShakerConfig { }

export interface ExtensionConfig extends ThemeConfig {
    enabled?: boolean;
    comboThreshold?: number;
    comboTimeout?: number;
    settingSuggestions?: boolean;
}

export function getConfigValue<T>(key: string, vscodeConfig: WorkspaceConfiguration, themeConfig: any): T {
    // If the config is explicitly set, use that value
    if (isConfigSet(key, vscodeConfig)) {
        return vscodeConfig.get<T>(key);
    }

    // Use the themeConfig value if set,
    const themeValue = themeConfig[key];
    if (!isNullOrUndefined(themeValue)) {
        return themeValue;
    }

    // Fall back to the package.json default value
    // as a last resort
    return vscodeConfig.get<T>(key);
}

function isNullOrUndefined(value: any) {
    return value === null || value === undefined;
}

function isConfigSet(key: string, config: WorkspaceConfiguration): boolean {
    const inspectionResults = config.inspect(key);
    return !isNullOrUndefined(inspectionResults.globalValue) ||
           !isNullOrUndefined(inspectionResults.workspaceValue);
}