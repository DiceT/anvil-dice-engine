# 03_Dice_Geometry_Factory.md

## Goal
Implement the procedural geometry generation for all standard polyhedral dice (d4-d20), recreating the `create_geometry` logic.

## Tasks
1. [ ] **DiceFactory**: Create `src/engine/DiceFactory.ts`.
2. [ ] **Math Helpers**: Port `chamfer_geom` and `make_geom` (essential for rounded corners).
3. [ ] **Geometry Functions**: Implement:
   - `create_d4_geometry`
   - `create_d6_geometry`
   - `create_d8_geometry`
   - `create_d10_geometry` (Trapezohedron logic)
   - `create_d12_geometry`
   - `create_d20_geometry`
4. [ ] **Mapping**: Ensure the Standard D20 face map (non-sequential) is used.
5. [ ] **Validation**:
   - Spawn one of each die type in a row in the scene.
   - Verify shapes and chamfers look correct.
