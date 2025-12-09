# 07_Advanced_Engine_Features.md

## Goal
Enhance the Dice Engine to support custom dice types (Coins, D100) and implement robust notation parsing with result aggregation.

## Requirements

### 1. New Dice Types [ ]
- **Coin (d2)**:
    - Geometry: Cylinder (Disc).
    - Labels: "1", "2" (or Heads/Tails mapped to 1/2).
- **Tens D10 (d100)**:
    - Geometry: Same as D10.
    - Labels: "00", "10", "20", "30", "40", "50", "60", "70", "80", "90".
    - Logic: Used in pair with D10 for percentile rolls.

### 2. Notation Parsing [ ]
The engine must parse strings like `"4d6 + 2d8 + 1d100 + 5"`.

- **Operators**: `+` (Summation), `-` (Subtraction).
- **Modifiers**: Static numbers (e.g. `+5`, `-2`).
- **Percentile (`d100` or `d%`)**:
    - Spawns TWO dice: `Tens Die (00-90)` and `Ones Die (0-9)`.
    - **Logic**:
        - `Tens: 00` = 0
        - `Ones: 0` = 0
        - If Total is 0 (i.e., `00` + `0`), Result = **100**.
        - Example: `40 + 5` = 45. `00 + 5` = 5.

### 3. API Response Structure [ ]
The `roll()` Promise must resolve with a structured object:

```typescript
interface RollResult {
    total: number;          // Final calculated sum
    notation: string;       // Original request (e.g. "2d20 + 5")
    sets: DiceSetResult[];  // Breakdown by group
}

interface DiceSetResult {
    notation: string;       // e.g. "2d20"
    total: number;          // Sum of this set
    rolls: DieRoll[];       // Individual die results
}

interface DieRoll {
    type: string;           // "d20", "d10", "d100", "coin"
    value: number;          // Face value (e.g. 15, 0, 10)
    label: string;          // Visual label (e.g. "15", "00")
    isDropped?: boolean;    // For future drop logic
}
```

## Implementation Plan

1.  **DiceForge Updates**:
    - Implement `Coin` geometry.
    - Implement `D100` geometry (clone D10, new labels/normals).
2.  **Parser Logic**:
    - Regex based parsing to separate groups.
    - Handle `d%` replacement -> spawn `d100 + d10`.
3.  **Result Aggregation**:
    - Collect all dice from `PhysicsWorld`.
    - Map them back to the requested groups (requires tracking `groupId` on dice).
4.  **Promise Resolution**:
    - Ensure `roll()` waits for *all* dice to sleep before resolving.

## Verification
- Roll `d%`: Check bounds 1-100.
- Roll `1d20 + 5`: Check math.
- Roll `Coin`: Check flip physics.
