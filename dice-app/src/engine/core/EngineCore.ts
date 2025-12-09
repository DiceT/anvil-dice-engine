import * as THREE from 'three';
import { SceneManager } from './SceneManager';
import { PhysicsWorld } from './PhysicsWorld';

export class EngineCore {
    private renderer: THREE.WebGLRenderer;
    private sceneManager: SceneManager;
    private physicsWorld: PhysicsWorld;
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
        container.appendChild(this.renderer.domElement);

        // Initialize Systems
        this.sceneManager = new SceneManager(this.renderer.domElement);
        this.physicsWorld = new PhysicsWorld();

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

        // Sync Physics to Visuals (Validation Step)
        // In real app, DiceManager will handle this syncing
        this.physicsWorld.syncDebugMeshes(this.sceneManager.getScene());

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
