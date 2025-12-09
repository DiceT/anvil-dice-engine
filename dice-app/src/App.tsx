import { useEffect, useRef, useState } from 'react';
import { EngineCore } from './engine/core/EngineCore';
import { DiceColors } from './engine/DiceColors';
import { DiceForge } from './engine/DiceForge';
import * as CANNON from 'cannon-es';

function App() {
    const containerRef = useRef<HTMLDivElement>(null);
    const engineRef = useRef<EngineCore | null>(null);
    const [loadedTextures, setLoadedTextures] = useState<string[]>([]);

    useEffect(() => {
        if (!containerRef.current) return;

        // Initialize Engine
        const engine = new EngineCore(containerRef.current);
        engine.start();
        engineRef.current = engine;

        // Initialize Colors (Step 02 Validation)
        new DiceColors((images) => {
            const names = Object.keys(images).filter(k => images[k].texture);
            setLoadedTextures(names);
        });

        // Spawn Dice Row (Step 03 Validation)
        const forge = new DiceForge();
        const types = ['d4', 'd6', 'd8', 'd10', 'd12', 'd20'];

        types.forEach((type, index) => {
            try {
                const mesh = forge.createdice(type);
                // Position them in a row
                mesh.position.set((index - 2.5) * 3, 5, 0);

                // Add to Scene
                engine.sceneManager.getScene().add(mesh);

                // Add to Physics 
                if ((mesh as any).body_shape) {
                    const body = new CANNON.Body({
                        mass: 1,
                        shape: (mesh as any).body_shape,
                        position: new CANNON.Vec3((index - 2.5) * 3, 5, 0)
                    });
                    // Random spin
                    body.angularVelocity.set(Math.random(), Math.random(), Math.random());

                    engine.physicsWorld.addBody(body, mesh);
                }

            } catch (e) {
                console.error(`Failed to spawn ${type}`, e);
            }
        });

        // Cleanup
        return () => {
            engine.destroy();
        };
    }, []);

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
                backgroundColor: 'rgba(0,0,0,0.5)',
                padding: '10px',
                pointerEvents: 'none'
            }}>
                <h2>Step 03: Geometry Validation</h2>
                <p>You should see a row of falling dice (d4, d6, d8, d10, d12, d20).</p>
                <p>Loaded Textures: {loadedTextures.length > 0 ? "YES" : "Loading..."}</p>
            </div>
        </div>
    );
}

export default App;
