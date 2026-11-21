# GLIMMER: Game Design Doc (v2)

*Status: playable local prototype in `prototype/`. Not published. Concept selection: `concepts.md`. Source principles: `../knowledge_base.md` (citations are `[KB video label @mm:ss]`; the URL key is at the bottom).*

## 1. Pitch
You are a small wisp lost in a forest at midnight. **Your light radius is your health, your vision, and your weapon, all at once.** Shadows sizzle and pop while they're inside your glow. Each one that touches you dims it. Golden motes out in the dark feed it. Hit **Flare** to spend a chunk of your light in a blast that clears the screen. Survive six "hours" (3 minutes) until dawn burns the rest of the shadows away.

**One-line hook:** "Stay lit, stay alive. Spend light to fight."

## 2. Target emotion (emotion first [Gruul musical-chairs short @00:00] [Three questions short @00:00])
**Dread that turns into defiance.** You start out cowering in a small circle with eyes all around you in the dark. Within a minute you're choosing to dive into the dark after motes and flaring into packs. The fantasy should feel like barely making it. Per Cheng, "the best power fantasy is secretly easier than it feels" [How hard should your game be short @00:33], so the near-misses are deliberately rigged (§6).

**Kinds of fun:** primarily **Sensation and Challenge** (Beat Saber's "how a game feels can be the whole game" [Beat Saber one-word short @01:06]; Cuphead's micro-victories [Cuphead fun-type short @00:49]), with a little **Submission** from the numbers going up [Vampire Survivors one-word short @00:27].

## 3. Core loop
| Timescale | Loop |
|---|---|
| **Seconds** | Move. Shadows enter your light and burn ("sizzle, then pop"). A touch costs light. You grab nearby motes. |
| **~10–20 s** | Read the threat: a pack in the cone ahead, a Lurker's red-eyed wind-up, a moth swarm. Decide whether to **Flare** (spend light) or kite (keep shadows at the edge of your light, where they burn). |
| **~20–30 s** | **Kindle:** enough motes and you pick 1 of 3 upgrades. A new **hour** begins with a banner and a new enemy type. |
| **3 min (run)** | 12 AM → 5 AM escalation. **The Gloom** (boss) arrives at 4 AM. **Dawn** at 6 AM is the cathartic payoff. |
| **Session** | Results screen: how far into the night you got, score count-up, rank, "N points to the next rank," and your best. One key restarts. |

## 4. Mechanics
- **Light (R):** starts at 125, max 160. When R drops to 22, you're snuffed out. R fades slowly (1.0 + 0.6% of R per second, rising 60% over the night), but **fading stops at 40**. Fading alone never kills you, only shadows do. That keeps every death the player's fault and readable [Board game insiders @00:00] [How hard should your game be short @00:00].
- **Burn:** shadows inside R take `20 × (0.5 + 0.5 × closeness) × hot × upgrades` damage per second, and move 15% slower while burning. **"A small flame burns hotter":** `hot` rises to ×1.6 as R shrinks. This is comeback slack the fiction explains [Dave the Diver spotlight @06:17].
- **Motes:** spawn out in the dark, beyond your light, and each gives +3.5 light. Greed pulls you away from safety, so the risk is yours to choose [Dave the Diver spotlight @06:49].
- **Flare (Space / Shift / right-click / touch button):** costs max(15, 26% of R). Blast radius is 150 + 1.55R and damage is 75 + 0.45R, with knockback, a 60 ms hit-stop, and a 1.0 s cooldown. You can't flare yourself to death. It's one big, visible trade of health for power, never a hidden modifier [Magic Find short @02:15].
- **Enemies** (each has one readable job, plus a silhouette and eye color):
  - **Shade:** drifts in with a slight weave. The basic threat.
  - **Moth** (1 AM): fast, fragile swarms that chip at you.
  - **Lurker** (2 AM): stops, shrinks, its eyes flare red, a dashed line shows the lane, and a rising sound plays. Then it dashes after 0.6 s. The tell uses **shape + line + sound, not just color** [Sci-Fi Vampire Survivors lessons @11:40].
  - **Wraith** (3 AM): tanky and burn-resistant. Your answer is to flare or kite.
  - **The Gloom** (4 AM boss, 1,100 HP): every ~7 s it **inhales**. That's a 1.5 s tell (red eyes, a ring marking its range, "it inhales...", a rising roar), then 1.7 s of pulling you in and draining your light. **Flaring during the tell or inhale staggers it, and it takes ×3 damage for 2.6 s.** Big threat, big tell, specific counter [Prophet Skeram short @00:00], with a suspense beat before the payoff [Gruul musical-chairs short @02:02]. Banishing it gives +1,000 × combo and +30 light. Otherwise dawn burns it away.
