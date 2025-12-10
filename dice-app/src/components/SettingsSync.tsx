import React, { useEffect } from 'react';
import { useSettings } from '../store/SettingsContext';
import { EngineCore } from '../engine/core/EngineCore';

export const SettingsSync: React.FC<{ engine: EngineCore | null }> = ({ engine }) => {
    const { settings } = useSettings();
    useEffect(() => {
        if (engine) {
            engine.updateSettings(settings);
        }
    }, [engine, settings]);
    return null;
};
