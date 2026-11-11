#!/usr/bin/env bash
# Rendert alle segmenten (video zonder geluid), 2 tegelijk. Geluid wordt daarna met scripts/mix.py toegevoegd.
CH=${CHROME:-/opt/pw-browsers/chromium-1243/chrome-linux64/chrome}
cd "$(dirname "$0")/.."
ids="Body1 Body2 Body3"; for b in 1 2 3; do for h in 1 2 3 4 5; do ids="$ids Hook$b-$h"; done; done
echo $ids | tr ' ' '\n' | xargs -P2 -I{} sh -c "[ -s out/seg/{}.mp4 ] || npx remotion render {} out/seg/{}.mp4 --concurrency=2 --muted --crf=24 --pixel-format=yuv420p --browser-executable=$CH --chrome-mode=chrome-for-testing > out/seg/{}.log 2>&1"
