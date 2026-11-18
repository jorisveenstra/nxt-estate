"""Eén opgewekte instrumentale muziekbed via ElevenLabs Music (music_v1), hergebruikt in alle 15 varianten."""
import json
from el import request, ledger_get, ledger_update, ROOT
MODEL = "music_v1"
PROMPT = ("Uplifting, positive, modern corporate instrumental for a Dutch business-property advertisement: "
          "warm plucked guitar and light piano, soft driving percussion, steady 105 BPM, confident and optimistic, "
          "clean mix that stays in the background beneath a voice-over, no vocals, no lyrics, consistent energy, gentle ending.")
LENGTH_MS = 72000

def make(on_usage=None):
    out = ROOT / "public/muziek/muziekbed.mp3"
    rec = ledger_get("muziek") or {}
    if rec.get("status") == "klaar" and out.exists():
        return out
    if rec.get("status") == "verzonden":
        raise RuntimeError("muziek: eerdere aanroep onzeker; niet herhalen")
    body = {"model_id": MODEL, "prompt": PROMPT, "music_length_ms": LENGTH_MS, "force_instrumental": True}
    ledger_update("muziek", status="verzonden", settings=body)
    st, h, raw = request("POST", "/v1/music?output_format=mp3_44100_192", body, timeout=600)
    if st >= 300:
        ledger_update("muziek", status="afgewezen", error=f"{st}: {raw[:300].decode(errors='ignore')}")
        raise RuntimeError(f"muziek {st}: {raw[:300]!r}")
    out.write_bytes(raw)
    hl = {k.lower(): v for k, v in h.items()}
    ledger_update("muziek", status="klaar", request_id=hl.get("request-id"), song_id=hl.get("song-id"),
                  character_cost=hl.get("character-cost"))
    if on_usage:
        on_usage("music", MODEL, hl.get("request-id") or hl.get("song-id"), h)
    return out
