import * as CANNON from 'cannon-es';
import type { SurfaceMaterial } from '../types';
import { AudioManager } from '../audio/AudioManager';

export class PhysicsWorld {
    private world: CANNON.World;
    private bodies: CANNON.Body[] = [];
    private walls: CANNON.Body[] = [];

    public readonly diceMaterial: CANNON.Material;
    private groundMaterial: CANNON.Material;
    private diceGroundContact: CANNON.ContactMaterial;
    private currentSurface: SurfaceMaterial = 'felt';

    constructor() {
        this.world = new CANNON.World();
        this.world.gravity.set(0, -9.82 * 20, 0); // Scaled gravity for dice feel
        this.world.broadphase = new CANNON.NaiveBroadphase();
        (this.world.solver as any).iterations = 10;

        // Materials
        this.diceMaterial = new CANNON.Material();
        this.groundMaterial = new CANNON.Material();

        this.diceGroundContact = new CANNON.ContactMaterial(this.diceMaterial, this.groundMaterial, {
            friction: 0.1,
            restitution: 0.5 // Bouncy
        });
        this.world.addContactMaterial(this.diceGroundContact);

        // Ground Plane Physics
        const groundBody = new CANNON.Body({
            mass: 0, // Static
            shape: new CANNON.Plane(),
            material: this.groundMaterial
        });
        groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
        this.world.addBody(groundBody);

        // Audio Listener
        groundBody.addEventListener('collide', this.handleGroundCollision);

        // Initial Walls (Default to Window Edge approx +/- 22 X, +/- 14 Z)
        this.updateBounds(44, 28);
    }

    // Audio Handlers
    private handleGroundCollision = (e: any) => {
        const relativeVelocity = e.contact.getImpactVelocityAlongNormal();
        if (Math.abs(relativeVelocity) > 0.5) {
            console.log(`PhysicsWorld: Ground Hit. Vel: ${relativeVelocity.toFixed(2)}`);
            AudioManager.getInstance().playSurfaceHit(Math.abs(relativeVelocity), this.currentSurface || 'felt');
        }
    };

    private handleDiceCollision = (e: any) => {
        const otherBody = e.body;
        if (otherBody.mass > 0) {
            const relativeVelocity = e.contact.getImpactVelocityAlongNormal();
            if (Math.abs(relativeVelocity) > 0.5) {
                console.log(`PhysicsWorld: Dice Hit. Vel: ${relativeVelocity.toFixed(2)}`);
                AudioManager.getInstance().playDiceHit(Math.abs(relativeVelocity));
            }
        }
    };

    public setGravity(g: number) {
        // We scale gravity by 20 to match our world scale
        this.world.gravity.set(0, -g * 20, 0);
    }

    public setSurface(surface: SurfaceMaterial) {
        this.currentSurface = surface;
        let friction = 0.3;
        let restitution = 0.3;

        switch (surface) {
            case 'felt': friction = 0.8; restitution = 0.1; break;
            case 'wood': friction = 0.5; restitution = 0.3; break;
            case 'rubber': friction = 0.9; restitution = 0.8; break;
            case 'glass': friction = 0.1; restitution = 0.5; break;
        }

        this.diceGroundContact.friction = friction;
        this.diceGroundContact.restitution = restitution;

        // Also update wall contact? For now walls utilize diceMaterial so they might need their own contact or just share.
        // Currently walls utilize diceMaterial (line 74), so dice hitting walls is dice-on-dice friction? 
        // No, we haven't defined dice-dice contact. Default is used.
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
        // Audio
        body.addEventListener('collide', this.handleGroundCollision);
    }

    public step(deltaTime: number) {
        this.world.step(1 / 60, deltaTime, 3);
    }

    public addBody(body: CANNON.Body) {
        this.world.addBody(body);
        this.bodies.push(body);
        body.addEventListener('collide', this.handleDiceCollision);
    }

    public removeBody(body: CANNON.Body) {
        body.removeEventListener('collide', this.handleDiceCollision);
        this.world.removeBody(body);
        const index = this.bodies.indexOf(body);
        if (index !== -1) {
            this.bodies.splice(index, 1);
        }
    }
}
