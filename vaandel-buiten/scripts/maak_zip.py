"""
Maakt per video een bewerkbare bron-ZIP (Remotion-project + voice-over + muziek + gebruikte clips + herkomst/hashes).
Zonder node_modules, .git, .env, credentials, usage-ledgers, tts-cache en zonder de eindrender (MP4).
De clips in de ZIP zijn zwaarder gecomprimeerde kopieen van de montageclips (de ongewijzigde Veo-originelen staan in de
Frame.io-Bronnenbibliotheek met sha256 en generation_id; zie source-assets/generations.json en PROVENANCE.md).
Gebruik: python3 scripts/maak_zip.py
"""
import hashlib, json, re, subprocess, zipfile
from pathlib import Path
ROOT = Path(__file__).resolve().parent.parent
TMP = ROOT / "out/zipclips"
TMP.mkdir(parents=True, exist_ok=True)
cfg = (ROOT / "src/config.ts").read_text()
gen = json.loads((ROOT / "source-assets/generations.json").read_text())


def clips_for(b, h):
    body = set(re.findall(r'\["([a-z_]+)", (?:null|"[^"]+")\]', cfg.split("BODY_CLIPS")[1].split("HOOK_CLIPS")[0].split(f"  {b}: {{")[1].split("\n  },")[0]))
    hook = re.search(rf"  {b}: {{[^\n]*\b{h}: \"([a-z_]+)\"", cfg.split("HOOK_CLIPS")[1].split("HOOK_ACCENT")[0]).group(1)
    return sorted(body | {hook})


def sha(p):
    return hashlib.sha256(Path(p).read_bytes()).hexdigest()


def arch_clip(n):
    out = TMP / f"{n}.mp4"
    if not out.exists():
        subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-y", "-i", str(ROOT / f"public/clips/{n}.mp4"), "-c:v", "libx264", "-crf", "30", "-preset", "slow", "-an", "-movflags", "+faststart", str(out)], check=True)
    return out


(ROOT / "out/zip").mkdir(exist_ok=True)
for b in (1, 2):
    for h in (1, 2, 3, 4, 5):
        used = clips_for(b, h)
        prov = ["# Herkomst en hashes (Vaandel Buiten, Body %d Hook %d)\n" % (b, h),
                "Voice-over: ElevenLabs eleven_v4, stem Tijs (voice_id YgjXqgzBJa9op0K278OW); request-id's in source-assets/vo-meta/.",
                "Muziek: ElevenLabs music_v1 (instrumentaal), zie source-assets/music-meta.json.",
                "Beeld: ElevenLabs Image & Video veo-3.1-generate-001, 1080p, 9:16, 8 s, zonder geluid, vanuit staande startfoto's (source-assets/portrait).",
                "Branding: vaandelbuiten.nl (logo public/logo.png, groenblauw #325059, Poppins/Lato lokaal in public/fonts).",
                "Montage: `python3 scripts/normaliseer_clips.py` (originelen -> public/clips), `node scripts/render.mjs`, `python3 scripts/assembleer.py`.",
                "De ongewijzigde Veo-originelen (36 MB per clip) staan in de Frame.io-Bronnenbibliotheek van het project; de clips in deze ZIP zijn gecomprimeerde kopieen.\n",
                "| clip | startfoto sha256 | generation_id |", "|---|---|---|"]
        for n in used:
            prov.append(f"| {n} | {gen[n]['source_portrait_sha256']} | {gen[n]['generation_id']} |")
        zp = ROOT / f"out/zip/Body {b} Hook {h}.zip"
        with zipfile.ZipFile(zp, "w", zipfile.ZIP_DEFLATED) as z:
            for rel in ["package.json", "package-lock.json", "remotion.config.ts", "tsconfig.json", ".gitignore"]:
                z.write(ROOT / rel, rel)
            for p in sorted((ROOT / "src").glob("*")):
                z.write(p, f"src/{p.name}")
            for p in sorted((ROOT / "scripts").glob("*")):
                if p.is_file() and p.suffix in (".py", ".mjs", ".json"):
                    z.write(p, f"scripts/{p.name}")
            z.write(ROOT / "public/logo.png", "public/logo.png")
            for p in sorted((ROOT / "public/fonts").glob("*")):
                z.write(p, f"public/fonts/{p.name}")
            for f in (f"b{b}h{h}-hook.wav", f"b{b}-body.wav"):
                z.write(ROOT / "public/vo" / f, f"public/vo/{f}")
            z.write(ROOT / "public/muziek/muziek.mp3", "public/muziek/muziek.mp3")
            for n in used:
                z.write(arch_clip(n), f"public/clips/{n}.mp4")
                z.write(ROOT / f"source-assets/portrait/{n}.jpg", f"source-assets/portrait/{n}.jpg")
            z.write(ROOT / "source-assets/generations.json", "source-assets/generations.json")
            z.write(ROOT / "source-assets/music-meta.json", "source-assets/music-meta.json")
            for p in sorted((ROOT / "source-assets/vo-meta").glob("*.json")):
                z.write(p, f"source-assets/vo-meta/{p.name}")
            z.writestr("PROVENANCE.md", "\n".join(prov) + "\n")
        print(zp.name, round(zp.stat().st_size / 1e6, 1), "MB", used)
