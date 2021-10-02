import { ThemeConfig } from './config';
import { alphabetGifMap } from './alphabet_map';

export const Ridiculous: ThemeConfig = {
   
    enableCursorExplosions: false,
    maxExplosions: 25,
    explosionSize: 10,
    explosionFrequency: 1,
    explosionOrder: 'sequential',
    gifMode: 'restart',
    explosionDuration: 1350, 
    explosionOffset: 0.5,
    backgroundMode: 'image',
    customExplosions: alphabetGifMap,
}