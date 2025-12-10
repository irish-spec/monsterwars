# MonsterWars

MonsterWars is a concept for an idle monster-collecting crime saga that fuses Mafia Wars territory control with Pokémon-style battles. This repository currently contains design notes and early content data to guide prototyping.

## What's here
- `docs/game_design.md`: High-level vision, core loops, and system design pillars.
- `docs/roadmap.md`: Milestone plan from foundation to beta and stretch ideas.
- `docs/index.html`, `docs/styles.css`, `docs/main.js`: A static, data-driven idle prototype that runs fully in the browser.
- `data/monsters.yaml`: Sample starter monsters with stats, moves, and passives.
- `data/missions.yaml`: Early mission outlines that mix PvE, PvP, and idle rewards.

## How to use these files
- Use the YAML in `data/` as seed content for a combat simulator or client prototype.
- Expand the design docs with balancing decisions, UI mocks, and tech choices as the project matures.
- Keep systems deterministic and data-driven so combat logs and economy tuning remain transparent.

## Play the idle prototype
The `docs/` folder is GitHub Pages–ready. Open `docs/index.html` locally or via GitHub Pages to try the idle Mafia Wars × Pokémon loop using the YAML content. The prototype now includes:

- District selector with a range of missions per turf
- Rackets/idle work that lock monsters out of battle while they earn passive cash
- PvE mission runs, NPC arena bouts, capturing and summoning monsters, and basic leveling

## Next steps
1. Build a minimal battle simulator that can parse the YAML monster data.
2. Prototype rackets/idle timers and test offline accrual caps.
3. Create wireframes for district control, squad management, and battle replay screens.
