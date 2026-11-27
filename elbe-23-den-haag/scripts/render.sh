#!/usr/bin/env bash
# Rendert body 1 één keer en elke hook los (zonder audio), plakt hook + body met ffmpeg -c copy aan elkaar
# en mixt de audio (voice-over eleven_v4 + muziekbed met ducking). Uitvoer: out/Elbe 23 - Body 1 Hook N.mp4
set -euo pipefail
cd "$(dirname "$0")/.."
BROWSER="${REMOTION_BROWSER:-$(ls /opt/pw-browsers/chromium_headless_shell-*/chrome-headless-shell-linux64/chrome-headless-shell 2>/dev/null | head -1)}"
ARGS=(--codec=h264 --crf=24 --muted --concurrency=2 --pixel-format=yuv420p --offthreadvideo-cache-size-in-bytes=536870912)
[ -n "$BROWSER" ] && ARGS+=(--browser-executable="$BROWSER")
mkdir -p out/seg
pids=()
[ -f out/seg/body-b1.mp4 ] || npx remotion render src/index.ts Body-b1 out/seg/body-b1.mp4 "${ARGS[@]}" > out/seg/body-b1.log 2>&1 & pids+=($!)
for h in 1 2 3 4 5; do
  npx remotion render src/index.ts Hook-b1h$h out/seg/hook-b1h$h.mp4 "${ARGS[@]}" > out/seg/hook-b1h$h.log 2>&1
done
for p in "${pids[@]}"; do wait "$p"; done
python3 scripts/assemble.py
