export type MaterialType = 'plastic' | 'metal' | 'wood' | 'glass';
export type SurfaceMaterial = 'felt' | 'wood' | 'rubber' | 'glass';

export interface DiceTheme {
    diceColor: string;      // Hex body color
    labelColor: string;     // Hex number color
    outlineColor: string;   // Hex outline color
    texture: string;        // Texture key name (e.g. 'ledgerandink')
    material: MaterialType; // Physics/Visual material type
    font: string;           // Font family (e.g. 'Arial')
    scale: number;          // 0.6 to 1.5
    textureContrast: number; // 0.5 to 2.0
}

export interface PhysicsSettings {
    throwForce: number;     // 30 - 60
    gravity: number;        // ~9.8
    surface: SurfaceMaterial; // Presets for friction/restitution
    soundVolume: number;    // 0 - 1
    spinForce: number;      // 0 - 20
    wallRestitution: number; // 0 - 1
    groundFriction: number; // 0 - 1
}

export interface AppSettings {
    theme: DiceTheme;
    physics: PhysicsSettings;
    soundVolume: number; // 0.0 - 1.0
}

export const DEFAULT_THEME: DiceTheme = {
    diceColor: '#dddddd',
    labelColor: '#000000',
    outlineColor: '#000000',
    texture: 'ledgerandink',
    material: 'plastic',
    font: 'Arial',
    scale: 1.0,
    textureContrast: 1.0
};

export const DEFAULT_PHYSICS: PhysicsSettings = {
    throwForce: 60,
    gravity: 9.81,
    surface: 'felt',
    soundVolume: 0.5,
    spinForce: 15,
    wallRestitution: 0.5,
    groundFriction: 0.5
};

export interface RollResult {
    total: number;
    notation: string;
    breakdown: {
        type: string;
        value: number;
        dropped?: boolean;
    }[];
    modifier: number;
}

export const DEFAULT_SETTINGS: AppSettings = {
    theme: DEFAULT_THEME,
    physics: DEFAULT_PHYSICS,
    soundVolume: 0.5
};
