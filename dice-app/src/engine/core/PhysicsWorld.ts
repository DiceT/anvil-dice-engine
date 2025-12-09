import * as CANNON from 'cannon-es';


export class PhysicsWorld {
    private world: CANNON.World;
    private bodies: CANNON.Body[] = [];
    private walls: CANNON.Body[] = [];


    public readonly diceMaterial: CANNON.Material;
    private groundMaterial: CANNON.Material;

    constructor() {
        this.world = new CANNON.World();
        this.world.gravity.set(0, -9.82 * 20, 0); // Scaled gravity for dice feel
        this.world.broadphase = new CANNON.NaiveBroadphase();
        (this.world.solver as any).iterations = 10;

        // Materials
        this.diceMaterial = new CANNON.Material();
        this.groundMaterial = new CANNON.Material();

        const diceGroundContact = new CANNON.ContactMaterial(this.diceMaterial, this.groundMaterial, {
            friction: 0.1,
            restitution: 0.5 // Bouncy
        });
        this.world.addContactMaterial(diceGroundContact);

        // Ground Plane Physics
        const groundBody = new CANNON.Body({
            mass: 0, // Static
            shape: new CANNON.Plane(),
            material: this.groundMaterial
        });
        groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
        this.world.addBody(groundBody);

        // Initial Walls (Default to Window Edge approx +/- 22 X, +/- 14 Z)
        this.updateBounds(44, 28);
    }

    public updateBounds(width: number, depth: number) {
        // Remove old walls
        this.walls.forEach(wall => this.world.removeBody(wall));
        this.walls = [];

        const halfWidth = width / 2;
        const halfDepth = depth / 2;
        const thickness = 10;
        const height = 20;

        const offsetX = halfWidth + (thickness / 2);
        const offsetZ = halfDepth + (thickness / 2);

        // Top/Bottom (Span X)
        const topBotWidth = width + (thickness * 2) + 20;

        this.addWall(new CANNON.Vec3(0, 0, -offsetZ), new CANNON.Vec3(0, 0, 0), new CANNON.Vec3(topBotWidth, height, thickness)); // Top
        this.addWall(new CANNON.Vec3(0, 0, offsetZ), new CANNON.Vec3(0, 0, 0), new CANNON.Vec3(topBotWidth, height, thickness));  // Bottom

        // Left/Right (Span Z)
        const sideLen = depth + (thickness * 2);

        this.addWall(new CANNON.Vec3(-offsetX, 0, 0), new CANNON.Vec3(0, Math.PI / 2, 0), new CANNON.Vec3(sideLen, height, thickness)); // Left
        this.addWall(new CANNON.Vec3(offsetX, 0, 0), new CANNON.Vec3(0, Math.PI / 2, 0), new CANNON.Vec3(sideLen, height, thickness));  // Right
    }

    private addWall(position: CANNON.Vec3, rotation: CANNON.Vec3, size: CANNON.Vec3) {
        const shape = new CANNON.Box(new CANNON.Vec3(size.x / 2, size.y / 2, size.z / 2));
        const body = new CANNON.Body({
            mass: 0, // Static
            shape: shape,
            position: position,
            material: this.diceMaterial // Use same material for bounce
        });
        body.quaternion.setFromEuler(rotation.x, rotation.y, rotation.z);
        this.world.addBody(body);
        this.walls.push(body);
    }

    public step(deltaTime: number) {
        this.world.step(1 / 60, deltaTime, 3);
    }

    public addBody(body: CANNON.Body) {
        this.world.addBody(body);
        this.bodies.push(body);
    }

    public removeBody(body: CANNON.Body) {
        this.world.removeBody(body);
        const index = this.bodies.indexOf(body);
        if (index !== -1) {
            this.bodies.splice(index, 1);
        }
    }
}
