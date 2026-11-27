#!/bin/bash
# Staande 1080x1920-uitsnedes (geen padding, geen vervorming) van de 4K Baraca Village-renderanimaties.
# Gebruik: scripts/prep_clips.sh <map met bronbestanden>   (kolommen: bron, doelnaam, horizontale positie 0..1)
SRC=${1:?bronmap}; cd "$(dirname "$0")/.."
while read f n c; do
  ffmpeg -v error -y -i "$SRC/$f" -an -vf "crop=w=trunc(ih*9/16/2)*2:h=ih:x=(iw-trunc(ih*9/16/2)*2)*$c:y=0,scale=1080:1920:flags=lanczos,setsar=1,fps=30" -c:v libx264 -crf 18 -preset medium -pix_fmt yuv420p -movflags +faststart "public/clips/$n.mp4"
done <<EOF
src-12-kids-at-the-gate-v2.mov poort-kinderen 0.68
src-video-01-curtains-in-the-breeze.mov villa-gordijnen 0.50
src-video-02-pool-ripples-and-palms.mov villa-zwembad 0.42
src-video-03-morning-light-push-in.mov villa-twee-lagen 0.45
src-video-04-drone-flyover-to-the-sea.mov drone-naar-zee 0.50
src-video-05-drone-orbit-kids-on-the-village-road.mov drone-orbit 0.50
src-video-09-living-room-curtains.mov woonkamer 0.62
src-video-10-bedroom-garden-breeze.mov slaapkamer 0.60
src-video-11-kitchen-dining-morning-v2.mov keuken 0.55
src-video-13-common-pool.mov gemeenschappelijk-zwembad 0.50
EOF
