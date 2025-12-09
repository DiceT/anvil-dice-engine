import type { SurfaceMaterial } from '../types';

export class AudioManager {
    private static instance: AudioManager;
    private audioContext: AudioContext;
    private buffers: Map<string, AudioBuffer> = new Map();
    private volume: number = 0.5;
    private enabled: boolean = false;
    private loaded: boolean = false;

    // Asset Manifest
    private assets = {
        dicehits: 15, // dicehit1.wav ... dicehit15.wav
        surfaces: {
            felt: 7, // surface_felt1.wav ...
            wood_tray: 7, // surface_wood_tray1.wav ...
            metal: 9, // surface_metal1.wav ...
        }
    };

    private constructor() {
        // Initialize AudioContext
        const AudioContext = (window.AudioContext || (window as any).webkitAudioContext);
        this.audioContext = new AudioContext();
        this.enabled = true;

        // Auto-resume on first interaction
        const unlock = () => {
            if (this.audioContext.state === 'suspended') {
                this.audioContext.resume().then(() => {
                    console.log('AudioManager: AudioContext resumed successfully.');
                    this.enabled = true; // Ensure enabled
                }).catch(e => console.error('AudioManager: Failed to resume AudioContext:', e));
            }
            window.removeEventListener('click', unlock, true);
            window.removeEventListener('touchstart', unlock, true);
            window.removeEventListener('keydown', unlock, true);
        };

        // Use capture phase to ensure we catch it before React or others preventDefault
        window.addEventListener('click', unlock, true);
        window.addEventListener('touchstart', unlock, true);
        window.addEventListener('keydown', unlock, true);

        this.loadAssets();
    }

    public static getInstance(): AudioManager {
        if (!AudioManager.instance) {
            AudioManager.instance = new AudioManager();
        }
        return AudioManager.instance;
    }

    public setVolume(vol: number) {
        this.volume = Math.max(0, Math.min(1, vol));
        // Also try to resume if volume is changed (user interaction implies they want sound)
        if (this.audioContext.state === 'suspended' && this.volume > 0) {
            this.audioContext.resume();
        }
    }

    private async loadAssets() {
        const loadBuffer = async (url: string, key: string) => {
            try {
                const response = await fetch(url);
                const arrayBuffer = await response.arrayBuffer();
                const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
                this.buffers.set(key, audioBuffer);
            } catch (e) {
                console.warn(`Failed to load sound: ${url}`, e);
            }
        };

        const promises: Promise<void>[] = [];

        // Load Dice Hits
        for (let i = 1; i <= this.assets.dicehits; i++) {
            promises.push(loadBuffer(`sounds/dicehit${i}.wav`, `dicehit${i}`));
        }

        // Load Surfaces
        // Felt
        for (let i = 1; i <= this.assets.surfaces.felt; i++) {
            promises.push(loadBuffer(`sounds/felt/surface_felt${i}.wav`, `felt${i}`));
        }
        // Wood (Tray)
        for (let i = 1; i <= this.assets.surfaces.wood_tray; i++) {
            promises.push(loadBuffer(`sounds/wood_tray/surface_wood_tray${i}.wav`, `wood${i}`));
        }
        // Metal
        for (let i = 1; i <= this.assets.surfaces.metal; i++) {
            promises.push(loadBuffer(`sounds/metal/surface_metal${i}.wav`, `metal${i}`));
        }

        await Promise.all(promises);
        this.loaded = true;
        console.log("AudioManager: All sounds loaded.");
    }

    public playDiceHit(velocity: number) {
        if (!this.enabled || !this.loaded || this.volume <= 0) return;

        // Volume based on impact velocity (scaled)
        // Assume velocity range roughly 0-50, but collisions usually lower relative speed
        const intensity = Math.min(1, Math.max(0.1, velocity / 20));

        // Pick random sound
        const index = Math.floor(Math.random() * this.assets.dicehits) + 1;
        this.playSound(`dicehit${index}`, intensity);
    }

    public playSurfaceHit(velocity: number, surface: SurfaceMaterial) {
        if (!this.enabled || !this.loaded || this.volume <= 0) return;

        const intensity = Math.min(1, Math.max(0.1, velocity / 30));

        let keyPrefix = 'felt';
        let count = this.assets.surfaces.felt;

        switch (surface) {
            case 'wood':
            case 'glass': // Glass sounds like hard surface (wood fallback for now)
                keyPrefix = 'wood';
                count = this.assets.surfaces.wood_tray;
                break;
            case 'felt':
            case 'rubber':
                keyPrefix = 'felt';
                count = this.assets.surfaces.felt;
                break;
            // Metal sounds are distinct, assuming we map something to it
            // For now, let's say if we add a 'metal' surface later, we use it.
            // But 'glass' could also be metal-ish? Let's stick to wood for glass as it's a tray.
        }

        // If specific override needed:
        if (surface === 'glass') {
            // Glass on wood tray -> Wood sound
            // Glass on glass tray -> Metal sound? 
            // Let's us metal for glass surface for "tink" sound
            keyPrefix = 'metal';
            count = this.assets.surfaces.metal;
        }

        const index = Math.floor(Math.random() * count) + 1;
        this.playSound(`${keyPrefix}${index}`, intensity);
    }

    private playSound(key: string, intensity: number) {
        if (!this.buffers.has(key)) {
            console.warn(`AudioManager: Sound buffer missing for key: ${key}`);
            return;
        }
        const buffer = this.buffers.get(key);
        if (!buffer) return;

        console.log(`AudioManager: Playing ${key} (Vol: ${this.volume}, Int: ${intensity.toFixed(2)})`);

        const source = this.audioContext.createBufferSource();
        source.buffer = buffer;

        const gainNode = this.audioContext.createGain();
        // Master Volume * Impact Intensity
        gainNode.gain.value = this.volume * intensity;

        // Slight pitch variation for realism
        source.playbackRate.value = 0.9 + Math.random() * 0.2;

        source.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        source.start(0);
    }
}
