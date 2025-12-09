# 08_Settings_UI.md

## Goal
Build a robust, categorized Settings UI with a real-time 3D preview of the changes.

## Tasks
1. [ ] **Settings Store**: Create a React Context or simple Store for:
   - **Appearance**: Theme (ColorSet), Scale.
   - **Behavior**: Gravity, Throw Force, Spin Force, Sound Volume.
2. [ ] **UI Structure**: Create `SettingsModal.tsx` with tabs/categories:
   - Tab 1: **Appearance** (Theme Dropdown, Scale Slider).
   - Tab 2: **Behavior** (Physics Sliders).
3. [ ] **Live Preview Component**: Create `DicePreview.tsx`.
   - A *separate* mini Three.js scene (isolated from the main DiceTray).
   - Contains a single D20.
   - Rotates continuously (`mesh.rotation.y += delta`).
   - Reacts instantly to `Appearance` changes (Theme updates).
4. [ ] **Validation**:
   - Open Settings -> Change Theme.
   - See the D20 in the modal change texture immediately.
   - Change "Throw Force" -> Roll dice in main tray -> Observe faster/harder rolls.
