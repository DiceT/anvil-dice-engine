import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { DiceForge } from './DiceForge';
import { PhysicsWorld } from './core/PhysicsWorld';
import { DiceParser } from './DiceParser';
import type { DiceTheme, PhysicsSettings, RollResult } from './types';
import { DEFAULT_THEME, DEFAULT_PHYSICS } from './types';

interface ActiveDie {
    mesh: THREE.Mesh;
    body: CANNON.Body;
    stopped: boolean;
    result: string | number | null;
    groupId: number; // Index in ParseResult.groups
    type: string;    // 'd6', 'd100', 'd%_tens', 'd%_ones'
    rollId: number;  // Unique ID for this specific die spawn
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
    public onRollComplete: ((result: RollResult) => void) | null = null;

    private isRolling = false;
    private currentModifier = 0;
    private currentNotation = "";

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
        this.clear();
        this.isRolling = true;
        this.currentNotation = notation;

        const parsed = DiceParser.parse(notation);
        this.currentModifier = parsed.modifier;

        // Reset UI via callback (optional, or wait for finish)

        // Spawn Dice
        let dieKey = 0;
        parsed.groups.forEach((group, groupIndex) => {
            const count = Math.abs(group.count);

            for (let i = 0; i < count; i++) {
                if (group.type === 'd%') {
                    this.spawnDie('d100', dieKey++, groupIndex, 'd%_tens');
                    this.spawnDie('d10', dieKey++, groupIndex, 'd%_ones');
                } else if (group.type === 'd66') {
                    // d66 = d60 (Tens) + d6 (Ones)
                    this.spawnDie('d60', dieKey++, groupIndex, 'd66_tens');
                    this.spawnDie('d6', dieKey++, groupIndex, 'd66_ones');
                } else if (group.type === 'd88') {
                    // d88 = d80 (Tens) + d8 (Ones)
                    this.spawnDie('d80', dieKey++, groupIndex, 'd88_tens');
                    this.spawnDie('d8', dieKey++, groupIndex, 'd88_ones');
                } else {
                    this.spawnDie(group.type, dieKey++, groupIndex, group.type);
                }
            }
        });
    }

    public clear() {
        this.activeDice.forEach(die => {
            this.scene.remove(die.mesh);
            this.physicsWorld.removeBody(die.body);
        });
        this.activeDice = [];
        this.isRolling = false;
        this.currentModifier = 0;
        this.currentNotation = "";
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
            this.finishRoll();
        }
    }

    private finishRoll() {
        // Aggregate Results
        let total = 0;
        const breakdown: { type: string, value: number }[] = [];

        // Group dice by groupId to handle d%
        const groups = new Map<number, ActiveDie[]>();
        this.activeDice.forEach(d => {
            if (!groups.has(d.groupId)) groups.set(d.groupId, []);
            groups.get(d.groupId)!.push(d);
        });

        groups.forEach((dice, _) => {
            // Detect special types
            // Just check the first die's type to guess group intent?
            const firstType = dice[0]?.type || '';

            if (firstType.startsWith('d%')) {
                // Sort by ID to ensure pairs
                dice.sort((a, b) => a.rollId - b.rollId);

                for (let i = 0; i < dice.length; i += 2) {
                    const tenDie = dice[i];
                    const oneDie = dice[i + 1];

                    if (tenDie && oneDie) {
                        const tensStr = String(tenDie.result);
                        const onesStr = String(oneDie.result);
                        let tens = parseInt(tensStr.replace('00', '0'));
                        let ones = parseInt(onesStr);
                        if (isNaN(tens)) tens = 0;
                        if (isNaN(ones)) ones = 0;

                        let val = tens + ones;
                        // d%: 00 + 0 = 100
                        if (val === 0 && tensStr === '00' && onesStr === '0') val = 100;

                        total += val;
                        breakdown.push({ type: 'd%', value: val });
                    }
                }
            } else if (firstType.startsWith('d66')) {
                dice.sort((a, b) => a.rollId - b.rollId);
                for (let i = 0; i < dice.length; i += 2) {
                    const tenDie = dice[i];
                    const oneDie = dice[i + 1];
                    if (tenDie && oneDie) {
                        const tens = parseInt(String(tenDie.result)) || 10;
                        const ones = parseInt(String(oneDie.result)) || 1;
                        // d60 returns 10..60. Just add.
                        const val = tens + ones;
                        total += val;
                        breakdown.push({ type: 'd66', value: val });
                    }
                }
            } else if (firstType.startsWith('d88')) {
                dice.sort((a, b) => a.rollId - b.rollId);
                for (let i = 0; i < dice.length; i += 2) {
                    const tenDie = dice[i];
                    const oneDie = dice[i + 1];
                    if (tenDie && oneDie) {
                        const tens = parseInt(String(tenDie.result)) || 10;
                        const ones = parseInt(String(oneDie.result)) || 1;
                        const val = tens + ones;
                        total += val;
                        breakdown.push({ type: 'd88', value: val });
                    }
                }
            } else {
                // Standard
                dice.forEach(d => {
                    let valStr = String(d.result);
                    let val = parseInt(valStr);
                    if (d.type === 'd10' && valStr === '0') val = 10;
                    if (d.type === 'd100' && valStr === '00') val = 0;

                    if (!isNaN(val)) {
                        total += val;
                        breakdown.push({ type: d.type, value: val });
                    }
                });
            }
        });

        // Add Modifier
        total += this.currentModifier;

        const result: RollResult = {
            total: total,
            notation: this.currentNotation,
            breakdown: breakdown,
            modifier: this.currentModifier
        };

        if (this.onRollComplete) {
            this.onRollComplete(result);
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

    private spawnDie(type: string, rollId: number, groupId: number, subType: string) {
        try {
            // If d%_tens or d%_ones, we need physical mesh for d100/d10
            let meshType = type; // Default
            if (subType === 'd%_tens') meshType = 'd100'; // Tens Die
            if (subType === 'd%_ones') meshType = 'd10';  // Ones Die

            // Use Current Theme
            const mesh = this.diceForge.createdice(meshType, this.currentTheme);

            // ROLL FROM SIDE: Spawn at edge of CURRENT bounds
            const wallX = this.bounds.width / 2;
            const spawnX = wallX - 1;

            const safeZ = (this.bounds.depth / 2) - 3;
            const spread = safeZ > 0 ? safeZ * 2 : 2;

            const x = spawnX + (Math.random() - 0.5) * 1;
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
                result: null,
                groupId: groupId,
                type: subType, // 'd%_tens', 'd10', etc.
                rollId: rollId
            });

        } catch (e) {
            console.error(`Failed to spawn die: ${type}`, e);
        }
    }
}
