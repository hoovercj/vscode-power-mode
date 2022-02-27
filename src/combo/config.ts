// The types used in the configuration file
export type ComboLocationConfig = "editor" | "statusbar" | "default" | "off";
export type ComboFeatureConfig = "show" | "hide" | "default";

// The types used by this plugin which converts default to an actual location
export type ComboLocation = Exclude<ComboLocationConfig, "default">;
export interface ComboPluginConfig {
    comboLocation: ComboLocation;
    enableComboTimer: boolean;
    enableComboCounter: boolean;
}

export const COMBO_LOCATION_CONFIG_KEY = "comboLocation";
export const COMBO_COUNTER_CONFIG_KEY = "enableComboCounter";
export const COMBO_TIMER_CONFIG_KEY = "enableComboTimer";

export const LEGACY_COMBO_COUNTER_CONFIG_KEY = "enableStatusBarComboCounter";
export const LEGACY_COMBO_TIMER_CONFIG_KEY = "enableStatusBarComboTimer";
