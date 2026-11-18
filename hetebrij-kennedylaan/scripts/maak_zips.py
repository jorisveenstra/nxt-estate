"""
Bouwt per variant een bewerkbaar bron-ZIP (max 200 MB) voor de portal/Frame.io:
Remotion-project (src, scripts, config), package.json + lockfile van de root, fonts, logo,
voice-overs, muziekbed, staande startbeelden, originele renders, en bewerkkopieën van de
Veo-clips (CRF 23; de onbewerkte originele clips staan in de Frame.io-Bronnenbibliotheek,
zie BRONNEN.json). Geen node_modules, .git, .env, sleutels, tokens of eindrenders.

Gebruik: python3 scripts/maak_zips.py <map-met-clip-bewerkkopieen> <uitmap>
"""
import hashlib, json, sys, zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
REPO = ROOT.parent
SKIP_DIRS = {"node_modules", ".git", "out", "tts-cache", "__pycache__"}
SKIP_FILES = {".env"}


def sha(p):
    return hashlib.sha256(Path(p).read_bytes()).hexdigest()


def files():
    for p in sorted(ROOT.rglob("*")):
        rel = p.relative_to(ROOT)
        if p.is_symlink() or not p.is_file() or any(part in SKIP_DIRS for part in rel.parts):
            continue
        if p.name in SKIP_FILES or p.name.startswith(".nxt-") or p.suffix in (".pending", ".part"):
            continue
        if rel.parts[:2] == ("public", "clips"):
            continue  # bewerkkopieën apart
        yield p, rel


def main():
    clipdir, outdir = Path(sys.argv[1]), Path(sys.argv[2])
    outdir.mkdir(parents=True, exist_ok=True)
    timing = json.loads((ROOT / "src/timing.json").read_text())
    veo = json.loads((ROOT / "scripts/veo-ledger.json").read_text())
    lib = json.loads((ROOT / "scripts/bibliotheek-ids.json").read_text())
    shots = json.loads((ROOT / "scripts/shots.json").read_text())
    bronnen = {}
    for shot, L in veo.items():
        if L.get("status") != "completed":
            continue
        bronnen[shot] = {
            "origineel_render": f"bronnen/origineel/{shots[shot]['label'].replace(' ', '-')}.{shots[shot]['src'].rsplit('.', 1)[1]}",
            "frameio_bron_bestand": shots[shot]["src"],
            "staand_startbeeld": f"bronnen/staand/{shot}.png",
            "staand_startbeeld_sha256": L["start_sha256"],
            "crop_px_w_h_x_y": shots[shot]["crop"],
            "veo_generation_id": L["generation_id"], "veo_model": L["model_id"], "prompt": L["prompt"],
            "elevenlabs_asset_id_startbeeld": L["asset_id"],
            "originele_clip_sha256": L["clip_sha256"],
            "bibliotheek_portrait_image_id": lib.get(f"{shot}:portrait_image", {}).get("library_id"),
            "bibliotheek_motion_clip_id": lib.get(f"{shot}:motion_clip", {}).get("library_id"),
            "bewerkkopie_in_zip": f"public/clips/{shot}.mp4 (libx264 CRF 23, 1080x1920; origineel in Frame.io-bibliotheek)",
        }
    base = list(files())
    for b in (1, 2, 3):
        for h in range(1, 6):
            title = f"Body {b} Hook {h}"
            variant = {
                "title": title, "body": b, "hook": h,
                "compositions": [f"Hook-B{b}-H{h}", f"Body{b}"],
                "frames": {"hook": timing[f"b{b}h{h}"]["frames"], "body": timing[f"b{b}"]["frames"]},
                "format": "1080x1920, 30 fps, h264 CRF 24, AAC 160k, faststart",
                "voiceover": {"model_id": "eleven_v4", "voice_id": "YgjXqgzBJa9op0K278OW",
                              "files": [f"public/vo/b{b}h{h}-hook.wav", f"public/vo/b{b}-body.wav"],
                              "provenance": "scripts/vo-provenance.json"},
                "music": {"file": "public/muziek/bed.mp3", "meta": "scripts/muziek-meta.json", "model_id": "music_v1"},
                "sound_effects": "uitgeschakeld (geen SFX)",
                "render": f"npm install (repo-root) && cd hetebrij-kennedylaan && python3 scripts/monteer.py --alleen b{b}h{h}",
            }
            z = outdir / f"{title}.zip"
            with zipfile.ZipFile(z, "w", zipfile.ZIP_DEFLATED, compresslevel=6) as zf:
                pre = "hetebrij-kennedylaan/"
                for p, rel in base:
                    zf.write(p, pre + str(rel))
                for c in sorted(Path(clipdir).glob("*.mp4")):
                    zf.write(c, pre + f"public/clips/{c.name}", compress_type=zipfile.ZIP_STORED)
                zf.write(REPO / "package.json", "package.json")
                zf.write(REPO / "package-lock.json", "package-lock.json")
                zf.writestr(pre + "VARIANT.json", json.dumps(variant, indent=1, ensure_ascii=False))
                zf.writestr(pre + "BRONNEN.json", json.dumps(bronnen, indent=1, ensure_ascii=False))
            print(z.name, f"{z.stat().st_size / 1e6:.1f} MB")
            if z.stat().st_size > 200_000_000:
                raise SystemExit("ZIP te groot")


if __name__ == "__main__":
    main()
