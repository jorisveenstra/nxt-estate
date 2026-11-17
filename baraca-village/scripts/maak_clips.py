"""
Snijdt de originele baraca_village-video's (4K liggend) bij tot staande 1080x1920-clips (30 fps, geen geluid)
met een vaste, onderwerpgerichte uitsnede (geen opvulling, geen uitrekken), en zet de Veo-clips om naar 30 fps.

Bronnen: media/bronnen/ (originelen uit de Frame.io-Bronnenbibliotheek) en media/beweging/ (Veo-originelen).
Uitvoer: public/clips/<naam>.mp4 en src/clips.json (lengte per clip).

Gebruik: python3 scripts/maak_clips.py
"""
import json
import subprocess
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
B = "baraca_village Baraca Village - "
# naam: (bronbestand, horizontaal middelpunt van de uitsnede als fractie van de breedte)
UITSNEDE = {
    "poort": ("baraca_village 12 Kids at the gate v2.mov", 0.185),
    "poort_kinderen": ("baraca_village 12 Kids at the gate v2.mov", 0.70),
    "villa1": (B + "video 01 curtains in the breeze.mov", 0.55),
    "villa2": (B + "video 02 pool ripples and palms.mov", 0.36),
    "villa2_zwembad": (B + "video 02 pool ripples and palms.mov", 0.78),
    "villa3": (B + "video 03 morning light push-in.mov", 0.45),
    "drone_zee": (B + "video 04 drone flyover to the sea.mov", 0.50),
    "drone_zee_links": (B + "video 04 drone flyover to the sea.mov", 0.22),
    "drone_orbit": (B + "video 05 drone orbit kids on the village road.mov", 0.55),
    "woonkamer": (B + "video 09 living room curtains.mov", 0.42),
    "woonkamer_tuin": (B + "video 09 living room curtains.mov", 0.82),
    "slaapkamer": (B + "video 10 bedroom garden breeze.mov", 0.60),
    "keuken": (B + "video 11 kitchen dining morning v2.mov", 0.38),
    "keuken_eiland": (B + "video 11 kitchen dining morning v2.mov", 0.70),
    "zwembad": (B + "video 13 common pool.mov", 0.40),
    "zwembad_rechts": (B + "video 13 common pool.mov", 0.78),
}
VEO = {
    "straat": "Baraca Village - Villastraat - rustige push-in langs de villa's - gouden uur - 9x16.mp4",
    "speeltuin": "Baraca Village - Speeltuin en waterspeelplek - langzame tilt omhoog - gouden uur - 9x16.mp4",
    "badkamer": "Baraca Village - Badkamer met dubbele wastafel - subtiele push-in - warm interieurlicht - 9x16.mp4",
}
ENC = ["-an", "-c:v", "libx264", "-crf", "17", "-preset", "medium", "-pix_fmt", "yuv420p", "-movflags", "+faststart"]


def probe(p):
    out = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries",
                          "stream=width,height:format=duration", "-of", "json", str(p)], capture_output=True, text=True).stdout
    d = json.loads(out)
    return d["streams"][0]["width"], d["streams"][0]["height"], float(d["format"]["duration"])


def snij(naam):
    uit = ROOT / f"public/clips/{naam}.mp4"
    if naam in VEO:
        bron = ROOT / "media/beweging" / VEO[naam]
        w, h, _ = probe(bron)
        assert (w, h) == (1080, 1920), f"{naam}: Veo-clip is {w}x{h}, niet native 1080x1920"
        vf = "fps=30,setsar=1"
    else:
        bron_naam, cx = UITSNEDE[naam]
        bron = ROOT / "media/bronnen" / bron_naam
        w, h, _ = probe(bron)
        cw = round(h * 9 / 16 / 2) * 2
        x = int(min(max(cx * w - cw / 2, 0), w - cw))
        vf = f"crop={cw}:{h}:{x}:0,scale=1080:1920:flags=lanczos,fps=30,setsar=1"
    if not uit.exists():
        subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-y", "-i", str(bron), "-vf", vf, *ENC, str(uit)], check=True)
    return naam, round(probe(uit)[2], 3)


def main():
    (ROOT / "public/clips").mkdir(parents=True, exist_ok=True)
    namen = list(UITSNEDE) + [n for n in VEO if (ROOT / "media/beweging" / VEO[n]).exists()]
    with ThreadPoolExecutor(2) as pool:
        lengtes = dict(pool.map(snij, namen))
    (ROOT / "src/clips.json").write_text(json.dumps(lengtes, indent=1))
    print(lengtes)


if __name__ == "__main__":
    main()
