"""
Maakt per video een bewerkbaar bron-ZIP: Remotion-bron, package.json + lockfile, voice-overs (met
provenance), muziekbed (met provenance), fonts, logo, de gebruikte bibliotheekclips (met hashes en
generation-IDs) en REVISIE.md. Geen node_modules, .git, out/, credentials, portal-tokens of
eindrenders.
"""
import json, re, sys, zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
REPO = ROOT.parent
VERBODEN = re.compile(r"(node_modules|/\.git/|/out/|\.env|\.nxt-|tts-cache/.*\.pending)")


def bestanden(b, h):
    cfg = (ROOT / "src/config.ts").read_text()
    blok = cfg.split(f"\n  {b}: {{", 1)[1].split("\n  },", 1)[0]
    hook_clips = json.loads(re.search(r"hookClips: (\[[^\]]*\])", blok).group(1))
    shots = json.loads(re.search(r"shots: (\[.*?\]\]),", blok).group(1))
    clips = {hook_clips[h - 1]} | {c for s in shots for c in s}
    vaste = ["package.json", "remotion.config.ts", "tsconfig.json"]
    out = [ROOT / f for f in vaste]
    out += sorted((ROOT / "src").glob("*")) + sorted(p for p in (ROOT / "scripts").glob("*") if p.is_file())
    out += [ROOT / f"public/vo/body{b}.mp3", ROOT / f"public/vo/b{b}h{h}.mp3", ROOT / "public/vo/provenance.json",
            ROOT / f"public/music/body{b}.mp3", ROOT / f"public/music/body{b}.json", ROOT / "public/clips/index.json"]
    out += sorted((ROOT / "public/fonts").glob("*.ttf")) + sorted((ROOT / "public/logo").glob("*"))
    out += [ROOT / f"public/clips/foto{c:02d}.mp4" for c in sorted(clips)]
    return out, sorted(clips)


def main(b, h, dst):
    files, clips = bestanden(b, h)
    readme = (ROOT / "REVISIE.md").read_text().replace("{{VIDEO}}", f"Body {b} Hook {h}") \
        .replace("{{COMP}}", f"Body{b} + Body{b}-Hook{h}-hook").replace("{{CLIPS}}", ", ".join(f"foto{c:02d}" for c in clips))
    with zipfile.ZipFile(dst, "w", zipfile.ZIP_DEFLATED) as z:
        z.writestr("elbe-23-den-haag/REVISIE.md", readme)
        z.write(REPO / "package.json", "package.json")
        z.write(REPO / "package-lock.json", "package-lock.json")
        z.write(REPO / "tools/portal_bridge.py", "tools/portal_bridge.py")
        for f in files:
            rel = "elbe-23-den-haag/" + str(f.relative_to(ROOT))
            assert f.is_file() and not VERBODEN.search("/" + rel), rel
            z.write(f, rel, compress_type=zipfile.ZIP_STORED if f.suffix in (".mp4", ".mp3") else zipfile.ZIP_DEFLATED)
    return dst


if __name__ == "__main__":
    print(main(int(sys.argv[1]), int(sys.argv[2]), Path(sys.argv[3])))
