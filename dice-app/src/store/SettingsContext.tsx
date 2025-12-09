import React, { createContext, useContext, useState, useEffect } from 'react';
import type { AppSettings, DiceTheme, PhysicsSettings } from '../engine/types';
import { DEFAULT_THEME, DEFAULT_PHYSICS } from '../engine/types';

interface SettingsContextType {
    settings: AppSettings;
    updateTheme: (updates: Partial<DiceTheme>) => void;
    updatePhysics: (updates: Partial<PhysicsSettings>) => void;
    resetSettings: () => void;
}

const SettingsContext = createContext<SettingsContextType | null>(null);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Determine initial state (eventually from localStorage)
    const [settings, setSettings] = useState<AppSettings>(() => {
        const saved = localStorage.getItem('anvil_dice_settings');
        return saved ? JSON.parse(saved) : { theme: DEFAULT_THEME, physics: DEFAULT_PHYSICS };
    });

    // Save on Change
    useEffect(() => {
        localStorage.setItem('anvil_dice_settings', JSON.stringify(settings));
    }, [settings]);

    const updateTheme = (updates: Partial<DiceTheme>) => {
        setSettings(prev => ({
            ...prev,
            theme: { ...prev.theme, ...updates }
        }));
    };

    const updatePhysics = (updates: Partial<PhysicsSettings>) => {
        setSettings(prev => ({
            ...prev,
            physics: { ...prev.physics, ...updates }
        }));
    };

    const resetSettings = () => {
        setSettings({ theme: DEFAULT_THEME, physics: DEFAULT_PHYSICS });
    };

    return (
        <SettingsContext.Provider value={{ settings, updateTheme, updatePhysics, resetSettings }}>
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (!context) throw new Error("useSettings must be used within SettingsProvider");
    return context;
};
