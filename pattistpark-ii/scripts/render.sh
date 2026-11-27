#!/usr/bin/env bash
# Rendert Pattistpark II: 3 body-renders + 15 hook-renders (stil, 1080x1920), plakt per variant
# hook + body met ffmpeg -c copy en mixt daaronder voice-over (eleven_v4) + muziek (music_v1, met ducking).
# Resultaat: out/final/Body<b>-Hook<h>.mp4 (faststart). Gebruik: bash scripts/render.sh
set -euo pipefail
cd "$(dirname "$0")/.."
CHROME="${REMOTION_CHROME:-$(ls -d /opt/pw-browsers/chromium-*/chrome-linux64/chrome 2>/dev/null | head -1)}"
BROWSER=()
[ -n "$CHROME" ] && BROWSER=(--browser-executable="$CHROME")
mkdir -p out/parts out/final
FPS=30

npx remotion bundle src/index.ts --out-dir build --log=error >/dev/null

render() { # compositie -> out/parts/<id>.mp4
  [ -s "out/parts/$1.mp4" ] && return 0
  npx remotion render build "$1" "out/parts/$1.mp4" "${BROWSER[@]}" --concurrency=2 --muted --log=error
}
export -f render
export CHROME
ids=(Body1 Body2 Body3)
for b in 1 2 3; do for h in 1 2 3 4 5; do ids+=("Body$b-Hook$h"); done; done
# Begrensd parallel: twee renders tegelijk
printf '%s\n' "${ids[@]}" | xargs -P 2 -I{} bash -c 'render "$@"' _ {}

dur() { ffprobe -v error -show_entries format=duration -of csv=p=0 "$1"; }
frames() { ffprobe -v error -count_packets -select_streams v:0 -show_entries stream=nb_read_packets -of csv=p=0 "$1"; }

for b in 1 2 3; do for h in 1 2 3 4 5; do
  id="Body$b-Hook$h"
  out="out/final/$id.mp4"
  [ -s "$out" ] && continue
  hook="out/parts/$id.mp4"; body="out/parts/Body$b.mp4"
  H=$(python3 -c "print($(frames "$hook")/$FPS)")
  T=$(python3 -c "print(($(frames "$hook")+$(frames "$body"))/$FPS)")
  hook_mp3=$(python3 -c "import json;print(json.load(open('scripts/woorden-tts.json'))['b${b}h${h}']['mp3'])")
  body_mp3=$(python3 -c "import json;print(json.load(open('scripts/woorden-tts.json'))['b${b}']['mp3'])")
  printf "file '%s'\nfile '%s'\n" "$PWD/$hook" "$PWD/$body" > "out/parts/$id.txt"
  ffmpeg -v error -y -f concat -safe 0 -i "out/parts/$id.txt" -c copy "out/parts/$id-video.mp4"
  FO=$(python3 -c "print(max(0.0, $T-2.2))")
  ffmpeg -v error -y -i "out/parts/$id-video.mp4" -i "$hook_mp3" -i "$body_mp3" -i public/muziek/muziek.mp3 -filter_complex "
    [1:a]aresample=48000,apad=whole_dur=$H[h];
    [2:a]aresample=48000[bd];
    [h][bd]concat=n=2:v=0:a=1,loudnorm=I=-15:TP=-1.5:LRA=9,aresample=48000,apad=whole_dur=$T,asplit[vo][sc];
    [3:a]aresample=48000,atrim=0:$T,asetpts=PTS-STARTPTS,volume=0.28,afade=t=in:d=0.3,afade=t=out:st=$FO:d=2.2[m];
    [m][sc]sidechaincompress=threshold=0.03:ratio=6:attack=20:release=450[md];
    [vo][md]amix=inputs=2:normalize=0:duration=first,alimiter=limit=0.93[a]" \
    -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 192k -ar 48000 -t "$T" -movflags +faststart "$out"
  echo "$id: $(dur "$out")s"
done; done
