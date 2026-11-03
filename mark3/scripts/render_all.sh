#!/usr/bin/env bash
# Rendert alle 15 video's (2 parallel). Browser: ../node_modules is gelinkt; chrome-headless-shell lokaal.
cd "$(dirname "$0")/.."
B=${BROWSER:-/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell}
render() { b=$1; h=$2; npx remotion render Body$b-Hook$h out/mark3-body$b-hook$h.mp4 --browser-executable=$B --concurrency=2 --crf=25 >work/render-b$b-h$h.log 2>&1 && echo "klaar b$b h$h" || echo "FOUT b$b h$h"; }
export -f render; export B
for b in 1 2 3; do for h in 1 2 3 4 5; do echo "$b $h"; done; done | xargs -P2 -L1 bash -c 'render $0 $1'
