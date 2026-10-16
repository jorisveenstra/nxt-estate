"""Voegt hook + body samen (ffmpeg -c copy), mengt de muziek eronder (ducking, alleen audio opnieuw gecodeerd),
controleert met ffprobe en maakt per video het bewerkbare bronarchief (zip).
Gebruik: python3 scripts/finalize.py b1h1 [b1h2 ...]   ->  out/final/BodyXHookY.mp4 + out/final/BodyXHookY-bron.zip
"""
import hashlib, json, re, subprocess, sys, zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "out/final"
OUT.mkdir(parents=True, exist_ok=True)
T = json.loads((ROOT / "src/timing.json").read_text())
CFG = (ROOT / "src/config.ts").read_text()


def probe(p, entries, sel="v:0"):
    return subprocess.run(["ffprobe", "-v", "error", "-select_streams", sel, "-show_entries", entries, "-of", "json", str(p)], capture_output=True, text=True).stdout


def clips_for(b, h):
    hook = re.search(rf'{b}h{h}: \{{ clip: "(foto\d+)"', CFG).group(1)
    body_cfg = CFG.split("export const BODIES")[1]
    block = re.split(r"\n  b\d: \{", body_cfg)[int(b[1:])]
    return sorted({hook, *re.findall(r"foto\d+", block)}), hook


def mix(b, h, name):
    work = ROOT / "out/work"
    cat = OUT / f"{name}.cat.mp4"
    lst = OUT / f"{name}.txt"
    lst.write_text(f"file '{work}/Hook-{b}h{h}.mp4'\nfile '{work}/Body-{b}.mp4'\n")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", str(lst), "-c", "copy", str(cat)], check=True)
    dur = float(json.loads(probe(cat, "format=duration", "a:0") if False else subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "json", str(cat)], capture_output=True, text=True).stdout)["format"]["duration"])
    final = OUT / f"{name}.mp4"
    fc = (f"[1:a]atrim=0:{dur:.3f},asetpts=PTS-STARTPTS,volume=0.55,afade=t=in:d=1.2,afade=t=out:st={dur-2.2:.3f}:d=2.2[m];"
          f"[0:a]asplit[v][k];[m][k]sidechaincompress=threshold=0.02:ratio=10:attack=15:release=450:makeup=1[d];"
          f"[v][d]amix=inputs=2:normalize=0:duration=first,alimiter=limit=0.89[a]")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(cat), "-i", str(ROOT / "public/muziek/elbe23.mp3"), "-filter_complex", fc,
                    "-map", "0:v", "-map", "[a]", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-movflags", "+faststart", str(final)], check=True)
    cat.unlink(); lst.unlink()
    info = json.loads(probe(final, "stream=codec_name,width,height,sample_aspect_ratio,duration:stream_side_data=rotation"))
    s = info["streams"][0]
    assert (s["width"], s["height"]) == (1080, 1920) and not any(d.get("rotation") for d in s.get("side_data_list", [])), info
    vol = subprocess.run(["ffmpeg", "-v", "info", "-i", str(final), "-af", "volumedetect", "-vn", "-f", "null", "-"], capture_output=True, text=True).stderr
    print(name, s["width"], s["height"], round(float(s["duration"]), 1), final.stat().st_size // 1024, "KB", re.findall(r"(?:mean|max)_volume: [-\d.]+ dB", vol))
    return final


def bron(b, h, name):
    clips, hook = clips_for(b, h)
    zp = OUT / f"{name}-bron.zip"
    manifest = {"video": name, "composities": [f"Hook-{b}h{h}", f"Body-{b}"], "formaat": "1080x1920 (9:16), 30 fps",
                "stem": {"voice_id": "YgjXqgzBJa9op0K278OW", "model_id": "eleven_v4"},
                "muziek": {"model_id": "music_v1", "instrumental": True, "bestand": "public/muziek/elbe23.mp3"},
                "veo": {}, "montage": "scripts/render_alles.mjs + scripts/finalize.py (hook + body samenvoegen, muziek met ducking)"}
    meta = json.loads((ROOT / "scripts/foto-meta.json").read_text())
    with zipfile.ZipFile(zp, "w", zipfile.ZIP_DEFLATED) as z:
        def add(p, arc=None):
            z.write(p, arc or str(p.relative_to(ROOT)))
        for f in ["package.json", "package-lock.json", "tsconfig.json", "remotion.config.ts"]:
            add(ROOT / f)
        for p in (ROOT / "src").iterdir():
            add(p)
        for p in (ROOT / "scripts").iterdir():
            if p.is_file():
                add(p)
        for p in (ROOT / "scripts/tts-cache").glob("*.json"):  # provenance (zonder audio)
            d = json.loads(p.read_text()); d.pop("audio_base64", None)
            z.writestr(f"scripts/tts-cache/{p.name}", json.dumps(d))
        for p in (ROOT / "scripts/veo-ledger").glob("*.json"):
            d = json.loads(p.read_text()); d.pop("asset_raw", None)
            z.writestr(f"scripts/veo-ledger/{p.name}", json.dumps(d, indent=1))
        for p in (ROOT / "public/fonts").iterdir(): add(p)
        for p in (ROOT / "public/logo").iterdir(): add(p)
        for p in (ROOT / "public/muziek").iterdir(): add(p)
        for f in [f"vo/{hook and ''}{b}h{h}-hook.wav", f"vo/{b}-body.wav"]:
            add(ROOT / "public" / f)
        for c in clips:
            n = int(c[4:])
            add(ROOT / f"public/clips/{c}.mp4")
            add(ROOT / f"portrait/foto{n}.jpg")
            add(ROOT / f"source-photos/foto{n}.jpg")
            led = json.loads((ROOT / f"scripts/veo-ledger/foto{n}.json").read_text())
            orig = ROOT / f"clips-orig/{c}.mp4"
            manifest["veo"][c] = {"generation_id": led["generation_id"], "foto_sha256": meta[str(n)]["sha256"], "origineel_clip_sha256": hashlib.sha256(orig.read_bytes()).hexdigest(), "model": "veo-3.1-generate-001", "1080x1920": True}
        z.writestr("MANIFEST.json", json.dumps(manifest, indent=1, ensure_ascii=False))
        z.writestr("LEESMIJ.txt", "Bewerkbare bron. npm install; npx remotion studio (compositions Hook-<b>h<h> en Body-<b>). Rendermethode: node scripts/render_alles.mjs, daarna python3 scripts/finalize.py <b>h<h>. "
                   "Branding: businessnomads.nl/elbe-23 (BN-logo, taupe #B4AB90, Manrope). Geen sleutels in dit archief; originele Veo-clips zijn vervangen door werkkopieen (sha256 in MANIFEST.json).\n")
    print(name, "zip", zp.stat().st_size // 1024 // 1024, "MB")


if __name__ == "__main__":
    for k in sys.argv[1:]:
        b, h = re.match(r"(b\d)h(\d)", k).groups()
        name = f"Body{b[1:]}Hook{h}"
        mix(b, h, name)
        bron(b, h, name)
