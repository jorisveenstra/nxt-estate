"""Veo 3.1 image-to-video via ElevenLabs (staand 9:16). Authenticatie via netwerk-secret (proxy), geen sleutel nodig.
Gebruik: python3 veo.py submit|poll <werkmap>   ledger: <werkmap>/veo-ledger.json (nooit dubbel indienen)"""
import json, sys, time, subprocess, urllib.request, pathlib
W = pathlib.Path(sys.argv[2]); L = W / "veo-ledger.json"
NEG = "people morphing, distortion, warping, flicker, text, logos, cartoon, fast camera movement, new objects, changed architecture"
SHOTS = {
 'A': "Slow, subtle push-in on the brick gable family house on a sunny day, leaves moving gently in the breeze, one continuous shot, no cuts, no transitions, no morphing. Architecture, materials and proportions stay exactly as in the photo.",
 'B': "Gentle slow camera drift to the right along the row of houses beside the water, reeds and grass swaying softly, ducks barely moving, one continuous shot, no cuts, no transitions, no morphing. Architecture unchanged.",
 'C': "Very slow, subtle push-in towards the corner house, clouds drifting slowly, grass and willow branches moving gently, one continuous shot, no cuts, no transitions, no morphing. Architecture unchanged.",
 'D': "Slow subtle camera glide forward past the hedge and garden towards the brick house, flowers moving gently in the breeze, one continuous shot, no cuts, no transitions, no morphing. Architecture unchanged.",
 'E': "Calm, subtle push-in on the bright living room, children playing quietly on the rug and a mother relaxing on the sofa with gentle natural movement, one continuous shot, no cuts, no transitions, no morphing. Room and furniture unchanged.",
 'F': "Slow subtle camera drift through the bright open living room and kitchen, soft daylight, one continuous shot, no cuts, no transitions, no morphing. Room and furniture unchanged.",
 'G': "Slow subtle push-in on the warm living room with open garden doors, curtains and plants moving gently in the breeze, one continuous shot, no cuts, no transitions, no morphing. Room unchanged.",
 'H': "Gentle slow camera drift over the water towards the houses and pergola, small ripples on the water, reeds swaying, one continuous shot, no cuts, no transitions, no morphing. Architecture unchanged.",
 'I': "Slow subtle push-in from the water towards the back gardens and terraces, soft ripples and swaying reeds, one continuous shot, no cuts, no transitions, no morphing. Architecture unchanged.",
 'J': "Slow cinematic aerial drift forward over the neighbourhood, canal and green meadows, gentle natural movement, one continuous shot, no cuts, no transitions, no morphing. Layout unchanged.",
 'K': "Slow subtle push-in towards the gable house across the green grass and water, willow leaves moving gently, children playing softly in the grass, one continuous shot, no cuts, no transitions, no morphing. Architecture unchanged.",
 'L': "Slow subtle camera glide past the blooming hydrangeas towards the brick gable house, light breeze in the flowers, one continuous shot, no cuts, no transitions, no morphing. Architecture unchanged.",
}
led = json.loads(L.read_text()) if L.exists() else {}
def save(): L.write_text(json.dumps(led, indent=1))
def call(args): return subprocess.check_output(["curl","-sS","-m","180"]+args)
if sys.argv[1] == "submit":
    for k, p in SHOTS.items():
        e = led.setdefault(k, {})
        if "generation_id" in e or e.get("submitting"): continue
        if "asset_id" not in e:
            r = json.loads(call(["-F", f"asset=@{W}/portrait/{k}.jpg;type=image/jpeg", "-F", f"name=oevers-{k}-9x16", "https://api.elevenlabs.io/v1/assets"]))
            e["asset_id"] = r.get("asset_id") or r.get("id"); e["asset_resp"] = r; save()
        e["submitting"] = True; save()   # onzeker resultaat => nooit blind herhalen
        body = {"model_id":"veo-3.1-generate-001","prompt":p,"negative_prompt":NEG,"start_frame":{"type":"asset","asset_id":e["asset_id"]},
                "resolution":"1080p","duration_secs":8,"generate_audio":False,"aspect_ratio":"9:16"}
        r = json.loads(call(["-X","POST","-H","Content-Type: application/json","-d",json.dumps(body),"https://api.elevenlabs.io/v1/flows/video"]))
        e["submit_resp"] = r
        if "id" in r: e["generation_id"] = r["id"]; e.pop("submitting")
        save(); print(k, str(r)[:200], flush=True)
else:
    for k, e in led.items():
        if "generation_id" not in e or e.get("done"): continue
        r = json.loads(call([f"https://api.elevenlabs.io/v1/flows/video/{e['generation_id']}"]))
        e["status"] = r.get("status"); print(k, r.get("status"), r.get("failure_reason") or "", flush=True)
        if r.get("status") == "completed":
            call(["-o", str(W/"clips"/f"{k}.mp4"), r["content_url"]]); e["done"] = True; e["poll_resp"] = {x:y for x,y in r.items() if x!="content_url"}
        save()
