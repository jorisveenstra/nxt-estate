#!/bin/bash
# Renders all segments (3 bodies + 15 hooks) with bounded concurrency. Usage: ./render.sh [browser-executable]
cd "$(dirname "$0")"
BROWSER=${1:-/opt/pw-browsers/chromium-1243/chrome-linux64/chrome}
mkdir -p out
r(){ ./node_modules/.bin/remotion render src/index.ts Seg out/$1.mp4 --props=data/$1.json --concurrency=2 --browser-executable=$2 --codec=h264 > out/$1.log 2>&1; echo $1 done; }
export -f r
printf "%s\n" b1body b2body b3body $(for b in 1 2 3; do for h in 1 2 3 4 5; do echo b${b}h$h; done; done) | xargs -P 2 -I{} bash -c "r {} $BROWSER"
echo ALLDONE
