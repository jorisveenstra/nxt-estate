#!/usr/bin/env bash
# naam bronbestand cx(0-1): getrouwe, onderwerp-bewuste crop naar 1080x1920 (geen verzonnen architectuur)
cd "$(dirname "$0")/.."
while read -r naam bron cx; do
  w=$(ffprobe -v error -show_entries stream=width -of csv=p=0 public/src-img/$bron); h=$(ffprobe -v error -show_entries stream=height -of csv=p=0 public/src-img/$bron)
  cw=$(python3 -c "print(int($h*9/16)//2*2)"); x=$(python3 -c "print(max(0,min($w-$cw,int($w*$cx-$cw/2))))")
  ffmpeg -nostdin -v error -y -i public/src-img/$bron -vf "crop=$cw:$h:$x:0,scale=1080:1920:flags=lanczos,setsar=1" -q:v 2 public/portrait/$naam.jpg
done <<'L'
luchtfoto 07129886_2025-11-20_1.jpg 0.30
voorgevel 29e5f609_2025-11-20_16.jpg 0.50
hoekpand 152d151f_2025-11-20_14.jpg 0.40
avond ea9b3529_2025-11-20_19.jpg 0.45
stellingen 7ff071a1_2025-11-20_35.jpg 0.55
hal f009943b_2025-11-20_22.jpg 0.50
dakterras 95e216ea_2025-11-20_33.jpg 0.55
dakterras-2 bafdb5b4_2025-11-20_40.jpg 0.50
straat 8770d778_2025-11-20_15.jpg 0.45
water 7ef35f0d_2025-11-20_18.jpg 0.50
L
