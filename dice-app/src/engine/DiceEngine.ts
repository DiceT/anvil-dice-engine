import { EngineCore } from './core/EngineCore';
import type { DiceTheme, RollResult } from './types';
import { DiceColors } from './DiceColors';

export type RollEventHandler = (result: RollResult) => void;

export class DiceEngine {
    private engineCore: EngineCore | null = null;
    private container: HTMLElement | null = null;
    private listeners: { [key: string]: Function[] } = {};

    constructor() {
        // Pre-load colors/textures if needed, or wait for initialize
        new DiceColors();
    }

    /**
     * Initialize the 3D Engine into the given container.
     */
    public initialize(container: HTMLElement) {
        if (this.engineCore) {
            console.warn('DiceEngine already initialized.');
            return;
        }
        this.container = container;
        this.engineCore = new EngineCore(container);

        // Hook internal events
        this.engineCore.rollController.onRollComplete = (results) => {
            this.emit('rollComplete', results);
            if (this._pendingRollResolve) {
                this._pendingRollResolve(results);
                this._pendingRollResolve = null;
            }
        };

        this.engineCore.start();
        console.log('DiceEngine initialized.');
    }

    /**
     * Roll dice based on notation (e.g., "2d20", "4d6").
     * Returns a Promise that resolves with the results when the roll settles.
     */
    private _pendingRollResolve: ((results: RollResult) => void) | null = null;

    public async roll(notation: string): Promise<RollResult> {
        if (!this.engineCore) throw new Error("Engine not initialized");

        return new Promise((resolve) => {
            // Cancel previous pending if any?
            if (this._pendingRollResolve) {
                this._pendingRollResolve({ total: 0, notation: 'Cancelled', breakdown: [], modifier: 0 });
            }
            this._pendingRollResolve = resolve;

            this.emit('rollStart', notation);
            this.engineCore!.rollController.roll(notation);
        });
    }

    /**
     * Clear all dice from the table.
     */
    public clear() {
        if (this.engineCore) {
            this.engineCore.rollController.clear();
        }
    }

    /**
     * Update the visual theme of the dice.
     */
    public setTheme(theme: Partial<DiceTheme>) {
        if (this.engineCore) {
            // We need the full settings object structure for EngineCore currently,
            // or we update just the theme part.
            // EngineCore.updateSettings takes AppSettings.
            // This is a bit of a mismatch. We should expose updateTheme on EngineCore or access rollController directly.

            // For now, let's access rollController directly as EngineCore exposes it.
            // But we need to merge with existing defaults if partial.
            // Actually EngineCore.updateSettings re-sets everything.

            // Let's rely on the App passing full settings for now, 
            // OR we implement a specific method in EngineCore.

            // Allow direct access for granular updates:
            // This requires the current full theme state.
            // The Engine doesn't store state, the App does. 
            // So this method might be state-less (just applies to current dice).

            // Ideally the App manages state. Use `updateTheme` to push changes.
            // For this API, we assume the caller tracks state.
            this.engineCore.rollController.updateTheme(theme as DiceTheme); // Cast for now, controller handles it?
        }
    }

    public resize() {
        if (this.engineCore && this.container) {
            // EngineCore has a loop but maybe not explicit resize public method exposed well?
            // it adds a window listener.
            // If container changes size without window resize, we need manual trigger.
            // EngineCore.handleResize is private.
            // We should expose it if needed.
        }
    }

    public destroy() {
        if (this.engineCore) {
            this.engineCore.destroy();
            this.engineCore = null;
        }
    }

    // --- Event Emitter ---
    public on(event: 'rollStart' | 'rollComplete', fn: Function) {
        if (!this.listeners[event]) this.listeners[event] = [];
        this.listeners[event].push(fn);
    }

    public off(event: 'rollStart' | 'rollComplete', fn: Function) {
        if (!this.listeners[event]) return;
        this.listeners[event] = this.listeners[event].filter(f => f !== fn);
    }

    private emit(event: string, data: any) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(fn => fn(data));
        }
    }
}

// Export a singleton instance for simplicity
export const diceEngine = new DiceEngine();
