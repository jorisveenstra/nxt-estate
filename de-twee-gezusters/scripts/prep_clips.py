"""
Zet de gekozen bronclips uit de Frame.io-Bronnenbibliotheek om naar staande 1080x1920-clips in public/clips/.
- AI-renderclips (motion_clip) zijn al native 1080x1920: alleen opnieuw gecodeerd (geen nieuwe generatie).
- REAL-opnames (1920x1080) worden cover-fit uitgesneden (geen opvulling, geen uitrekken); cropX = horizontale
  positie van de uitsnede (0 = links, 1 = rechts). Framerate van de bron blijft behouden (vloeiende vertraging).
Schrijft src/clips.json met de lengte per clip.

Gebruik: python3 scripts/prep_clips.py <map met gedownloade bibliotheekbestanden>
"""
import concurrent.futures as cf
import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def prep(item):
    name, c = item
    src = Path(sys.argv[1]) / c["bestand"]
    uit = ROOT / f"public/clips/{name}.mp4"
    if c["cropX"] is None:
        vf = "scale=1080:1920:flags=lanczos,setsar=1"
    else:
        vf = f"scale=-2:1920:flags=lanczos,crop=1080:1920:(iw-1080)*{c['cropX']}:0,setsar=1"
    if not uit.exists():
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(src), "-an", "-vf", vf, "-c:v", "libx264", "-preset", "medium",
                        "-crf", "20", "-pix_fmt", "yuv420p", "-g", "30", "-movflags", "+faststart", str(uit)], check=True)
    d = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration:stream=width,height", "-of", "json", str(uit)],
                       capture_output=True, text=True, check=True)
    j = json.loads(d.stdout)
    assert (j["streams"][0]["width"], j["streams"][0]["height"]) == (1080, 1920), name
    return name, round(float(j["format"]["duration"]), 3)


def main():
    bron = json.loads((ROOT / "scripts/clips-bron.json").read_text())
    (ROOT / "public/clips").mkdir(parents=True, exist_ok=True)
    with cf.ThreadPoolExecutor(3) as ex:
        lengtes = dict(ex.map(prep, bron.items()))
    (ROOT / "src/clips.json").write_text(json.dumps(dict(sorted(lengtes.items())), indent=1))
    print(len(lengtes), "clips")


if __name__ == "__main__":
    main()
