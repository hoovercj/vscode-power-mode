import * as vscode from 'vscode';
import { Plugin } from '../plugin';
import { ThemeConfig, getConfigValue, CSS_LEFT, CSS_TOP } from '../config/config';

const alphabetIdxMap = {"A":0,"a":0,"B":1,"b":1,"C":2,"c":2,"D":3,"d":3,"E":4,"e":4,"F":5,"f":5,"G":6,"g":6,"H":7,"h":7,"I":8,"i":8,"J":9,"j":9,"K":10,"k":10,"L":11,"l":11,"M":12,"m":12,"N":13,"n":13,"O":14,"o":14,"P":15,"p":15,"Q":16,"q":16,"R":17,"r":17,"S":18,"s":18,"T":19,"t":19,"U":20,"u":20,"V":21,"v":21,"W":22,"w":22,"X":23,"x":23,"Y":24,"y":24,"Z":25,"z":25,"1":26,"2":27,"3":28,"4":29,"5":30,"6":31,"7":32,"8":33,"9":34,"0":35,"`":36,"!":37,"$":38,"%":39,"^":40,"*":41,"(":42,")":43,"-":44,"=":45,"_":46,"+":47,"[":48,"]":49,"\\":50,"|":51,";":52,"'":53,":":54,"\"":55,",":56,".":57,"/":58,"<":59,">":60,"?":61,"DELETE":62,"SPACE":63,"NEWLINE":64,"CONTROL+V":65};

export type ExplosionOrder = 'random' | 'sequential' | number;
export type BackgroundMode = 'mask' | 'image';
export type GifMode = 'continue' | 'restart';
export interface ExplosionConfig {
    enableRidiculous: boolean;
    enableExplosions: boolean;
    maxExplosions: number;
    explosionSize: number;
    explosionFrequency: number;
    explosionOffset: number;
    explosionDuration: number;
    customExplosions: string[];
    explosionOrder: ExplosionOrder;
    backgroundMode: BackgroundMode;
    gifMode: GifMode
    customCss?: {[key: string]: string};
}

export class CursorExploder implements Plugin {

    private config: ExplosionConfig = {} as ExplosionConfig;
    private activeDecorations: vscode.TextEditorDecorationType[] = [];
    private keystrokeCounter = -1;
    private explosionIndex = -1;
    private counterTimeout: NodeJS.Timer;

    constructor(public themeConfig: ThemeConfig) {}

    onThemeChanged = (theme: ThemeConfig) => {
        this.themeConfig = theme;
        this.initialize();
    }

    activate = () => {
        this.initialize();
    }

    dispose = () => {
        this.onPowermodeStop();
    }

    public onPowermodeStart = (combo?: number) => {
        // Do nothing
    }

    public onPowermodeStop = (combo?: number) => {
        // Dispose all explosions
        while(this.activeDecorations.length > 0) {
            this.activeDecorations.shift().dispose();
        }
    }

    public onDidChangeTextDocument = (combo: number, powermode: boolean, event: vscode.TextDocumentChangeEvent) => {
        if (!this.config.enableExplosions || !powermode) {
            return;
        }

        // If the content change is empty then it was likely a delete
        // This means there may not be text after the cursor, so do the
        // explosion before instead.
        const changes = event.contentChanges[0];
        const left = changes && changes.text.length === 0;
        this.explode(left, changes.text);
    }

