#!/bin/bash
# render één video: scripts/render.sh b1h1
k=$1; id="Body${k:1:1}-Hook${k:3:1}"; mkdir -p out2
cd "$(dirname "$0")/.."
npx remotion render src/index.ts "$id" "out2/$k.mp4" --concurrency=2 --crf=25 --browser-executable=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome --chrome-mode=chrome-for-testing > "out2/$k.log" 2>&1 && \
 ffmpeg -v error -y -i "out2/$k.mp4" -c copy -movflags +faststart "out2/$k.fs.mp4" && mv "out2/$k.fs.mp4" "out2/$k.mp4" && echo "klaar $k"
