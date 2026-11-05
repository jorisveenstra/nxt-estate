#!/bin/bash
cd /home/user/nxt-estate/stock-utrecht-zuid
S=/tmp/claude-0/-home-user-nxt-estate/32334129-fb11-57d9-9697-baeaf859a42e/scratchpad
for b in 1 2 3; do for h in 1 2 3 4 5; do n=b${b}h$h
 d=$(ffprobe -v error -show_entries format=duration -of csv=p=0 final/$n.mp4 2>/dev/null)
 exp=$(python3 -I -c "import json;m=json.load(open('$S/meta_$n.json'));print(m['hookDur']+m['bodyDur'])")
 ok=$(python3 -I -c "
try: print(1 if abs(float('${d:-0}')-$exp)<1.5 else 0)
except: print(0)")
 if [ "$ok" != 1 ]; then ./mux.sh $b $h $(python3 -I -c "import json;print(json.load(open('$S/meta_$n.json'))['hookDur'])"); else echo $n ok; fi
done; done; echo FIXDONE
