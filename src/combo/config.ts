// The types used in the configuration file
export type ComboLocationConfig = "editor" | "statusbar" | "default" | "off";
export type ComboFeatureConfig = "show" | "hide" | "default";

// The types used by this plugin which converts default to an actual location
export type ComboLocation = Exclude<ComboLocationConfig, "default">;
export interface ComboPluginConfig {
    comboLocation: ComboLocation;
    enableComboTimer: boolean;
    enableComboCounter: boolean;
    comboCounterSize: number;
}
