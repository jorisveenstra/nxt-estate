"""Maakt per video een bronarchief (zonder node_modules, out/, .env, tokens). Clips zijn gecomprimeerde kopieën; originele 1080x1920-clips: zie provenance/ (SHA256) en de Frame.io-bronnenbibliotheek."""
import zipfile, pathlib, sys, shutil
R = pathlib.Path(__file__).resolve().parent.parent; ARCH = pathlib.Path(sys.argv[1]); OUT = pathlib.Path(sys.argv[2]); OUT.mkdir(parents=True, exist_ok=True)
SKIP = {"node_modules", "out", ".git"}
def files():
    for p in R.rglob("*"):
        rel = p.relative_to(R)
        if p.is_dir() or rel.parts[0] in SKIP or rel.parts[:2] == ("public", "clips") or p.suffix in (".hdr",) or p.name.startswith(".env"): continue
        yield p, rel
base = OUT / "base.zip"
with zipfile.ZipFile(base, "w", zipfile.ZIP_DEFLATED) as z:
    for p, rel in files(): z.write(p, "wonen-in-de-oevers/" + str(rel))
    for p in ARCH.rglob("*.mp4"): z.write(p, "wonen-in-de-oevers/public/clips/" + p.name)
    z.write(R.parent / "package.json", "package.json"); z.write(R.parent / "package-lock.json", "package-lock.json")
print(base.stat().st_size)
for b in (1, 2, 3):
    for h in (1, 2, 3, 4, 5):
        t = OUT / f"Body {b} Hook {h}.zip"; shutil.copy(base, t)
        with zipfile.ZipFile(t, "a", zipfile.ZIP_DEFLATED) as z:
            z.writestr("wonen-in-de-oevers/VIDEO.txt", f"Body {b} Hook {h}: renders Hook-b{b}h{h} + Body-b{b} (scripts/render_alles.sh), mix: public/vo/b{b}h{h}-hook.wav + public/vo/body{b}.wav + public/music/oevers-music.mp3\n")
base.unlink()
