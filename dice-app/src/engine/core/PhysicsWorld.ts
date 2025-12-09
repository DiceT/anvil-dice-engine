import * as CANNON from 'cannon-es';
import * as THREE from 'three';

export class PhysicsWorld {
    private world: CANNON.World;
    private bodies: CANNON.Body[] = [];


    constructor() {
        this.world = new CANNON.World();
        this.world.gravity.set(0, -9.82 * 20, 0); // Scaled gravity for dice feel
        this.world.broadphase = new CANNON.NaiveBroadphase();
        (this.world.solver as any).iterations = 10;

        // Ground Plane Physics
        const groundBody = new CANNON.Body({
            mass: 0, // Static
            shape: new CANNON.Plane(),
        });
        groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
        this.world.addBody(groundBody);

        // Debug: Add a falling cube to test
        this.addDebugCube();
    }

    private addDebugCube() {
        const shape = new CANNON.Box(new CANNON.Vec3(2, 2, 2));
        const body = new CANNON.Body({
            mass: 1,
            shape: shape,
            position: new CANNON.Vec3(0, 20, 0)
        });

        // Initialize Body
        // (Debug cube removed)
        this.bodies.push(body);
        this.world.addBody(body);
    }

    public step(deltaTime: number) {
        this.world.step(1 / 60, deltaTime, 3);
    }

    public syncDebugMeshes(scene: THREE.Scene) {
        // Quick visual sync for the debug cube
        this.bodies.forEach(body => {
            const mesh = (body as any).mesh;
            if (mesh) {
                if (!mesh.parent) scene.add(mesh);
                mesh.position.copy(body.position as any);
                mesh.quaternion.copy(body.quaternion as any);
            }
        });
    }
    public addBody(body: CANNON.Body, mesh?: THREE.Mesh) {
        this.world.addBody(body);
        this.bodies.push(body);
        if (mesh) {
            (body as any).mesh = mesh;
        }
    }
}
