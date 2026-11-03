#!/usr/bin/env bash
# Rendert alle losse delen (muted, 1080x1920) met 2 gelijktijdige renders.
cd "$(dirname "$0")/.."
CH=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome
ids=(Body1 Body2 Body3); for b in 1 2 3; do for h in 1 2 3 4 5; do ids+=("Hook$b-$h"); done; done
r() { [ -s out/seg/$1.mp4 ] || npx remotion render $1 out/seg/$1.mp4 --muted --codec=h264 --crf=24 --concurrency=2 --browser-executable=$CH > out/seg/$1.log 2>&1; }
export -f r; export CH
printf '%s\n' "${ids[@]}" | xargs -P 2 -I{} bash -c 'r {}'
echo done > out/seg/ALL_DONE
