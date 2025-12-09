# 02_Dice_Colors_And_Materials.md

## Goal
Implement the texture and material system (DiceColors), strictly using existing assets.

## Tasks
1. [ ] **Interfaces**: Create `src/engine/types.ts` for `TextureDefinition`, `ColorSet`, `ImageEntry`.
2. [ ] **DiceColors**: Create `src/engine/DiceColors.ts`.
   - **Singleton Pattern**: Implement the `waitingCallbacks` logic we perfected.
   - **TextureList**: Populate with *only* the verified `public/textures` (Ledger, Hammered, etc.).
   - **Loader**: Implement `ImageLoader` to fetch textures from absolute paths (`/textures/...`).
3. [ ] **Materials**: Implement `createMaterials` logic (from old engine, but clean TS).
   - Standard material generation (bump maps, shiny plastic vs metal).
   - Canvas-based face texture generation (for applying numbers/labels to faces).
4. [ ] **Validation**:
   - Load textures in `App.tsx` and log success.
   - Apply a generated material to a test cube to see "Ledger and Ink" texture.
