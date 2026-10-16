#!/bin/bash
# Werkkopie van de Veo-clips (1080x1920, h264 CRF 25) voor Remotion en het bronarchief; originelen staan in clips-orig/.
cd "$(dirname "$0")/.."
for f in public/clips/foto*.mp4; do
  n=$(basename "$f")
  [ -f "clips-orig/$n" ] && continue
  mv "$f" "clips-orig/$n"
  ffmpeg -v error -y -i "clips-orig/$n" -an -c:v libx264 -preset medium -crf 25 -pix_fmt yuv420p -r 30 -vf "scale=1080:1920,setsar=1" -movflags +faststart "$f"
done
