# Anvil Dice Engine (v0.9.0)

**Anvil Dice Engine** is a high-fidelity, physics-based 3D dice rolling library built for the *Anvil & Loom* ecosystem. It features procedural geometry, advanced material shaders (glass, metal, holographic), and a robust parsing engine for complex TTRPG notation. Rebuilt from the ground up using Major Victory's dice engine as a source of inspiration, some logic, and sound files.

> **Authors**: T Guiles & The Architect

---

## 🚀 Getting Started

### 1. Installation

```bash
npm install anvil-dice-app cannon-es three
```

### 2. Integration

To use the engine in your project, import the singleton instance `diceEngine` or create your own `DiceEngine`.

```typescript
import { diceEngine } from 'anvil-dice-app/engine/DiceEngine';

// 1. Initialize with a DOM container
const container = document.getElementById('dice-tray');
diceEngine.initialize(container);

// 2. Listen for results
diceEngine.on('rollComplete', (result) => {
    console.log(`Rolled: ${result.total}`, result.breakdown);
});

// 3. Roll!
diceEngine.roll('4d6 + 5');
```

> [Insert Generic Screenshot of Dice Rolling Here]

---

## 🛠️ API Reference

### Core Methods

#### `diceEngine.initialize(container: HTMLElement)`
Bootstraps the Three.js scene and Cannon.js physics world attached to the HTML element. Handles auto-resizing.

#### `diceEngine.roll(notation: string): Promise<RollResult>`
Parses and executes a dice roll.
*   **Returns**: A promise that resolves when all dice have settled.
*   **Notation**: Supports standard (`2d20`) and advanced syntax (`d%`, `d66`).

#### `diceEngine.clear()`
Removes all dice from the scene and resets the physics world.

#### `diceEngine.setTheme(theme: Partial<DiceTheme>)`
Updates the visual and physical properties of the engine in real-time.
*   **Usage**: configuring colors, textures, materials, and gravity.

### Events

*   `rollStart` -> `(notation: string)`
*   `rollComplete` -> `(result: RollResult)`

---

## ✨ Features

### 1. Advanced Notation
The engine supports complex parsing logic beyond standard dice:

| Type | Notation | Description |
| :--- | :--- | :--- |
| **Standard** | `XdY + Z` | Basic rolls (e.g., `4d6`, `1d20+5`) |
| **Percentile** | `d%` | Spawns `d100` (tens) + `d10` (ones). Logic: `00`+`0`=`100`. |
| **D66** | `d66` | Spawns `d60` (10-60) + `d6`. Summation logic (e.g., `30`+`5`=`35`). |
| **D88** | `d88` | Spawns `d80` (10-80) + `d8`. Summation logic. |

### 2. High-Fidelity Visuals
*   **Procedural Geometry**: Dice are generated procedurally (chamfered edges, optimized UVs).
*   **Material System**: Supports `Standard` (plastic/matte) and `Physical` (glass/metal) materials.
*   **Dynamic Textures**: Includes `Starmap`, `Fractured Glass`, `Runic`, and more.

> [Insert Screenshot of Glass vs Metal Dice Here]

### 3. Physics & Customization
Powered by **cannon-es**, every roll is physically simulated.
*   **Surface Properties**: Configure Friction and Restitution (Bounce) for different tray feelings (Felt vs Glass).
*   **Throw Force**: Adjust the power and spin of the throw.

---

## ⚙️ Configuration (Settings)

The engine is stateless regarding UI, but fully configurable via code. You can build a Settings UI (like the one in the demo app) using the `setTheme` API.

**Configurable Properties:**
*   `texture`: Texture ID (e.g., 'nebula', 'forgescored').
*   `material`: 'standard' | 'metal' | 'glass'.
*   `tint`: Hex color for the die body.
*   `scale`: Global sizing.
*   `fontScaler`: Adjust label sizes.

> [Insert Screenshot of Settings Panel Here]

---

## 📦 Project Structure

*   `src/engine/DiceEngine.ts`: Main Facade.
*   `src/engine/DiceForge.ts`: Geometry & Material Factory.
*   `src/engine/RollController.ts`: Physics & Logic Orchestrator.
*   `src/engine/DiceParser.ts`: Notation Parser.

## 📄 License

**UNLICENSED** (Private to Anvil & Loom).
*Contact authors for usage rights.*
