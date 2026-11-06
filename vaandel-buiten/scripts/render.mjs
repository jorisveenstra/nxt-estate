// Rendert alle compositions (Body1, Body1-Hook1 ...) als stille, staande 1080x1920 MP4's (h264, CRF 22) naar out/.
// Gebruik: node scripts/render.mjs [id ...]   Omgeving: BROWSER=<pad naar chromium>, CONCURRENCY=2 (aantal parallelle renders)
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import path from "node:path";
import fs from "node:fs";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const browserExecutable = process.env.BROWSER || undefined;
const ids = process.argv.slice(2).length ? process.argv.slice(2) : [
  "Body1", "Body2",
  ...[1, 2].flatMap((b) => [1, 2, 3, 4, 5].map((h) => `Body${b}-Hook${h}`)),
];
fs.mkdirSync(path.join(root, "out"), { recursive: true });
const serveUrl = await bundle({ entryPoint: path.join(root, "src/index.ts"), publicDir: path.join(root, "public") });
const parallel = Number(process.env.CONCURRENCY || 2);
let next = 0;
const worker = async () => {
  while (next < ids.length) {
    const id = ids[next++];
    const outputLocation = path.join(root, "out", `${id}.mp4`);
    if (fs.existsSync(outputLocation) && !process.env.FORCE) { console.log("bestaat al", id); continue; }
    const t0 = Date.now();
    const composition = await selectComposition({ serveUrl, id, browserExecutable });
    await renderMedia({
      composition, serveUrl, codec: "h264", outputLocation, browserExecutable, crf: 22, pixelFormat: "yuv420p", x264Preset: "fast",
      imageFormat: "jpeg", jpegQuality: 92, muted: true, concurrency: 2, hardwareAcceleration: "disable", offthreadVideoCacheSizeInBytes: 300 * 1024 * 1024,
    });
    console.log("klaar", id, ((Date.now() - t0) / 1000).toFixed(0) + "s", composition.durationInFrames + " frames");
  }
};
await Promise.all(Array.from({ length: parallel }, worker));
console.log("alles gerenderd");
