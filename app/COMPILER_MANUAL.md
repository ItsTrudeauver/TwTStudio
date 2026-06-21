# TwT Visual Skill Compiler Manual

Welcome to the official manual for the **TwT Visual Skill Compiler**. This document acts as the definitive specification for the triggers, target selectors, conditions, and actions supported by the TwT modular combat and gameplay engine.

---

## 1. Core Architecture (How it Works)

The TwT Skill Compiler uses a **data-driven design**. Instead of writing custom Python code for every new character ability, you use the Visual Sentence Builder on your Web Dashboard to construct logical blocks. 

When you click "Save", the dashboard compiles your visual blocks into a structured **JSON Abstract Syntax Tree (AST)** and writes it directly to the `ability_tags` column in your `characters_cache` table.

The Python bot reads this JSON at runtime and interprets the blocks. This allows you to add or modify complex behaviors without ever restarting your bot or writing backend code.

---

## 2. Global Math Variables (The Math Parser)

When configuring values or formulas in your block actions, the Python engine evaluates them dynamically. It automatically injects the following contextual variables into your equations:

* **`dupes`**: The local unit's dupe level (0 to 10).
* **`dead_allies_count`**: The count of your team members whose power has been reduced to `0` (sacrificed or killed).
* **`suppressed_count`**: The count of active skills silenced during the start of combat.
* **`team_level`**: The player's overall account/team level.
* **`bond_level`**: The local unit's bond level (1 to 50).
* **`duration_hours`**: The duration of the active expedition in hours (for expedition calculations, capped at 24.0).

---

## 3. The Block Specification

Every skill contains an array of executable **Blocks**. Each block is configured via these four properties:

### 3.1 Triggers (WHEN)
Determines the exact combat phase hook when the block is evaluated:
* **`ON_BATTLE_START` (Phase 1):** Resolves before base power calculations. Used for silences, sacrifices, and positional setups.
* **`ON_POWER_CALC` (Phase 2):** Resolves during individual self-power calculation. Used for percentage stat-buffs and chance calculations.
* **`POST_POWER_CALC` (Phase 2.5):** Resolves after multipliers are set, but before final totals are summed. Used for spatial logic (copies and swaps).
* **`ON_BATTLE_END` (Phase 3):** Resolves after winner determination. Used for retry loops and win/loss overwrites.

### 3.2 Target Selectors (ON)
Determines which units are affected by the block's action:
* **`SELF`**: The unit holding the skill.
* **`ADJACENT_ALLIES`**: Units positioned directly to the left and right of the caster.
* **`ALL_ALLIES`**: Every unit on the caster's team.
* **`ALL_ALLIES_EXCEPT`**: Every unit on the caster's team except a specified ID.
* **`ALL_ENEMIES`**: Every unit on the opponent's team.
* **`RANDOM_OPPONENT`**: A single randomly chosen enemy unit.
* **`WEAKEST_ALLY` / `WEAKEST_ENEMY`**: The unit on either team with the lowest current power.
* **`STRONGEST_ALLY` / `STRONGEST_ENEMY`**: The unit on either team with the highest current power.
* **`SACRIFICED_ALLIES`**: Allies whose power is currently `0`.
* **`SLOT_1` to `SLOT_5`**: Absolute physical positions in your team lineup (from Left to Right).

### 3.3 Logic Chain (IF Gates)
Adds conditional restrictions to block execution. Multiple conditions can be chained together using the logical connectors **`AND`** or **`OR`**:
* **`NONE`**: The block is guaranteed to execute (no conditions).
* **`IF_TEAM_HAS`**: Evaluates to True if a specific character ID is present on your team.
* **`IF_TEAM_HAS_SKILL`**: Evaluates to True if any team member holds a specific skill.
* **`IF_POSITION_BETWEEN`**: Evaluates to True if the caster's slot index is directly between the indices of two specific character IDs.
* **`IF_POSITION_ADJACENT_TO`**: Evaluates to True if a specific character ID is in an adjacent slot.
* **`IF_POSITION_NOT_ADJACENT_TO`**: Evaluates to True if a specific character ID is NOT in an adjacent slot.
* **`IF_SELF_SUPPRESSED`**: Evaluates to True if the caster has been silenced.
* **`IF_RESULT_IS`**: Evaluates to True if the final battle outcome is `LOSS` or `WIN`.
* **`IF_FLAG_ACTIVE`**: Evaluates to True if a global state flag in the battle context is active.

