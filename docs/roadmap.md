# MonsterWars Roadmap

## Milestone 0: Foundation
- Define data schemas for monsters, crew, rackets, and missions.
- Stand up repo tooling (formatter, linter, test harness) and CI skeleton.
- Create battle simulator prototype (command-line) that can resolve 3v3 fights deterministically.
- Seed initial content: 5 monsters, 3 missions, and basic affinity chart.

## Milestone 1: Prototype
- **Client**: Build React UI for squad management, mission selection, and battle log viewer.
- **Backend**: Implement inventory, mission resolution, and idle production timers with Redis queues.
- **Progression**: Add XP/leveling and DNA shard rank-ups; implement stamina/energy regeneration.
- **Economy**: Create rackets (Casino, Lab, Dock) with upgrade paths and offline accrual caps.
- **Testing**: Add simulation tests for battle outcomes and timer math; start telemetry logging.

## Milestone 2: Alpha
- **PvP**: Asynchronous arena with defensive teams; include Heat/crackdown modifiers.
- **Factions**: Reputation tracks that unlock missions, discounts, and exclusive monsters.
- **Crafting**: Safehouse workshop for gear components and temporary buffs.
- **Events**: Live Ops framework for rotating modifiers (Heat Wave, Night Market, Monster Showdown).
- **Social**: Crew/Clan system with shared buffs and raid-style missions.

## Milestone 3: Beta
- **Battle Pass**: Seasonal rewards with story chapters and cosmetics.
- **Cosmetics**: Skins for monsters and crew, territory decoration, and profile banners.
- **Live Balancing**: Remote config for moves, affinities, and loot tables; A/B testing hooks.
- **Hardening**: Anti-cheat checks on battle logs, rate limiting, and audit trails.

## Stretch Ideas
- **AR Hunts**: Optional AR layer for monster capture in real-world locations.
- **Co-op Raids**: Timed boss fights where multiple players contribute damage asynchronously.
- **Player Housing**: Customizable safehouse that confers idle bonuses.

## Developer Notes
- Favor deterministic simulation for combat to avoid reconciliation issues in PvP.
- Keep economy numbers data-driven (YAML/JSON) for rapid iteration without redeploys.
- Build monitoring early: dashboards for timers, resource inflows/outflows, and PvP fairness.
