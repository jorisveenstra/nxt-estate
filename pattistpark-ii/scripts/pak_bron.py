"""
Maakt per video een bewerkbaar bronarchief (ZIP, max 200 MB) voor latere revisies:
Remotion-broncode, package.json + lockfile, voice-overs (met eleven_v4-herkomst), muziekstem (met
instellingen/song-id), lettertypen, branding-notities en de herkomst van alle bibliotheekclips.

De originele 1080x1920-bewegingsclips (samen >300 MB) staan in de Frame.io-bronnenbibliotheek van het
project; het archief bevat per clip de bibliotheek-asset-ID, SHA256, bron-SHA256 en generatie-ID, plus
scripts/haal_clips.md. Geen node_modules, .git, .env, sleutels of portal-capabilities.

Gebruik: python3 scripts/pak_bron.py <Body1-Hook1> <uitvoer.zip>
"""
import json
import sys
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
REPO = ROOT.parent
VERBODEN = ("node_modules", "out", "build", ".git", "clips")
GEHEIM = (".env", ".elevenlabs", ".nxt-", "credentials")


def main():
    variant, uit = sys.argv[1], Path(sys.argv[2])
    b, h = variant.replace("Body", "").split("-Hook")
    with zipfile.ZipFile(uit, "w", zipfile.ZIP_DEFLATED) as z:
        for p in sorted(ROOT.rglob("*")):
            rel = p.relative_to(ROOT)
            if p.is_symlink() or p.is_dir() or rel.parts[0] in VERBODEN or any(x in VERBODEN for x in rel.parts[:-1]):
                continue
            if any(g in p.name for g in GEHEIM) or p.suffix in (".log", ".inflight"):
                continue
            z.write(p, f"pattistpark-ii/{rel}")
        z.write(REPO / "package.json", "package.json")
        z.write(REPO / "package-lock.json", "package-lock.json")
        z.writestr("pattistpark-ii/VARIANT.json", json.dumps({
            "title": f"Body {b} Hook {h}",
            "compositions": [f"Body{b}-Hook{h}", f"Body{b}"],
            "assembly": "scripts/render.sh: hook-render + body-render (ffmpeg -c copy) + VO/muziek-mix",
            "format": {"width": 1080, "height": 1920, "fps": 30, "aspect": "9:16"},
            "voiceover": {"model_id": "eleven_v4", "voice_id": "YgjXqgzBJa9op0K278OW",
                          "provenance": "scripts/tts-cache/herkomst.json"},
            "music": "public/muziek/herkomst.json (music_v1, instrumentaal, hergebruikt voor alle varianten)",
            "soundEffects": "uitgeschakeld (geen SFX)",
            "clips": "scripts/clips-herkomst.json (Frame.io-bronnenbibliotheek, hergebruikt, niet opnieuw gegenereerd)",
        }, indent=1, ensure_ascii=False))
    size = uit.stat().st_size
    assert size < 200_000_000, size
    print(uit.name, size)


if __name__ == "__main__":
    main()
