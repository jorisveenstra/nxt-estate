"""
Maakt per video een bewerkbaar bronarchief (ZIP) voor latere revisies:
Remotion-bron, package.json + lockfile, voice-over (eleven_v4), muziekstem, de gebruikte
bibliotheekclips (originele Veo-clips, met generatie-ID's en SHA256 in scripts/bibliotheek-clips.json),
timing en provenance. Géén node_modules, .git, renders, sleutels of portal-tokens.

Gebruik: python3 scripts/maak_bronzip.py <b>h<n> <uit.zip>
"""
import json, sys, zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
VERBODEN = ("node_modules", ".git", "/out/", ".env", ".pending", ".nxt-", "public/vo/")


def main(key, uit):
    t = json.loads((ROOT / "src/timing.json").read_text())
    tts = json.loads((ROOT / "scripts/woorden-tts.json").read_text())
    b = key.split("h")[0]
    clips = {s["clip"] for s in t["bodies"][b]["shots"]} | {h["clip"] for k, h in t["hooks"].items() if k.startswith(b + "h")}
    bestanden = [p for p in ROOT.rglob("*") if p.is_file() and not any(v in p.as_posix() for v in VERBODEN)
                 and "public/clips" not in p.as_posix() and "tts-cache" not in p.as_posix() and "__pycache__" not in p.as_posix()
                 and p.suffix not in (".mp4", ".wav")]
    bestanden += [ROOT / f"public/clips/foto{c:02d}.mp4" for c in sorted(clips)]
    for k, d in tts.items():
        if k == f"{b}body" or k.startswith(b + "h"):
            c = d["cache"]
            bestanden += [ROOT / f"scripts/tts-cache/{c}.mp3", ROOT / f"scripts/tts-cache/{c}.json", ROOT / f"scripts/tts-cache/{c}.meta.json"]
    with zipfile.ZipFile(uit, "w", zipfile.ZIP_DEFLATED) as z:
        for p in sorted(set(bestanden)):
            rel = p.relative_to(ROOT).as_posix()
            z.write(p, "elbe-23-den-haag/" + rel, compress_type=zipfile.ZIP_STORED if p.suffix in (".mp4", ".mp3", ".png", ".woff2") else zipfile.ZIP_DEFLATED)
        z.write(ROOT.parent / "package-lock.json", "package-lock.json")
        z.write(ROOT.parent / "package.json", "package.json")
        z.writestr("elbe-23-den-haag/VIDEO.json", json.dumps({
            "titel": f"Body {b[1:]} Hook {key.split('h')[1]}", "compositie": f"Body{b[1:]}-Hook{key.split('h')[1]}",
            "segmenten": [f"Hook-{key}", f"Body-{b}"], "formaat": "1080x1920 (9:16), 30 fps, H.264 CRF 24, harde cuts",
            "render": "npm install in de root (node_modules-symlink), daarna bash scripts/render_alles.sh",
            "audio": f"out/audio/{key}.wav via scripts/bouw_audio.py (VO eleven_v4 + music_v1-bed, ducking)"}, ensure_ascii=False, indent=1))
    print(uit, Path(uit).stat().st_size)


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
