"""Snijdt de originele 4K-landscapebeelden (alleen baraca_village-bronnen) tot native 1080x1920-shots van 3 s
met een rustige horizontale pan binnen het bronbeeld. Geen padding, geen vervorming: cover-fit crop."""
import json, hashlib, subprocess, pathlib, sys
ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = pathlib.Path("/tmp/claude-0/work/src")
SOURCES = {  # id: (bestand, omschrijving, tags)
 "v01": ("baraca_village_Baraca_Village_-_video_01_curtains_in_the_breeze.mov", "villa-tuin", "exterieur,villa,tuin,dag"),
 "v02": ("baraca_village_Baraca_Village_-_video_02_pool_ripples_and_palms.mov", "villa-prive-zwembad", "exterieur,villa,zwembad,dag"),
 "v03": ("baraca_village_Baraca_Village_-_video_03_morning_light_push-in.mov", "villa-twee-verdiepingen", "exterieur,villa,ochtendlicht"),
 "v04": ("baraca_village_Baraca_Village_-_video_04_drone_flyover_to_the_sea.mov", "drone-dorp-naar-zee", "drone,overzicht,zee,golden-hour"),
 "v05": ("baraca_village_Baraca_Village_-_video_05_drone_orbit_kids_on_the_village_road.mov", "drone-dorpsweg", "drone,overzicht,weg,kinderen"),
 "v09": ("baraca_village_Baraca_Village_-_video_09_living_room_curtains.mov", "woonkamer", "interieur,woonkamer"),
 "v10": ("baraca_village_Baraca_Village_-_video_10_bedroom_garden_breeze.mov", "slaapkamer", "interieur,slaapkamer,tuin"),
 "v11": ("baraca_village_Baraca_Village_-_video_11_kitchen_dining_morning_v2.mov", "keuken-eethoek", "interieur,keuken,ochtend"),
 "v13": ("baraca_village_Baraca_Village_-_video_13_common_pool.mov", "gedeeld-zwembad", "exterieur,zwembad,zonsondergang"),
 "v12": ("baraca_village_12_Kids_at_the_gate_v2.mov", "kinderen-bij-poort", "exterieur,kinderen,poort"),
}
PANS = [(0.30, 0.55), (0.60, 0.40), (0.45, 0.70), (0.50, 0.50)]
DUR = 3.0
def dur(p): return float(subprocess.run(["ffprobe","-v","error","-show_entries","format=duration","-of","csv=p=0",p],capture_output=True,text=True).stdout)
shots, catalog = [], {}
for sid, (fn, name, tags) in SOURCES.items():
    p = SRC / fn; sha = hashlib.sha256(p.read_bytes()).hexdigest(); d = dur(str(p))
    catalog[sid] = {"file": fn, "sha256": sha, "duration": d, "name": name, "tags": tags}
    starts = [0.0, 2.5, 5.0] if d > 6 else [0.0, max(0, d - DUR - 0.1)]
    for i, st in enumerate(starts):
        f0, f1 = PANS[(i + len(shots)) % len(PANS)]
        out = ROOT / f"public/clips/{sid}-{i+1}.mp4"
        if not out.exists():
            vf = (f"scale=-2:1920:flags=lanczos,crop=1080:1920:x='(iw-1080)*({f0}+({f1}-{f0})*t/{DUR})':y=0,fps=30,setsar=1,format=yuv420p")
            subprocess.run(["ffmpeg","-v","error","-y","-ss",str(st),"-i",str(p),"-t",str(DUR),"-vf",vf,"-an","-c:v","libx264","-crf","19",
                            "-preset","medium","-movflags","+faststart",str(out)],check=True)
        shots.append({"id": f"{sid}-{i+1}", "src": sid, "start": st, "pan": [f0, f1], "subject": name, "tags": tags})
json.dump({"sources": catalog, "shots": shots}, open(ROOT / "shots.json", "w"), indent=1)
print(len(shots), "shots")
