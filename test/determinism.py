# Does a rendered in-browser replay match the headless sim for the same seed + bot?
import asyncio, json, pathlib
from playwright.async_api import async_playwright
ROOT = pathlib.Path(__file__).resolve().parent.parent
async def main():
    async with async_playwright() as p:
        br = await p.chromium.launch(executable_path='/usr/bin/google-chrome', headless=True)
        pg = await br.new_page(viewport={"width": 1280, "height": 760})
        await pg.goto((ROOT / "index.html").as_uri()); await pg.wait_for_timeout(500)
        await pg.add_script_tag(path=str(ROOT / "test/bots.js"))
        out = []
        for seed in [22, 23, 24]:
            a = await pg.evaluate("s => { const r = GLIMMER.simulate(s, GLIMMER_BOTS.heuristic(0.2), GLIMMER_BOTS.pickFirst); return [r.t, r.score, r.kills]; }", seed)
            b = await pg.evaluate("""s => { const G = GLIMMER; G.start(); G.newGame(s); G.externalStep = true; G.bot = GLIMMER_BOTS.heuristic(0.2);
                let n = 0; while (G.state !== 'over' && n < 400*120) { if (G.state === 'kindle') G.choose(0); G.update(1/120); n++; }
                G.externalStep = false; G.bot = null; return [+(G.reachedT).toFixed(1), G.score, G.kills]; }""", seed)
            out.append({"seed": seed, "headless": a, "rendered": b, "match": a == b})
        print(json.dumps(out)); await br.close()
asyncio.run(main())
