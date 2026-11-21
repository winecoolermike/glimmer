# v2 Concepts: starting over after "Last Chair Standing"

Jeff's verdict on v1 was "Game is no good, remake a new idea." Before brainstorming, here is what went wrong with v1, so v2 can avoid it:

| v1 problem | Rule for v2 |
|---|---|
| One gimmick lifted almost directly from Gruul | Combine several principles into one core verb. Don't re-skin a single boss. |
| Built mechanics-first, with flat shapes and no juice | Pick a look that procedural art can make beautiful. Juice is part of the scope, not a later polish pass. |
| Heavy loot and armor systems wrapped around one short fight | At most one small reward system inside the run, sized to the content. |
| Difficulty never tuned | Bot simulation across many seeds, with numeric targets. |
| Not fun in the first 10 seconds | Something to do and feel within 2 s of pressing Start. No reading needed. |

Citations use the KB's video labels, for example `[Twitch-chat jam @03:18]`. They resolve to `../knowledge_base.md` (Per-video index) and to the URL key at the bottom of this file.

---

## Brainstorm: 6 concepts in 6 different genres

### A. GLIMMER (arcade survival / micro-roguelite)
You are a small wisp lost in a dark forest for one night. **Your light radius is three things at once: your health, your vision, and your weapon.** Shadows burn while they're inside your glow, touching one dims you, and you can **Flare**, which spends part of your light in a blast that clears the screen. Survive until dawn (about 3 min).
- **Target emotion:** dread that turns into defiance. You go from cowering in a shrinking circle to choosing to brave the dark.
- **KB principles:** light as a resource; the Priestess's light *is* her health; flares give agency without killing tension [Twitch-chat jam @03:18]. Mechanics reinforce fantasy [Dave the Diver spotlight @05:11]. Feedback where the eyes are: the health bar *is* the light around you [Sci-Fi Vampire Survivors lessons @12:51]. Player-controlled risk and reward through greed for motes in the dark [Dave the Diver spotlight @06:49]. Cone pack spawns [Sci-Fi Vampire Survivors lessons @05:36]. Rigged near-loss moments [How hard should your game be @00:33]. Upgrades with unique niches, drawn from a marble bag [Sci-Fi Vampire Survivors lessons @06:42] [Marble bag deep dive @00:00]. A progress bar on death [Cuphead fun-type short @00:49].

### B. PULSE BREAKER (rhythm arcade)
Breakout locked to a 120 BPM track. A paddle hit on the beat fires a piercing "power ball," and bricks pulse with the music. Each stage is a song with a 90-second ending.
- **Target emotion:** sensation. It should feel like playing drums with a ball.
- **KB principles:** Breakout is on the learning ladder [5 beginner games @02:45]. Music as a mechanic clock [Sci-Fi Vampire Survivors lessons @03:22]. Compose the music before the level [Rhythm Runner jam recap @09:30]. "The soundtrack becomes both the reward and the punishment" [Beat Saber one-word short @00:32].

### C. BAG OF OMENS (push-your-luck bag-builder)
A fortune-teller draws marbles from your bag each round. Gold marbles score and cursed ones add up, and three curses means a bust. Between rounds you buy marbles that bend the odds. Each bag is literally a marble-bag RNG, so streaks are visible and controllable.
- **Target emotion:** the "one more draw" gamble, with fair odds you can feel.
- **KB principles:** the marble bag, "randomness with memory" [Marble bag deep dive @00:00]. Four ways to control randomness [Four ways to control randomness @00:34]. Gambler's-fallacy emotions [Control randomness short @00:33]. A single significant decision [Magic Find short @02:15].

### D. KEEPSAKE TOWER (physics stacker)
Stack oddly shaped relics in a wobbly tower before the tide rises. Heavier relics are worth more but make the tower less stable.
- **Target emotion:** held-breath suspense, then relief or a crash.
- **KB principles:** weight versus greed [Dave the Diver spotlight @07:22]. Suspense beats [Gruul musical-chairs short @02:02].

### E. FORGE & FORMULA (idle / incremental)
Run a smithy whose armor numbers are A/(A+K). You commission heroes and watch them survive more hits.
- **Target emotion:** submission ("filling bars with low mental effort").
- **KB principles:** the armor formula, Parts 1 and 2 [Simple Math / Armor Pt 1 short @02:13] [Armor formula Pt 2 short @01:09]. Submission fun [Vampire Survivors one-word short @01:00]. Milestones fight grind [Why games feel grindy @05:37].

