# 05_Result_Detection.md

## Goal
Determine which face is "up" when dice stop moving and return results.

## Tasks
1. [ ] **ResultDetector**: Create `src/engine/ResultDetector.ts`.
   - Monitor velocity of all active dice.
   - **Stable State**: When velocity < threshold for N frames = Stopped.
2. [ ] **Face Resolution**:
   - Raycast or Vector Dot Product method (Compare Face Normals vs World Up Vector).
   - Get the Index of the top face.
3. [ ] **Value Mapping**:
   - Use `DiceFactory` data to map Face Index -> Numeric Value / Label.
4. [ ] **Validation**:
   - Roll a d6. Wait for stop. Console log "Rolled a 6" (verify visually).
