import { ThemeConfig } from './config';
import { verticalRift } from './rift';
import { alphabetGifMap } from './alphabet_map';

export const Ridiculous: ThemeConfig = {
   
    enableRidiculous: true,
    enableShake: false,
    enableExplosions: true,
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