# Completed Steps

## [x] 01_Skeleton_Environment.md
- **Date**: 2025-12-08
- **Validation**: Verified by User (Blue cube falls).
- **Notes**: Recreated React shell. Fixed OrbitControls passive listener and React Double-Render issues.

## [x] 02_Dice_Colors_And_Materials.md
- **Date**: 2025-12-08
- **Validation**: Verified by User (Textures loaded and listed).
- **Notes**: Implemented robust Singleton DiceColors, fixed Vite import issues (DiceTypes).bitControls passive listener and React Double-Render issues.

## [x] 03_Dice_Numbering_And_Geometry.md
- **Date**: 2025-12-09
- **Validation**: Verified by User ("Everything looks perfect! ... numbers are spot on!").
- **Notes**: Corrected label maps for all dice (D20/D10 manually verified). Normalized geometry vertices to ensure consistent sizing (fixing D8/D10 scale). Fixed D10 texture warping. Removed debug artifacts.

## [x] 04_Roll_Controller.md
- **Date**: 2025-12-09
- **Validation**: Verified by User ("Much better... Perfect").
- **Notes**: Implemented `RollController` with side-roll physics (horizontal throw from edge, bounce). Refined environment with top-down camera, overhead lighting, transparent ground, and invisible physics walls. Fixed D6 numbering (no dot). Confirmed bounce with custom physics materials.

## [x] 04.5_Bounds_And_Autofit.md
- **Date**: 2025-12-09
- **Validation**: Verified by User ("It does feel better... consider it COMPLETED").
- **Notes**: Implemented "Auto-Fit Canvas" feature. System dynamically calculates visible frustum at table level and snaps physics walls to window edges. Added UI controls for manual/auto override and a "Show Debug Walls" visibility toggle.
 
## [x] 05_Result_Detection.md
- **Date**: 2025-12-09
- **Validation**: Verified by Browser Test (D6 result '2', D20 result '10' matched visuals).
- **Notes**: Implemented face normal storage in `DiceForge`. Added velocity tracking and Vector Math (Dot Product) in `RollController` to detect "Up" face. Added UI to display rolling status and final results.

## [x] 06_Settings_UI_And_Customization.md
- **Date**: 2025-12-09
- **Validation**: Verified by User/Browser ("Everything looks INCREDIBLE!").
- **Notes**: Implemented full Settings implementation with `SettingsProvider` (Context/Hooks) and localStorage persistence.
    - **Visuals**: Added Contrast Slider (Canvas Filter), Custom Fonts, and High-Fidelity Textures (Starmap, Metal, etc.).
    - **Refinement**: Boosted- [x] **Lighting & Shadows**
  - Directional Light with Soft Shadows
  - Ambient Light for base visibility
  - Hemisphere Light for sky/ground contrast
    - **Glass**: Implemented specialized `MeshPhysicalMaterial` for Glass with `transparent: true`, `opacity: 0.85`, and `DoubleSide` rendering.
    - **Physics**: Added Surface Material presets (Felt, Rubber, Glass) controlling friction/restitution.
    - **Preview**: Integrated live `DicePreview` component in naming modal.

## 05. Advanced Engine Features (Parsing & Physics)
- [x] **Dice Parsing System**
  - Implemented `DiceParser` class for `XdY + N` notation.
  - Added support for `d%` (Percentile: Tens + Ones).
  - Added support for `d66` (Tens D6 + Ones D6) and `d88` (Tens D8 + Ones D8).
  - Consistent Summation Logic for special dice (e.g., `30 + 5 = 35`).

- [x] **Physics & Logic Refinements**
  - **Coin (d2)**: Reduced thickness to prevent edge-standing.
  - **Visuals**: Added 6 new textures (Bone, Circuit, Glass, etc.).
  - **Font Scaling**: Reduced font size (40%) for `d100`, `d80`, `d60` to fit double digits.
  - **Debug**: Disabled debug borders by default.

- [x] **API Layer**
  - **DiceEngine Facade**: `initialize`, `roll`, `clear`, `setTheme`.
  - **Structured Results**: `RollResult` object (Total, Breakdown, Modifiers).
  - **Events**: `onRollComplete` event emission.
