"""Slaat de portretstartframes en Veo-bewegingsclips op in de Frame.io Bronnenbibliotheek van het project."""
import json, hashlib, pathlib
from common import *
ROOT = pathlib.Path(__file__).resolve().parent.parent
b = bridge(); b.library_assets = json.load(open(STATE / "claim.json"))["snapshot"]["mediaLibrary"]["assets"]
led = json.load(open(STATE / "veo-ledger.json"))
SRC = {"luchtfoto": "07129886_2025-11-20_1.jpg", "voorgevel": "29e5f609_2025-11-20_16.jpg", "hoekpand": "152d151f_2025-11-20_14.jpg", "avond": "ea9b3529_2025-11-20_19.jpg",
       "stellingen": "7ff071a1_2025-11-20_35.jpg", "hal": "f009943b_2025-11-20_22.jpg", "dakterras": "95e216ea_2025-11-20_33.jpg", "straat": "8770d778_2025-11-20_15.jpg"}
INFO = {  # naam: (titel-deel, zichtbaar, gebruik, tags)
 "luchtfoto": ("Luchtbeeld bedrijfsunits en parkeren", "Drone-achtig overzicht van de nieuwbouw, parkeerplaatsen en groen", "locatie/bereikbaarheid, overzicht", ["buiten", "dag", "luchtfoto", "overzicht"]),
 "voorgevel": ("Voorgevel unit met dakterras", "Voorgevel met eiken-look gevel, zwarte details en dakterras", "opening hook, gevel, dakterras", ["buiten", "dag", "gevel", "dakterras"]),
 "hoekpand": ("Hoekpand straatzijde", "Hoekpand met begane grond en bovenliggende bouwlagen aan de straat", "opening hook, zichtlocatie", ["buiten", "dag", "gevel", "straat"]),
 "avond": ("Gevel in avondlicht", "Gebouw in schemering met verlichte ramen", "afsluiting, oplevering, sfeer", ["buiten", "avond", "gevel", "verlichting"]),
 "stellingen": ("Hal met hoge stellingen", "Hoge bedrijfshal met stellingen en opslag", "opslag en logistiek, vrije hoogte (let op: personen en heftruck in beeld)", ["binnen", "hal", "opslag", "hoogte"]),
 "hal": ("Hal met stellingen en trap", "Hoge hal met stellingen, trap en kantoorruimte boven", "opslag, werkruimte (let op: personen in beeld)", ["binnen", "hal", "opslag", "trap"]),
 "dakterras": ("Dakterras met zitgedeelte", "Dakterras met balustrade en groen, aan de gevel", "buitenruimte, dakterras", ["buiten", "dag", "dakterras", "buitenruimte"]),
 "straat": ("Bedrijvenstraat met overheaddeuren", "Bestrate straat langs units met overheaddeuren en parkeerplaatsen", "bereikbaarheid, units, parkeren", ["buiten", "dag", "straat", "overheaddeuren"]),
}
out = {}
for n, (titel, zicht, gebruik, tags) in INFO.items():
    orig = hashlib.sha256((ROOT / "public/src-img" / SRC[n]).read_bytes()).hexdigest()
    por = ROOT / f"public/portrait/{n}.jpg"; psha = hashlib.sha256(por.read_bytes()).hexdigest()
    desc = lambda extra: f"MARK3 Breda. Zichtbaar: {zicht}. Geschikt voor: {gebruik}. {extra}"
    r1 = b.save_library_asset(por, f"MARK3 - {titel} - staande crop - daglicht - 9x16" if n != "avond" else f"MARK3 - {titel} - staande crop - schemer - 9x16",
        desc("Beperking: getrouwe staande crop van de originele render (geen verzonnen architectuur)."), tags + ["portret", "9x16", "startframe"], "portrait_image", source_sha256=orig)
    clip = ROOT / f"public/clips/{n}.mp4"
    r2 = b.save_library_asset(clip, f"MARK3 - {titel} - rustige camerabeweging 8s - veo 3.1 - 9x16",
        desc("Beperking: AI-bewegingsclip (Veo 3.1, 8 s, zonder audio); één doorlopende shot."), tags + ["motion", "veo", "9x16", "1080p"], "motion_clip", source_sha256=psha, generation_id=led[n]["gen_id"])
    out[n] = {"portrait": r1.get("id"), "clip": r2.get("id")}; print(n, out[n], flush=True)
json.dump(out, open(ROOT / "work/library-ids.json", "w"), indent=1)
