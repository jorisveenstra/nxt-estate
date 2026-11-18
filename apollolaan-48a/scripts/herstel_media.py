"""
Bouwt public/clips/ en public/vo/ + src/timing.json opnieuw op uit ai-clips/ en scripts/tts-cache/, zonder nieuwe
ElevenLabs-aanvragen (er wordt alleen lokaal getranscodeerd).

Gebruik: python3 scripts/herstel_media.py
"""
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
GEBRUIKT = ["achtergevel-woning", "achtergevel-boot", "achtergevel-terras", "ringvaart-twiske", "keuken-kookeiland",
            "keuken-eettafel", "woonkamer-tuindeuren", "woonkamer-eethoek"]

(ROOT / "public/clips").mkdir(parents=True, exist_ok=True)
for n in GEBRUIKT:
    uit = ROOT / "public/clips" / f"{n}.mp4"
    bron = ROOT / "ai-clips" / f"{n}.mp4"
    if not bron.exists():
        # Per-video bronarchieven bevatten alleen de clips van die video; de rest staat in de Frame.io-bronnenbibliotheek
        # (zie bron/bibliotheek.json, sleutel clip:<naam>, met sha256 en generation_id).
        print("clip ontbreekt lokaal (zie bron/bibliotheek.json):", n)
        continue
    if not uit.exists():
        subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-y", "-i", str(ROOT / "ai-clips" / f"{n}.mp4"), "-vf",
                        "fps=30,format=yuv420p,setsar=1", "-an", "-c:v", "libx264", "-crf", "18", "-preset", "medium",
                        "-g", "30", "-movflags", "+faststart", str(uit)], check=True)
        print("clip", n)
# maak_vo.py gebruikt alleen de cache zolang de teksten in scripts/scripts.json ongewijzigd zijn.
subprocess.run([sys.executable, str(ROOT / "scripts/maak_vo.py")], check=True)