    public onDidChangeConfiguration = (config: vscode.WorkspaceConfiguration) => {

        const newConfig: ExplosionConfig = {
            enableRidiculous: getConfigValue<boolean>('enableRidiculous', config, this.themeConfig),
            customExplosions: getConfigValue<string[]>('customExplosions', config, this.themeConfig),
            enableExplosions: getConfigValue<boolean>('enableExplosions', config, this.themeConfig),
            maxExplosions: getConfigValue<number>('maxExplosions', config, this.themeConfig),
            explosionSize: getConfigValue<number>('explosionSize', config, this.themeConfig),
            explosionFrequency: getConfigValue<number>('explosionFrequency', config, this.themeConfig),
            explosionOffset: getConfigValue<number>('explosionOffset', config, this.themeConfig),
            explosionOrder: getConfigValue<ExplosionOrder>('explosionOrder', config, this.themeConfig),
            explosionDuration: getConfigValue<number>('explosionDuration', config, this.themeConfig),
            backgroundMode: getConfigValue<BackgroundMode>('backgroundMode', config, this.themeConfig),
            gifMode: getConfigValue<GifMode>('gifMode', config, this.themeConfig),
            customCss: getConfigValue<any>('customCss', config, this.themeConfig),
        }

        let changed = false;
        Object.keys(newConfig).forEach(key => {
            if (this.config[key] !== newConfig[key]) {
                changed = true;
            }
        });

        if (!changed) {
            return;
        }

        this.config = newConfig;

        this.initialize();
    }

    public initialize = () => {
        this.dispose();

        if (!this.config.enableExplosions) {
            return;
        }

        this.explosionIndex = -1;
        this.keystrokeCounter = -1;
    }

    private getExplosionDecoration = (position: vscode.Position, changes: string): vscode.TextEditorDecorationType => {
        let explosions = this.config.customExplosions;
        let explosion: string = null;

        if(this.config.enableRidiculous) {
            if(changes.length == 1 && changes[0] in alphabetIdxMap) {
                explosion = explosions[alphabetIdxMap[changes[0]]];
            } else if(changes.length == 0) {
                explosion = explosions[alphabetIdxMap["DELETE"]];
            } else if(changes == " ") {
                explosion = explosions[alphabetIdxMap["SPACE"]];
            } else if(changes == "\n" || changes == "\r\n") {
                explosion = explosions[alphabetIdxMap["NEWLINE"]];
            } else {
                explosion = explosions[alphabetIdxMap["CONTROL+V"]];
            }
        } else {
            explosion = this.pickExplosion(explosions);
        }

        if (!explosion) {
            return null;
        }

        return this.createExplosionDecorationType(explosion, position, changes);
    }

    private pickExplosion(explosions: string[]): string {
        if (!explosions) {
            return null;
        }
        switch (typeof this.config.explosionOrder) {
            case 'string':
                switch (this.config.explosionOrder) {
                    case 'random':
                        this.explosionIndex = getRandomInt(0, explosions.length);
                        break;
                    case 'sequential':
                        this.explosionIndex = (this.explosionIndex + 1) % explosions.length;
                        break;
                    default:
                        this.explosionIndex = 0;
                }
                break;
            case 'number':
                this.explosionIndex = Math.min(explosions.length - 1, Math.floor(Math.abs(this.config.explosionOrder as number)));
            default:
                break;
        }
        return explosions[this.explosionIndex];
    }

    /**
     * @returns an decoration type with the configured background image
     */
    private createExplosionDecorationType = (explosion: string, editorPosition: vscode.Position, changes: string): vscode.TextEditorDecorationType => {

        let explosionSize = this.config.explosionSize * (Math.random() * 0.7 + 0.5);
        let explosionSizeHor = explosionSize;

        if(this.config.enableRidiculous) {
            if(changes.length == 1 && changes[0] in alphabetIdxMap) {
                
            } else {
                explosionSizeHor = explosionSize * 6;
            }
        }

        // subtract 1 ch to account for the character and divide by two to make it centered
        // Use Math.floor to skew to the right which especially helps when deleting chars
        const leftValue = Math.floor((explosionSizeHor - 1) / 2);
        // By default, the top of the gif will be at the top of the text.
        // Setting the top to a negative value will raise it up.
        // The default gifs are "tall" and the bottom halves are empty.
        // Lowering them makes them appear in a more natural position,
        // but limiting the top to the line number keeps it from going
        // off the top of the editor
        const topValue = explosionSize * this.config.explosionOffset;

        const explosionUrl = this.getExplosionUrl(explosion);

        const backgroundCss = this.config.backgroundMode === 'mask' ?
            this.getMaskCssSettings(explosionUrl) :
            this.getBackgroundCssSettings(explosionUrl);

        const defaultCss = {
            position: 'absolute',
            [CSS_LEFT] : `-${leftValue}ch`,
            [CSS_TOP]: `-${topValue}rem`,
            width: `${explosionSizeHor}ch`,
            height: `${explosionSize}rem`,
            display: `inline-block`,
            ['z-index']: 1,
            ['pointer-events']: 'none',
        };

        const backgroundCssString = this.objectToCssString(backgroundCss);
        const defaultCssString = this.objectToCssString(defaultCss);
        const customCssString = this.objectToCssString(this.config.customCss || {});

        //let arr = ([...changes].map(x => x.charCodeAt(0))).join('-');

        return vscode.window.createTextEditorDecorationType(<vscode.DecorationRenderOptions>{
            before: {
                contentText: "",
                textDecoration: `none; ${defaultCssString} ${backgroundCssString} ${customCssString}`,
            },
            textDecoration: `none; position: relative;`,
            rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed,
        });
    }

