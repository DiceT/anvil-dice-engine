# 07_Audio_And_Collision.md

## Goal
Implement impact sounds using simple physics collision events.

## Tasks
1. [ ] **AudioManager**: Create `src/engine/AudioManager.ts`.
   - Setup `Howler.js` (or similar web audio).
   - Load sound samples (clatter, thud) from `public/sounds` (we will need to verify if these exist or use placeholders).
2. [ ] **Collision Events**:
   - In `PhysicsWorld.ts`, subscribe to Cannon's `beginContact` or `collide` events.
   - Detect impact velocity.
3. [ ] **Wiring**:
   - `World` -> `Event` -> `AudioManager.play(volume)`.
   - Scale volume by impact force (so soft landing = quiet, hard throw = loud).
4. [ ] **Validation**:
   - Throw dice.
   - Hear clicks/clatters when they hit the floor or each other.
