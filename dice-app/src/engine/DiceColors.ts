import type { ImageEntry, TextureDefinition } from './DiceTypes';

// Explicit list of textures available in public/textures/
export const TEXTURELIST: { [key: string]: TextureDefinition } = {
    'none': { name: 'none', composite: 'source-over' },
    'bonepith': { name: 'Bone Pith', composite: 'multiply', source: 'textures/bonepith.png', bump: 'textures/bonepith-bump.png', material: 'wood' },
    'circuittrace': { name: 'Circuit Trace', composite: 'multiply', source: 'textures/circuittrace.png', bump: 'textures/circuittrace-bump.png', material: 'plastic' },
    'crackedobsidian': { name: 'Cracked Obsidian', composite: 'multiply', source: 'textures/crackedobsidian.png', bump: 'textures/crackedobsidian-bump.png', material: 'glass' },
    'dualcoreswirl': { name: 'Dual Core Swirl', composite: 'multiply', source: 'textures/dualcoreswirl.png', bump: 'textures/dualcoreswirl-bump.png', material: 'plastic' },
    'forgescored': { name: 'Forge Scored', composite: 'multiply', source: 'textures/forgescored.png', bump: 'textures/forgescored-bump.png', material: 'metal' },
    'fracturedglass': { name: 'Fractured Glass', composite: 'multiply', source: 'textures/fracturedglass.png', bump: 'textures/fracturedglass-bump.png', material: 'glass' },
    'graveyard': { name: 'Graveyard', composite: 'source-over', source: 'textures/graveyard.png', bump: 'textures/graveyard-bump.png', material: 'stone' },
    'hammeredsteel': { name: 'Hammered Steel', composite: 'multiply', source: 'textures/hammeredsteel.png', bump: 'textures/hammeredsteel-bump.png', material: 'metal' },
    'ledgerandink': { name: 'Ledger and Ink', composite: 'multiply', source: 'textures/ledgerandink.png', bump: 'textures/ledgerandink-bump.png', material: 'wood' },
    'runicbranding': { name: 'Runic Branding', composite: 'multiply', source: 'textures/runicbranding.png', bump: 'textures/runicbranding-bump.png', material: 'stone' },
    'sinewstrands': { name: 'Sinew Strands', composite: 'multiply', source: 'textures/sinewstrands.png', bump: 'textures/sinewstrands-bump.png', material: 'plastic' },
    'slagscarred': { name: 'Slag Scarred', composite: 'multiply', source: 'textures/slagscarred.png', bump: 'textures/slagscarred-bump.png', material: 'metal' },
    'smokynebula': { name: 'Smoky Nebula', composite: 'multiply', source: 'textures/smokynebula.png', bump: 'textures/smokynebula-bump.png', material: 'plastic' },
    'starmap': { name: 'Starmap', composite: 'multiply', source: 'textures/starmap.png', bump: 'textures/starmap-bump.png', material: 'plastic' },
    'swirl': { name: 'Swirl', composite: 'multiply', source: 'textures/swirl.png', bump: 'textures/swirl-bump.png', material: 'plastic' },
    'tapestry': { name: 'Tapestry', composite: 'multiply', source: 'textures/tapestry.png', bump: 'textures/tapestry-bump.png', material: 'cloth' },
    'treering': { name: 'Tree Ring', composite: 'multiply', source: 'textures/treering.png', bump: 'textures/treering-bump.png', material: 'wood' },
    'wovenlinen': { name: 'Woven Linen', composite: 'multiply', source: 'textures/wovenlinen.png', bump: 'textures/wovenlinen-bump.png', material: 'cloth' },
    'thearchitect': { name: 'The Architect', composite: 'multiply', source: 'textures/thearchitect.png', bump: 'textures/thearchitect-bump.png', material: 'metal' },
    'eldritchvein': { name: 'Eldritch Vein', composite: 'multiply', source: 'textures/eldritchvein.png', bump: 'textures/eldritchvein-bump.png', material: 'metal' },
};

// Global cache to persist loaded images across engine restarts
const globalImageCache: Record<string, ImageEntry> = {};
let imageLoadingState: 'idle' | 'loading' | 'complete' = 'idle';
const waitingCallbacks: Array<(images: Record<string, ImageEntry>) => void> = [];

export class DiceColors {

    constructor(callback?: (images: Record<string, ImageEntry>) => void) {
        if (callback) {
            if (imageLoadingState === 'complete') {
                callback(globalImageCache);
            } else {
                waitingCallbacks.push(callback);
            }
        }

        if (imageLoadingState === 'idle') {
            new ImageLoader().loadImages();
        }
    }

    public getImage(name: string): ImageEntry | undefined {
        return globalImageCache[name];
    }
}

class ImageLoader {
    loadImages() {
        if (imageLoadingState !== 'idle') return;
        imageLoadingState = 'loading';

        let loadedCount = 0;
        let totalToLoad = 0;

        // Calculate total items to load
        for (const k in TEXTURELIST) {
            if (TEXTURELIST[k].source) totalToLoad++;
            if (TEXTURELIST[k].bump) totalToLoad++;
        }

        if (totalToLoad === 0) {
            this.finish();
            return;
        }

        const checkDone = () => {
            loadedCount++;
            if (loadedCount >= totalToLoad) {
                this.finish();
            }
        };

        for (const key in TEXTURELIST) {
            globalImageCache[key] = {};
            const entry = TEXTURELIST[key];

            if (entry.source) {
                const img = new Image();
                img.onload = checkDone;
                img.onerror = () => { console.warn('Texture load failed:', entry.source); checkDone(); };
                img.src = entry.source;
                globalImageCache[key].texture = img;
            }

            if (entry.bump) {
                const img = new Image();
                img.onload = checkDone;
                img.onerror = () => { console.warn('Bump load failed:', entry.bump); checkDone(); };
                img.src = entry.bump;
                globalImageCache[key].bump = img;
            }
        }
    }

    private finish() {
        imageLoadingState = 'complete';
        waitingCallbacks.forEach(cb => cb(globalImageCache));
        waitingCallbacks.length = 0;
        console.log('DiceColors: All images loaded.');
    }
}
