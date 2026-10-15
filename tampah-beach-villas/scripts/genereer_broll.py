"""
Genereert realistische B-roll voor de hooks/scènes die over Nederland gaan (Den Haag, box 3, bank, pensioen),
via ElevenLabs Image & Video (Veo 3.1, tekst-naar-video, staand 9:16, 1080p, zonder geluid).

Gebruik: python3 scripts/genereer_broll.py [naam ...]   (zonder namen: alle clips die nog niet bestaan)
Uitvoer: ai-broll/<naam>.mp4 (origineel) en public/clips/<naam>.mp4 (30 fps)
API-sleutel: ELEVENLABS_API_KEY in ~/.elevenlabs
"""
import json
import subprocess
import sys
import time
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
STIJL = (
    "Photorealistic documentary-style footage shot on a full-frame cinema camera, natural light, "
    "realistic skin and materials, shallow depth of field, subtle handheld or gimbal movement, vertical 9:16 framing. "
)
NEGATIEF = "text, captions, subtitles, logos, watermark, readable writing, cartoon, illustration, CGI look, distorted faces, extra fingers, warping, morphing, flicker"

CLIPS = {
    # Den Haag / politiek
    "nl-binnenhof": "Slow cinematic drone shot over the Hofvijver pond towards the historic Binnenhof parliament buildings in The Hague, Netherlands, on a grey overcast autumn day, reflections in the water.",
    "nl-binnenhof-plein": "People in coats walking across the cobbled inner courtyard of the Binnenhof in The Hague, Netherlands, with the medieval Ridderzaal hall in the background, overcast daylight, slow push-in.",
    # Box 3 / verhuur
    "nl-rijtjeshuizen": "Slow gimbal shot along a street of typical Dutch brick terraced houses with white window frames and bicycles parked in front, overcast sky, quiet residential neighbourhood in the Netherlands.",
    "nl-grachtenpanden": "Slow pan along historic Dutch canal houses in Amsterdam with apartments above, bicycles on the bridge, soft overcast daylight.",
    "nl-verhuurder-sleutels": "A Dutch landlord in his fifties hands a set of house keys to a young tenant at the front door of a brick apartment building, close-up of the keys changing hands, natural daylight.",
    "nl-papierwerk": "Close-up of a middle-aged Dutch man at a kitchen table sighing over a pile of tax forms and letters with a calculator and reading glasses, soft window light, he rubs his forehead.",
    "nl-belastingbrief": "Close-up of hands opening a plain blue envelope at a wooden kitchen table in a Dutch home, a woman reads the letter with a concerned expression, soft morning light.",
    # Bank / inflatie / inkomen
    "nl-bank-laptop": "A Dutch couple in their fifties sits at the dining table looking at their savings on a laptop, the man frowns and points at the screen, cosy living room, evening lamp light.",
    "nl-euromunten": "Macro shot of a small stack of euro coins on a wooden table slowly being reduced as a hand takes coins away one by one, shallow depth of field, warm light.",
    "nl-kantoor-loonstrook": "A Dutch professional in his forties at an office desk looks at his payslip and a calculator with a disappointed expression, modern office, daylight through large windows.",
    # Pensioen (body 2)
    "nl-pensioen-stel": "A retired Dutch couple in their sixties sits at the kitchen table reading pension documents together, the woman points at a page, warm natural light, calm but thoughtful mood.",
    "nl-pensioen-raam": "A Dutch man in his late fifties stands at the window of his living room holding a letter, looking outside thoughtfully, rainy Dutch street outside, soft grey light.",
}


def sleutel():
    for r in (Path.home() / ".elevenlabs").read_text().splitlines():
        if r.startswith("ELEVENLABS_API_KEY="):
            return r.split("=", 1)[1].strip()


def api(pad, body=None):
    req = urllib.request.Request(
        f"https://api.elevenlabs.io/v1/flows/video{pad}",
        data=json.dumps(body).encode() if body else None,
        headers={"xi-api-key": sleutel(), "Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req, timeout=120) as r:
        return json.loads(r.read())


def maak(naam):
    origineel = ROOT / "ai-broll" / f"{naam}.mp4"
    if not origineel.exists():
        gen = api("", {
            "model_id": "veo-3.1-generate-001", "prompt": STIJL + CLIPS[naam], "negative_prompt": NEGATIEF,
            "aspect_ratio": "9:16", "duration_secs": 6, "resolution": "1080p", "generate_audio": False,
        })
        print(naam, "ingediend", gen["id"], flush=True)
        wacht = 20
        for _ in range(80):
            time.sleep(wacht)
            r = api(f"/{gen['id']}")
            if r["status"] in ("completed", "failed"):
                break
            wacht = min(60, wacht * 1.3)
        if r["status"] != "completed":
            print(naam, "MISLUKT:", r.get("failure_reason"), r.get("error_message"), flush=True)
            return
        origineel.write_bytes(urllib.request.urlopen(r["content_url"]).read())
    subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-y", "-i", str(origineel), "-vf", "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,fps=30,format=yuv420p",
                    "-an", "-c:v", "libx264", "-crf", "19", "-preset", "medium", "-movflags", "+faststart", str(ROOT / "public/clips" / f"{naam}.mp4")], check=True)
    print(naam, "klaar", flush=True)


def main():
    (ROOT / "ai-broll").mkdir(exist_ok=True)
    namen = sys.argv[1:] or [n for n in CLIPS if not (ROOT / "public/clips" / f"{n}.mp4").exists()]
    with ThreadPoolExecutor(4) as pool:
        list(pool.map(maak, namen))


if __name__ == "__main__":
    main()
