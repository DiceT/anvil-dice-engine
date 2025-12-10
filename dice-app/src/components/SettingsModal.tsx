import React, { useState } from 'react';
import { useSettings } from '../store/SettingsContext';
import { DicePreview } from './DicePreview';
import type { SurfaceMaterial } from '../engine/types';


interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    textures: string[];
    // Bounds Props
    boundsWidth: number;
    setBoundsWidth: (w: number) => void;
    boundsDepth: number;
    setBoundsDepth: (d: number) => void;
    isAutoFit: boolean;
    setIsAutoFit: (auto: boolean) => void;
    onUpdateBounds: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
    isOpen, onClose, textures,
    boundsWidth, setBoundsWidth, boundsDepth, setBoundsDepth,
    isAutoFit, setIsAutoFit, onUpdateBounds
}) => {
    const { settings, updateTheme, updatePhysics, setSoundVolume, resetSettings } = useSettings();
    const [activeTab, setActiveTab] = useState<'appearance' | 'behavior'>('appearance');

    if (!isOpen) return null;

    // Helper for Surface Material Preset Logic
    const setSurface = (surface: SurfaceMaterial) => {
        updatePhysics({ surface });
    };

    return (
        <div style={{
            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
            backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
            <div style={{
                width: '800px', height: '600px', backgroundColor: '#222',
                borderRadius: '12px', border: '1px solid #444', display: 'flex', flexDirection: 'column',
                boxShadow: '0 10px 30px rgba(0,0,0,0.5)', color: '#eee', fontFamily: 'sans-serif'
            }}>
                {/* Header */}
                <div style={{
                    padding: '20px', borderBottom: '1px solid #333',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                    <h2 style={{ margin: 0 }}>Dice Settings</h2>
                    <button onClick={onClose} style={{
                        background: 'transparent', border: 'none', color: '#888', fontSize: '24px', cursor: 'pointer'
                    }}>×</button>
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', borderBottom: '1px solid #333' }}>
                    <button
                        onClick={() => setActiveTab('appearance')}
                        style={{
                            flex: 1, padding: '15px', background: activeTab === 'appearance' ? '#333' : 'transparent',
                            border: 'none', color: activeTab === 'appearance' ? 'white' : '#888', cursor: 'pointer', fontWeight: 'bold'
                        }}
                    >Appearance</button>
                    <button
                        onClick={() => setActiveTab('behavior')}
                        style={{
                            flex: 1, padding: '15px', background: activeTab === 'behavior' ? '#333' : 'transparent',
                            border: 'none', color: activeTab === 'behavior' ? 'white' : '#888', cursor: 'pointer', fontWeight: 'bold'
                        }}
                    >Behavior</button>
                </div>

                {/* Content */}
                <div style={{ flex: 1, padding: '30px', overflowY: 'auto', display: 'flex', gap: '30px' }}>

                    {activeTab === 'appearance' && (
                        <>
                            {/* Controls */}
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>

                                {/* Texture */}
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', color: '#aaa' }}>Texture</label>
                                    <select
                                        value={settings.theme.texture}
                                        onChange={(e) => updateTheme({ texture: e.target.value })}
                                        style={{ width: '100%', padding: '10px', background: '#333', border: '1px solid #555', color: 'white', borderRadius: '6px' }}
                                    >
                                        {textures.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>

                                {/* Material Type */}
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', color: '#aaa' }}>Material</label>
                                    <select
                                        value={settings.theme.material}
                                        onChange={(e) => updateTheme({ material: e.target.value as any })}
                                        style={{ width: '100%', padding: '10px', background: '#333', border: '1px solid #555', color: 'white', borderRadius: '6px' }}
                                    >
                                        <option value="plastic">Plastic</option>
                                        <option value="metal">Metal</option>
                                        <option value="wood">Wood</option>
                                        <option value="glass">Glass</option>
                                    </select>
                                </div>

                                {/* Font Selection */}
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', color: '#aaa' }}>Font</label>
                                    <select
                                        value={settings.theme.font}
                                        onChange={(e) => updateTheme({ font: e.target.value })}
                                        style={{ width: '100%', padding: '10px', background: '#333', border: '1px solid #555', color: 'white', borderRadius: '6px', fontFamily: settings.theme.font }}
                                    >
                                        <option value="Arial">Arial (Default)</option>
                                        <option value="Cinzel">Cinzel</option>
                                        <option value="Faculty Glyphic">Faculty Glyphic</option>
                                        <option value="IM Fell English SC">IM Fell English SC</option>
                                        <option value="Orbitron">Orbitron</option>
                                        <option value="Oxanium">Oxanium</option>
                                        <option value="Teko">Teko</option>
                                        <option value="Unica One">Unica One</option>
                                        <option value="Valkyrie">Valkyrie</option>
                                    </select>
                                </div>

                                {/* Colors */}
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ display: 'block', marginBottom: '8px', color: '#aaa', fontSize: '12px' }}>Dice Color</label>
                                        <input type="color" value={settings.theme.diceColor} onChange={(e) => updateTheme({ diceColor: e.target.value })} style={{ width: '100%', height: '40px', cursor: 'pointer' }} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ display: 'block', marginBottom: '8px', color: '#aaa', fontSize: '12px' }}>Label Color</label>
                                        <input type="color" value={settings.theme.labelColor} onChange={(e) => updateTheme({ labelColor: e.target.value })} style={{ width: '100%', height: '40px', cursor: 'pointer' }} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ display: 'block', marginBottom: '8px', color: '#aaa', fontSize: '12px' }}>Outline</label>
                                        <input type="color" value={settings.theme.outlineColor} onChange={(e) => updateTheme({ outlineColor: e.target.value })} style={{ width: '100%', height: '40px', cursor: 'pointer' }} />
                                    </div>
                                </div>

                                {/* Scale & Contrast */}
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ display: 'block', marginBottom: '8px', color: '#aaa' }}>Scale: {settings.theme.scale.toFixed(1)}x</label>
                                        <input
                                            type="range" min="0.6" max="1.5" step="0.1"
                                            value={settings.theme.scale}
                                            onChange={(e) => updateTheme({ scale: parseFloat(e.target.value) })}
                                            style={{ width: '100%' }}
                                        />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ display: 'block', marginBottom: '8px', color: '#aaa' }}>Contrast: {(settings.theme.textureContrast || 1.0).toFixed(1)}</label>
                                        <input
                                            type="range" min="0.5" max="2.0" step="0.1"
                                            value={settings.theme.textureContrast || 1.0}
                                            onChange={(e) => updateTheme({ textureContrast: parseFloat(e.target.value) })}
                                            style={{ width: '100%' }}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Preview */}
                            <div style={{ width: '300px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#111', borderRadius: '12px' }}>
                                <DicePreview />
                                <div style={{ marginTop: '10px', color: '#666', fontSize: '12px' }}>Live Preview (D20)</div>
                            </div>
                        </>
                    )}

                    {activeTab === 'behavior' && (
                        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '30px' }}>
                            {/* Surface Materials */}
                            <div>
                                <label style={{ display: 'block', marginBottom: '15px', color: '#aaa' }}>Surface Material (Friction & Bounce)</label>
                                <div style={{ display: 'flex', gap: '15px' }}>
                                    {(['felt', 'wood', 'rubber', 'glass'] as SurfaceMaterial[]).map(s => (
                                        <button
                                            key={s}
                                            onClick={() => setSurface(s)}
                                            style={{
                                                flex: 1, padding: '20px',
                                                background: settings.physics.surface === s ? '#4a90e2' : '#333',
                                                border: '1px solid #555', borderRadius: '8px', color: 'white',
                                                cursor: 'pointer', textTransform: 'capitalize', fontSize: '16px'
                                            }}
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Sliders */}
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', color: '#aaa' }}>Throw Force: {settings.physics.throwForce}</label>
                                <input
                                    type="range" min="20" max="80" step="5"
                                    value={settings.physics.throwForce}
                                    onChange={(e) => updatePhysics({ throwForce: parseInt(e.target.value) })}
                                    style={{ width: '100%' }}
                                />
                                <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>Higher force = faster, harder rolls.</div>
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', color: '#aaa' }}>Gravity: {settings.physics.gravity.toFixed(1)}</label>
                                <input
                                    type="range" min="5" max="20" step="0.1"
                                    value={settings.physics.gravity}
                                    onChange={(e) => updatePhysics({ gravity: parseFloat(e.target.value) })}
                                    style={{ width: '100%' }}
                                />
                                <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>Standard Earth gravity is 9.8.</div>
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', color: '#aaa' }}>Master Volume: {Math.round(settings.soundVolume * 100)}%</label>
                                <input
                                    type="range" min="0" max="1" step="0.05"
                                    value={settings.soundVolume}
                                    onChange={(e) => setSoundVolume(parseFloat(e.target.value))}
                                    style={{ width: '100%' }}
                                />
                                <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>Adjust sound effects volume (0 to mute).</div>
                            </div>

                            {/* BOUNDS Section (Moved from Overlay) */}
                            <div style={{ borderTop: '1px solid #444', paddingTop: '20px', marginTop: '10px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '15px' }}>
                                    <h3 style={{ margin: 0, fontSize: '16px', color: '#white' }}>Simulation Bounds</h3>
                                    <label style={{ fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#aaa' }}>
                                        <input
                                            type="checkbox"
                                            checked={isAutoFit}
                                            onChange={(e) => setIsAutoFit(e.target.checked)}
                                        />
                                        Auto-Fit to Screen
                                    </label>
                                </div>

                                <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                                    <div>
                                        <label style={{ marginRight: '10px', color: '#aaa' }}>Width:</label>
                                        <input
                                            type="number"
                                            value={boundsWidth}
                                            onChange={(e) => setBoundsWidth(Number(e.target.value))}
                                            disabled={isAutoFit}
                                            style={{ width: '60px', padding: '10px', borderRadius: '6px', background: '#333', border: '1px solid #555', color: 'white', opacity: isAutoFit ? 0.5 : 1 }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ marginRight: '10px', color: '#aaa' }}>Depth:</label>
                                        <input
                                            type="number"
                                            value={boundsDepth}
                                            onChange={(e) => setBoundsDepth(Number(e.target.value))}
                                            disabled={isAutoFit}
                                            style={{ width: '60px', padding: '10px', borderRadius: '6px', background: '#333', border: '1px solid #555', color: 'white', opacity: isAutoFit ? 0.5 : 1 }}
                                        />
                                    </div>
                                    <button
                                        onClick={onUpdateBounds}
                                        disabled={isAutoFit}
                                        style={{ padding: '10px 20px', background: '#555', border: 'none', color: 'white', borderRadius: '6px', cursor: isAutoFit ? 'default' : 'pointer', opacity: isAutoFit ? 0.5 : 1 }}
                                    >
                                        Update Bounds
                                    </button>
                                </div>
                                <div style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>
                                    Defines the invisible walls around the dice.
                                </div>
                            </div>

                        </div>
                    )}
                </div>

                {/* Footer */}
                <div style={{ padding: '20px', borderTop: '1px solid #333', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                    <button onClick={resetSettings} style={{ padding: '10px 20px', background: 'transparent', border: '1px solid #555', color: '#aaa', borderRadius: '6px', cursor: 'pointer' }}>Reset Defaults</button>
                    <button onClick={onClose} style={{ padding: '10px 30px', background: '#4a90e2', border: 'none', color: 'white', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Done</button>
                </div>
            </div>
        </div>
    );
};
