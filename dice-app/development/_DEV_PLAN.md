# Anvil & Loom – 3D Dice Engine Spec (Architect Version)

## 1. Primary Goal

Build a self-contained 3D dice engine that:
- Generates all dice models in code (no external mesh files required).
- Uses a physics library for realistic rolling and collision.
- Supports sound on impacts.
- Exposes a clean API for “roll dice, get results.”
- We will review the older 3D dice engine to reuse proven logic patterns.

- The Anvil Dice Engine will be a self-contained engine that can be used in any project.
- It will manage all dice rolls and results.
- It will provide a clean API for “roll dice, get results.”
- You send it a dice expression, it will roll the dice physically, await for the dice to settle, and return the results as an object with each die's value as well as a total.
- We will accommodate special dice rolls like d100, challenge dice, exploding dice, d66, d88, and step down dice. But the first priority is to get the polyhedral dice working.

No UI framework assumptions (React, etc.). Just a core engine that can be wrapped later.

---

## 2. Tech Choices

**Rendering:**
- Engine: `three.js`
- Requirements:
  - Scene, camera, lights, and tray geometry.
  - Support for materials, textures, normal maps, and shadows.

**Physics:**
- Engine: `cannon-es`
- Requirements:
  - Rigid bodies for dice, table, and walls.
  - Basic world setup (gravity, solver, timesteps).
  - Collision events (for sound).
  - Sleep / rest detection.

**Audio:**
- Library: `howler.js` (or abstract over Web Audio so we can swap later).
- Requirements:
  - Multiple sound variants for collisions.
  - Volume and pitch scaling based on collision intensity.

---

## 3. High-Level Modules

1. **EngineCore**
   - Initializes Three + Cannon.
   - Owns the render / update loop.
   - Exposes lifecycle control (start, stop, resize).

2. **SceneManager**
   - Creates and manages:
     - Camera and controls (basic orbit).
     - Lights (ambient + directional, optional spotlight).
     - Table and tray (floor + 4 walls).
   - Responsible for attaching dice meshes to the scene.

3. **PhysicsManager**
   - Wraps Cannon world.
   - Responsible for:
     - Creating bodies for dice and static geometry.
     - Updating physics each frame (fixed timestep).
     - Syncing physics bodies → Three meshes.
     - Emitting events for:
       - `bodySleeping`
       - `collision` (for audio)
       - `worldStep`

4. **DiceFactory**
   - Creates dice **geometry + mesh + physics body** for:
     - d4, d6, d8, d10, d12, d20 (and d100 as a second d10).
   - Dice are generated parametrically:
     - No external 3D assets.
     - Consistent scale and mass across types.
   - Each die instance includes:
     - ID
     - Three mesh reference
     - Physics body reference
     - Face data (index → value mapping, face normals).

5. **DiceMaterials**
   - Central place for creating materials and textures.
   - Provides a small set of presets:
     - Plastic, bone, stone, metal.
   - Each preset defines:
     - Base color / texture.
     - Normal/bump maps.
     - Roughness / metalness.
   - No runtime material editor in this phase; just presets.

6. **RollController**
   - Responsible for:
     - Spawning dice into the scene.
     - Determining initial position and orientation (randomized within bounds).
     - Applying initial linear impulses and angular velocities.
   - Supports “roll styles”:
     - Gentle, Normal, Savage.
   - Provides a single main method:
     - `rollDice(rollConfig)` where `rollConfig` includes:
       - Number and types of dice.
       - Optional roll style.
       - Optional seed or deterministic overrides.

7. **ResultDetector**
   - Listens for dice going to “sleep” (via PhysicsManager).
   - For each die at rest:
     - Inspects its transform.
     - Determines the “top” face using face normals.
   - Handles edge cases:
     - If a die is not clearly resting (too tilted), retries for a short period or snaps to nearest face if within a tolerance.
   - Emits events:
     - `dieResult(dieId, value)`
     - `rollComplete(resultSummary)` once all dice have settled or a timeout is reached.

8. **AudioManager**
   - Subscribes to physics collision events.
   - Differentiates:
     - Die vs table.
     - Die vs wall.
     - Die vs die.
   - Chooses a sound variant and adjusts:
     - Volume based on impact velocity.
     - Optional pitch variation to avoid repetition.
   - Exposes:
     - Master volume.
     - Mute/unmute.

