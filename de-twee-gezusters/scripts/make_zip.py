"""Bouwt per video een bewerkbaar bronarchief (Remotion-project + voice-over + muziek + gebruikte clips). Clips in het archief zijn
gecomprimeerde portret-proxies van dezelfde 1080x1920-clips (volledige kwaliteit staat in de Frame.io Bronnenbibliotheek en
public/clips; sha256 per clip in scripts/clips_manifest.json). Gebruik: python3 scripts/make_zip.py <uit-map>"""
import hashlib, json, subprocess, sys, zipfile
from pathlib import Path
ROOT = Path(__file__).resolve().parent.parent
OUT = Path(sys.argv[1]); ZIPS = OUT / "zip"; LITE = OUT / "clips_lite"
ZIPS.mkdir(parents=True, exist_ok=True); LITE.mkdir(exist_ok=True)
data = json.loads((ROOT / "src/data.json").read_text())


def lite(c):
    f = LITE / f"{c}.mp4"
    if not f.exists():
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(ROOT / f"public/clips/{c}.mp4"), "-an", "-c:v", "libx264", "-crf", "27", "-preset", "veryfast", "-pix_fmt", "yuv420p", "-movflags", "+faststart", str(f)], check=True)
    return f


for b in (1, 2, 3):
    for h in range(1, 6):
        hk, bk = f"b{b}h{h}", f"b{b}"
        clips = sorted({s["clip"] for k in (hk, bk) for s in data[k]["shots"]})
        z = ZIPS / f"body{b}-hook{h}.zip"
        manifest = {c: hashlib.sha256((ROOT / f"public/clips/{c}.mp4").read_bytes()).hexdigest() for c in clips}
        with zipfile.ZipFile(z, "w", zipfile.ZIP_DEFLATED, compresslevel=6) as zf:
            for rel in ["package.json", "tsconfig.json", "remotion.config.ts"]:
                zf.write(ROOT / rel, rel)
            zf.write(ROOT.parent / "package-lock.json", "package-lock.json")
            for p in list((ROOT / "src").rglob("*")) + list((ROOT / "public/logo").rglob("*")) + list((ROOT / "public/fonts").rglob("*")):
                if p.is_file(): zf.write(p, str(p.relative_to(ROOT)))
            for p in (ROOT / "scripts").glob("*"):
                if p.is_file(): zf.write(p, f"scripts/{p.name}")
            for k in (hk, bk):
                for ext in ("json", "mp3"): zf.write(ROOT / f"scripts/vo/{k}.{ext}", f"scripts/vo/{k}.{ext}")
            zf.write(ROOT / "public/muziek/muziek.mp3", "public/muziek/muziek.mp3")
            for c in clips: zf.write(lite(c), f"public/clips/{c}.mp4")
            zf.writestr("scripts/clips_manifest.json", json.dumps({"note": "sha256 van de volledige 1080x1920-clips; archief bevat proxies (crf 27)", "clips": manifest}, indent=1))
            zf.writestr("README_REVISIE.md", f"""# De Twee Gezusters - Body {b} Hook {h}
Compositions: `Body-b{b}` (body + CTA) en `Hook-b{b}h{h}`; de eindvideo = hook + body (ffmpeg -c copy) met audio uit scripts/render_all.py.
Stappen: `npm install`, scripts/maak_vo.py (eleven_v4, voice YgjXqgzBJa9op0K278OW) en scripts/plan.py (timing + shots -> src/data.json), `npx remotion studio`.
Audio: voice-over (scripts/vo/*.mp3) + muziek (public/muziek/muziek.mp3, ElevenLabs music_v1, instrumentaal) met ducking in scripts/render_all.py. Geen geluidseffecten.
Herkomst van AI-clips, generatie-ID's, hashes en voice-over request-ID's: scripts/provenance.json. Geen sleutels of tokens in dit archief.
""")
        print(z.name, round(z.stat().st_size / 1e6, 1), "MB", flush=True)
