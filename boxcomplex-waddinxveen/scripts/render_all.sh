#!/usr/bin/env bash
# Rendert elk segment één keer (5 hooks per body + 1 body), zonder audio; mix.sh voegt daarna VO + muziek toe.
# Gebruik: BROWSER=/pad/naar/chrome-headless-shell bash scripts/render_all.sh
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p out/seg
BX=${BROWSER:+--browser-executable=$BROWSER}
SEGS=$(node -e 'const p=require("./src/plan.json");console.log(Object.keys(p.segments).join(" "))')
printf '%s\n' $SEGS | xargs -P 2 -I{} sh -c 'id=$(echo {} | tr _ -); [ -s out/seg/{}.mp4 ] || npx remotion render Seg-$id out/seg/{}.mp4 --muted --codec=h264 --crf=24 --concurrency=2 --x264-preset=medium --log=error '"$BX"' && echo "segment {} klaar"'
