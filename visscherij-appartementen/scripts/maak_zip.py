"""Bronarchief per video: bewerkbare Remotion-bron + voice-over van die video + clips + muziek. Geen MP4, sleutels of tokens."""
import json, sys, zipfile
from pathlib import Path
ROOT = Path(__file__).resolve().parent.parent
def maak(key, uit):
    prov = {"voice_id": "YgjXqgzBJa9op0K278OW", "model_id": "eleven_v4",
            "tts_requests": [json.loads(p.read_text()).get("_meta") for p in sorted((ROOT / "scripts/tts-cache").glob("*.json"))],
            "music": json.loads((ROOT / "public/music/muziek.json").read_text()),
            "clips": "Hergebruikte projectbronnen (Frame.io Bronnenbibliotheek), native 1080x1920, geen nieuwe generatie.",
            "render": f"npx remotion render src/index.ts Body{key[1]}-Hook{key[3]} out/{key}.mp4 --crf=25"}
    with zipfile.ZipFile(uit, "w", zipfile.ZIP_DEFLATED) as z:
        for f in ["package.json", "remotion.config.ts", "tsconfig.json"]:
            z.write(ROOT / f, f)
        z.write(ROOT.parent / "package-lock.json", "package-lock.json")
        z.write(ROOT.parent / "package.json", "root-package.json")
        for d in ["src", "public/clips", "public/fonts", "public/music"]:
            for p in sorted((ROOT / d).rglob("*")):
                if p.is_file(): z.write(p, p.relative_to(ROOT).as_posix())
        for f in ["public/logo-licht.svg", "public/logo-donker.svg", f"public/vo/{key}.wav",
                  "scripts/scripts.json", "scripts/woorden-tts.json", "scripts/plan.py", "scripts/maak_vo.py", "scripts/maak_muziek.py"]:
            z.write(ROOT / f, f)
        z.writestr("PROVENANCE.json", json.dumps(prov, indent=1, ensure_ascii=False))
if __name__ == "__main__": maak(sys.argv[1], sys.argv[2])
