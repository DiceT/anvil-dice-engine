import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { DiceForge } from '../engine/DiceForge';
import { useSettings } from '../store/SettingsContext';

export const DicePreview: React.FC = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const { settings } = useSettings();
    const sceneRef = useRef<THREE.Scene | null>(null);
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const meshRef = useRef<THREE.Mesh | null>(null);
    const diceForgeRef = useRef<DiceForge | null>(null);

    // Initialize Scene
    useEffect(() => {
        if (!containerRef.current) return;

        // Scene
        const scene = new THREE.Scene();
        sceneRef.current = scene;

        // Camera
        const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
        camera.position.set(0, 1.5, 2.5); // Zoomed in 2x (was 0, 3, 5)
        camera.lookAt(0, 0, 0);
        cameraRef.current = camera;

        // Renderer
        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        renderer.setSize(200, 200); // Fixed size for preview
        renderer.setPixelRatio(window.devicePixelRatio);
        containerRef.current.appendChild(renderer.domElement);
        rendererRef.current = renderer;

        // Lights
        const ambient = new THREE.AmbientLight(0xffffff, 0.7);
        scene.add(ambient);
        const dir = new THREE.DirectionalLight(0xffffff, 1.2);
        dir.position.set(5, 10, 5);
        scene.add(dir);

        const fill = new THREE.DirectionalLight(0xffffff, 0.5);
        fill.position.set(-5, 5, -5);
        scene.add(fill);

        // DiceForge
        diceForgeRef.current = new DiceForge();

        // Animation Loop
        let frameId: number;
        const animate = () => {
            if (meshRef.current) {
                meshRef.current.rotation.y += 0.01;
                meshRef.current.rotation.x += 0.005;
            }
            renderer.render(scene, camera);
            frameId = requestAnimationFrame(animate);
        };
        animate();

        return () => {
            cancelAnimationFrame(frameId);
            if (renderer.domElement.parentNode) {
                renderer.domElement.parentNode.removeChild(renderer.domElement);
            }
            renderer.dispose();
        };
    }, []);

    // Update Mesh on Settings Change
    useEffect(() => {
        if (!sceneRef.current || !diceForgeRef.current) return;

        // Remove old mesh
        if (meshRef.current) {
            sceneRef.current.remove(meshRef.current);
            // Dispose geometry/materials to prevent leaks
            if (meshRef.current.geometry) meshRef.current.geometry.dispose();
            if (Array.isArray(meshRef.current.material)) {
                meshRef.current.material.forEach(m => m.dispose());
            } else {
                meshRef.current.material.dispose();
            }
        }

        try {
            // Create new mesh with current theme
            // Using D20 as the showcase die
            const mesh = diceForgeRef.current.createdice('d20', settings.theme);
            sceneRef.current.add(mesh);
            meshRef.current = mesh;
        } catch (e) {
            console.error("Failed to generate preview dice", e);
        }

    }, [settings.theme]); // Re-run when theme changes

    return <div ref={containerRef} style={{ width: '200px', height: '200px', margin: '0 auto' }} />;
};
