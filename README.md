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
* Configuration for:
   - Combo timeout
   - The Power Mode combo threshold
   - Choose your own explosions with base64 encoded gifs or full urls
   - Set the size, number, and frequency of explosions
   - Disable explosions
   - Disable shake
   - Set shake intensity
   - Legacy Mode

## Known Issues:
This is an experiment and may not perform well. There are a few configuration options that can be tweaked to help, though:
* `powermode.legacyMode`: Setting this to `true` will use the original, "background" explosions which may put less strain on the browser renderer.
* `powermode.maxExplosions`: Reducing this will reduce the number of explosions rendered at once.
* `powermode.explosionFrequency`: Increasing this will increase the number of keystrokes between explosions. It means that there will be gaps between explosions as you type but may help performance.
* `powermode.customExplosions`: Provide your own lighter weight gifs to use (And share them [here](https://github.com/hoovercj/vscode-power-mode/issues/1))
* `powermode.customCss`: Changes the CSS applied to the "after" pseudoelement. You can experiment with ways to make it look or perform better.

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
- v1.0.0
  - True power mode! Explosions now extend outside the boundaries of a letter
  - Eliminated two of the default explosions that didn't look good when expanded
  - Added new explostion configuration options (explosion number, size, and frequency)
  - Added a Legacy Mode configuration option
  - Shake now resets after 1 second without typing (Thanks @horvay)
- v0.0.1
  - Initial release
  - Explosions work, but limited to size of characters