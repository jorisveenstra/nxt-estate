#!/bin/bash
cd "$(dirname "$0")"
CH=${CHROME:-/opt/pw-browsers/chromium-1243/chrome-linux64/chrome}
for h in "$@"; do npx remotion render Body1-Hook$h out/singelkwartier-body1-hook$h.mp4 --browser-executable=$CH --chrome-mode=chrome-for-testing --concurrency=2 --crf=24 --audio-codec=aac || exit 1; done
