'use strict';
import * as vscode from 'vscode';
import { Plugin } from '../plugin';
import { ThemeConfig, getConfigValue } from '../config/config';

const atomExplosion = "data:image/gif;base64,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";

export type ExplosionMode = 'random' | 'sequential' | number;
export type BackgroundMode = 'mask' | 'image';
export type GifMode = 'continue' | 'restart';
export interface ExplosionConfig {
    enableExplosions: boolean;
    maxExplosions: number;
    explosionSize: number;
    explosionFrequency: number;
    explosionOffset: number;
    explosionDuration: number;
    customExplosions: string[];
    explosionMode: ExplosionMode;
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
        // Do nothing
        this.initialize();
    }

    dispose = () => {
        // Nothing to dispose yet
    }

    public onPowermodeStart = (combo: number) => {
        // Do nothing
    }

    public onPowermodeStop = (combo: number) => {
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
        this.explode(left);
    }

    public onDidChangeConfiguration = (config: vscode.WorkspaceConfiguration) => {
        // TODO: this doesn't work when I adopt 'sets'

        const newConfig: ExplosionConfig = {
            customExplosions: getConfigValue<string[]>('customExplosions', config, this.themeConfig),
            enableExplosions: getConfigValue<boolean>('enableExplosions', config, this.themeConfig),
            maxExplosions: getConfigValue<number>('maxExplosions', config, this.themeConfig),
            explosionSize: getConfigValue<number>('explosionSize', config, this.themeConfig),
            explosionFrequency: getConfigValue<number>('explosionFrequency', config, this.themeConfig),
            explosionOffset: getConfigValue<number>('explosionOffset', config, this.themeConfig),
            explosionMode: getConfigValue<ExplosionMode>('explosionMode', config, this.themeConfig),
            explosionDuration: getConfigValue<number>('explosionDuration', config, this.themeConfig),
            backgroundMode: getConfigValue<BackgroundMode>('backgroundMode', config, this.themeConfig),
            gifMode: getConfigValue<GifMode>('gifMode', config, this.themeConfig),
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
        if (!this.config.enableExplosions) {
            this.dispose();
            return;
        }

        this.explosionIndex = -1;
        this.keystrokeCounter = -1;
    }

    private getExplosionDecoration = (position: vscode.Position): vscode.TextEditorDecorationType => {
        let explosions = this.config.customExplosions;
        const explosion = this.pickExplosion(explosions);

        if (!explosion) {
            return null;
        }

        return this.createExplosionDecorationType(explosion, position);
    }

    private pickExplosion(explosions: string[]): string {
        if (!explosions) {
            return null;
        }
        switch (typeof this.config.explosionMode) {
            case 'string':
                switch (this.config.explosionMode) {
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
                this.explosionIndex = Math.min(explosions.length - 1, Math.floor(Math.abs(this.config.explosionMode as number)));
            default:
                break;
        }
        return explosions[this.explosionIndex];
    }

    /**
     * @returns an decoration type with the configured background image
     */
    private createExplosionDecorationType = (explosion: string, editorPosition: vscode.Position ): vscode.TextEditorDecorationType => {
        // subtract 1 ch to account for the character and divide by two to make it centered
        const leftValue = (this.config.explosionSize - 1) / 2;
        // By default, the top of the gif will be at the top of the text.
        // Setting the top to a negative value will raise it up.
        // The default gifs are "tall" and the bottom halves are empty.
        // Lowering them makes them appear in a more natural position,
        // but limiting the top to the line number keeps it from going
        // off the top of the editor
        const topValue = Math.min(editorPosition.line, this.config.explosionSize * this.config.explosionOffset);

        const explosionUrl = this.getExplosionUrl(explosion);

        const backgroundCss = this.config.backgroundMode === 'mask' ?
            this.getMaskCssSettings(explosionUrl) :
            this.getBackgroundCssSettings(explosionUrl);

        const defaultCss = {
            position: 'absolute',
            left: `-${leftValue}ch`,
            top: `-${topValue}rem`,
            width: `${this.config.explosionSize}ch`,
            height: `${this.config.explosionSize}rem`,
            display: `inline-block`,
        };

        const backgroundCssString = this.objectToCssString(backgroundCss);
        const defaultCssString = this.objectToCssString(defaultCss);
        const customCssString = this.objectToCssString(this.config.customCss || {});

        return vscode.window.createTextEditorDecorationType(<vscode.DecorationRenderOptions>{
            after: {
                contentText: '',
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
            return explosion.replace('base64,', `timestamp=${Date.now()};base64,`);
        }
    }

    private isUrl(value: string): boolean {
        return value.indexOf('https') === 0;
    }

    private getBackgroundCssSettings(explosion: string) {
        return {
            'background-repeat': 'no-repeat',
            'background-size': 'contain',
            'background-composite': 'xor',
            'background-image': `url("${explosion}")`,
        }
    }

    private getMaskCssSettings(explosion: string): any {
        return {
            'background-color': 'currentColor',
            '-webkit-mask-repeat': 'no-repeat',
            '-webkit-mask-size': 'contain',
            '-webkit-mask-composite': 'xor',
            '-webkit-mask-image': `url("${explosion}")`,
            filter: 'saturate(150%)',
        }
    }

    private objectToCssString(settings: any): string {
        // let cssString = '';
        // for(const setting in settings) {
        //     if (settings.hasOwnProperty(setting)) {
        //         cssString += `${setting}: ${settings[setting]}`;
        //     }
        // }

        // return cssString;

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
    private explode = (left = false) => {
        // To give the explosions space, only explode every X strokes
        // Where X is the configured explosion rarity
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
        const decoration = this.getExplosionDecoration(newRange.start);
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