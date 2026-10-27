#!/bin/bash
# Plakt hook + body (-c copy), mengt voice-over en muziek (ducking) en schrijft out/<naam>.mp4
# Gebruik: bash scripts/mix.sh b1 3
set -e
cd "$(dirname "$0")/.."
b=$1; h=$2; out=out/final/body$b-hook$h.mp4
mkdir -p out/final out/tmp
HF=$(python3 -c "import json;print(json.load(open('src/plan.json'))['b$b-h$h']['frames'])")
BF=$(python3 -c "import json;print(json.load(open('src/plan.json'))['b$b-body']['frames'])")
T=$(python3 -c "print(($HF+$BF)/30)")
HD=$(python3 -c "print($HF/30)")
printf "file '../parts/b$b-h$h.mp4'\nfile '../parts/b$b-body.mp4'\n" > out/tmp/b$b-h$h.txt
ffmpeg -v error -y -f concat -safe 0 -i out/tmp/b$b-h$h.txt -c copy out/tmp/b$b-h$h-video.mp4
ffmpeg -v error -y -i public/vo/b$b-h$h.mp3 -i public/vo/b$b-body.mp3 -stream_loop -1 -i public/muziek/bali-lombok.mp3 -filter_complex \
"[0]apad=whole_dur=$HD[a];[a][1]concat=n=2:v=0:a=1,apad=whole_dur=$T,atrim=0:$T,aformat=sample_rates=44100:channel_layouts=stereo,volume=1.0[vo];\
[vo]asplit=2[vo1][vo2];\
[2]atrim=0:$T,asetpts=N/SR/TB,aformat=sample_rates=44100:channel_layouts=stereo,volume=0.30,afade=t=in:d=1.0,afade=t=out:st=$(python3 -c "print($T-2.5)"):d=2.5[m];\
[m][vo2]sidechaincompress=threshold=0.03:ratio=8:attack=20:release=400[md];\
[vo1][md]amix=inputs=2:duration=first:normalize=0,alimiter=limit=0.92[mix]" -map "[mix]" -ar 44100 -c:a aac -b:a 192k out/tmp/b$b-h$h-audio.m4a
ffmpeg -v error -y -i out/tmp/b$b-h$h-video.mp4 -i out/tmp/b$b-h$h-audio.m4a -map 0:v -map 1:a -c:v copy -c:a copy -shortest -movflags +faststart $out
echo $out $(ffprobe -v error -show_entries stream=codec_name,width,height,duration -of csv=p=0 $out | tr '\n' ' ')
