"""Bewerkbaar bronarchief per video (zonder node_modules, .git, out/, sleutels of tokens)."""
import json, re, sys, zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
LOCK = ROOT.parent / "package-lock.json"
sys.path.insert(0, str(ROOT / "scripts"))


def clips_for(b, h):
    cfg = (ROOT / "src/config.ts").read_text()
    block = cfg.split(f'"{b}": {{\n    tag')[1].split("\n  },")[0]
    used = set(re.findall(r'clip: "(\w+)"', block))
    hooks = re.search(rf'"{b}": \[(.*?)\]', cfg.split("HOOK_CLIPS")[1]).group(1)
    used.add(re.findall(r'"(\w+)"', hooks)[h - 1])
    return used


def build(b, h, dst):
    files = []
    for p in ["README.md", "package.json", "remotion.config.ts", "tsconfig.json", ".gitignore"]:
        files.append(ROOT / p)
    files += sorted((ROOT / "src").glob("*")) + sorted((ROOT / "scripts").glob("*.py")) + [ROOT / "scripts/scripts.json"]
    files += sorted((ROOT / "public/fonts").glob("*")) + sorted((ROOT / "public/logo").glob("*"))
    files += [ROOT / f"public/vo/b{b}h{h}.mp3", ROOT / f"public/vo/b{b}h{h}.json", ROOT / f"public/vo/body{b}.mp3", ROOT / f"public/vo/body{b}.json", ROOT / f"public/music/body{b}.mp3"]
    files += [ROOT / f"public/clips/{c}.mp4" for c in sorted(clips_for(b, h))]
    files += [ROOT / "bronnen/generaties.json", ROOT / "bronnen/bibliotheek.json"]
    files += sorted((ROOT / "bronnen/startbeelden").glob("*.png")) + sorted((ROOT / "bronnen/origineel").glob("*"))
    with zipfile.ZipFile(dst, "w", zipfile.ZIP_DEFLATED) as z:
        for f in files:
            if f.is_file() and f.name not in (".env",):
                z.write(f, "stock-haarlem-xl/" + str(f.relative_to(ROOT)), compress_type=zipfile.ZIP_STORED if f.suffix in (".mp4", ".mp3", ".png", ".webp", ".woff2") else zipfile.ZIP_DEFLATED)
        z.write(LOCK, "package-lock.json")
        z.write(ROOT.parent / "package.json", "package.root.json")
        z.writestr("stock-haarlem-xl/composition.json", json.dumps({"composition": f"Body{b}-Hook{h}", "width": 1080, "height": 1920, "fps": 30, "title": f"Body {b} Hook {h}"}, indent=1))
    return dst


if __name__ == "__main__":
    b, h = int(sys.argv[1]), int(sys.argv[2])
    print(build(b, h, Path(sys.argv[3])))
