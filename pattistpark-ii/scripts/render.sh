#!/usr/bin/env bash
# gebruik: scripts/render.sh <hook...>  (renders met 2 cores per render)
cd "$(dirname "$0")/.."
for h in "$@"; do
  npx remotion render src/index.ts Body1-Hook$h out/body1-hook$h.mp4 --browser-executable=/opt/pw-browsers/chromium --concurrency=3 --offthreadvideo-cache-size-in-bytes=1500000000 --crf=25 --log=error || exit 1
  ffmpeg -v error -y -i out/body1-hook$h.mp4 -c copy -movflags +faststart out/b1h$h.mp4 && mv out/b1h$h.mp4 out/body1-hook$h.mp4
done
