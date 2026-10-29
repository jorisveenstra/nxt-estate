"""Plakt hook + body aan elkaar (stream copy) en mixt voice-over + muziek; maakt per video een bron-ZIP.

Gebruik: python3 scripts/assembleer.py   (verwacht out/HookB<b>H<h>.mp4 en out/BodyDeel<b>.mp4)
"""
import hashlib, json, subprocess, sys, zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SCRATCH = Path(sys.argv[1]) if len(sys.argv) > 1 else None  # map met provenance.json (gegenereerd tijdens productie)
timing = json.loads((ROOT / "src/timing.json").read_text())


def run(*a):
    subprocess.run([str(x) for x in a], check=True)


def duur(p):
    return float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(p)], capture_output=True, text=True).stdout)


(ROOT / "out/final").mkdir(parents=True, exist_ok=True)
(ROOT / "out/zip").mkdir(parents=True, exist_ok=True)
for key in timing:
    b, h = key[1:].split("h")
    uit = ROOT / f"out/final/Body {b} Hook {h}.mp4"
    lst = ROOT / f"out/lijst-{key}.txt"
    lst.write_text(f"file '{ROOT}/out/HookB{b}H{h}.mp4'\nfile '{ROOT}/out/BodyDeel{b}.mp4'\n")
    stil = ROOT / f"out/stil-{key}.mp4"
    run("ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", lst, "-c", "copy", stil)
    d = duur(stil)
    filt = (f"[1:a]apad=whole_dur={d:.3f}[v];[2:a]atrim=0:{d:.3f},afade=t=in:d=0.67,afade=t=out:st={d - 2:.3f}:d=2,volume=0.17[m];"
            f"[v][m]amix=inputs=2:duration=first:normalize=0,alimiter=limit=0.95[a]")
    run("ffmpeg", "-v", "error", "-y", "-i", stil, "-i", ROOT / f"public/vo/{key}.wav", "-i", ROOT / "public/muziek/muziek.mp3",
        "-filter_complex", filt, "-map", "0:v", "-map", "[a]", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-t", f"{d:.3f}", "-movflags", "+faststart", uit)
    lst.unlink()
    stil.unlink()
    print(key, f"{duur(uit):.2f}s", f"{uit.stat().st_size / 1e6:.1f} MB", flush=True)

    # bron-ZIP: bewerkbare Remotion-bron + media van deze video, zonder eind-MP4's, node_modules of sleutels
    z = ROOT / f"out/zip/Body {b} Hook {h} - bron.zip"
    with zipfile.ZipFile(z, "w", zipfile.ZIP_DEFLATED) as zf:
        def add(p, arc):
            zf.write(p, f"de-ark/{arc}")
        for rel in ["package.json", "remotion.config.ts", "tsconfig.json", ".gitignore"]:
            add(ROOT / rel, rel)
        add(ROOT.parent / "package-lock.json", "package-lock.json")
        add(ROOT.parent / "package.json", "root-package.json")
        for p in sorted((ROOT / "src").rglob("*")) + sorted((ROOT / "scripts").glob("*.py")) + [ROOT / "scripts/scripts.json", ROOT / "scripts/woorden-tts.json"]:
            if p.is_file():
                add(p, p.relative_to(ROOT))
        for p in sorted((ROOT / "public").rglob("*")):
            if p.parent.name == "clips" and (ROOT / "out/clips-proxy" / p.name).exists():
                # Bewerkings-proxy (CRF 28, zelfde 1080x1920); de originele clips staan in de Frame.io Bronnenbibliotheek (sha256 in herkomst/provenance.json)
                add(ROOT / "out/clips-proxy" / p.name, p.relative_to(ROOT))
            elif p.is_file() and p.parent.name != "vo" or p == ROOT / f"public/vo/{key}.wav":
                add(p, p.relative_to(ROOT))
        if SCRATCH:
            for p in sorted(SCRATCH.rglob("*")):
                if p.is_file():
                    add(p, f"herkomst/{p.relative_to(SCRATCH)}")
    print("  zip", f"{z.stat().st_size / 1e6:.1f} MB", flush=True)