- **Spawning:** packs appear just off-screen, inside a cone that tracks where you're heading (±12° jitter per pack, re-aimed every 5–9 s), with 50% from random directions so you can't run in a straight line forever [Sci-Fi Vampire Survivors lessons @05:36]. Spawns are driven by a budget per hour, and the first 1.5 s is a grace period. **Opening beat:** 5 shades already lurk just past the light and 6 motes sit close by, so the first sizzle-and-pop happens about 2.5 s after you press start.

## 5. Progression and rewards (deliberately small: one system, sized to a 3-minute run)
- **Kindle** at 6, 15, 27, 42, 60, 82, 108, 138, 172, 210, 252, and 300 motes. Each one pauses the game and offers 1 of 3 upgrades. Each upgrade has one **clear, unique property** [Sci-Fi Vampire Survivors lessons @06:42]:

| Upgrade | Niche |
|---|---|
| Wider Halo (×3) | +30 max light, refill now: survivability |
| Searing Glow (×3) | +40% burn, and burn kills feed light: aggression sustain |
| Orbiting Spark (×3) | A spark that hits outside your light: reach |
| Afterglow (×2) | Cheaper, faster Flares: the Flare build |
| Wildfire (×2) | Burn kills explode and chain: crowd clear |
| Lodestar (×2) | Mote magnet and +light per mote: economy |
| Fleetwing (×2) | +20% speed, +1 light per mote: mobility |
| Steady Flame (×2) | Slower fade, softer hits: defense |
| Phoenix Ember (×1) | One revive with a free flare: insurance |

- Offers are drawn from a **marble bag** (shuffled, no repeats until every upgrade has been seen), so streaks are controlled [Marble bag deep dive @00:00] [Control randomness short @00:00].
- **Score:** kill value × combo multiplier (×1 to ×8; +1 per 5 chained kills within 2.5 s; a hit resets it), +2 per mote, and a dawn bonus of 2,000 + 10 × your remaining light.
- **Meta:** only your best score and a 7-step rank ladder (Flicker → Candle → Lantern → Bonfire → Beacon → Sunrise → Dawnbringer at 100k). There's no persistent power, so no grind [Why games feel grindy @00:34]. The reason to replay is mastery and the next rank, which the end screen shows with "N points to reach X."

## 6. Key formulas and tuning (all in `prototype/logic.js` → `CFG`, `ETYPE`, `HOURS`)
- Burn DPS: `20 · (0.5 + 0.5·(1 − d/R)) · (1 + clamp((110 − R)/88 · 0.6, 0, 0.6)) · (1 + 0.4·sear)`
- Fade per second: `(1.0 + 0.006·R) · (1 + 0.6·t/180)`, never below R = 40
- Flare: cost `max(15, 0.26R)·[1, .65, .5][afterglow]`, radius `150 + 1.55R`, damage `(75 + 0.45R)·(1 − 0.4·d/radius)`
- **Rigged near-loss** [How hard should your game be short @00:33]: below R = 52, hits deal 30% less, and a "pity mote" appears 90–170 px away every 1.6 s. Below R = 110 the light burns hotter. None of this is announced.
- **Drops** use a deterministic accumulator rather than a coin flip (shade = 0.15 motes, so exactly 3 drops per 20 kills): randomness with memory [Four ways to control randomness @05:36].
- Spawn budget per second = `HOURS[h].rate × (1 + 0.25·progress in the hour) × 3.4`. Rates by hour: 0.35 / 1.2 / 1.9 / 2.6 / 2.0 (Gloom hour, lighter) / 3.6.

