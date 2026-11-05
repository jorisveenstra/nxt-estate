#!/bin/bash
cd /home/user/nxt-estate/stock-utrecht-zuid
r(){ ../node_modules/.bin/remotion render src/index.ts Seg out/$1.mp4 --props=data/$1.json --concurrency=2 --browser-executable=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome --codec=h264 > out/$1.log 2>&1; echo $1 done; }
export -f r
printf "%s\n" b1body b2body b3body $(for b in 1 2 3; do for h in 1 2 3 4 5; do echo b${b}h$h; done; done) | xargs -P 2 -I{} bash -c 'r {}'
echo ALLDONE
