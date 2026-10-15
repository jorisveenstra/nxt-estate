// Stills voor controle: node scripts/stills.mjs <browser> <compositie> <seconden,seconden,...> [uitmap]
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import path from "node:path";
const [browser, id, secs, out = "/tmp/stills"] = process.argv.slice(2);
const root = path.resolve(import.meta.dirname, "..");
const serveUrl = await bundle({ entryPoint: path.join(root, "src/index.ts"), webpackOverride: (c) => c });
const comp = await selectComposition({ serveUrl, id, browserExecutable: browser });
for (const s of secs.split(",")) {
  const frame = Math.min(comp.durationInFrames - 1, Math.round(parseFloat(s) * 30));
  await renderStill({ composition: comp, serveUrl, frame, output: `${out}/${id}-${String(s).replace(".", "_")}.jpg`, imageFormat: "jpeg", browserExecutable: browser });
}
console.log("klaar", comp.durationInFrames);
