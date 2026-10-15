// Rendert alle video's uit src/config.ts (VIDEOS) naar out/ met faststart. Optioneel: BROWSER=<pad naar chrome(-headless-shell)>
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync } from "node:fs";

mkdirSync("out", { recursive: true });
const cfg = readFileSync("src/config.ts", "utf8");
const list = [...cfg.matchAll(/body: (\d+), hook: (\d+)/g)].map((m) => [m[1], m[2]]);
for (const [b, h] of list) {
  const id = `Body${b}-Hook${h}`;
  const args = ["remotion", "render", id, `out/${id}.tmp.mp4`, "--codec=h264", "--crf=23", "--audio-codec=aac", "--audio-bitrate=192k"];
  if (process.env.BROWSER) args.push(`--browser-executable=${process.env.BROWSER}`);
  execFileSync("npx", args, { stdio: "inherit" });
  execFileSync("ffmpeg", ["-v", "error", "-y", "-i", `out/${id}.tmp.mp4`, "-c", "copy", "-movflags", "+faststart", `out/${id}.mp4`]);
  import("node:fs").then((fs) => fs.unlinkSync(`out/${id}.tmp.mp4`));
}
