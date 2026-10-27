#!/bin/bash
# Rendert de beelddelen (1080x1920, zonder audio): 10 hooks + 2 bodies, daarna scripts/mix.sh per video.
# Gebruik: CHROME=/pad/naar/chrome bash scripts/render.sh
set -e
cd "$(dirname "$0")/.."
CHROME=${CHROME:-/opt/pw-browsers/chromium-1243/chrome-linux64/chrome}
mkdir -p out/parts
for id in b1-body b2-body b1-h1 b1-h2 b1-h3 b1-h4 b1-h5 b2-h1 b2-h2 b2-h3 b2-h4 b2-h5; do
  [ -f out/parts/$id.mp4 ] && continue
  npx remotion render src/index.ts $id out/parts/$id.mp4 --browser-executable=$CHROME --concurrency=2 --crf=24 --pixel-format=yuv420p --muted --log=error
done
