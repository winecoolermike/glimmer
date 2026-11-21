# Headless playtest for Glimmer (Chrome via Playwright).
# 1) loads the page from file:// and checks for zero JS errors
# 2) drives REAL keyboard / mouse / touch input through the normal input path
# 3) runs scripted bot playthroughs to a win and to a loss, capturing screenshots
# 4) cross-checks the difficulty sim inside the browser
import asyncio, json, pathlib
from playwright.async_api import async_playwright
ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT
URL = (ROOT / "index.html").as_uri()
RESULT = {"errors": [], "checks": {}}

STEP_UNTIL = """([cond, maxT, pick]) => { const G = GLIMMER; const f = new Function('G', 'return ' + cond); let n = 0;
  while (!f(G) && n < maxT * 120 && G.state !== 'over') { if (G.state === 'kindle' && pick) G.choose(0); G.update(1/120); n++; }
  G.shakeT = 0; G.snapCam = true; return { state: G.state, t: G.t, R: G.p.R, score: G.score }; }"""

async def shot(pg, name, wait=200):
    await pg.wait_for_timeout(wait)
    await pg.screenshot(path=str(OUT / name))

async def main():
    async with async_playwright() as p:
        br = await p.chromium.launch(executable_path='/usr/bin/google-chrome', headless=True, args=['--autoplay-policy=no-user-gesture-required'])
        ctx = await br.new_context(viewport={"width": 1280, "height": 760})
        pg = await ctx.new_page()
        pg.on("pageerror", lambda e: RESULT["errors"].append("pageerror: " + str(e)))
        pg.on("console", lambda m: RESULT["errors"].append("console: " + m.text) if m.type == "error" else None)
        await pg.goto(URL); await pg.wait_for_timeout(900)
        await shot(pg, "screenshot_title.png")
        RESULT["checks"]["title_state"] = await pg.evaluate("GLIMMER.state")

        # --- real input: press Space to start, hold D/W, flare with Space, pause/mute/shake keys
        await pg.keyboard.press("Space"); await pg.wait_for_timeout(300)
        st = await pg.evaluate("({s: GLIMMER.state, x: GLIMMER.p.x})")
        await pg.keyboard.down("d"); await pg.wait_for_timeout(700); await pg.keyboard.up("d")
        await pg.keyboard.down("w"); await pg.wait_for_timeout(400); await pg.keyboard.up("w")
        moved = await pg.evaluate("Math.hypot(GLIMMER.p.x, GLIMMER.p.y)")
        f0 = await pg.evaluate("GLIMMER.flares"); await pg.keyboard.press("Space"); await pg.wait_for_timeout(200); f1 = await pg.evaluate("GLIMMER.flares")
        # mouse hold-to-move
        before = await pg.evaluate("({x: GLIMMER.p.x, y: GLIMMER.p.y})")
        await pg.mouse.move(1200, 380); await pg.mouse.down(); await pg.wait_for_timeout(500); await pg.mouse.up()
        after = await pg.evaluate("({x: GLIMMER.p.x, y: GLIMMER.p.y})")
        await pg.keyboard.press("k"); shake_off = await pg.evaluate("GLIMMER.settings.shake"); await pg.keyboard.press("k")
        await pg.keyboard.press("p"); paused = await pg.evaluate("GLIMMER.state"); await pg.keyboard.press("p")
        await pg.keyboard.press("m"); muted = await pg.evaluate("GLIMMER.settings.muted"); await pg.keyboard.press("m")
        RESULT["checks"]["real_input"] = {"started": st["s"] == "play", "moved_px_keyboard": round(moved), "flare_on_space": f1 == f0 + 1,
            "mouse_moved_px": round(after["x"] - before["x"]), "shake_toggle_works": shake_off is False, "pause_works": paused == "paused", "mute_toggle_works": muted is True}
        # random keyboard mashing in real time for 12 s (zero errors expected)
        import random; random.seed(3)
        for _ in range(40):
            k = random.choice(["w", "a", "s", "d", "ArrowUp", "ArrowLeft"]); await pg.keyboard.down(k); await pg.wait_for_timeout(random.randint(80, 400)); await pg.keyboard.up(k)
            if random.random() < 0.2: await pg.keyboard.press("Space")
            if await pg.evaluate("GLIMMER.state") == "kindle": await pg.keyboard.press("1")
        RESULT["checks"]["random_realtime"] = await pg.evaluate("({state: GLIMMER.state, t: +GLIMMER.t.toFixed(1), score: GLIMMER.score, kills: GLIMMER.kills})")

        # --- scripted WIN run (sharp bot), screenshots along the way
        await pg.add_script_tag(path=str(ROOT / "test/bots.js"))
        win = None
        for seed in [11, 12, 13, 14, 15, 16, 17, 18]:
            ok = await pg.evaluate("s => GLIMMER.simulate(s, GLIMMER_BOTS.heuristic(0.8), GLIMMER_BOTS.pickFirst).won && GLIMMER.simulate(s, GLIMMER_BOTS.heuristic(0.8), GLIMMER_BOTS.pickFirst).gloomKilled", seed)
            if ok: win = seed; break
        RESULT["checks"]["win_seed"] = win
        await pg.evaluate("s => { const G = GLIMMER; G.start(); G.newGame(s); G.externalStep = true; G.bot = GLIMMER_BOTS.heuristic(0.8); }", win)
        await pg.evaluate(STEP_UNTIL, ["G.t > 50 && G.enemies.length > 12 && G.p.R > 90", 120, True]); await shot(pg, "screenshot_gameplay.png")
        await pg.evaluate(STEP_UNTIL, ["G.state === 'kindle'", 120, False]); await shot(pg, "screenshot_kindle.png", 500)
        await pg.evaluate("GLIMMER.choose(0); Object.keys(GLIMMER.hints).forEach(k => GLIMMER.hints[k] = 2)")
        await pg.evaluate(STEP_UNTIL, ["G.t > 100 && G.flares > 0 && G.rings.length > 1", 80, True]); await shot(pg, "screenshot_flare.png", 60)
        r = await pg.evaluate(STEP_UNTIL, ["G.enemies.some(e => e.type === 'gloom' && (e.state === 'inhale') && Math.hypot(e.x - G.p.x, e.y - G.p.y) < 420)", 80, True]); await shot(pg, "screenshot_gloom.png", 60)
        RESULT["checks"]["gloom_shot"] = r
        await pg.evaluate(STEP_UNTIL, ["G.state === 'dawn' && G.endTimer > 1.2", 120, True]); await shot(pg, "screenshot_dawn.png", 60)
        end = await pg.evaluate(STEP_UNTIL, ["G.state === 'over'", 30, True]); await shot(pg, "screenshot_end_win.png", 1600)
        RESULT["checks"]["win_run"] = await pg.evaluate("({state: GLIMMER.state, won: GLIMMER.won, score: GLIMMER.score, rank: GLIMMER.rankFor(GLIMMER.score)[1], kills: GLIMMER.kills, gloomKilled: GLIMMER.gloomKilled, picks: GLIMMER.picks})")
        # restart via real key from the end screen
        await pg.evaluate("GLIMMER.externalStep = false; GLIMMER.bot = null;")
        await pg.keyboard.press("r"); await pg.wait_for_timeout(200)
        RESULT["checks"]["restart_from_end"] = await pg.evaluate("GLIMMER.state")

        # --- scripted LOSS run (novice bot) to the death screen
        loss = None
        for seed in range(21, 60):
            rr = await pg.evaluate("s => GLIMMER.simulate(s, GLIMMER_BOTS.heuristic(0.2), GLIMMER_BOTS.pickFirst)", seed)
            if not rr["won"] and rr["t"] > 60: loss = seed; break
        await pg.evaluate("s => { const G = GLIMMER; G.start(); G.newGame(s); G.externalStep = true; G.bot = GLIMMER_BOTS.heuristic(0.2); Object.keys(G.hints).forEach(k => G.hints[k] = 2); }", loss)
        await pg.evaluate(STEP_UNTIL, ["G.p.R < G.CFG.lowLight && G.enemies.length > 6", 200, True]); await shot(pg, "screenshot_lowlight.png", 60)
        await pg.evaluate(STEP_UNTIL, ["G.state === 'over'", 200, True]); await shot(pg, "screenshot_end_loss.png", 1600)
        RESULT["checks"]["loss_run"] = await pg.evaluate("({seed: GLIMMER.seed, state: GLIMMER.state, won: GLIMMER.won, diedAt: GLIMMER.clock(GLIMMER.reachedT), score: GLIMMER.score})")

        # --- in-browser difficulty cross-check (same code path as Node sim)
        RESULT["checks"]["browser_sim"] = await pg.evaluate("""() => { const B = GLIMMER_BOTS, out = {};
          for (const [n, mk, pk] of [['idle', () => B.idle(), B.pickFirst], ['random', () => B.random(), B.pickFirst], ['novice', () => B.heuristic(0.2), B.pickFirst], ['average', () => B.heuristic(0.5), B.pickFirst], ['expert', () => B.heuristic(1), B.pickSmart]]) {
            const rs = []; for (let s = 1; s <= 12; s++) rs.push(GLIMMER.simulate(900 + s, mk(), pk));
            out[n] = { winPct: Math.round(rs.filter(r => r.won).length / rs.length * 100), avgT: Math.round(rs.reduce((a, r) => a + r.t, 0) / rs.length) }; }
          return out; }""")
        await ctx.close()

        # --- touch device: tap to start, drag stick, tap flare button
        tctx = await br.new_context(viewport={"width": 420, "height": 860}, has_touch=True, is_mobile=True, device_scale_factor=2)
        tp = await tctx.new_page()
        tp.on("pageerror", lambda e: RESULT["errors"].append("touch pageerror: " + str(e)))
        await tp.goto(URL); await tp.wait_for_timeout(600)
        await tp.touchscreen.tap(210, 600); await tp.wait_for_timeout(300)
        cdp = await tctx.new_cdp_session(tp)
        await cdp.send("Input.dispatchTouchEvent", {"type": "touchStart", "touchPoints": [{"x": 200, "y": 500, "id": 1}]})
        for i in range(12):
            await cdp.send("Input.dispatchTouchEvent", {"type": "touchMove", "touchPoints": [{"x": 200 + i * 5, "y": 500, "id": 1}]}); await tp.wait_for_timeout(50)
        await tp.wait_for_timeout(400)
        await cdp.send("Input.dispatchTouchEvent", {"type": "touchEnd", "touchPoints": []})
        tx = await tp.evaluate("GLIMMER.p.x")
        f0 = await tp.evaluate("GLIMMER.flares"); await tp.touchscreen.tap(420 - 74, 860 - 84); await tp.wait_for_timeout(200); f1 = await tp.evaluate("GLIMMER.flares")
        await tp.wait_for_timeout(1200); await tp.screenshot(path=str(OUT / "screenshot_mobile.png"))
        RESULT["checks"]["touch"] = {"state": await tp.evaluate("GLIMMER.state"), "dragged_right_px": round(tx), "flare_button": f1 == f0 + 1}
        await tctx.close(); await br.close()
    (ROOT / "test/playtest_result.json").write_text(json.dumps(RESULT, indent=1))
    print(json.dumps(RESULT, indent=1))
asyncio.run(main())
