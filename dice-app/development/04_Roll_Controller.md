# 04_Roll_Controller.md

## Goal
Implement the logic to spawn dice, throw them (force/impulse), and track their state.

## Tasks
1. [ ] **RollController**: Create `src/engine/RollController.ts`.
   - `roll(notation)`: Parse "4d6" etc.
   - **Spawn Logic**: Calculate start positions (grid or random cloud above table).
   - **Throw Logic**: Apply `impulse` (force vector) and `angularVelocity` (spin) to Cannon bodies.
2. [ ] **Integration**: Connect Factory output (Meshes/Bodies) to Physics World via Controller.
3. [ ] **Validation**:
   - Call `roll("4d20")` and watch them explode out and bounce physically.
