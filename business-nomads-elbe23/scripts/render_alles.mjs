// Bundelt één keer en rendert alle 3 bodies + 15 hooks (staand 1080x1920) naar out/work/. Gebruik: node scripts/render_alles.mjs
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const browserExecutable = process.env.BROWSER || "/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell";
const timing = JSON.parse(fs.readFileSync(path.join(root, "src/timing.json"), "utf8"));
fs.mkdirSync(path.join(root, "out/work"), { recursive: true });
const serveUrl = await bundle({ entryPoint: path.join(root, "src/index.ts"), publicDir: path.join(root, "public") });
const ids = [...Object.keys(timing.bodies).map((b) => `Body-${b}`), ...Object.keys(timing.hooks).map((k) => `Hook-${k}`)];
const only = process.argv.slice(2);
const todo = ids.filter((i) => (only.length ? only.includes(i) : true) && !fs.existsSync(path.join(root, `out/work/${i}.mp4`)));
let next = 0;
const last = {};
async function worker() {
  while (next < todo.length) {
    const id = todo[next++];
    const comp = await selectComposition({ serveUrl, id, browserExecutable, chromeMode: "headless-shell", chromiumOptions: { gl: "swangle" } });
    const tmp = path.join(root, `out/work/${id}.part.mp4`);
    await renderMedia({ composition: comp, serveUrl, codec: "h264", crf: 24, pixelFormat: "yuv420p", audioBitrate: "192k", outputLocation: tmp, concurrency: 4, offthreadVideoCacheSizeInBytes: 1_500_000_000, onProgress: ({ progress }) => { const q = Math.floor(progress * 10); if (q !== last[id]) { last[id] = q; console.log(id, q * 10 + "%"); } }, browserExecutable, chromeMode: "headless-shell", chromiumOptions: { gl: "swangle" }, overwrite: true, timeoutInMilliseconds: 120000 });
    fs.renameSync(tmp, path.join(root, `out/work/${id}.mp4`));
    console.log("klaar", id, new Date().toISOString());
  }
}
await worker();
console.log("ALLES KLAAR");
process.exit(0);
