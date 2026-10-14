"""
Bewegende AI-renders via ElevenLabs Image & Video (Veo 3.1): foto als eerste frame, staand 9:16.

Gebruik: python3 ai_video.py <startframe.jpg> <uit.mp4> "<prompt>" [duur 4|6|8] [model]
API-sleutel: ELEVENLABS_API_KEY in ~/.elevenlabs
"""
import base64, json, sys, time, urllib.request
from pathlib import Path

NEGATIEF = ("people, persons, hands, new furniture, renovation, changing the room, extra objects, "
            "distortion, warping, morphing, flicker, text, logos, cartoon, fast camera movement")


def sleutel():
    for r in (Path.home() / ".elevenlabs").read_text().splitlines():
        if r.startswith("ELEVENLABS_API_KEY="):
            return r.split("=", 1)[1].strip()


def api(pad, body=None):
    req = urllib.request.Request(f"https://api.elevenlabs.io/v1/flows/video{pad}", data=json.dumps(body).encode() if body else None,
                                 headers={"xi-api-key": sleutel(), "Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=120) as r:
        return json.loads(r.read())


def main():
    frame, uit, prompt = sys.argv[1], Path(sys.argv[2]), sys.argv[3]
    duur = int(sys.argv[4]) if len(sys.argv) > 4 else 6
    model = sys.argv[5] if len(sys.argv) > 5 else "veo-3.1-generate-001"
    body = {
        "model_id": model, "prompt": prompt, "negative_prompt": NEGATIEF, "aspect_ratio": "9:16",
        "duration_secs": duur, "resolution": "1080p", "generate_audio": False,
        "start_frame": {"type": "inline_base64", "content_base64": base64.b64encode(open(frame, "rb").read()).decode(), "mime_type": "image/jpeg"},
    }
    gen = api("", body)
    print(uit.name, "ingediend", gen["id"], flush=True)
    wacht = 15
    for _ in range(80):
        time.sleep(wacht)
        r = api(f"/{gen['id']}")
        if r["status"] in ("completed", "failed"):
            break
        wacht = min(60, wacht * 1.3)
    if r["status"] != "completed":
        sys.exit(f"{uit.name}: {r.get('failure_reason')} {r.get('error_message')}")
    uit.write_bytes(urllib.request.urlopen(r["content_url"]).read())
    print(uit.name, "klaar", flush=True)


if __name__ == "__main__":
    main()
