# Glimmer difficulty simulation (final tuning)

Run with `node test/sim.js 60` (results in `sim_final.txt` and `sim_results.json`) and `node test/upgrade_value.js 30` (`upgrade_final.txt`). The sim uses the same `logic.js` as the game, with no rendering, at a 120 Hz fixed step. Bots live in `bots.js`: the heuristic bot dodges threats, chases motes, and flares at crowds, Lurker tells, and the Gloom's inhale. Lower skill means slower reactions (120 to 400 ms), aim error, a shorter sight radius, and random 0.4–1 s lapses.

| Bot (60 seeds) | Dawn % | Median survival | Median score | Gloom banished | Near-loss runs | Deaths by hour (12,1,2,3,4,5 AM / dawn) |
|---|---|---|---|---|---|---|
| idle | 0 | 75.1 s | 11,102 | 0% | 100% | 0,28,20,12,0,0 / 0 |
| random | 0 | 19.7 s | 68 | 0% | 100% | 57,3,0,0,0,0 / 0 |
| novice (skill .2) | 23 | 115 s | 23,725 | 23% | 93% | 2,2,12,17,11,2 / 14 |
| average (skill .5) | 65 | 180 s | 67,229 | 45% | 90% | 0,0,4,7,5,5 / 39 |
| sharp (skill .8) | 80 | 180 s | 78,655 | 70% | 90% | 0,0,0,5,5,2 / 48 |
| expert (skill 1, smart picks) | 98 | 180 s | 84,388 | 70% | 68% | 0,0,0,0,1,0 / 59 |

Opening check (idle, seeds 1–3): first kill at 2.5–2.8 s; 5–6 kills and 0 hits by 12 s.

**Tuning history (why the numbers are what they are):**
1. First pass: an idle player survived until 4 AM and every moving bot won 100% without being hit, because the light burned everything before contact. Fix: burn 30 → 16–20 dps, and shadows barely slow down inside the light.
2. Light was self-sustaining (kills dropped more light than they cost). Fix: kill drops cut about 4×, Flare kills no longer refund light, and the light's upkeep scales with its size.
3. That swung too far: bots spent most of the run at near-zero light, so the screen was nearly black and ugly. Fix: gentler fading, so the average light radius sits around 90–105 and the pressure comes from shadow density instead.
4. The opening (first 15 s) had 20+ shadows and an idle player died at about 14 s. Fix: 12 AM spawn rate cut, a 1.5 s grace period, shade HP 16 → 14, and more burn at the light's edge. Now an idle player survives the first hour (first shadows pop on their own) but dies by 2–3 AM because the light fades without motes.
5. The first ~10 s were empty, because off-screen spawns took about 8 s to arrive. Fix: an opening beat of 5 shades placed just past the light plus 6 nearby motes.
6. The bots were found to be step-rate dependent (60 vs 120 Hz). Fixed to use the real dt, and spawn distance is pinned to at least 640 px so browser replays match the sim.

**Upgrade value** (average bot, prefers upgrade X whenever offered, 30 seeds; baseline "take the first card" = 53% dawn):
Lodestar 80% · Phoenix 70% · Afterglow 63% · Fleetwing 57% · Spark 47% · Wildfire 47% · Steady 43% · Halo 33% · Searing 30%.
Light-economy upgrades dominate. Damage-only upgrades underperform even after two buff passes. **This is an open balance issue** (and partly a bot artifact: the bot doesn't kite to exploit burn).
