# VSCODE OSU Mode!!!

OSU Mode is a fork of Power Mode, they said it shouldn't be done...

However, after being bored and realizing that VSCode was not the only modern editor without it, I knew I didn't have to try, but I couldn't let VSCode live in the shadow of its big brother or Atom.

I present you, **VSCODE OSU MODE**!!! (now with Genshin Impact Characters!)

![DEMO](https://raw.githubusercontent.com/ao-shen/vscode-power-mode/master/images/demo-osu.gif)

#### General Settings
To disable OSU mode, add `"osumode.enabled": false` to your settings.

To disable combo counter, add `"osumode.enableComboCounter": false,` to your settings.

To disable combo image, add `"osumode.enableComboImage": false,` to your settings.

To disable letter explosions at the cursor when you type, add `"osumode.enableCursorExplosions": false,` to your settings.

#### Customize Images
To change the number of combo between every image, change `"osumode.comboImageInterval"` in your settings.

You can also specify custom images to use instead of default ones. Change `"osumode.customComboImages"` in your settings to a list of URLs to your custom images. Note: local images don't work, they have to be from https (for security reasons?)

```json
"osumode.customComboImages": [
  "https://imgur.com/t4XQPkJ.png",
  "https://imgur.com/9TYZgzm.png",
  "https://imgur.com/YAUseUb.png",
]
```


## Features:
* NEW: COMBO COUNTER
* NEW: COMBO IMAGES
* NEW: PER CHARACTER CURSOR EXPLOSIONS

## Acknowledgements:
* Thanks to [@hoovercj](https://github.com/hoovercj) for [Powermode](https://github.com/hoovercj/vscode-power-mode)

## Changelog:
- v3.2.1
  - Fixed readme error!
- v3.2.0
  - Added settings for combo image interval!
  - Added ability to customize combo images!
  - Changed default settings so that all features are enabled by default!
  - Removed some useless settings!
- v3.1.0
  - Updated Settings to be "osumode" instead of "powermode"!
  - Removed existing powermode presets, now you can install Osumode and Powermode separately!
  - Removed extra settings that only pertained to Powermode features!
  - Removed status bar combo counter!
- v3.0.1
  - Updated Readme!
- v3.0.0
  - Forked from Power Mode!
  - Added per character cursor explosions!
  - Added combo counter animations!
  - Added combo images!