9. **SettingsStore**
   - Central configuration object with runtime tweakables:
     - Gravity vector.
     - Dice scale.
     - Tray size and wall height.
     - Roll strength and spin ranges.
     - Physics iterations / step size.
     - Shadow quality.
     - Audio volume and toggles.
   - No UI required yet; just an in-memory or JSON-driven config.

10. **Public API Layer**
    - Clean interface the rest of the app will use:
      - `initialize(containerElement, options)`
      - `roll(expressionOrConfig)`
      - `clearDice()`
      - `on(eventName, handler)`
      - `destroy()`
    - Events:
      - `rollStart`
      - `dieResult`
      - `rollComplete`
      - `error`

---

## 4. Dice Generation Details

**General Requirements:**
- All dice are generated in code.
- Each die type has:
  - A function to generate the geometry.
  - Well-defined orientation where a known face is “up” (to make result mapping deterministic).
- UV mapping:
  - Each face gets consistent UVs so number glyphs / textures can be applied correctly.
- Face metadata:
  - For each face:
    - Index
    - Normal (in local space)
    - Value

**Specific Dice Types:**
- d4: Tetrahedron-like solid with 4 faces, result determined by vertex or bottom/side rule (we need to decide and stay consistent).
- d6: Standard cube.
- d8, d12, d20: Platonic solids with known vertex/face layouts.
- d10 / d100:
  - Ten-sided pentagonal trapezohedron.
  - Values arranged in standard dice fashion (opposites sum to 9 or 11 depending on convention).

---

## 5. Roll & Result Life Cycle

1. **Roll Requested**
   - API receives a roll request (e.g., “4d6” or a structured config).
   - Any existing dice may be cleared if we enforce one-roll-at-a-time (v1) or left in place (v2).

2. **Dice Creation & Placement**
   - DiceFactory creates required dice.
   - RollController sets:
     - Initial positions above the tray within a defined spawn zone.
     - Initial random rotations.

3. **Force Application**
   - RollController applies:
     - A randomized linear impulse.
     - A randomized angular velocity.
   - Roll style determines magnitude ranges.

4. **Simulation Phase**
   - PhysicsManager runs the world step.
   - EngineCore syncs mesh transforms.
   - AudioManager reacts to collisions.

5. **Rest Detection**
   - ResultDetector tracks each die’s velocity and angular velocity.
   - When both are below thresholds for a defined duration:
     - The die is considered “at rest.”

6. **Result Determination**
   - For each resting die:
     - Transform each face normal from local to world space.
     - Select the face whose normal is most aligned with world +Y.
     - Map face index → numeric value.
   - Emit `dieResult` for each.

7. **Roll Completion**
   - When all dice are at rest OR a max roll duration expires:
     - Emit `rollComplete` with:
       - Individual results.
       - Sum(s) or other derived stats (if we decide to include that here).

---

## 6. Integration with Existing (Older) Dice Engine

We will use the old engine as a logic reference, not a dependency.

Architect should:
1. Identify:
   - How the old engine:
     - Maps faces to numbers.
     - Decides when dice are “done.”
     - Handles weird edge cases (dice resting on edges).
2. Replicate:
   - Any proven heuristics for result stabilization.
   - Any roll duration minimums or timeouts.
3. Avoid:
   - Copying UI or framework assumptions.
   - Copying engine-specific hacks that are tied to a different physics/rendering stack.

If needed, Architect can expose a debug mode that:
- Draws face normals.
- Logs distribution statistics over many rolls for fairness testing.

---

## 7. Phase Plan (for Implementation)

**Phase 1: Skeleton**
- EngineCore, SceneManager, PhysicsManager.
- Single d6 generated in code.
- Drop it on the table with gravity only.

**Phase 2: Full Dice Set & Results**
- All dice types implemented.
- RollController + ResultDetector wired.
- Basic API and event system.

**Phase 3: Audio & Polish**
- AudioManager wired to collisions.
- Material presets and lighting tuned.
- SettingsStore for runtime tweaking.

**Phase 4: Validation**
- Debug overlays.
- Automated roll distribution tests.
- Comparison against older engine behavior.

---

This spec should give Architect enough clarity to design the internal structure, define module boundaries, and plan the implementation order *without* writing any code yet.