## 7. Game-feel goals and how they're met
| Goal | Implementation | KB |
|---|---|---|
| Zero-latency movement | Velocity reaches input in ~50 ms (exp. smoothing k = 18), no wind-up, 120 Hz fixed step | [Responsive game feel short @01:30] |
| Shake like salt | Vertical only, ≤0.12 s, only on hits, Flares, and the boss kill (not every pop); toggle with K or the "shake" button, saved | [Camera shake @01:07] [Camera shake @05:14] |
| Health where the eyes are | The light's edge is the health bar: a dashed ring pulses red when low, plus a red vignette, a heartbeat, and a deliberately harsh hit sound | [Sci-Fi Vampire Survivors lessons @12:51] |
| Layered hit feedback | Kill: white flash, ash and ember particles, a "+pts" pop, a rising pentatonic note per combo step. Flare: shockwave rings, a full-screen light flash, a temporary light hole, hit-stop, knockback, a boom | [Slow-motion game feel short @00:00] |
| Audio reinforces rules | Sizzle only while something burns; rising chimes on mote streaks; distinct wind-up sounds for Lurkers and the Gloom; music at 96 BPM that intensifies with the hour | [Survival game (Seymour) jam @09:44] [Sci-Fi Vampire Survivors lessons @03:22] |
| Programmer art that looks intentional | Darkness map with radial light holes, additive glow sprites, bioluminescent mushrooms, glowing eyes in the dark, serif titles | [Sci-Fi Vampire Survivors lessons @04:29] [Game company with beginners @03:17] |
| Teach by doing | One contextual hint at a time (move → burn → hit → flare), each retired once it's been shown | [Starfield spotlight @04:50] [Virtual Escape Room jam recap @08:34] |
| Every death is a micro-victory | The end screen shows a night-progress bar with your previous attempt marked, "% of the night," the score count-up, and the next rank | [Cuphead fun-type short @00:49] |

