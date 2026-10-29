"""Bewaart de staande startframes en AI-clips in de Frame.io-Bronnenbibliotheek van het project (via de portal-bridge)."""
import json, os, sys
from pathlib import Path
ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, os.environ["NXT_SCRATCH"])
from prog import get
sys.path.insert(0, str(ROOT / "scripts")); import maak_clips as mc  # noqa
os.chdir(os.environ["NXT_SCRATCH"])
b = get(); b.claim_done = True
b.library_assets = []
try: b.library_assets = b.library().get("assets", [])
except Exception as e: print("library():", e)
BESCHR = {
 "voorgevel-tuin": ("Voorgevel met tuin", "baksteen- en houtgevel met balkons en tuin, daglicht", "gevel, tuin"),
 "binnentuin": ("Binnentuin en terrassen", "pad door de tuin naar de terrassen, warm daglicht", "tuin, buiten"),
 "straatgevel": ("Straatgevel en entree", "straatzijde met entree en geparkeerde auto's, daglicht", "gevel, straat, parkeren"),
 "avond-gevel": ("Gevel in de avond", "verlichte ramen in de schemering", "gevel, avond"),
 "isometrie": ("Overzicht van boven", "isometrisch overzicht van gebouw en omgeving, daglicht", "overzicht, drone"),
 "woonkamer-tuindeuren": ("Woonkamer met tuindeuren", "woonkamer richting tuindeuren, warm zonlicht", "interieur, woonkamer"),
 "slaapkamer": ("Slaapkamer", "slaapkamer met bed en latten, zonlicht", "interieur, slaapkamer"),
 "woonkamer-balkon": ("Woonkamer met balkondeuren", "woonkamer richting balkondeuren, zonlicht", "interieur, balkon"),
 "woonkamer-bank": ("Woonkamer met bank en olijfboom", "bank, olijfboom, daglicht", "interieur, woonkamer"),
 "woonkamer-eethoek": ("Woonkamer en eethoek", "open woon- en eethoek, zacht licht", "interieur, eethoek"),
}
for naam, (nr, _p) in mc.CLIPS.items():
    st = json.loads((ROOT / f"scripts/gen/{naam}.json").read_text())
    t, d, tags = BESCHR[naam]
    base = f"De Goffaert - {t}"
    crop = ROOT / f"scripts/crops/c{nr:02d}.jpg"; clip = ROOT / f"public/clips/{naam}.mp4"
    for path, kind, suffix, extra in ((crop, "portrait_image", "staand startframe - daglicht - 9x16", {}), (clip, "motion_clip", "rustige camerabeweging - 9x16", {"generation_id": st["gen_id"], "source_sha256": st["crop_sha256"]})):
        try:
            r = b.save_library_asset(str(path), f"{base} - {suffix}", f"Zichtbaar: {d}. Geschikt voor opening, sfeer en overzicht; architectuur ongewijzigd, AI-bewerkt vanuit projectrender.", ["De Goffaert", "Alkmaar"] + [x.strip() for x in tags.split(",")] + (["bewegend"] if kind == "motion_clip" else ["staand"]), kind, **({"source_sha256": st["crop_sha256"]} if kind == "portrait_image" else extra))
            print(naam, kind, "ok", r.get("id"), flush=True)
        except Exception as e:
            print(naam, kind, "FOUT", repr(e)[:200], getattr(e, "detail", ""), flush=True)
