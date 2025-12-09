import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

export class SceneManager {
    private scene: THREE.Scene;
    private camera: THREE.PerspectiveCamera;
    private controls: OrbitControls;
    private ambientLight: THREE.AmbientLight;
    private directionalLight: THREE.DirectionalLight;

    constructor(domElement: HTMLElement) {
        this.scene = new THREE.Scene();

        // Setup Camera
        this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 1000);
        this.camera.position.set(0, 25, 0); // Closer zoom
        this.camera.lookAt(0, 0, 0);

        // Setup Controls
        this.controls = new OrbitControls(this.camera, domElement);
        this.controls.enableDamping = true;
        this.controls.enableRotate = false; // Locked top-down
        this.controls.enableZoom = false;   // Locked zoom
        this.controls.enablePan = false;    // Locked pan

        // Setup Lights
        this.ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
        this.scene.add(this.ambientLight);

        this.directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
        this.directionalLight.position.set(5, 50, 5); // Overhead light
        this.directionalLight.castShadow = true;
        this.directionalLight.shadow.mapSize.width = 2048;
        this.directionalLight.shadow.mapSize.height = 2048;
        this.scene.add(this.directionalLight);

        // Fill Light to brighten shadows
        const fillLight = new THREE.DirectionalLight(0xffffff, 0.5);
        fillLight.position.set(-5, 20, -5);
        this.scene.add(fillLight);

        // Setup Basic Tray (Floor + Walls)
        this.createTray();
    }

    private createTray() {
        // Floor - Transparent but receives shadows
        const floorGeo = new THREE.PlaneGeometry(100, 100);
        const floorMat = new THREE.ShadowMaterial({ opacity: 0.5 });
        const floor = new THREE.Mesh(floorGeo, floorMat);
        floor.rotation.x = -Math.PI / 2;
        floor.receiveShadow = true;
        this.scene.add(floor);

        // Debug Walls
        this.updateDebugBounds(44, 28);
    }

    private debugWalls: THREE.Mesh[] = [];

    public updateDebugBounds(width: number, depth: number) {
        // Remove old walls
        this.debugWalls.forEach(wall => {
            this.scene.remove(wall);
            if (wall.geometry) wall.geometry.dispose();
        });
        this.debugWalls = [];

        const material = new THREE.MeshBasicMaterial({ color: 0xff0000, opacity: 0.3, transparent: true });

        const halfWidth = width / 2;
        const halfDepth = depth / 2;
        const thickness = 10;
        const height = 20;

        const offsetX = halfWidth + (thickness / 2);
        const offsetZ = halfDepth + (thickness / 2);

        // Geometries
        const topBotWidth = width + (thickness * 2) + 20;
        const horizWallGeo = new THREE.BoxGeometry(topBotWidth, height, thickness);

        const sideLen = depth + (thickness * 2);
        const vertWallGeo = new THREE.BoxGeometry(thickness, height, sideLen);

        // Top (-Z)
        const topWall = new THREE.Mesh(horizWallGeo, material);
        topWall.position.set(0, 0, -offsetZ);
        topWall.visible = false; // Default Hidden
        this.scene.add(topWall);
        this.debugWalls.push(topWall);

        // Bottom (+Z)
        const botWall = new THREE.Mesh(horizWallGeo, material);
        botWall.position.set(0, 0, offsetZ);
        botWall.visible = false; // Default Hidden
        this.scene.add(botWall);
        this.debugWalls.push(botWall);

        // Left (-X)
        const leftWall = new THREE.Mesh(vertWallGeo, material);
        leftWall.position.set(-offsetX, 0, 0);
        leftWall.visible = false; // Default Hidden
        this.scene.add(leftWall);
        this.debugWalls.push(leftWall);

        // Right (+X)
        const rightWall = new THREE.Mesh(vertWallGeo, material);
        rightWall.position.set(offsetX, 0, 0);
        rightWall.visible = false; // Default Hidden
        this.scene.add(rightWall);
        this.debugWalls.push(rightWall);
    }

    public getVisibleBounds() {
        // Calculate visible area at Y=0 (Table surface)
        // Camera distance (Y=25)
        const distance = this.camera.position.y;

        // Vertical FOV in radians
        const vFOV = THREE.MathUtils.degToRad(this.camera.fov);

        // Visible height (Depth)
        const height = 2 * Math.tan(vFOV / 2) * distance;

        // Visible width (Width)
        const width = height * this.camera.aspect;

        return { width, depth: height };
    }

    public setDebugVisibility(visible: boolean) {
        this.debugWalls.forEach(wall => {
            wall.visible = visible;
        });
    }

    public getScene(): THREE.Scene {
        return this.scene;
    }

    public getCamera(): THREE.PerspectiveCamera {
        return this.camera;
    }

    public updateCamera(width: number, height: number) {
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
    }
}
