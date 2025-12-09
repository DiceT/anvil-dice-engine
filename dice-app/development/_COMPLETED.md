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

## [x] 05_Bounds_And_Autofit.md
- **Date**: 2025-12-09
- **Validation**: Verified by User ("It does feel better... consider it COMPLETED").
- **Notes**: Implemented "Auto-Fit Canvas" feature. System dynamically calculates visible frustum at table level and snaps physics walls to window edges. added UI controls for manual/auto override.
