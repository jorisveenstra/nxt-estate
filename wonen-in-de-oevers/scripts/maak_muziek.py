"""ElevenLabs Music (music_v1), instrumentaal, 80 s; één stem voor alle varianten (op lengte geknipt met fade)."""
import json, subprocess, pathlib
R = pathlib.Path(__file__).resolve().parent.parent
body = {"model_id":"music_v1","prompt":"Uplifting, warm, positive instrumental background music for a real-estate ad about a family neighbourhood by the water and park: gentle acoustic guitar, soft piano, light percussion and airy strings, hopeful and bright, moderate tempo, no vocals, no lyrics.","force_instrumental":True,"music_length_ms":80000}
out = R/"public/music/oevers-music.mp3"; hdr = R/"scripts/music.hdr"
subprocess.check_call(["curl","-sS","-m","580","-D",str(hdr),"-o",str(out),"-X","POST","-H","Content-Type: application/json","-d",json.dumps(body),"https://api.elevenlabs.io/v1/music?output_format=mp3_44100_128"])
h = {l.split(":",1)[0].strip().lower(): l.split(":",1)[1].strip() for l in hdr.read_text().splitlines() if ":" in l}
meta = {"request_id":h.get("request-id"),"character_cost":h.get("character-cost"),"song_id":h.get("song-id"),"model_id":"music_v1","settings":body}
(R/"scripts/music-meta.json").write_text(json.dumps(meta,indent=1)); hdr.unlink(); print(meta["request_id"],meta["character_cost"],meta["song_id"],out.stat().st_size)
