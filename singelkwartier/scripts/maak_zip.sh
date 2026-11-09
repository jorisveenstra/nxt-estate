#!/bin/bash
# Bronarchief per video: Remotion-bron + lichte clip-kopieën (originelen staan in Frame.io Bronnenbibliotheek)
set -e
cd "$(dirname "$0")/.."
ARCH=${ARCH:-/tmp/w/arch}
for h in 1 2 3 4 5; do
  S=$(mktemp -d); mkdir -p $S/public/vo $S/public/muziek
  cp -r src scripts package.json package-lock.json remotion.config.ts tsconfig.json render.sh .gitignore $S/
  rm -rf $S/scripts/tts-cache/*.mp3
  cp -r public/fonts public/brand $S/public/
  cp -r $ARCH/clips $S/public/clips
  cp public/vo/h$h.wav $S/public/vo/; cp public/muziek/muziek.mp3 $S/public/muziek/
  cat > $S/LEESMIJ.txt <<T
Singelkwartier Body1-Hook$h (9:16, 1080x1920). npm install; npx remotion studio.
public/clips: lichte re-encodes (crf27) van de clips uit de Frame.io Bronnenbibliotheek; vervang door de originelen voor de eindrender.
Voice-over: eleven_v4, voice YgjXqgzBJa9op0K278OW. Muziek: ElevenLabs music_v1. Zie scripts/provenance.json.
T
  (cd $S && zip -qr /tmp/w/singelkwartier-body1-hook$h-bron.zip . -x '*.mp4.tmp')
  rm -rf $S
done
ls -la /tmp/w/*.zip
