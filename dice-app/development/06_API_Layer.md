# 06_API_Layer.md

## Goal
Expose a clean, simple API for the external app to use.

## Tasks
1. [x] **DiceEngine**: Create/Refine `src/engine/DiceEngine.ts` (The main entry point).
   - `initialize(container)`
   - `setTheme(colorset)`
   - `clear()`
   - `roll(notation)` -> Returns Promise<Result>
2. [x] **Events**: Implement a simple event emitter (onRollStart, onResult, onRollComplete).
3. [x] **Connect UI**: Update actual `src/App.tsx` and `DiceTray.tsx` to use this new API instead of any legacy code.
4. [x] **Validation**:
   - The React UI "Roll" buttons work perfectly.
   - Settings panel changes texture in real-time.