## 8. Scope (what's in, and what was cut on purpose [Too many good ideas short @00:00])
**In:** 1 arena (a 1,500 px-radius forest), 4 enemies + 1 boss, 9 upgrades, title / pause / kindle / end screens, keyboard, mouse, and touch (virtual stick + FLARE button), saved best score and settings, procedural audio, and a test harness.
**Cut:** persistent unlocks, multiple characters, biomes, obstacles and collision geometry, story, leaderboards, and the loot and armor scaffolding (v1's mistake).

## 9. Principle → feature traceability
| # | Cheng principle (KB) | Glimmer feature |
|---|---|---|
| 1 | Emotion first [Gruul musical-chairs short @00:00] | "Dread → defiance" chose the light-as-life verb before any mechanic |
| 2 | Light as a resource; Priestess light = health; flares give agency [Twitch-chat jam (Deliver Us From Evil) @03:18] | Light radius = HP = vision = weapon; Flare |
| 3 | Mechanics reinforce fantasy; penalties the fantasy explains [Dave the Diver spotlight @05:11] [Dave the Diver spotlight @06:17] | Light fades, a small flame burns hotter, dawn kills shadows |
| 4 | Player-controlled risk and reward (weight × oxygen) [Dave the Diver spotlight @06:49] | Motes out in the dark; Flare spends HP for power |
| 5 | Feedback where the eyes are, plus an obnoxious sound [Sci-Fi Vampire Survivors lessons @12:51] | Light ring = health bar; harsh hit sound; red vignette |
| 6 | Cut anticipation frames [Responsive game feel short @01:30] | Instant movement; Flare fires on the press frame |
| 7 | Camera shake = salt; vertical, ≤0.1 s [Camera shake @01:07] | Vertical-only 0.12 s shake on big events; toggle |
| 8 | Cone spawns ahead of movement [Sci-Fi Vampire Survivors lessons @05:36] | Spawn cone re-aimed toward your heading |
| 9 | Upgrades need a clear, unique property [Sci-Fi Vampire Survivors lessons @06:42] | 9 single-niche upgrades |
| 10 | Marble bag / randomness with memory [Marble bag deep dive @00:00] [Four ways to control randomness @00:34] | Upgrade offer bag; deterministic drop accumulator; pity motes |
| 11 | Power fantasy is secretly easier [How hard should your game be short @00:33] | Hidden damage reduction and pity motes at low light |
| 12 | Big threat → big tell → required answer [Prophet Skeram short @00:00] | Gloom inhale → Flare stagger ×3 |
| 13 | Suspense beat before the payoff [Gruul musical-chairs short @02:02] | 1.5 s inhale tell; 0.6 s Lurker wind-up |
| 14 | Hard caps over panicky soft penalties [Loatheb short @01:05] | Fading has a hard floor at 40; you can't flare yourself to death |
| 15 | Don't rely on color alone [Sci-Fi Vampire Survivors lessons @11:40] | Lurker tell = shrink + dashed line + sound; boss = range ring + text |
| 16 | Micro-victories on death [Cuphead fun-type short @00:49] | Night-progress bar with your last attempt marked; Gloom HP ring |
| 17 | Grind = attention on future rewards [Why games feel grindy @00:34] | No persistent power; all rewards land inside the 3-minute run |
| 18 | Numbers going up and to the right [Vampire Survivors one-word short @00:27] | Combo ×8, score pops, Kindle every ~20 s |
| 19 | Music as a mechanic clock [Sci-Fi Vampire Survivors lessons @03:22] | 96 BPM bed; intensity layers by hour; hour banners |
| 20 | Visual + audio feedback teach rules [Survival game (Seymour) jam @09:44] | Sizzle only while burning; burning rim on shadows |
| 21 | Nudges: an on-screen goal is hard to ignore [Starfield spotlight @04:50] | Kindle bar; "N points to the next rank" |
| 22 | Design for what players actually do [Loatheb short @00:32] | Bot sims at 6 skill levels drove tuning (§10) |
| 23 | Ship small, playable early; tissue test [Game Jam tips 1-5 @06:25] [Tissue test short @00:00] | One 3-minute mode; human tissue test is the next step |

## 10. Tuning evidence (bot simulation, 60 seeds per row; `prototype/test/sim.js`)
See the table in `prototype/test/SIM_RESULTS.md`. Targets: an idle player survives the first hour but dies by 2–3 AM, a novice reaches dawn in about 25–40% of runs, an average player about 60–70%, and an expert about 100%. Most runs should still include a near-loss (light < 40).

| Bot (60 seeds each) | Reached dawn | Median survival | Median score | Gloom banished | Runs with a near-loss | Average light R |
|---|---|---|---|---|---|---|
| Idle (never moves) | 0% | 75 s (2:30 AM) | 11k | 0% | 100% | 97 |
| Random input | 0% | 20 s | 68 | 0% | 100% | 60 |
| Novice (slow, noisy, distracted) | 23% | 115 s (3:50 AM) | 24k | 23% | 93% | 96 |
| Average | 65% | dawn | 67k | 45% | 90% | 91 |
| Sharp | 80% | dawn | 79k | 70% | 90% | 87 |
| Expert (smart upgrade picks) | 98% | dawn | 84k | 70% | 68% | 87 |

Opening check: standing still, the first shadow pops at about 2.6 s, and 5–6 pop with zero hits by 12 s.

## 11. Risks and next steps
1. **Bots aren't people.** The difficulty curve is bot-validated only. Next: a 3-person tissue test, without coaching, asking testers to say what they feel out loud [Tissue test short @00:22].
2. **Upgrade balance:** light-economy upgrades (Lodestar, Afterglow, Phoenix) beat pure damage ones in sims. Searing Glow and Wider Halo underperform.
3. **Late-game readability:** at 5 AM the screen can hold 100+ shadows. It needs a human check for visual noise.
4. **Replay depth** past ~10 runs is unproven (one arena). Candidates: daily seed, a "Long Night" hard mode, a second biome.

---
**URL key** (`https://www.youtube.com/watch?v=<ID>&t=<s>s`): Gruul musical-chairs short LsY3FHxBVgw · Three questions short GowOfSAODdQ · How hard should your game be short 6sejMX_vdHU · Beat Saber one-word short f7VkUSWYJPw · Cuphead fun-type short YXb2jOoJ6ck · Vampire Survivors one-word short V4vPnB4Hcss · Board game insiders qG3oX9H8RAo · Dave the Diver spotlight V9SpGLY2iBM · Magic Find short kJ08SA90Cwg · Sci-Fi Vampire Survivors lessons re10Zp6cb1c · Prophet Skeram short o0dR_AaEstw · Marble bag deep dive mKVGrWrEqLQ · Control randomness short 2anY9ICA-Pg · Four ways to control randomness AYOzD0Sxt4A · Why games feel grindy 9UpeKknwayc · Responsive game feel short jl7OYBo_oIU · Camera shake lp-AnYMGpQs · Slow-motion game feel short xiwG4HwW8H0 · Survival game (Seymour) jam xr0wY9LtnPU · Game company with beginners l51KtTf5N0I · Starfield spotlight nYiIt5eoN-o · Virtual Escape Room jam recap R_bWn3H6msA · Too many good ideas short ylcd0Yryk74 · Twitch-chat jam (Deliver Us From Evil) m_mgtRhVLDg · Loatheb short NksxgFq6eAg · Game Jam tips 1-5 3N_ikDs0WYI · Tissue test short FgbdQS4pLHA
