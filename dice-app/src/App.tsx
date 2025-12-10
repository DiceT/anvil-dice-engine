import { useRef, useEffect, useState } from 'react';
import { EngineCore } from './engine/core/EngineCore';
import { DiceColors, TEXTURELIST } from './engine/DiceColors';
import { SettingsProvider } from './store/SettingsContext';
import { SettingsModal } from './components/SettingsModal';
import type { RollResult } from './engine/types';

import { SettingsSync } from './components/SettingsSync';

// Main App Internal (Logic)
function InnerApp() {
    const containerRef = useRef<HTMLDivElement>(null);
    const engineRef = useRef<EngineCore | null>(null);

    // State
    const [rollNotation, setRollNotation] = useState("4d6");
    const [boundsWidth, setBoundsWidth] = useState(44);
    const [boundsDepth, setBoundsDepth] = useState(28);
    const [isAutoFit, setIsAutoFit] = useState(true);
    // Debug removed for now
    const [rollResult, setRollResult] = useState<RollResult | null>(null);
    const [isRolling, setIsRolling] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    // Settings UI State
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    // Initialize Engine (Run once)
    useEffect(() => {
        if (!containerRef.current) return;

        const engine = new EngineCore(containerRef.current);

        engine.rollController.onRollComplete = (result) => {
            setRollResult(result);
            setIsRolling(false);
        };

        engine.start();
        engineRef.current = engine;
        engine.setDebugVisibility(false);
        new DiceColors();

        return () => {
            engine.destroy();
        };
    }, []);

    // Mobile Check
    useEffect(() => {
        const checkMobile = () => {
            const mobile = window.matchMedia("(max-width: 768px)").matches;
            setIsMobile(mobile);
            if (engineRef.current) {
                engineRef.current.rollController.setSpawnOrigin(mobile ? 'bottom' : 'right');
                // Adjust bounds for mobile? Mobile usually needs narrower width, deeper depth?
                // Auto-fit handles screen size generally.
            }
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Effect for Auto-Fit
    useEffect(() => {
        const handleResize = () => {
            if (isAutoFit && engineRef.current) {
                const { width, depth } = engineRef.current.fitBoundsToScreen();
                setBoundsWidth(Math.floor(width));
                setBoundsDepth(Math.floor(depth));
            }
        };
        window.addEventListener('resize', handleResize);
        if (isAutoFit && engineRef.current) setTimeout(handleResize, 100);
        return () => window.removeEventListener('resize', handleResize);
    }, [isAutoFit]);

    // End AutoFit Effect logic if any trailing bits
    // Debug effect removed

    const handleRoll = () => {
        if (!rollNotation.trim()) return;

        if (engineRef.current) {
            setIsRolling(true);
            setRollResult(null);
            try {
                engineRef.current.rollController.roll(rollNotation);
            } catch (e) {
                console.error("Roll failed:", e);
                setIsRolling(false);
            }
        }
    };

    const handleClear = () => {
        if (engineRef.current) {
            engineRef.current.rollController.clear();
            setRollResult(null);
            setRollNotation("");
            setIsRolling(false);
        }
    };

    const handleUpdateBounds = () => {
        if (engineRef.current) {
            engineRef.current.updateBounds(boundsWidth, boundsDepth);
            setIsAutoFit(false);
        }
    };

    // Button Logic
    const addDice = (type: string) => {
        const str = rollNotation.trim();

        if (!str) {
            setRollNotation(`1${type}`);
            return;
        }

        // Check if we can increment the last die term (e.g. 1d6 -> 2d6)
        const escapedType = type.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`(\\d+)${escapedType}$`);
        const match = str.match(regex);

        if (match && match.index !== undefined) {
            const count = parseInt(match[1], 10);
            const prefix = str.substring(0, match.index);
            setRollNotation(`${prefix}${count + 1}${type}`);
            return;
        }

        // Smart append: if ends with operator, just append. Else append + 1d...
        if (str.match(/[+-]$/)) {
            setRollNotation(`${str} 1${type}`);
        } else {
            setRollNotation(`${str} + 1${type}`);
        }
    };

    const addMod = (val: number) => {
        const str = rollNotation.trim();
        // Check if ends in number
        const match = str.match(/([+-])\s*(\d+)$/);
        if (match) {
            // Increment existing modifier
            const sign = match[1] === '-' ? -1 : 1;
            const num = parseInt(match[2]);
            const total = (sign * num) + val;

            // Replace suffix
            const prefix = str.substring(0, match.index);
            const newSign = total >= 0 ? '+' : '-';
            setRollNotation(`${prefix}${newSign} ${Math.abs(total)}`);
        } else {
            // Append new modifier
            const sign = val >= 0 ? '+' : '-';
            setRollNotation(`${str} ${sign} ${Math.abs(val)}`);
        }
    };

    const addSuffix = (suffix: string) => {
        setRollNotation(prev => prev.trim() + suffix);
    };

    const textureKeys = Object.keys(TEXTURELIST);

    // Button Styles
    const btnStyle = {
        background: '#444', color: '#fff', border: '1px solid #555',
        borderRadius: '4px', cursor: 'pointer', padding: '8px',
        fontWeight: 'bold', fontSize: '14px', flex: 1
    };

    return (
        <div
            ref={containerRef}
            style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}
        >
            <SettingsSync engine={engineRef.current} />

            <SettingsModal
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                textures={textureKeys}
                boundsWidth={boundsWidth} setBoundsWidth={setBoundsWidth}
                boundsDepth={boundsDepth} setBoundsDepth={setBoundsDepth}
                isAutoFit={isAutoFit} setIsAutoFit={setIsAutoFit}
                onUpdateBounds={handleUpdateBounds}
            />

            {/* UI OVERLAY - Dice Pool Maker */}
            <div style={{
                position: 'absolute',
                top: isMobile ? 'auto' : 20,
                bottom: isMobile ? 20 : 'auto',
                left: isMobile ? '50%' : 20,
                transform: isMobile ? 'translateX(-50%)' : 'none',
                width: isMobile ? '90%' : '320px',
                color: 'white',
                backgroundColor: 'rgba(0,0,0,0.7)',
                backdropFilter: 'blur(5px)',
                padding: '15px',
                borderRadius: '12px',
                fontFamily: 'sans-serif',
                zIndex: 10,
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                boxShadow: '0 4px 15px rgba(0,0,0,0.5)'
            }}>
                {/* Row 1: Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ margin: 0, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>🎲</span> Anvil Dice
                    </h2>
                    <button
                        onClick={() => setIsSettingsOpen(true)}
                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '20px', padding: '4px' }}
                        title="Settings"
                    >
                        ⚙️
                    </button>
                </div>

                {/* Row 2: Input + Roll */}
                <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                        type="text"
                        value={rollNotation}
                        onChange={(e) => setRollNotation(e.target.value)}
                        placeholder="e.g. 4d6"
                        style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #555', background: '#222', color: 'white', fontSize: '16px' }}
                    />
                    <button
                        onClick={handleRoll}
                        disabled={isRolling}
                        style={{ ...btnStyle, background: isRolling ? '#555' : '#4a90e2', border: 'none', flex: 0.4 }}
                    >
                        {isRolling ? '...' : 'ROLL'}
                    </button>
                </div>

                {/* Row 3: Result + Clear */}
                <div style={{ display: 'flex', gap: '8px', alignItems: 'stretch' }}>
                    <div style={{ flex: 1, background: 'rgba(0,0,0,0.3)', borderRadius: '4px', padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ color: '#aaa', fontSize: '12px' }}>RESULT</span>
                        <span style={{ color: '#ffd700', fontSize: '20px', fontWeight: 'bold' }}>
                            {rollResult ? rollResult.total : '-'}
                        </span>
                    </div>
                    <button onClick={handleClear} style={{ ...btnStyle, background: '#333', flex: 0.3, fontSize: '12px' }}>
                        CLEAR
                    </button>
                </div>

                {/* Breakdown (Mini) */}
                {rollResult && (
                    <div style={{ fontSize: '12px', color: '#888', display: 'flex', flexWrap: 'wrap', gap: '4px', maxHeight: '60px', overflowY: 'auto' }}>
                        {rollResult.breakdown.map((b, i) => (
                            <span key={i} style={{
                                background: b.dropped ? '#422' : '#333',
                                color: b.dropped ? '#888' : '#eee',
                                textDecoration: b.dropped ? 'line-through' : 'none',
                                padding: '2px 5px', borderRadius: '3px'
                            }}>
                                {b.value}
                            </span>
                        ))}
                        {rollResult.modifier !== 0 && (
                            <span style={{ background: '#334', padding: '2px 5px', borderRadius: '3px', color: '#aaf' }}>
                                {rollResult.modifier > 0 ? '+' : ''}{rollResult.modifier}
                            </span>
                        )}
                    </div>
                )}

                {/* Row 4: Basic Dice */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '5px' }}>
                    {['d4', 'd6', 'd8', 'd10', 'd12', 'd20'].map(d => (
                        <button key={d} onClick={() => addDice(d)} style={btnStyle}>{d}</button>
                    ))}
                </div>

                {/* Row 5: Advanced Dice */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '5px' }}>
                    <button onClick={() => addDice('d2')} style={btnStyle}>d2</button>
                    <button onClick={() => addDice('d%')} style={btnStyle}>d%</button>
                    <button onClick={() => addDice('d66')} style={btnStyle}>d66</button>
                    <button onClick={() => addDice('d88')} style={btnStyle}>d88</button>
                </div>

                {/* Row 6: Modifiers */}
                <div style={{ display: 'flex', gap: '5px' }}>
                    <button onClick={() => addMod(1)} style={{ ...btnStyle, background: '#3a5' }}>+</button>
                    <button onClick={() => addSuffix('kh')} style={btnStyle} title="Keep Highest">ADV</button>
                    <button onClick={() => addSuffix('kl')} style={btnStyle} title="Keep Lowest">DIS</button>
                    <button onClick={() => addMod(-1)} style={{ ...btnStyle, background: '#d44' }}>-</button>
                </div>

            </div>
        </div>
    );
}

export default function App() {
    return (
        <SettingsProvider>
            <InnerApp />
        </SettingsProvider>
    );
}
