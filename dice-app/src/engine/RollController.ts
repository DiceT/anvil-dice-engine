import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { DiceForge } from './DiceForge';
import { PhysicsWorld } from './core/PhysicsWorld';
import type { DiceTheme, PhysicsSettings } from './types';
import { DEFAULT_THEME, DEFAULT_PHYSICS } from './types';

interface ActiveDie {
    mesh: THREE.Mesh;
    body: CANNON.Body;
    stopped: boolean;
    result: string | number | null;
}

export class RollController {
    private diceForge: DiceForge;
    private physicsWorld: PhysicsWorld;
    private scene: THREE.Scene;

    private activeDice: ActiveDie[] = [];
    private bounds = { width: 44, depth: 28 };

    // Settings
    private currentTheme: DiceTheme = DEFAULT_THEME;
    private currentPhysics: PhysicsSettings = DEFAULT_PHYSICS;

    // Callback for results
    public onRollComplete: ((results: any[]) => void) | null = null;

    private isRolling = false;

    constructor(physicsWorld: PhysicsWorld, scene: THREE.Scene) {
        this.physicsWorld = physicsWorld;
        this.scene = scene;
        this.diceForge = new DiceForge();
    }

    public updateTheme(theme: DiceTheme) {
        this.currentTheme = theme;
    }

    public updatePhysics(physics: PhysicsSettings) {
        this.currentPhysics = physics;
    }

    public setBounds(width: number, depth: number) {
        this.bounds = { width, depth };
    }

    public roll(notation: string) {
        // Clear old dice first (Optionally? Or just add?)
        // Usually reroll clears old ones.
        this.clear();
        this.isRolling = true;
        if (this.onRollComplete) this.onRollComplete([]); // Reset UI

        // Simple parsing for "NdX" (e.g., "4d6", "1d20")
        const cleanNotation = notation.trim().toLowerCase();
        const match = cleanNotation.match(/^(\d+)d(\d+)$/);

        if (!match) {
            console.error(`Invalid notation '${notation}'. Use format 'NdX' (e.g. 4d6)`);
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
        });
        this.activeDice = [];
        this.isRolling = false;
        if (this.onRollComplete) this.onRollComplete([]);
    }

    public update() {
        if (!this.isRolling || this.activeDice.length === 0) return;

        let allStopped = true;

        // Sync Physics to Visuals & Check Stability
        this.activeDice.forEach(die => {
            die.mesh.position.copy(die.body.position as any);
            die.mesh.quaternion.copy(die.body.quaternion as any);

            if (!die.stopped) {
                // Check velocity
                const v = die.body.velocity.lengthSquared();
                const w = die.body.angularVelocity.lengthSquared();

                // Thresholds: Very low movement
                if (v < 0.01 && w < 0.01) {
                    die.stopped = true;
                    // Calculate Result immediately when one stops
                    die.result = this.getDieValue(die);
                    console.log(`Die stopped. Result: ${die.result}`);
                } else {
                    allStopped = false;
                }
            }
        });

        if (allStopped && this.isRolling) {
            this.isRolling = false;
            console.log("All dice stopped.");
            if (this.onRollComplete) {
                const results = this.activeDice.map(d => d.result);
                this.onRollComplete(results);
            }
        }
    }

    private getDieValue(die: ActiveDie): string | number {
        const mesh = die.mesh;
        const faceValues = mesh.userData.faceValues;

        if (!faceValues || faceValues.length === 0) return '?';

        // 1. Get World Up Vector (0, 1, 0)
        // 2. Transform into Local Space of the Die
        const worldUp = new THREE.Vector3(0, 1, 0);

        // Inverse Quaternion of the die
        const quaternion = mesh.quaternion.clone().invert();

        // Apply inverse rotation to World Up -> Local Up
        const localUp = worldUp.applyQuaternion(quaternion);

        // 3. Check for D4 (values are arrays)
        const isD4 = Array.isArray(faceValues[0].value);

        if (isD4) {
            // For D4, look for the face pointing DOWN (opposite to up)
            const localDown = localUp.clone().negate();

            let closestFace = null;
            let maxDot = -Infinity;

            for (const fv of faceValues) {
                const dot = localDown.dot(fv.normal);
                if (dot > maxDot) {
                    maxDot = dot;
                    closestFace = fv;
                }
            }

            if (!closestFace) return '?';

            const present = closestFace.value as string[];
            const all = ['1', '2', '3', '4'];
            const result = all.find(n => !present.includes(n));
            return result || '?';

        } else {
            // Standard Dice (Face pointing UP)
            let closestFace = null;
            let maxDot = -Infinity;

            for (const fv of faceValues) {
                const dot = localUp.dot(fv.normal);
                if (dot > maxDot) {
                    maxDot = dot;
                    closestFace = fv;
                }
            }

            return closestFace ? closestFace.value : '?';
        }
    }



    // ... getDieValue ...

    private spawnDie(type: string, _index: number, _total: number) {
        try {
            // Use Current Theme
            const mesh = this.diceForge.createdice(type, this.currentTheme);

            // ... (setup code stays same) ...
            // Wait, I need to verify I'm not overwriting too much.
            // The bounds logic is fine.

            // ROLL FROM SIDE: Spawn at edge of CURRENT bounds
            const wallX = this.bounds.width / 2;
            const spawnX = wallX - 1;

            const safeZ = (this.bounds.depth / 2) - 3;
            const spread = safeZ > 0 ? safeZ * 2 : 2;

            const x = spawnX + (Math.random() - 0.5) * 1;
            // Spawn higher for "drop" feel if desired, but 2-3 is fine
            const y = 2 + Math.random() * 1;
            const z = (Math.random() - 0.5) * spread;

            mesh.position.set(x, y, z);
            mesh.castShadow = true;

            // Physics Body
            let bodyShape: CANNON.Shape | null = null;
            if ((mesh as any).body_shape) {
                bodyShape = (mesh as any).body_shape;
            } else {
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

            // Add Force/Spin from Settings
            const baseForce = this.currentPhysics.throwForce || 40;
            const throwStrength = baseForce + Math.random() * 5;

            // Velocity towards center (negative X)
            const velocity = new CANNON.Vec3(-throwStrength, 0, (Math.random() - 0.5) * 2);

            body.velocity.copy(velocity);
            body.angularVelocity.set((Math.random() - 0.5) * 20, (Math.random() - 0.5) * 20, (Math.random() - 0.5) * 20);

            // Register
            this.scene.add(mesh);
            this.physicsWorld.addBody(body);

            this.activeDice.push({
                mesh,
                body,
                stopped: false,
                result: null
            });

        } catch (e) {
            console.error(`Failed to spawn die: ${type}`, e);
        }
    }
}
