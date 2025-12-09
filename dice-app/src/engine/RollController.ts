import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { DiceForge } from './DiceForge';
import { PhysicsWorld } from './core/PhysicsWorld';

interface ActiveDie {
    mesh: THREE.Mesh;
    body: CANNON.Body;
}

export class RollController {
    private diceForge: DiceForge;
    private physicsWorld: PhysicsWorld;
    private scene: THREE.Scene;

    private activeDice: ActiveDie[] = [];
    private bounds = { width: 44, depth: 28 };

    constructor(physicsWorld: PhysicsWorld, scene: THREE.Scene) {
        this.physicsWorld = physicsWorld;
        this.scene = scene;
        this.diceForge = new DiceForge();
    }

    public setBounds(width: number, depth: number) {
        this.bounds = { width, depth };
    }

    public roll(notation: string) {
        // Simple parsing for "NdX" (e.g., "4d6", "1d20")
        const match = notation.toLowerCase().match(/^(\d+)d(\d+)$/);
        if (!match) {
            console.error("Invalid notation. Use format 'NdX' (e.g. 4d6)");
            return;
        }

        const count = parseInt(match[1], 10);
        const sides = parseInt(match[2], 10);
        const type = `d${sides}`;

        for (let i = 0; i < count; i++) {
            this.spawnDie(type, i, count);
        }
    }

    public clear() {
        this.activeDice.forEach(die => {
            this.scene.remove(die.mesh);
            this.physicsWorld.removeBody(die.body);

            // Optional: Dispose geometry/material if not cached/shared cleanly
            // For now, we rely on DiceForge caching reusing geometry
        });
        this.activeDice = [];
    }

    public update() {
        // Sync Physics to Visuals
        this.activeDice.forEach(die => {
            die.mesh.position.copy(die.body.position as any);
            die.mesh.quaternion.copy(die.body.quaternion as any);
        });
    }

    private spawnDie(type: string, _index: number, _total: number) {
        try {
            const mesh = this.diceForge.createdice(type);

            // Random start position
            // ROLL FROM SIDE: Spawn at edge of CURRENT bounds
            const wallX = this.bounds.width / 2;
            const spawnX = wallX - 1;

            const safeZ = (this.bounds.depth / 2) - 3;
            const spread = safeZ > 0 ? safeZ * 2 : 2;

            const x = spawnX + (Math.random() - 0.5) * 1;
            const y = 2 + Math.random() * 1;            // Very Low
            const z = (Math.random() - 0.5) * spread;   // Along the edge

            mesh.position.set(x, y, z);
            mesh.castShadow = true;

            // Physics Body
            let bodyShape: CANNON.Shape | null = null;
            if ((mesh as any).body_shape) {
                bodyShape = (mesh as any).body_shape;
            } else {
                // Fallback
                console.warn(`No body_shape found for ${type}, using box fallback`);
                bodyShape = new CANNON.Box(new CANNON.Vec3(1, 1, 1));
            }

            const body = new CANNON.Body({
                mass: 1,
                shape: bodyShape!,
                position: new CANNON.Vec3(x, y, z),
                material: this.physicsWorld.diceMaterial
            });

            // Random Rotation
            body.quaternion.setFromEuler(
                Math.random() * Math.PI * 2,
                Math.random() * Math.PI * 2,
                Math.random() * Math.PI * 2
            );

            // Add Force/Spin (The "Side Roll")
            // Throw hard LEFT (-x) across the table
            // AC: Increased force by ~20% (30 -> 36)
            const throwStrength = 36 + Math.random() * 5;

            const velocity = new CANNON.Vec3(
                -throwStrength,                       // Hard LEFT
                0,                                    // Flat
                (Math.random() - 0.5) * 2             // Mild drift
            );

            body.velocity.copy(velocity);

            body.angularVelocity.set(
                (Math.random() - 0.5) * 20, // Spin
                (Math.random() - 0.5) * 20,
                (Math.random() - 0.5) * 20
            );

            // Register
            this.scene.add(mesh);
            this.physicsWorld.addBody(body);

            this.activeDice.push({ mesh, body });

        } catch (e) {
            console.error(`Failed to spawn die: ${type}`, e);
        }
    }
}
