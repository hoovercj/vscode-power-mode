'use strict';
import * as vscode from 'vscode';
import { Plugin } from '../plugin';
import { ThemeConfig, getConfigValue } from '../config/config';

export type ExplosionOrder = 'random' | 'sequential' | number;
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

        const newConfig: ExplosionConfig = {
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
    private createExplosionDecorationType = (explosion: string, editorPosition: vscode.Position ): vscode.TextEditorDecorationType => {
        // subtract 1 ch to account for the character and divide by two to make it centered
        // Use Math.floor to skew to the right which especially helps when deleting chars
        const leftValue = Math.floor((this.config.explosionSize - 1) / 2);
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
            ['z-index']: 1,
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
            // https://tools.ietf.org/html/rfc2397
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
    private explode = (left = false) => {
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