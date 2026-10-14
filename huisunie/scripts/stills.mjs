// Controlebeelden: rendert per scène het laatste moment (alles in beeld) als jpg.
// Gebruik: node scripts/stills.mjs <uitmap> b1h1 b2h1 ...
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import fs from "fs";
import path from "path";
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const out = process.argv[2];
const keys = process.argv.slice(3);
const T = JSON.parse(fs.readFileSync(`${root}/src/timing.json`));
const serveUrl = await bundle({ entryPoint: `${root}/src/index.ts` });
for (const key of keys) {
  const b = Number(key[1]), h = Number(key[3]);
  const inputProps = { body: b, hook: h };
  const comp = await selectComposition({ serveUrl, id: `Body${b}-Hook${h}`, inputProps });
  const sc = T[key].scenes;
  for (let i = 0; i < sc.length; i++) {
    const next = i + 1 < sc.length ? sc[i + 1].start : T[key].end + 2;
    const frame = Math.min(comp.durationInFrames - 1, Math.round((next - (sc[i].id === "cta" ? 0.5 : 0.45)) * 30));
    await renderStill({ composition: comp, serveUrl, inputProps, output: `${out}/${key}-${String(i).padStart(2, "0")}-${sc[i].id}.jpg`, frame, imageFormat: "jpeg", jpegQuality: 70, scale: 0.3 });
  }
  console.log(key, "ok");
}
fs.rmSync(serveUrl, { recursive: true, force: true });
