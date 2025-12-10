import * as THREE from 'three';
import { SceneManager } from './SceneManager';
import { PhysicsWorld } from './PhysicsWorld';
import { RollController } from '../RollController';
import { AudioManager } from '../audio/AudioManager';
import type { AppSettings } from '../types';

export class EngineCore {
    private renderer: THREE.WebGLRenderer;
    public readonly sceneManager: SceneManager;
    public readonly physicsWorld: PhysicsWorld;
    public readonly rollController: RollController;
    private animationId: number | null = null;
    private lastTime: number = 0;

    constructor(container: HTMLElement) {
        // Initialize Renderer
        this.renderer = new THREE.WebGLRenderer({
            alpha: true,
            antialias: true
        });
        this.renderer.setSize(container.clientWidth, container.clientHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        // Fix Color Space (r124 uses older naming)
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        container.appendChild(this.renderer.domElement);

        // Initialize Systems
        this.sceneManager = new SceneManager(this.renderer.domElement);
        this.physicsWorld = new PhysicsWorld();
        this.rollController = new RollController(this.physicsWorld, this.sceneManager.getScene());

        // Handle Resize
        window.addEventListener('resize', () => this.handleResize(container));
    }

    public start() {
        if (this.animationId) return;
        this.lastTime = performance.now();
        this.loop();
    }

    public stop() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    public updateBounds(width: number, depth: number) {
        this.physicsWorld.updateBounds(width, depth);
        this.sceneManager.updateDebugBounds(width, depth);
        this.rollController.setBounds(width, depth);
    }

    public fitBoundsToScreen() {
        // Get visible bounds from scene
        const { width, depth } = this.sceneManager.getVisibleBounds();

        // Apply slightly padded bounds so walls are just OFF SCREEN
        const padW = 0; // Exact fit
        const padD = 0;

        this.updateBounds(width + padW, depth + padD);
        return { width: width + padW, depth: depth + padD };
    }

    public setDebugVisibility(visible: boolean) {
        this.sceneManager.setDebugVisibility(visible);
    }

    public updateSettings(settings: AppSettings) {
        // Update Roll Controller (Visuals & Throw Force)
        this.rollController.updateTheme(settings.theme);
        this.rollController.updatePhysics(settings.physics);

        // Update Physics World (Gravity & Surface)
        this.physicsWorld.setGravity(settings.physics.gravity);
        this.physicsWorld.setSurface(settings.physics.surface);

        // Update Audio Volume
        AudioManager.getInstance().setVolume(settings.soundVolume);
    }

    public destroy() {
        this.stop();
        if (this.renderer.domElement.parentElement) {
            this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
        }
        // Optional: Dispose renderer resources if needed
    }

    private loop = () => {
        const time = performance.now();
        const deltaTime = (time - this.lastTime) / 1000;
        this.lastTime = time;

        // Step Physics
        this.physicsWorld.step(deltaTime);

        // Update Dice (Sync Physics -> Visuals)
        this.rollController.update();

        // Render
        this.renderer.render(this.sceneManager.getScene(), this.sceneManager.getCamera());

        this.animationId = requestAnimationFrame(this.loop);
    };

    private handleResize(container: HTMLElement) {
        const width = container.clientWidth;
        const height = container.clientHeight;
        this.renderer.setSize(width, height);
        this.sceneManager.updateCamera(width, height);
    }
}
