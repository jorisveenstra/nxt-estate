#!/usr/bin/env bash
# Rendert de 5 video's (twee tegelijk), 1080x1920, faststart
cd "$(dirname "$0")/.."
r() { npx remotion render src/index.ts Body1-Hook$1 out/Body1-Hook$1.mp4 --browser-executable=/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell --concurrency=2 --crf=24 --codec=h264 --pixel-format=yuv420p --audio-codec=aac --x264-preset=medium --enable-multiprocess-on-linux > out/log$1.txt 2>&1; }
(r 1; r 3; r 5) &
(r 2; r 4) &
wait
