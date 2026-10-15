// Rendert alle video's (Body1/2 x Hook1-5) met één bundel. Gebruik: node scripts/render_all.mjs [browserExecutable] [compositie ...]
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const browserExecutable = process.argv[2] && process.argv[2] !== "-" ? process.argv[2] : undefined;
const ids = process.argv.slice(3).length ? process.argv.slice(3) : [1, 2].flatMap((b) => [1, 2, 3, 4, 5].map((h) => `Body${b}-Hook${h}`));
const serveUrl = await bundle({ entryPoint: path.join(root, "src/index.ts") });
fs.mkdirSync(path.join(root, "out"), { recursive: true });
for (const id of ids) {
  const out = path.join(root, "out", `dok-schiebroek-${id.toLowerCase()}.mp4`);
  if (fs.existsSync(out)) continue;
  const composition = await selectComposition({ serveUrl, id, browserExecutable });
  await renderMedia({ composition, serveUrl, codec: "h264", crf: 21, outputLocation: out + ".part.mp4", browserExecutable, concurrency: 4, imageFormat: "jpeg", logLevel: "error" });
  fs.renameSync(out + ".part.mp4", out);
  console.log("klaar", id, fs.statSync(out).size);
}
