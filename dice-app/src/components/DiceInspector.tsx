import { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { DiceForge } from '../engine/DiceForge';
import { DEFAULT_THEME } from '../engine/types';

interface DiceInspectorProps {
    isOpen: boolean;
    onClose: () => void;
}

export function DiceInspector({ isOpen, onClose }: DiceInspectorProps) {
    const mountRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!isOpen || !mountRef.current) return;

        // 1. Setup Scene
        const scene = new THREE.Scene();
        scene.background = new THREE.Color('#222');

        const camera = new THREE.PerspectiveCamera(45, mountRef.current.clientWidth / mountRef.current.clientHeight, 0.1, 100);
        camera.position.set(0, 5, 10);
        camera.lookAt(0, 0, 0);

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        // No outputEncoding - match DicePreview.tsx exactly
        mountRef.current.appendChild(renderer.domElement);

        // 2. Lights (Restored to normal levels)
        const ambient = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambient);

        const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
        dirLight.position.set(5, 10, 5);
        dirLight.castShadow = true;
        scene.add(dirLight);

        const backLight = new THREE.DirectionalLight(0xffffff, 0.5);
        backLight.position.set(-5, 0, -5);
        scene.add(backLight);

        // 3. Controls
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;

        // 4. Dice
        const diceForge = new DiceForge();
        const diceTypes = ['d14', 'd16', 'd18'];
        const spacing = 3.5;
        const meshes: THREE.Mesh[] = [];

        diceTypes.forEach((type, index) => {
            try {
                const mesh = diceForge.createdice(type, DEFAULT_THEME);
                // Center them
                const x = (index - 1) * spacing;
                mesh.position.set(x, 0, 0);

                // Add labels above?

                scene.add(mesh);
                meshes.push(mesh);
            } catch (e) {
                console.error(`Failed to inspect ${type}`, e);
            }
        });

        // 5. Grid/Ground (Visual Helper)
        const gridHelper = new THREE.GridHelper(20, 20, 0x555555, 0x333333);
        gridHelper.position.y = -1.5; // Sit slightly below dice (radius ~1)
        scene.add(gridHelper);

        // 6. Animation Loop
        let frameId: number;
        const animate = () => {
            frameId = requestAnimationFrame(animate);
            controls.update();

            // Subtle rotation for presentation
            // meshes.forEach(m => {
            //     m.rotation.y += 0.005;
            // });

            renderer.render(scene, camera);
        };
        animate();

        // 7. Cleanup
        return () => {
            cancelAnimationFrame(frameId);
            if (mountRef.current) {
                mountRef.current.removeChild(renderer.domElement);
            }
            renderer.dispose();
            controls.dispose();
        };

    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.8)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
        }}>
            <div style={{
                width: '800px',
                height: '600px',
                background: '#1a1a1a',
                borderRadius: '8px',
                border: '1px solid #444',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column'
            }}>
                <div style={{
                    padding: '10px',
                    borderBottom: '1px solid #444',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: '#222',
                    borderTopLeftRadius: '8px',
                    borderTopRightRadius: '8px'
                }}>
                    <h3 style={{ margin: 0, color: 'white' }}>Dice Inspector: Trapezohedrons</h3>
                    <button
                        onClick={onClose}
                        style={{
                            background: '#d44', color: 'white', border: 'none',
                            borderRadius: '4px', padding: '5px 10px', cursor: 'pointer'
                        }}
                    >
                        Close
                    </button>
                </div>

                <div ref={mountRef} style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
                    <div style={{
                        position: 'absolute',
                        bottom: 10, left: 0, right: 0,
                        textAlign: 'center',
                        color: '#888',
                        pointerEvents: 'none'
                    }}>
                        Left: d14 | Center: d16 | Right: d18 <br />
                        <span style={{ fontSize: '12px' }}>Click & Drag to Rotate • Scroll to Zoom</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
