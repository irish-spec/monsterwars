# MonsterWars Game Design

## Vision
MonsterWars blends the turf-control fantasy of Mafia Wars with the creature collecting and battling of Pokémon, wrapped in idle/simulation systems that keep progress moving while players are away. The goal is to let players feel like criminal masterminds who command a squad of colorful beasts and human associates to dominate a neon-drenched city.

## Pillars
1. **Collect & Evolve Monsters**: Capture, train, and fuse monsters inspired by urban legends and underworld myths.
2. **Crew Management**: Recruit and gear up underbosses and associates who complement monster squads.
3. **Territory & Turf Wars**: Take over districts, earn passive income, and engage in asynchronous PvP.
4. **Idle Progression**: Timers, production buildings, and auto-farming ensure growth even when offline.
5. **Event-Driven Narrative**: Rotating operations and story arcs tied to districts and factions.

## Player Fantasy
- Run a shadow syndicate that weaponizes monsters.
- Command squads in quick, tactical battles.
- Expand influence via rackets, smuggling routes, and black-market labs.

## Core Loop
1. **Gather**: Capture monsters via street hunts or buy eggs on the black market.
2. **Train & Equip**: Level monsters, teach moves, fuse variants, and outfit crew with gear that amplifies monster stats.
3. **Run Operations**: Spend stamina/energy to clear missions that reward cash, DNA shards, and territory influence.
4. **Claim Territory**: Use influence to unlock districts; invest in rackets that generate idle income and buffs.
5. **PvP & Events**: Challenge rival crews asynchronously; participate in rotating events for limited monsters and cosmetics.
6. **Idle Collection**: Collect profits and materials, triggering upgrades that loop back into training and operations.

## Systems Overview
### Monsters
- **Affinities**: Fire, Water, Tech, Venom, Psychic, Shadow, and Street (neutral).
- **Stats**: HP, Attack, Special, Defense, Speed, Grit (critical resistance), and Loyalty (idle efficiency).
- **Moves**: Each monster learns up to 4 active moves and 2 passive traits; moves consume "Heat" (energy).
- **Growth**: XP leveling, rank up via DNA shards, optional fusion variants that modify affinity/resistances.

### Crew (Human) Units
- Rarity tiers (Common → Legendary) with roles: Enforcer (tanks), Fixer (support), Shooter (burst), Tech (hacker), Chemist (DoT).
- Crew members grant passive boosts to assigned monsters and unlock support moves during battle.
- Gear slots: Weapon, Gadget, Outfit, Tattoo (rune-like passive).

### Districts & Rackets (Idle)
- Districts provide rackets (income buildings) such as Casinos, Labs, Smuggling Docks, and Data Farms.
- Rackets produce **Cash**, **Reagents**, and **Influence** per real-time minute; production can be boosted by crew assignments and monster traits.
- District control levels unlock defensive bonuses and PvP matchups.

### Missions & Operations
- Require **Stamina**; scale with district difficulty.
- Offer branching objectives: Direct Assault, Stealth Hack, Smuggle Run, Monster Hunt, Boss Showdown.
- Rewards: Cash, DNA shards for specific affinities, gear components, notoriety (PvP matchmaking rank), story beats.

### Combat
- Turn-based 3v3 (monsters) with optional crew assist. Speed determines initiative; swap monsters mid-combat.
- Affinity chart similar to Pokémon with mafia twists (e.g., Tech strong vs. Psychic, Shadow strong vs. Street).
- Heat meter: powerful moves raise Heat; if it maxes, law-enforcement crackdown temporarily debuffs the squad.
- Environmental modifiers from districts (e.g., Docks add Water bonus, Labs boost Tech crit chance).

### Idle Mechanics
- Offline accrual for rackets (cap at 12 hours by default).
- Auto-battle tickets let monsters farm earlier missions; crew assignments reduce timer lengths.
- Safehouse crafting continues while offline, producing gear components and temporary buffs.

### Progression
- Account level unlocks energy cap, team size, and new districts.
- Monster rank ups unlock passives; crew ascensions unlock gear slots.
- Reputation tracks with factions; high reputation unlocks exclusive missions/monsters.

### Monetization-Friendly Hooks (for F2P)
- Cosmetic skins, time-savers (speed-ups), premium hunts, and battle pass with narrative chapters.
- All core content is earnable via play, with pity timers on rare drops.

## Content Examples
### Starter Monsters
- **Ember Jackal (Fire)**: Fast striker; move set includes *Flame Pounce* and *Ember Trail* (burn DoT).
- **Wire Viper (Tech/Venom)**: Debuffer; *Neural Bite* reduces Speed, *Toxic Surge* stacks Venom.
- **Gutter Golem (Street/Shadow)**: Bulky tank; *Alley Guard* provokes, *Shadow Cement* reduces enemy Attack.
- **Murkfin (Water)**: Sustainer; *Murky Barrier* shields allies, *Undertow* delays enemy turns.
- **Ghast Mutt (Psychic/Shadow)**: Trickster; *Mind Lash* (Special), *Wraith Howl* (fear chance).

### Sample Rackets
- **Casino Skim**: Generates Cash and small Reputation; higher levels unlock bonus crit chance buffs.
- **Bio Lab**: Produces Reagents and DNA shards; higher risk of law-enforcement events unless guarded.
- **Smuggling Dock**: Generates Cash and Influence; boosts Water-affinity monsters during dock battles.

### Events
- **Heat Wave**: Fire and Tech monsters gain bonus Heat capacity; district police presence increases, raising mission difficulty but reward multipliers.
- **Night Market**: Limited-time vendors for rare gear and fusion reagents.
- **Monster Showdown**: Ladder-style PvP with special titles and cosmetics.

## Technology & Architecture (proposed)
- **Client**: Web-first (React/TypeScript) with responsive UI; reusable components for battle HUD, idle timers, and district map.
- **Backend**: Node.js (Nest/Fastify) or Go for combat resolution and timers; PostgreSQL + Redis for persistence and queues.
- **Services**: Battle service (deterministic simulation), Progression service, Inventory service, Live Ops (events).
- **Auth**: JWT with refresh rotation; allow guest accounts upgraded via email.
- **Analytics**: Event bus → warehouse for balancing.

## Roadmap Snapshot
- **Prototype**: Core combat sim, monster data schema, mission/energy loop, basic district screen with idle timers.
- **Alpha**: PvP async battles, faction reputation, more districts, crafting.
- **Beta**: Live events, battle pass, cosmetic systems, social features (crews/clans).

## Success Metrics
- Day-1/7 retention, mission completion funnel, average monsters collected, PvP engagement, ARPDAU without pay-to-win spikes.

## Open Questions
- How punitive should Heat crackdowns be? Need tuning for fairness.
- Should crew assists consume stamina or separate resource?
- Best balance between monster rarities and accessibility without power creep.