### F. SKERAM'S MIRRORS (deduction puzzle-action)
A boss splits into copies, and you deduce which one is real from tells: mana shimmer, pet behavior, shadow lag. Each stage teaches one tell and then removes it.
- **Target emotion:** feeling smart, the escape-room "aha."
- **KB principles:** Skeram's tells and the players who outsmarted them [Prophet Skeram short @02:04]. Clue ordering for the "aha" [Virtual Escape Room jam recap @08:34].

---

## Scoring (1–5; feasibility means "polished solo HTML5 in one sitting")

| Concept | Fun in first 30 s | Depth / replay | Polished-HTML5 feasibility | Originality | **Total** | Notes |
|---|---|---|---|---|---|---|
| **A. Glimmer** | 5 | 4 | 5 | 4 | **18** | Instant: move and things burn. Glow lighting looks great with plain canvas gradients. |
| B. Pulse Breaker | 5 | 3 | 4 | 3 | 15 | Only as good as its music. Procedural music risks sounding cheap. |
| C. Bag of Omens | 3 | 4 | 5 | 3 | 15 | Close to *Quacks of Quedlinburg*. Slow start, since the first 30 s is reading odds. |
| D. Keepsake Tower | 4 | 2 | 3 | 2 | 11 | Needs a physics engine to feel right. Shallow. |
| E. Forge & Formula | 1 | 3 | 5 | 2 | 11 | Fails "fun in 10 s." It's a formula with a game wrapped around it, the same trap as v1. |
| F. Skeram's Mirrors | 2 | 2 | 4 | 4 | 12 | It's a riddle, so it can be solved once. Also too literal a boss lift, the v1 mistake again. |

## Pick: **A. Glimmer**

1. **Fun in the first 10 seconds.** Shadows drift in, sizzle, and pop as soon as you move. The rule "stay lit, stay alive" can be learned without reading.
2. **One verb, several principles working together.** The single light radius carries health, vision, offense, and the risk/reward of the Flare, and it shows your health where your eyes already are. This isn't one boss gimmick. It's a fusion of the jam's light-as-health idea, Dave the Diver's fantasy-driven resources and greed, and Celestial Survivors' spawning and upgrade lessons.
3. **Looks good with procedural art.** Darkness, glow, embers, and silhouettes of eyes are the strengths of a programmer-artist ("lean into geometric/programmatic VFX" [Game company with beginners @03:17]; "full-screen bloom (<1 min)" [Sci-Fi Vampire Survivors lessons @04:29]).
4. **Sized correctly.** A 3-minute run with a mid-run "hour" cadence, one boss-like event (the Gloom), a dawn payoff, and a score and rank. The only meta is your best score, so there's no loot or armor scaffolding.
5. **Tunable with bots.** Survival time, win rate, and near-loss frequency are all measurable in simulation.

Runner-up: **B. Pulse Breaker**. Worth revisiting if Jeff wants a pure "sensation" game. Its music dependency is the main risk.

---
### URL key (YouTube IDs)
Twitch-chat jam (Deliver Us From Evil) = m_mgtRhVLDg · Dave the Diver spotlight = V9SpGLY2iBM · Sci-Fi Vampire Survivors lessons = re10Zp6cb1c · How hard should your game be = 6sejMX_vdHU · Marble bag deep dive = mKVGrWrEqLQ · Cuphead fun-type short = YXb2jOoJ6ck · 5 beginner games = TyrHYzP8OTU · Rhythm Runner jam recap = 6c-41ghE5yI · Beat Saber one-word short = f7VkUSWYJPw · Four ways to control randomness = AYOzD0Sxt4A · Control randomness short = 2anY9ICA-Pg · Magic Find short = kJ08SA90Cwg · Gruul musical-chairs short = LsY3FHxBVgw · Simple Math / Armor Pt 1 = IzHAjV8YEW4 · Armor formula Pt 2 = HecTqtkoWyg · Vampire Survivors one-word = V4vPnB4Hcss · Why games feel grindy = 9UpeKknwayc · Prophet Skeram short = o0dR_AaEstw · Virtual Escape Room jam recap = R_bWn3H6msA · Game company with beginners = l51KtTf5N0I
(Link format: `https://www.youtube.com/watch?v=<ID>&t=<seconds>s`)
