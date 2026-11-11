"""Bewerkbare bron-ZIP per video (revisie 1): Remotion-bron, scripts, provenance, VO (volledig + hookdeel), muziek-stem,
de gebruikte clips. Geen node_modules, out/, tts-cache, .env, sleutels of portal-tokens; geen finale MP4.
Gebruik: python3 scripts/maak_bronarchief_rev.py <uitmap>"""
import json, re, sys, zipfile
from pathlib import Path

R = Path(__file__).resolve().parent.parent
OUT = Path(sys.argv[1]); OUT.mkdir(parents=True, exist_ok=True)
cfg = (R / "src/config.ts").read_text()
body_block = re.search(r"BODY_SHOTS[^=]*=\s*\{(.*?)\n\};", cfg, re.S).group(1)
hook_block = re.search(r"HOOK_SHOTS[^=]*=\s*\{(.*?)\n\};", cfg, re.S).group(1)
EXCL = ("node_modules", "out/", "scripts/tts-cache", ".nxt-", "public/clips/", "public/vo/", "public/muziek/", ".git/", ".env")
README = """Karakterplein 13 (Koer, Rotterdam) - bewerkbare Remotion-bron, {key} (revisie 1)
Revisie 1: body + CTA vermelden nu ca. 225 m2 (meetrapport: 229,90 m2 GBO wonen) en veel slaapkamers, en de CTA nodigt uit om
vrijblijvend een kijkafspraak te maken en de ruimte zelf te ervaren. Nieuwe body/CTA-voice-over: eleven_v4 (scripts/maak_vo_revisie.py);
de hooks zijn hergebruikt uit versie 1 (eleven_v4, public/vo/hooks/). Muziek: dezelfde music_v1-stem, 6,5% vertraagd (muziek_v2.mp3).
Installeren: npm install ; Studio: npx remotion studio ; volledige video: composition Body{b}-Hook{h}.
Productie: python3 scripts/render_all.py <chromium> (rendert Hook{b}-{h} en Body{b} apart, plakt met ffmpeg, mixt VO + muziek).
public/clips = lichtere kopieen (crf 24) van de Veo-clips (generation-ID's: scripts/gen_ledger.json) en rondleidingssnedes (walk-*);
originelen staan in de Frame.io Bronnenbibliotheek (sha256 in scripts/start_hashes.json). Geen sound effects.
"""
for b in (1, 2, 3):
    bline = [l for l in body_block.split("\n") if l.strip().startswith(f"{b}: [")][0]
    hline = [l for l in hook_block.split("\n") if l.strip().startswith(f"{b}: {{")][0]
    for h in range(1, 6):
        hshots = set(re.findall(r'"([a-z]+-[a-z]+)"', hline.split(f"{h}: [")[1].split("]")[0]))
        clips = set(re.findall(r'"([a-z]+-[a-z]+)"', bline)) | hshots
        key = f"b{b}h{h}"
        dst = OUT / f"Body{b}-Hook{h}-bron.zip"
        with zipfile.ZipFile(dst, "w", zipfile.ZIP_DEFLATED) as z:
            for p in sorted(R.rglob("*")):
                rel = p.relative_to(R).as_posix()
                if p.is_file() and not p.is_symlink() and not any(x in rel for x in EXCL) and rel != "README.txt":
                    z.write(p, rel)
            z.writestr("README.txt", README.format(key=key, b=b, h=h))
            z.write(R / f"public/vo/{key}.mp3", f"public/vo/{key}.mp3")
            z.write(R / f"public/vo/hooks/{key}.mp3", f"public/vo/hooks/{key}.mp3")
            z.write(R / "public/muziek/muziek_v2.mp3", "public/muziek/muziek_v2.mp3")
            z.write(R / "public/muziek/muziek.mp3", "public/muziek/muziek.mp3")
            for c in sorted(clips):
                z.write(R / f"public/clips/{c}.mp4", f"public/clips/{c}.mp4")
        print(dst.name, round(dst.stat().st_size / 1e6), "MB", len(clips), "clips", flush=True)
