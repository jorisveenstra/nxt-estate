#!/usr/bin/env bash
# Body 2: vijf video's na elkaar (twee parallelle renders gaven geheugenproblemen)
cd "$(dirname "$0")/.."
for h in 1 2 3 4 5; do npx remotion render src/index.ts Body2-Hook$h out/Body2-Hook$h.mp4 --browser-executable=/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell --concurrency=3 --crf=24 --codec=h264 --pixel-format=yuv420p --audio-codec=aac --x264-preset=medium --enable-multiprocess-on-linux > out/log-b2h$h.txt 2>&1; done
