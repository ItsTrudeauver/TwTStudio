# TwT Complete Player's Master Manual

Welcome to **TwT**, a Discord-based tactical card-battler and RPG. In this game, you will collect character cards, build custom squads, level up your account, hunt bounties, deploy expeditions, and take down massive event raid bosses.

This document acts as the official master manual. It outlines every command, combat rule, and progression mechanic you need to know to play effectively.

---

## Table of Contents
1. [Getting Started (Onboarding)](#1-getting-started-onboarding)
2. [Character Progression & Gacha](#2-character-progression--gacha)
3. [The Team Builder & Presets](#3-the-team-builder--presets)
4. [Core Game Modes](#4-core-game-modes)
   * [Daily Tasks & Dailies](#daily-tasks--dailies)
   * [Bounty Hunts & Gifting](#bounty-hunts--gifting)
   * [Expeditions](#expeditions)
   * [Raid Boss Events](#raid-boss-events)
5. [Item Economy & Token Shop](#5-item-economy--token-shop)
6. [Command Quick Reference](#6-command-quick-reference)

---

## 1. Getting Started (Onboarding)

Every new player starts with a free unboxing pack to establish their initial lineup.

* **Claim your Starter Pack:** Type `!starter`.
  * **What you receive:** A free 10-pull containing 9 standard random units and **one guaranteed, non-limited SSR character** to act as your frontline leader. 
  * *Note:* This command can only be claimed once per player profile.
* **Review your Profile:** Type `!profile` (or `!p`).
  * Displays your current Team Level, XP progression, total pulls performed, coin balance, and active Soulmates.
* **Inspect the obtainable pool:** Type `!allunits` (or `!pool`).
  * Opens an interactive catalog of all characters currently obtainable in the game. Use the built-in dropdown menus to filter by Rarity (UR, SSR, SR, R) and Availability (Standard vs. Event Limited), or sort by power and ID.

---

## 2. Character Progression & Gacha

To acquire more characters and make your squad stronger, you must summon units and manage duplicates.

### Gacha Rules & Spark Pity
* **Summoning:** Standard pulls cost **1,000 Gems** per single pull, or **10,000 Gems** for a 10-pull. 
  * Type `!pull 1` or `!pull 10` to summon.
* **Active Event Banners:** Type `!banner` to view the currently running featured banner, its rate-up units, and its expiration date.
* **The Spark Pity System:** Summons on active banners generate **1 Spark Point** per pull.
  * At **500 Spark Points**, you can exchange them directly for a featured event SSR unit of your choice.
  * Type `!spark` to open the pity exchange menu.

### Duplicity Scaling (Dupes)
When you pull a character you already own, they are automatically merged into your existing card, raising their **Dupe Level**:
* **Power Scaling:** Every Dupe Level (from 0 to 10) increases the unit's base attack power by **+5%** (up to a **+50%** maximum boost at Dupe Level 10).
* **The Scrap System:** If you pull an eleventh copy of a unit that is already at Dupe Level 10, it is automatically recycled into Gems and Coins:
  * **R-tier Dupe Recycle:** 100 Gems + 5 Coins
  * **SR-tier Dupe Recycle:** 500 Gems + 25 Coins
  * **SSR-tier Dupe Recycle:** 10,000 Gems + 500 Coins

---

## 3. The Team Builder & Presets

Before entering combat, you must organize your collected units into a squad of up to five members.

* **Launch the Team Builder:** Type `!teambuilder` (or `!tb`).
  * This opens an interactive GUI containing your inventory sorted by power.
  * **Filter & Select:** Use the dropdowns to filter your units by rarity (UR, SSR, SR, R) and select which characters to add or remove.
  * **Positioning:** Your team is positioned from Left to Right (Slot 1 to Slot 5). Positioning is critical because front-line slots (Slots 1 and 2) absorb single-target damage first, while specific skill structures (such as Casca's *The Anchor*) rely on adjacent layouts to activate.
  * **Equipping:** Click **💾 Equip Squad** to save and activate your current lineup for combat.
* **Squad Presets:**
  * To save your current layout as a preset template, click **📁 Save Preset** in the teambuilder interface (or use `!save_team [name]`).
  * If the preset name already exists, the builder will ask you to confirm before overwriting.
  * To equip a saved preset instantly, type `!load_team [name]`.
  * To delete an old preset, type `!delete_preset [name]` (or `!dp [name]`).
  * To view all your saved configurations, type `!presets`.

---

## 4. Core Game Modes

---

### Daily Tasks & Dailies
Players must log in daily to gather baseline resources and clear combat achievements.

* **Check-in:** Type `!checkin` once every 24 hours (resetting at 00:00 UTC) to receive **1,500 Gems**.
  * **Streak Rewards:** Maintaining consecutive check-in days increases your login streak, which unlocks permanent progression achievements (e.g. *Weekly Habit* or *Monthly Devotion*).
* **Daily Objectives:** Type `!tasks` to review your active daily battle card.
  * Tasks include battling other players (PVP) or defeating NPC teams of varying difficulties.
  * **Claiming Rewards:** Completed tasks grant Gems. Type `!claim [task]` to collect your earnings, or `!claimall` to claim all completed rewards at once.

---

### Bounty Hunts & Gifting
Bounty hunts are specialized encounters used to acquire character development items.

* **Bounty Keys:** Initiating a hunt consumes **1 Key**. You can hold a maximum of 3 keys, and they automatically regenerate at a rate of **1 Key per hour**.
* **Checking the Board:** Type `!bounty` to see active bounty listings, their difficulty tier (R, SR, SSR, or UR), total combat power, and clear rewards.
* **Starting a Hunt:** Type `!hunt`. This opens an interface where you can select an available slot and engage the targets.
* **Obtaining Rewards:** Winning a hunt awards specialized **Bond Items** corresponding to the difficulty of the encounter:
  * **R Bounty:** Faint Tincture (Small Bond)
  * **SR Bounty:** Vital Draught (Medium Bond)
  * **SSR Bounty:** Heart Elixirs (Large Bond)
  * **UR Bounty:** Essence of Devotion (UR Bond) + Coins
* **Gifting & Bond Progression:**
  * You can give your collected bond items to your units to increase their **Bond Level** (from 1 to 50).
  * **Power Scaling:** Every Bond Level increases the unit's attack power by **+0.5%** (up to a **+25%** maximum boost at Bond Level 50).
  * **Soulmates:** Reaching Bond Level 50 unlocks **Soulmate Status** for that character, permanently recording them on your profile card.
  * **How to Gift:** Type `!gift [inventory_id] [item_tier] [quantity]`.
    * *Example:* `!gift 422 medium 5` (Gives 5 Vital Draughts to unit ID 422).
    * *Item aliases:* `small` / `s`, `med` / `m`, `large` / `l`, `ur`.
    * *Multi-gifting:* You can chain gifts using `!`. For example: `!gift 422 small 5 ! 423 large 2`.

---

### Expeditions
Expeditions allow you to deploy your team to gather Gems passively over time.

* **Set your Expedition Team:** Type `!set_expedition [inv_id1] [inv_id2] ...` (supports up to 5 units).
* **Begin the Expedition:** Type `!ex start`.
* **Checking Status:** Type `!ex` to view the elapsed time of your running expedition.
* **Claiming Earnings:** Type `!ex claim`. 
  * This ends the expedition, grants accumulated Gems, and rewards your account with Team XP.
  * **Scaling Formula:** Gem yield scales based on the total power of the deployed squad and the total duration (in seconds) of the expedition. 
  * **Expedition Skills:** Certain character abilities modify these rates:
    * **Hardworker:** Increases final expedition yield by +15%.
    * **Master of Coin:** Increases final expedition yield by +10% globally.
    * **The Long Road (Fern):** Increases the final yield by up to +24% scaling linearly based on total duration (maximizing at 24 hours).

---

### Raid Boss Events
Raids are highly structured, cyclical boss fights that occur during limited-time events.

* **Raid Tickets:** Engaging a Raid Boss consumes **1 Raid Ticket** (players receive 3 tickets daily).
* **Raid Status:** Type `!raid` to inspect the active boss's remaining HP, abilities, your personal best score, and the community top-three leaderboard.
* **Tactical Layout:** Raids are turn-based encounters up to a maximum of 50 turns:
  * **HP is Power:** Your units do not have separate health values; their starting HP is equal to their combat power (multiplied by any active HP modifiers).
  * **Damage Ordering:** The Boss attacks your team from Left to Right (front-line slots take hits first). Your surviving units then attack back, dealing damage to the boss's HP pool.
  * **Shields and Mitigation:** Barriers (like Noelle's *Valkyrie Shield*) absorb incoming raw damage directly, while Damage Reduction (like Maple's *Impervious Shield*) mitigates a percentage of incoming hits.
  * **Boss Phases:** Bosses use specialized abilities (like silences, status debuffs, or AoE cleaves) on specific turn intervals. When a boss drops below 50% HP, they transition to **Phase 2**, activating more aggressive skills.
* **Raid Battle:** Type `!raid_fight` to begin the simulation. The combat displays live updates in a single high-density embed, featuring inline boss status cards, accumulative damage counters, and a scrolling description-based turn log.
* **Statistics & Leaderboards:** At battle end, the view displays your performance details. Use the navigation buttons to review exact damage dealt, barriers generated, and raw damage sustained per slot index.

---

## 5. Item Economy & Token Shop

As you clear content, you will earn Coins and other special development materials.

* **Check your Inventory Bag:** Type `!items` (or `!bag`).
  * Displays your current Coin balance and collected consumable items.
* **The Item Shop:** Type `!itemshop` (or `!ishop`).
  * Displays purchasable items.
* **SSR Dupe Tokens:**
  * You can purchase an **SSR Token** from the item shop for **2,000 Coins** (or buy them directly via `!buy_token [amount]`).
  * **Upgrading Units:** You can consume an SSR Token to instantly increase the Dupe Level of any owned SSR character by +1. 
  * **How to use:** Type `!use_token [inventory_id]` (or `!ut [inventory_id]`).
* **Credit Exchange:**
  * If your server has an active *Unbelievaboat* economy, you can exchange bank credits for Gems. 100 Million credits buys 1 Pull (1,000 Gems). Players can buy up to 10 pulls daily.
  * **How to buy:** Type `!buy [pull_amount]`.

---

## 6. Command Quick Reference

| Command | Category | Description |
| :--- | :--- | :--- |
| `!starter` | Onboarding | Claims free starter 10-pull pack (1 guaranteed SSR). |
| `!profile` | Information | Displays account level, XP, coins, and soulmates. |
| `!allunits` | Information | Opens the searchable, filterable obtainable units pool. |
| `!lookup [name]` | Information | Searches database for stats and skills of a specific character. |
| `!pull [1/10]` | Gacha | Summons 1 or 10 characters from active pool (costs Gems). |
| `!banner` | Gacha | Displays the currently featured event rate-up banner details. |
| `!spark` | Gacha | Opens the 500-point banner pity exchange menu. |
| `!teambuilder` | Management | Opens the visual GUI to set up and equip your active team. |
| `!save_team [name]` | Management | Saves your active team lineup to a preset slot. |
| `!load_team [name]` | Management | Swaps your active team lineup to a saved preset. |
| `!presets` | Management | Lists all saved team presets. |
| `!delete_preset [name]`| Management | Deletes a saved team preset. |
| `!battle [target/diff]`| Combat | Initiates standard battle against a player or NPC. |
| `!tasks` | Progression | Displays your daily task requirements and rewards. |
| `!claim [task]` | Progression | Claims Gem rewards for a completed daily task. |
| `!claimall` | Progression | Bulk claims all completed daily task rewards. |
| `!bounty` | Bounties | Opens the bounty board to inspect active target slots. |
| `!hunt` | Bounties | Opens the interactive select screen to fight a bounty. |
| `!gift [args]` | Progression | Gifts collected bond items to characters for Bond XP. |
| `!set_expedition [ids]`| Expedition | Sets your designated 5-unit expedition team. |
| `!ex [start/claim]` | Expedition | Starts or claims passive expedition Gem earnings. |
| `!raid` | Raids | Displays active boss HP, skills, and personal bests. |
| `!raid_fight` | Raids | Consumes 1 ticket to run an interactive Raid Battle. |
| `!raid_lb` | Raids | Opens the complete damage leaderboard for the active Raid. |
| `!itemshop` | Shop | Opens the Coin-based consumable and token shop. |
| `!buy_token [amount]` | Shop | Quick-buys a specified quantity of SSR Dupe Tokens. |
| `!use_token [inv_id]` | Progression | Consumes 1 SSR Token to upgrade a unit's Dupe Level. |
| `!buy [pull_amount]` | Economy | Exchanges Unbelievaboat credits for summoning Gems. |
| `!items` | Inventory | Views your current Coin balance and collected consumable items. |
| `!lock [inv_ids]` | Management | Locks characters to protect them from being scrapped. |
| `!unlock [inv_ids]` | Management | Unlocks characters so they can be managed or scrapped. |
| `!scrap_r` | Management | Bulk-scraps all unlocked R-rarity characters for Gems and Coins. |
| `!scrap_sr` | Management | Bulk-scraps all unlocked SR-rarity characters for Gems and Coins. |
