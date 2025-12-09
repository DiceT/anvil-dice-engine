import { useEffect, useRef, useState } from 'react';
import { EngineCore } from './engine/core/EngineCore';
import { DiceColors } from './engine/DiceColors';

function App() {
    const containerRef = useRef<HTMLDivElement>(null);
    const engineRef = useRef<EngineCore | null>(null);

    // State
    const [loadedTextures, setLoadedTextures] = useState<string[]>([]);
    const [rollNotation, setRollNotation] = useState("4d6");
    const [boundsWidth, setBoundsWidth] = useState(44);
    const [boundsDepth, setBoundsDepth] = useState(28);
    const [isAutoFit, setIsAutoFit] = useState(true);
    const [showDebug, setShowDebug] = useState(true);

    // Initialize Engine (Run once)
    useEffect(() => {
        if (!containerRef.current) return;

        const engine = new EngineCore(containerRef.current);
        engine.start();
        engineRef.current = engine;

        // Initialize Colors (Validation)
        new DiceColors((images) => {
            const names = Object.keys(images).filter(k => images[k].texture);
            setLoadedTextures(names);
        });

        return () => {
            engine.destroy();
        };
    }, []);

    // Handle Auto-Fit and Resize
    useEffect(() => {
        const checkAutoFit = () => {
            if (isAutoFit && engineRef.current) {
                const { width, depth } = engineRef.current.fitBoundsToScreen();
                setBoundsWidth(Math.round(width));
                setBoundsDepth(Math.round(depth));
            }
        };

        if (engineRef.current) checkAutoFit();

        const handleResize = () => {
            checkAutoFit();
        };
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, [isAutoFit]);

    // Handle Debug Visibility
    useEffect(() => {
        if (engineRef.current) {
            engineRef.current.setDebugVisibility(showDebug);
        }
    }, [showDebug]);

    const handleRoll = () => {
        if (engineRef.current) {
            engineRef.current.rollController.roll(rollNotation);
        }
    };

    const handleClear = () => {
        if (engineRef.current) {
            engineRef.current.rollController.clear();
        }
    };

    const handleUpdateBounds = () => {
        if (engineRef.current) {
            engineRef.current.updateBounds(boundsWidth, boundsDepth);
            setIsAutoFit(false); // Disable auto-fit if manual update
        }
    };

    const handleAutoFitToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
        setIsAutoFit(e.target.checked);
        // Effect will trigger auto update
    };

    return (
        <div
            ref={containerRef}
            style={{ width: '100%', height: '100%', position: 'relative' }}
        >
            <div style={{
                position: 'absolute',
                top: 20,
                left: 20,
                color: 'white',
                backgroundColor: 'rgba(0,0,0,0.6)',
                padding: '15px',
                borderRadius: '8px',
                fontFamily: 'sans-serif'
            }}>
                <h2 style={{ margin: '0 0 10px 0' }}>Step 04: Roll Controller</h2>

                <div style={{ marginBottom: '10px' }}>
                    <p>Loaded Textures: {loadedTextures.length > 0 ? "YES" : "Loading..."}</p>
                </div>

                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <input
                        type="text"
                        value={rollNotation}
                        onChange={(e) => setRollNotation(e.target.value)}
                        style={{ padding: '5px', borderRadius: '4px', border: 'none' }}
                    />
                    <button onClick={handleRoll} style={{ padding: '5px 10px', cursor: 'pointer' }}>
                        ROLL
                    </button>
                    <button onClick={handleClear} style={{ padding: '5px 10px', cursor: 'pointer' }}>
                        CLEAR
                    </button>
                </div>

                <div style={{ marginTop: '15px', borderTop: '1px solid #555', paddingTop: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '5px' }}>
                        <h4 style={{ margin: 0 }}>Bounds</h4>
                        <label style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                checked={isAutoFit}
                                onChange={handleAutoFitToggle}
                            />
                            Auto-Fit Canvas
                        </label>
                    </div>

                    <div style={{ display: 'flex', gap: '5px', alignItems: 'center', marginBottom: '5px' }}>
                        <label>W:</label>
                        <input
                            type="number"
                            value={boundsWidth}
                            onChange={(e) => setBoundsWidth(Number(e.target.value))}
                            disabled={isAutoFit}
                            style={{
                                width: '50px',
                                padding: '5px',
                                borderRadius: '4px',
                                border: 'none',
                                opacity: isAutoFit ? 0.5 : 1
                            }}
                        />
                        <label>D:</label>
                        <input
                            type="number"
                            value={boundsDepth}
                            onChange={(e) => setBoundsDepth(Number(e.target.value))}
                            disabled={isAutoFit}
                            style={{
                                width: '50px',
                                padding: '5px',
                                borderRadius: '4px',
                                border: 'none',
                                opacity: isAutoFit ? 0.5 : 1
                            }}
                        />
                    </div>
                    <button
                        onClick={handleUpdateBounds}
                        disabled={isAutoFit}
                        style={{
                            width: '100%',
                            padding: '5px',
                            cursor: isAutoFit ? 'default' : 'pointer',
                            opacity: isAutoFit ? 0.5 : 1
                        }}
                    >
                        UPDATE BOUNDS
                    </button>

                    <div style={{ marginTop: '10px' }}>
                        <label style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                checked={showDebug}
                                onChange={(e) => setShowDebug(e.target.checked)}
                            />
                            Show Debug Walls
                        </label>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default App;
