#!/bin/bash
# usage: mux.sh b h hookDur
b=$1;h=$2;hd=$3;n=b${b}h$h
ffmpeg -v error -y -i out/$n.mp4 -i out/b${b}body.mp4 -i public/vo/$n.mp3 -i public/vo/b${b}body.mp3 -stream_loop -1 -i public/muziek/music.mp3 -filter_complex "[0:v][1:v]concat=n=2:v=1:a=0[v];[2:a]aresample=44100,apad=whole_dur=$hd[h];[3:a]aresample=44100[bd];[h][bd]concat=n=2:v=0:a=1,asplit=2[vo1][vo2];[4:a]volume=0.16,afade=t=in:d=1.5,aresample=44100[mu];[mu][vo1]sidechaincompress=threshold=0.04:ratio=8:attack=20:release=400[duck];[vo2][duck]amix=inputs=2:duration=first:normalize=0,alimiter=limit=0.95[a]" -map "[v]" -map "[a]" -c:v libx264 -crf 24 -preset fast -pix_fmt yuv420p -r 30 -c:a aac -b:a 160k -movflags +faststart -shortest final/$n.mp4
echo $n $(ffprobe -v error -show_entries stream=codec_type,width,height,sample_aspect_ratio:format=duration,size -of csv=p=0 final/$n.mp4 | tr '\n' ' ')