### 3.4 Action Types (DO)
Determines how the target's stats or state are mutated:
* **`MULTIPLY_POWER`**: Multiplies target power (supports formulas like `1.25` or `1.45 ** dead_allies_count`).
* **`ADD_FLAT_POWER`**: Adds a flat value to target power (supports formulas like `7777` or `1000 * dupes`).
* **`SUPPRESS_SKILL`**: Silences and disables the target's active skills for the duration of the match.
* **`FORCE_VARIANCE`**: Overwrites the target's random damage variance to a fixed float (e.g. `1.0` or `1.2`).
* **`HARVEST_VARIANCE_DELTA`**: Saves the absolute difference of negated variance to a state flag (Jugram logic).
* **`SET_STATE_FLAG`**: Writes a custom key/value variable to the shared combat ledger.
* **`REGISTER_RETRY`**: Triggers a full combat rollback and retry on loss (Yhwach logic).
* **`SET_MULTIPLIER_FLOOR`**: Restricts a unit's power multiplier from dropping below a set minimum (Cleanse).
* **`ELIMINATE_UNIT`**: Instantly sets target's power to `0` (Kamikaze).
* **`FORCE_BATTLE_RESULT`**: Overwrites the outcome of the match to `WIN` on battle end (Revive).
* **`REGISTER_POST_PHASE`**: Pre-schedules a specific copying or swapping action to run during `POST_POWER_CALC` (Zodiac logic).
* **`EXPEDITION_YIELD_MULTIPLIER`**: Custom yield calculations for expeditions.
* **`EXPEDITION_TIME_SCALED_MULTIPLIER`**: Yield scaling based on expedition duration.
* **`REWARD_MULTIPLIER`**: Global reward multipliers (Royalty logic).

---

## 4. Master Recipe Book (How to Build Existing Skills)

### 4.1 Lucky 7
* **Priority:** `10` | **Context:** `Combat`
* **Block 1 (Jackpot):**
  * `WHEN:` `Power is Calculated` | `ON:` `Self` | `CHANCE:` `7`
  * `DO:` `Multiply Power` | `VALUE:` `8.77`
  * `Log Template:` `✨ Lucky 7: HIT THE JACKPOT (+777% Power)!`
* **Block 2 (Flat Buff):**
  * `WHEN:` `Power is Calculated` | `ON:` `Self` | `CHANCE:` `77`
  * `DO:` `Add Flat Power` | `VALUE:` `7777`
  * `Log Template:` `🍀 Lucky 7: Gained flat power (+7,777)!`

---

### 4.2 Qifrey's Trio Synergy (*Sidus Tenebrosum*)
* **Priority:** `50` | **Context:** `Combat`
* **Block 1:**
  * `WHEN:` `Battle Starts` | `ON:` `Self` | `CHANCE:` `100`
  * `IF:` `Team Has Character ID` `[129840]` (Coco)
  * `AND` `Team Has Character ID` `[129842]` (Agott)
  * `DO:` `Set Global State Flag` | `VALUE:` `sidus_active = true`
  * `Log Template:` `✨ Qifrey casts Sidus Tenebrosum, amplifying the trio's magical effectiveness!`

---

### 4.3 Casca's Spatial Buffer (*The Anchor*)
* **Priority:** `30` | **Context:** `Combat`
* **Block 1 (The Intermediator check):**
  * `WHEN:` `Battle Starts` | `ON:` `Self` | `CHANCE:` `100`
  * `IF:` `Positioned Between IDs` `[422, 424]` (Guts & Griffith)
  * `DO:` `Set Global State Flag` | `VALUE:` `casca_intermediator = true`
* **Block 2 (The Runaway check):**
  * `WHEN:` `Post-Power Calculation` | `ON:` `Guts` | `CHANCE:` `100`
  * `IF:` `Adjacent to Character ID` `[422]`
  * `AND` `Not Adjacent to Character ID` `[424]`
  * `DO:` `Set Multiplier Floor` | `VALUE:` `1.0` (Resets Guts' debuffs)
  * `Log Template:` `🏃‍♀️ Runaway: Casca's presence cleansed Guts' power multipliers!`

---

### 4.4 Tohru Honda's *Sheep Zodiac* Random Mode
* **Priority:** `10` | **Context:** `Combat`
* **Block 1:**
  * `WHEN:` `Battle Starts` | `ON:` `Self` | `CHANCE:` `8.33` (A 1-in-12 roll)
  * `DO:` `Register Post-Phase Action` | `VALUE:` `"COPY_MAX_ENEMY_POWER"`
  * `Log Template:` `👑 Queen of the Zodiacs: Invoked the Sheep Zodiac! (Pre-scheduled mirroring)`