#!/usr/bin/env bash
# Rendert de segmenten (Body-bX één keer per body, Hook-bXhY per variant) zonder audio,
# plakt hook + body met een harde cut (ffmpeg concat, -c copy) en mixt de audio uit out/audio.
# Resultaat: out/final/Elbe 23 Den Haag - Body X Hook Y.mp4 (1080x1920, H.264, faststart).
set -euo pipefail
cd "$(dirname "$0")/.."
B="${REMOTION_BROWSER:-/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell}"
mkdir -p out/seg out/final
python3 scripts/bouw_timing.py
python3 scripts/bouw_audio.py >/dev/null

render() { # id
  [ -s "out/seg/$1.mp4" ] && return 0
  npx remotion render src/index.ts "$1" "out/seg/$1.tmp.mp4" --browser-executable="$B" \
    --codec=h264 --crf=24 --pixel-format=yuv420p --muted --concurrency=2 --offthreadvideo-cache-size-in-bytes=536870912 --log=error
  mv "out/seg/$1.tmp.mp4" "out/seg/$1.mp4"
}
export -f render; export B
ids=$(node -e 'const t=require("./src/timing.json");console.log([...Object.keys(t.bodies).map(b=>"Body-"+b),...Object.keys(t.hooks).map(h=>"Hook-"+h)].join("\n"))')
# Bodies na elkaar (geheugen: twee lange OffthreadVideo-renders tegelijk -> OOM), hooks twee tegelijk (4 cores)
for id in $(echo "$ids" | grep '^Body-'); do render "$id" && echo "segment $id"; done
echo "$ids" | grep '^Hook-' | xargs -P 2 -I{} bash -c 'render {} && echo "segment {}"'

for key in $(node -e 'console.log(Object.keys(require("./src/timing.json").hooks).join(" "))'); do
  b=${key%h*}; h=${key#*h}
  naam="out/final/Elbe 23 Den Haag - Body ${b#b} Hook ${h}.mp4"
  printf "file '%s'\nfile '%s'\n" "$PWD/out/seg/Hook-$key.mp4" "$PWD/out/seg/Body-$b.mp4" > "out/seg/$key.txt"
  ffmpeg -v error -y -f concat -safe 0 -i "out/seg/$key.txt" -i "out/audio/$key.wav" \
    -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 192k -ar 48000 -shortest -movflags +faststart "$naam"
  # Controle: volledige decode zonder fouten; anders join opnieuw encoderen
  if ! ffmpeg -v error -xerror -i "$naam" -f null - 2>/dev/null; then
    ffmpeg -v error -y -f concat -safe 0 -i "out/seg/$key.txt" -i "out/audio/$key.wav" -map 0:v:0 -map 1:a:0 \
      -c:v libx264 -crf 24 -pix_fmt yuv420p -c:a aac -b:a 192k -shortest -movflags +faststart "$naam"
  fi
  echo "klaar: $naam"
done
