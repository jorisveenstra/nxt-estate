#!/usr/bin/env bash
# Rendert eerst de 3 body-delen en daarna de 15 hook-delen (2 renders tegelijk, elk 2 threads), 1080x1920.
set -euo pipefail
cd "$(dirname "$0")/.."
BROWSER="${BROWSER:-/opt/pw-browsers/chromium}"
mkdir -p out/delen
r() { n="$1"; [ -f "out/delen/$n.mp4" ] && exit 0; npx remotion render src/index.ts Ad "out/delen/$n.mp4" --props="props/$n.json" \
  --browser-executable="$BROWSER" --chrome-mode=chrome-for-testing --concurrency=4 --crf=24 --log=error && echo "klaar $n"; }
export -f r; export BROWSER
printf '%s\n' body1 body2 body3 $(for b in 1 2 3; do for h in 1 2 3 4 5; do echo b${b}h${h}-hook; done; done) | xargs -P1 -I{} bash -c 'r {}'
