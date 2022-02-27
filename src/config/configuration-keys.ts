export const ConfigurationKeys = [
    "enabled",
    "presets",
    "combo.location",
    "combo.threshold",
    "combo.timeout",
    "combo.counterEnabled",
    "combo.counterSize",
    "combo.timerEnabled",
    "shake.enabled",
    "shake.intensity",
    "explosions.enabled",
    "explosions.maxExplosions",
    "explosions.size",
    "explosions.frequency",
    "explosions.offset",
    "explosions.customExplosions",
    "explosions.backgroundMode",
    "explosions.gifMode",
    "explosions.explosionOrder",
    "explosions.duration",
    "explosions.customCss"
] as const;

export type ConfigurationKeys =  typeof ConfigurationKeys[number];

export const DeprecatedConfigurationKeys = [
    "comboThreshold",
    "comboTimeout",
    "enableStatusBarComboCounter",
    "enableStatusBarComboTimer",
    "enableShake",
    "shakeIntensity",
    "explosionSize",
    "explosionFrequency",
    "explosionOffset",
    "customExplosions",
    "backgroundMode",
    "gifMode",
    "explosionOrder",
    "explosionDuration",
    "customCss"
] as const;

export type DeprecatedConfigurationKeys =  typeof DeprecatedConfigurationKeys[number];
