# VSCODE POWER MODE!!!

Power Mode is one of the most requested extensions for VS Code. Unfortunatley, they said it couldn't be done...

![not-implementable](images/not-implementable.png)

However, after seeing [this list](https://github.com/codeinthedark/awesome-power-mode) and realizing that VS Code was the only modern editor without it, I knew I had to try. I couldn't let VS Code live in the shadow of its big brother or Atom.

I present you, VSCODE POWER MODE!!! (NOW WITH BIGGER EXPLOSIONS!)

![demo](images/demo.gif)

To enable, add `"powermode.enabled": true` to your settings.

## Features:
* NEW: BIGGER EXPLOSIONS!
* A combo counter
* A timer that shows how long until your combo expires
* Awful explosion gifs and screen shake effect when power mode is reached
* Community setting suggestions
* Configuration for:
   - Combo timeout
   - The Power Mode combo threshold
   - Choose your own explosions with base64 encoded gifs or full URIs (i.e. "data:image/gif;base64,1337GIF", "C:/my/cat/gif", "https://coolgif.io")
   - Choose how long the explosions last
   - Choose how to cycle through the explosions (random, sequential, or a specific index)
   - Set the size, number, and frequency of explosions
   - Change the vertical offset of the explosions
   - Disable explosions
   - Disable shake
   - Set shake intensity
   - Legacy Mode

## Cool Configurations:
I've tried to make power mode as configurable as possible. From doge to clippy, the only limit is your imagination. And now you can now see configurations shared by the community by typing `powermode` (without quotes) in `settings.json`. Share your own ideas with the community [here](https://github.com/hoovercj/vscode-power-mode/issues/7):

![demo](images/demo-settings-suggestions.gif)

**Note:** This feature is experimental and only available with powermode enabled. You can also disable this feature by adding `"powermode.settingSuggestions": false` to your user or workspace settings.

Here are a few ideas to get you started:

### Simple
```json
// Disable shake
"powermode.enableShake": false,
// Use the second (out of three) built in explosions
"powermode.explosionMode": 1,
```

![demo](images/demo-simple.gif)


### Chaos  
```json
// Make them often
"powermode.explosionFrequency": 1,
// Make them many
"powermode.maxExplosions": 5,
// Make them huge
"powermode.explosionSize": 20,
// Make them powerful!
"powermode.shakeIntensity": 15,

```

![demo](images/demo-chaos.gif)

### Clippy
```json
// https url link to image (http won't work) 
"powermode.customExplosions": [ "https://m.popkey.co/6a12ff/YN1DZ_s-200x150.gif" ],
// Make sure there is only one clippy
"powermode.maxExplosions": 1,
// Have him stay forever
"powermode.explosionDuration": 0,
// Position him to the bottom right of the cursor
"powermode.customCss": {
    "left": "1ch",
    "top": "1em",
    "z-index": 1
},
// Turn off shaking
"powermode.enableShake": false,
```

![demo](images/demo-clippy.gif)

### Other Options:
* `powermode.legacyMode`: If it worked better for you before the upgrade, setting this to `true` will use the original explosions.
* `powermode.maxExplosions`: Reducing this will reduce the number of explosions rendered at once.
* `powermode.explosionFrequency`: Increasing this will increase the number of keystrokes between explosions. It means that there will be gaps between explosions as you type but may help performance.
* `powermode.customExplosions`: Provide your own lighter weight gifs to use (And share them [here](https://github.com/hoovercj/vscode-power-mode/issues/1))
* `powermode.customCss`: Changes the CSS applied to the "after" pseudoelement. You can experiment with ways to make it look or perform better.

## Known Issues

They were right when they said it can't be done. At least not properly. VS Code does not expose the DOM as part of the API. Instead this extension relies on using TextEditorDecorations to set css properties for ranges in the editor. This has a few limitations:
* The cursor doesn't move with the text as it shakes
* When deleting characters, the explosion will briefly move to the beginning of the line. This is because I am using an "after" pseudoclass to apply the decorations, and when you delete the letter that it is anchored to it repositions to the next anchor which is the entire line.
* I have to use gifs instead of CSS animations for the particles/explosions
* I am not an artist, so I am using free gifs I found online

## Help Wanted:
If you can provide some lightweight, more attractive gifs that improve how power mode looks and performs, I would be happy to include them!

## Acknowledgements:
Thanks to [@horvay](https://github.com/horvay) for giving me ideas to get around the limitations I had in v0.0.1

## Changelog:
- v1.2.0
  - Suggest configurations in settings.json
- v1.1.0
  - Configure explosion duration
  - Configure explosion "mode": random, sequential, or a specific explosion
  - Reduce default "max explosions" from 5 to 1
- v1.0.0
  - True power mode! Explosions now extend outside the boundaries of a letter
  - Eliminated two of the default explosions that didn't look good when expanded
  - Added new explostion configuration options (explosion number, size, and frequency)
  - Added a Legacy Mode configuration option
  - Shake now resets after 1 second without typing (Thanks @horvay)
- v0.0.1
  - Initial release
  - Explosions work, but limited to size of characters