    private getExplosionUrl(explosion: string): string {
        if (this.config.gifMode !== 'restart') {
            return explosion;
        }

        if (this.isUrl(explosion)) {
            return `${explosion}?timestamp=${Date.now()}`;
        } else {
            // https://tools.ietf.org/html/rfc2397
            return explosion.replace('base64,', `timestamp=${Date.now()};base64,`);
        }
    }

    private isUrl(value: string): boolean {
        return value.startsWith('https');
    }

    private getBackgroundCssSettings(explosion: string) {
        return {
            'background-repeat': 'no-repeat',
            'background-size': 'contain',
            'background-image': `url("${explosion}")`,
        }
    }

    private getMaskCssSettings(explosion: string): any {
        return {
            'background-color': 'currentColor',
            '-webkit-mask-repeat': 'no-repeat',
            '-webkit-mask-size': 'contain',
            '-webkit-mask-image': `url("${explosion}")`,
            filter: 'saturate(150%)',
        }
    }

    private objectToCssString(settings: any): string {
        let value = '';
        const cssString = Object.keys(settings).map(setting => {
            value = settings[setting];
            if (typeof value === 'string' || typeof value === 'number') {
                return `${setting}: ${value};`
            }
        }).join(' ');

        return cssString;
    }

    /**
     * "Explodes" where the cursor is by setting a text decoration
     * that contains a base64 encoded gif as the background image.
     * The gif is then removed 1 second later
     *
     * @param {boolean} [left=false] place the decoration to
     * the left or the right of the cursor
     */
    private explode = (left = false, changes = "") => {
        // To give the explosions space, only explode every X strokes
        // Where X is the configured explosion frequency
        // This counter resets if the user does not type for 1 second.
        clearTimeout(this.counterTimeout);
        this.counterTimeout = setTimeout(() => {
            this.keystrokeCounter = -1;
        }, 1000);

        if (++this.keystrokeCounter % this.config.explosionFrequency !== 0) {
            return;
        }

        const activeEditor = vscode.window.activeTextEditor;
        const cursorPosition = vscode.window.activeTextEditor.selection.active;
        // The delta is greater to the left than to the right because otherwise the gif doesn't appear
        const delta = left ? -2 : 1;
        const newRange = new vscode.Range(
            cursorPosition.with(cursorPosition.line, cursorPosition.character),
            // Value can't be negative
            cursorPosition.with(cursorPosition.line, Math.max(0, cursorPosition.character + delta))
        );

        // Dispose excess explosions
        while(this.activeDecorations.length >= this.config.maxExplosions) {
            this.activeDecorations.shift().dispose();
        }

        // A new decoration is used each time because otherwise adjacent
        // gifs will all be identical. This helps them be at least a little
        // offset.
        const decoration = this.getExplosionDecoration(newRange.start, changes);
        if (!decoration) {
            return;
        }

        this.activeDecorations.push(decoration);

        if (this.config.explosionDuration !== 0) {
            setTimeout(() => {
                decoration.dispose();
            }, this.config.explosionDuration);
        }
        activeEditor.setDecorations(decoration, [newRange]);
    }
}

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
}
