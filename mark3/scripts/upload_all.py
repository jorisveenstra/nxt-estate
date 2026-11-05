"""Bouwt per video de bewerkbare bron-ZIP, verifieert de MP4 met ffprobe en uploadt MP4 (Frame.io) + ZIP. Idempotent via STATE/outputs.json."""
import json, zipfile, hashlib, pathlib, subprocess, uuid, sys
from common import *
ROOT = pathlib.Path(__file__).resolve().parent.parent
def probe(p):
    j = json.loads(subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height,sample_aspect_ratio:stream_side_data=rotation:format=duration", "-of", "json", str(p)], capture_output=True, text=True).stdout)
    s = j["streams"][0]; assert (s["width"], s["height"]) == (1080, 1920) and s.get("sample_aspect_ratio", "1:1") in ("1:1", "N/A") and not any(float(d.get("rotation", 0)) for d in s.get("side_data_list", [])), s
    return float(j["format"]["duration"])
def zipit(body, hook, out):
    key = f"b{body}h{hook}"
    clips = {p.name: hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted((ROOT / "public/clips").glob("*.mp4"))}
    readme = ("MARK3 - Body %d Hook %d. Bewerkbaar Remotion-project (staand 1080x1920). Installeren: npm install (lockfile meegeleverd), dan: npx remotion render Body%d-Hook%d out.mp4\n"
              "Clips in public/clips zijn lichtere re-encodes (H.264 crf 22, 1080x1920) van de originele Veo 3.1-clips; de originele clips staan met generation-ID in de Frame.io Bronnenbibliotheek.\n"
              "Voice-over: ElevenLabs eleven_v4, voice YgjXqgzBJa9op0K278OW. Muziek: ElevenLabs music_v1 (instrumentaal), instellingen in work/music-settings.json. Geen geluidseffecten.\n"
              "sha256 originele clips: %s\n") % (body, hook, body, hook, json.dumps(clips))
    with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as z:
        for f in ["package.json", "tsconfig.json", "remotion.config.ts", ".gitignore"]: z.write(ROOT / f, f)
        z.write(ROOT.parent / "package-lock.json", "package-lock.json")
        for d in ["src", "scripts"]:
            for p in (ROOT / d).rglob("*"):
                if p.is_file() and "__pycache__" not in str(p): z.write(p, p.relative_to(ROOT))
        for d in ["logo", "fonts", "portrait", "muziek"]:
            for p in (ROOT / "public" / d).rglob("*"):
                if p.is_file(): z.write(p, p.relative_to(ROOT))
        z.write(ROOT / f"public/vo/{key}.wav", f"public/vo/{key}.wav")
        for p in sorted((ROOT / "work/clips-slim").glob("*.mp4")): z.write(p, f"public/clips/{p.name}")
        for f in ["vo-provenance.json", "woorden-tts.json", "music-settings.json", "library-ids.json"]:
            if (ROOT / "work" / f).exists(): z.write(ROOT / "work" / f, "work/" + f)
        z.write(STATE / "veo-ledger.json", "work/veo-ledger.json")
        z.writestr("README.txt", readme)
if __name__ == "__main__":
    b = bridge(); reg_p = STATE / "outputs.json"; reg = json.loads(reg_p.read_text()) if reg_p.exists() else {}
    for body in (1, 2, 3):
        for hook in range(1, 6):
            title = f"Body {body} Hook {hook}"; mp4 = ROOT / f"out/mark3-body{body}-hook{hook}.mp4"
            if not mp4.exists() or reg.get(title, {}).get("done"): continue
            d = probe(mp4); oid = reg.setdefault(title, {"id": str(uuid.uuid4())})["id"]; reg_p.write_text(json.dumps(reg))
            z = STATE / f"src-b{body}h{hook}.zip"; zipit(body, hook, z); assert z.stat().st_size < 190e6
            b.upload(title, mp4, z, output_id=oid); reg[title]["done"] = True; reg_p.write_text(json.dumps(reg)); z.unlink()
            print(title, "geupload", f"{d:.1f}s", mp4.stat().st_size // 1000000, "MB", flush=True)
    print("alle:", [v["id"] for v in reg.values() if v.get("done")])
