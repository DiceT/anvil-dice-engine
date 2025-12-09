# 01_Skeleton_Environment.md

## Goal
Initialize the core engine environment with Three.js and Cannon.js.

## Tasks
1. [ ] **Directories**: Ensure `src/engine/core` exists.
2. [ ] **EngineCore**: Create `src/engine/core/EngineCore.ts`.
   - Initialize `THREE.Scene`, `THREE.WebGLRenderer`.
   - Initialize `CANNON.World`.
   - Setup basic render loop (`requestAnimationFrame`).
3. [ ] **SceneManager**: Create `src/engine/core/SceneManager.ts`.
   - Add basic Camera (Perspective) and Controls (OrbitControls for debug).
   - Add Lights (Ambient + Directional).
   - Add a simple Floor (PlaneGeometry) and Walls (BoxGeometry) for the "Tray".
4. [ ] **PhysicsWorld**: Create `src/engine/core/PhysicsWorld.ts`.
   - Wrap `CANNON.World`.
   - Create rigid bodies for Floor and Walls.
   - Sync method to update Physics -> Three.
5. [ ] **Validation**:
   - Render a blue cube falling onto the floor to prove physics + rendering works.
