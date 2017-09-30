import { ThemeConfig } from './config';

// https://i.imgur.com/PB34u4G.gif
// Thanks to @darkvertex
const atomExplosion = "data:image/gif;base64,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";

export const Particles: ThemeConfig = {
    enableShake: true,
    enableExplosions: true,
    maxExplosions: 5,
    explosionSize: 15,
    explosionFrequency: 1,
    explosionOrder: 'random',
    gifMode: 'restart',
    explosionDuration: 400,
    explosionOffset: .25,
    backgroundMode: 'mask',
    customExplosions: [
        // atomExplosion,
        "https://i.imgur.com/MiQWTj5.gif", // a
        "https://i.imgur.com/3GKCOch.gif", // b
        "https://i.imgur.com/K8e0aqM.gif", // c
        "https://i.imgur.com/4RXiBAx.gif", // d
        "https://i.imgur.com/BvpfEgA.gif", // e
        "https://i.imgur.com/DaOTgug.gif", // f
        "https://i.imgur.com/Tuv8EsP.gif", // g
        "https://i.imgur.com/eM5CSno.gif", // h
        "https://i.imgur.com/2lsLIEY.gif", // i
        "https://i.imgur.com/dnxBYmA.gif"  // j
    ],
}