"""
Bouwt per video het bewerkbare Remotion-bronarchief (zonder node_modules, .git, geheimen en eindrender).
Clips in het archief zijn lichter gecodeerde kopieën (native 1080x1920); de originele Veo-clips staan met hash,
generatie-ID en Frame.io-verwijzing in de Bronnenbibliotheek en in scripts/gen/. Gebruik: python3 scripts/maak_zip.py <body> <hook> <uit.zip>
"""
import json, subprocess, sys, zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
b, h, uit = sys.argv[1], sys.argv[2], Path(sys.argv[3])
LIGHT = ROOT / "scripts/tmp-archief-clips"
LIGHT.mkdir(exist_ok=True)
for clip in sorted((ROOT / "public/clips").glob("*.mp4")):
    t = LIGHT / clip.name
    if not t.exists():
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(clip), "-c:v", "libx264", "-crf", "24", "-preset", "medium", "-pix_fmt", "yuv420p", "-an", "-movflags", "+faststart", str(t)], check=True)
README = f"""De Goffaert - Body {b} Hook {h} (bewerkbaar Remotion-project)
Composition: Body{b}-Hook{h}, 1080x1920, 30 fps. Installeren: npm ci (package.json + package-lock.json in deze map), dan
npx remotion render src/index.ts Body{b}-Hook{h} out.mp4 --public-dir=$PWD/public
Voice-over: ElevenLabs eleven_v4, stem YgjXqgzBJa9op0K278OW (public/vo/b{b}h{h}.wav, request-id's in scripts/tts-cache-metadata.json).
Muziek: ElevenLabs music_v1 (public/muziek, scripts/gen/muziek.json). Geen geluidseffecten.
Clips: public/clips zijn lichtere kopieen van de originele Veo 3.1 clips (native 1080x1920). Originelen, hashes en generatie-ID's: scripts/gen/*.json en de Frame.io-Bronnenbibliotheek.
Bronrenders (originelen) staan als source_image in de Bronnenbibliotheek; staande startframes in scripts/crops.
Branding: degoffaert.nl (logo, Poppins, antraciet #323132 / zand #AF9982 / terracotta #C2714F).
"""
meta = {}
for f in (ROOT / "scripts/tts-cache").glob("*.json"):
    d = json.loads(f.read_text()); meta[f.stem] = d.get("_headers", {})
files = []
for sub in ("src", "scripts", "public/logo", "public/fonts", "public/muziek"):
    for p in (ROOT / sub).rglob("*"):
        if p.is_file() and "tts-cache" not in p.parts and "tmp-archief-clips" not in p.parts and p.suffix != ".pyc" and "__pycache__" not in p.parts:
            files.append((p, f"de-goffaert/{p.relative_to(ROOT)}"))
files += [(ROOT / "remotion.config.ts", "de-goffaert/remotion.config.ts"), (ROOT / "tsconfig.json", "de-goffaert/tsconfig.json"),
          (ROOT / "../package.json", "de-goffaert/package.json"), (ROOT / "../package-lock.json", "de-goffaert/package-lock.json"),
          (ROOT / f"public/vo/b{b}h{h}.wav", f"de-goffaert/public/vo/b{b}h{h}.wav")]
files += [(p, f"de-goffaert/public/clips/{p.name}") for p in sorted(LIGHT.glob("*.mp4"))]
with zipfile.ZipFile(uit, "w", zipfile.ZIP_DEFLATED) as z:
    for p, a in files:
        z.write(p, a)
    z.writestr("de-goffaert/README.txt", README)
    z.writestr("de-goffaert/scripts/tts-cache-metadata.json", json.dumps(meta, indent=1))
print(uit, uit.stat().st_size // 1_000_000, "MB")
