"""Maakt per video een bewerkbare bron-ZIP (Remotion-bron, VO, muziek, alleen de gebruikte clips als lichtere kopie). Geen secrets, geen finale MP4."""
import json, re, zipfile
from pathlib import Path
R = Path(__file__).resolve().parent.parent
cfg = (R / "src/config.ts").read_text()
BS = {b: {c for c in re.findall(r'"((?:real|imp|walk)-[a-z]+)"', block)} for b, block in
      zip((1, 2, 3), re.findall(r"BODY_SHOTS[^=]*=\s*\{(.*?)\n\};", cfg, re.S)[0].split("\n  ")[1:])}
hooks = json.loads(json.dumps({}))
HS = re.findall(r"HOOK_SHOTS[^=]*=\s*\{(.*?)\n\};", cfg, re.S)[0]
root = json.loads((R.parent / "package.json").read_text())
pkg = json.loads((R / "package.json").read_text())
pkg["dependencies"] = {k: v for k, v in root["dependencies"].items() if k != "@remotion/google-fonts"}
pkg["devDependencies"] = root.get("devDependencies", {})
EXCL = ("node_modules", "out/", "scripts/tts-cache", ".nxt-", "public/clips", "public/vo/", "public/muziek", ".git/")
def ok(p): return not any(x in p for x in EXCL)
README = """Karakterplein 13 (Koer, Rotterdam) - bewerkbare Remotion-bron, {key}
Installeren: npm install ; Studio: npx remotion studio ; volledige video: composition Body{b}-Hook{h} (hook + body + audio).
Productie rendert Hook{b}-{h} en Body{b} apart (--muted) en plakt ze met ffmpeg; audiomix in scripts/render_all.py.
public/clips = lichtere kopieen (crf 24) van de Veo-clips (generation-ID's: scripts/gen_ledger.json) en de rondleidingssnedes (walk-*); de
originele 1080x1920-clips en bronfoto's staan in de Frame.io Bronnenbibliotheek (sha256 in scripts/start_hashes.json).
Voice-over: eleven_v4, voice YgjXqgzBJa9op0K278OW (scripts/vo_provenance.json). Muziek: music_v1 (scripts/music_provenance.json). Geen sound effects.
"""
(R / "out/zips").mkdir(exist_ok=True)
for b in (1, 2, 3):
    for h in range(1, 6):
        hk = re.findall(rf"\b{b}: \{{(.*?)\}}", HS, re.S)  # ruw; hieronder exact via regels
        hookline = [l for l in HS.split("\n") if l.strip().startswith(f"{b}: {{")][0]
        hshots = set(re.findall(r'"([a-z]+-[a-z]+)"', hookline.split(f"{h}: [")[1].split("]")[0]))
        clips = BS[b] | hshots
        key = f"b{b}h{h}"
        dst = R / f"out/zips/Body{b}-Hook{h}-bron.zip"
        with zipfile.ZipFile(dst, "w", zipfile.ZIP_DEFLATED) as z:
            for p in sorted(R.rglob("*")):
                rel = p.relative_to(R).as_posix()
                if p.is_file() and not p.is_symlink() and ok(rel) and rel != "package.json": z.write(p, rel)
            z.writestr("package.json", json.dumps(pkg, indent=2))
            z.write(R.parent / "package-lock.json", "package-lock.json")
            z.writestr("README.txt", README.format(key=key, b=b, h=h))
            z.write(R / f"public/vo/{key}.mp3", f"public/vo/{key}.mp3")
            z.write(R / "public/muziek/muziek.mp3", "public/muziek/muziek.mp3")
            for c in sorted(clips): z.write(R / f"out/archive-clips/{c}.mp4", f"public/clips/{c}.mp4")
        print(dst.name, round(dst.stat().st_size / 1e6), "MB", len(clips), "clips")
