#!/usr/bin/env bash
# Synchroniseert de media (clips, voice-overs, AI-renders, muziek, renders) met Google Drive.
# De media staat niet in git; op Drive staat ze onder video-ads-media/<project>/ met dezelfde paden als hier.
#
# Gebruik:
#   ./media.sh push [project]   lokale media naar Drive kopiëren (alles, of één project)
#   ./media.sh pull [project]   media van Drive ophalen, bv. op een cloudserver na `git clone`
#
# Eenmalig: rclone installeren en de remote "gdrive" koppelen:
#   rclone config create gdrive drive scope=drive.file
# Kopiëren verwijdert nooit iets aan de andere kant.
set -euo pipefail
cd "$(dirname "$0")"

REMOTE="${MEDIA_REMOTE:-gdrive:video-ads-media}"
PROJECTEN=(pepperminds groote-visscherij dok-zoetermeer-3 maartens-business tampah-beach-villas huisunie nxt-estate)

# Wat als media telt: dezelfde mappen/bestanden die .gitignore buiten git houdt
FILTER=$(mktemp)
trap 'rm -f "$FILTER"' EXIT
cat > "$FILTER" <<'EOF'
- node_modules/**
- .DS_Store
+ out/**
+ public/clips/**
+ public/vo/**
+ public/vo-bron/**
+ public/muziek/**
+ public/broll/**
+ ai-renders/**
+ ai-broll/**
+ renders/**
+ vo-oud/**
+ clips-oud/**
+ scripts/tts-cache/**
+ *.mp4
+ *.mov
+ *.webm
+ *.wav
+ *.mp3
+ *.m4a
+ *.avif
+ *.webp
- *
EOF

actie="${1:-}"
shift || true
if [ $# -gt 0 ]; then PROJECTEN=("$@"); fi

for p in "${PROJECTEN[@]}"; do
  case "$actie" in
    push) rclone copy "$p" "$REMOTE/$p" --filter-from "$FILTER" --transfers 4 --progress --stats-one-line ;;
    pull) rclone copy "$REMOTE/$p" "$p" --transfers 4 --progress --stats-one-line ;;
    *) echo "Gebruik: $0 push|pull [project ...]"; exit 1 ;;
  esac
done
