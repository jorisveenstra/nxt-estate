#!/usr/bin/env bash
# Rendert alle 15 video's (2 tegelijk, beperkte concurrency) en zet faststart.
cd "$(dirname "$0")/.."
CH=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome
one() {
  b=$1; h=$2; o=out/body$b-hook$h
  [ -f $o.mp4 ] && exit 0
  npx remotion render src/index.ts Body$b-Hook$h $o.raw.mp4 --public-dir="$PWD/public" --browser-executable=$CH --concurrency=2 --crf=24 --codec=h264 --pixel-format=yuv420p > out/log-$b-$h.txt 2>&1 \
   && ffmpeg -v error -y -i $o.raw.mp4 -c copy -movflags +faststart $o.mp4 && rm $o.raw.mp4
}
export -f one; export CH
for b in 1 2 3; do for h in 1 2 3 4 5; do echo "$b $h"; done; done | xargs -P2 -L1 bash -c 'one $0 $1'
