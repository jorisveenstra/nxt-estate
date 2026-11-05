#!/usr/bin/env bash
# Rendert 3 bodies + 15 hooks (stil, 1080x1920) naar out/parts; assembleren: python3 scripts/assembleer.py
set -e; cd "$(dirname "$0")/.."; mkdir -p out/parts
CH="${BROWSER:-$(cat /tmp/w/chrome 2>/dev/null)}"
R() { npx remotion render "$1" "out/parts/$1.mp4" --codec h264 --crf 24 --concurrency 2 --muted ${CH:+--browser-executable=$CH --chrome-mode=chrome-for-testing} --no-sandbox >/dev/null 2>&1 && echo "klaar $1"; }
export -f R; export CH
printf "%s\n" Body1 Body2 Body3 $(for b in 1 2 3; do for h in 1 2 3 4 5; do echo Hook-b${b}h$h; done; done) | xargs -P 2 -I{} bash -c 'R {}'
