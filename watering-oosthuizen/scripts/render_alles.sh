#!/usr/bin/env bash
# Rendert alle 15 video's efficiënt:
#  1. elke body één keer (beeld, zonder audio), elke hook apart;
#  2. per video de audiomix (stem + muziek met ducking) uit de volledige Remotion-compositie "Body<b>-Hook<h>";
#  3. hook + body samenvoegen met ffmpeg -c copy (zelfde codec-instellingen), audio erbij, faststart.
# Gebruik: bash scripts/render_alles.sh   (BROWSER=<pad naar chrome-headless-shell> optioneel)
set -euo pipefail
cd "$(dirname "$0")/.."
BROWSER=${BROWSER:-/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell}
R="npx remotion render --browser-executable=$BROWSER --log=error"
mkdir -p out/parts out/audio out/final
CRF=${CRF:-23}

render_part() { # id uitvoer
  # begrensde frame-cache: voorkomt geheugentekort bij 2 gelijktijdige renders op 16 GB
  [ -s "$2" ] || { $R "$1" "$2.tmp.mp4" --muted --codec=h264 --crf=$CRF --concurrency=2 --pixel-format=yuv420p \
      --offthreadvideo-cache-size-in-bytes=400000000 --offthreadvideo-threads=1 && mv "$2.tmp.mp4" "$2"; }
}
export -f render_part; export R CRF

{
  for b in 1 2 3; do echo "Body$b out/parts/body$b.mp4"; done
  for b in 1 2 3; do for h in 1 2 3 4 5; do echo "Hook$b-$h out/parts/hook$b-$h.mp4"; done; done
} | xargs -P 2 -L1 bash -c 'render_part "$0" "$1"'

for b in 1 2 3; do for h in 1 2 3 4 5; do
  a=out/audio/b${b}h${h}.wav
  [ -s "$a" ] || { $R "Body$b-Hook$h" "$a.tmp.wav" --codec=wav && mv "$a.tmp.wav" "$a"; }
done; done

for b in 1 2 3; do for h in 1 2 3 4 5; do
  uit="out/final/Body $b Hook $h.mp4"
  printf "file '%s'\nfile '%s'\n" "$PWD/out/parts/hook$b-$h.mp4" "$PWD/out/parts/body$b.mp4" > out/parts/list$b$h.txt
  ffmpeg -nostdin -v error -y -f concat -safe 0 -i out/parts/list$b$h.txt -i out/audio/b${b}h${h}.wav \
    -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -ar 48000 -movflags +faststart -shortest "$uit"
  echo "klaar: $uit"
done; done
