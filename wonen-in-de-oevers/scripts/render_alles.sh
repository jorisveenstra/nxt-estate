#!/usr/bin/env bash
# Rendert 3 bodies + 15 hooks (stil, 1080x1920), voegt hook+body samen en mixt voice-over + muziek (ducking).
set -euo pipefail
cd "$(dirname "$0")/.."
CH="${CHROME:-$(ls /opt/pw-browsers/chromium-*/chrome-linux*/chrome | head -1)}"
mkdir -p out/parts out/final
TEMPO=1.07  # revisie 3: vlotter tempo; gelijk aan TEMPO in scripts/maak_timing.py
ids=(); for b in 1 2 3; do ids+=("Body-b$b"); for h in 1 2 3 4 5; do ids+=("Hook-b${b}h$h"); done; done
printf '%s\n' "${ids[@]}" | xargs -P 2 -I{} sh -c '[ -s out/parts/{}.mp4 ] || npx remotion render src/index.ts {} out/parts/{}.mp4 --concurrency=2 --offthreadvideo-cache-size-in-bytes=1500000000 --browser-executable='"$CH"' --codec=h264 --muted --log=error'
for b in 1 2 3; do for h in 1 2 3 4 5; do
  o="out/final/Body $b Hook $h.mp4"
  hf=$(python3 -c "import json;print(json.load(open('src/timing.json'))['b${b}h${h}']['frames'])")
  printf "file 'Hook-b${b}h${h}.mp4'\nfile 'Body-b${b}.mp4'\n" > out/parts/list_${b}_${h}.txt
  ffmpeg -v error -y -f concat -safe 0 -i out/parts/list_${b}_${h}.txt -c copy out/parts/v_${b}_${h}.mp4
  hd=$(python3 -c "print($hf/30)")
  tot=$(ffprobe -v error -show_entries format=duration -of csv=p=0 out/parts/v_${b}_${h}.mp4)
  fo=$(python3 -c "print(max(0,$tot-2.0))")
  # voice: hook, gepad tot het einde van het hookbeeld, dan body; muziek -22 dB onder de voice (sidechain-ducking), fade in/uit
  ffmpeg -v error -y -i out/parts/v_${b}_${h}.mp4 -i public/vo/b${b}h${h}-hook.wav -i public/vo/body${b}.wav -stream_loop -1 -i public/music/oevers-music.mp3 -filter_complex \
   "[1:a]atempo=$TEMPO,apad=whole_dur=$hd[h];[2:a]atempo=$TEMPO[bd];[h][bd]concat=n=2:v=0:a=1[vo];[vo]apad=whole_dur=$tot,asplit=2[vo1][vo2];[3:a]atrim=0:$tot,volume=0.20,afade=t=in:d=1.5,afade=t=out:st=$fo:d=2[m];[m][vo2]sidechaincompress=threshold=0.03:ratio=8:attack=20:release=400[md];[vo1][md]amix=inputs=2:duration=longest:normalize=0,alimiter=limit=0.95[a]" \
   -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 192k -t $tot -movflags +faststart "$o"
  echo "$o $(ffprobe -v error -show_entries stream=width,height,codec_name -of csv=p=0 "$o" | tr '\n' ' ') $(stat -c%s "$o")"
done; done
