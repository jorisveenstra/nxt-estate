"""Slaat bronfoto's, staande startframes en bewegende clips op in de Frame.io-bronnenbibliotheek (via portal_bridge)."""
import hashlib, json, sys
from pathlib import Path
SCR = sys.argv[1]
sys.path.insert(0, SCR)
from bridge import PortalBridge
ROOT = Path(__file__).resolve().parent.parent
b = PortalBridge("https://portal.nxt-estate.com/api/content-video-agent/jobs/e592f58d-b5d6-4402-9bee-3aee1d8b4d24", sys.argv[2], ["https://portal.nxt-estate.com"])
b.run_id = Path(SCR, "runid").read_text()
b.library_assets = json.loads(Path(SCR, "claim.json").read_text())["snapshot"]["mediaLibrary"]["assets"]
sha = lambda p: hashlib.sha256(Path(p).read_bytes()).hexdigest()
gen = json.loads((ROOT / "scripts/generaties.json").read_text())
T = {  # naam: (titel-stuk, beschrijving)
 "h1-appartement-woonkamer": ("Appartement type A - woonkamer met balkondeuren", "interieur woonkamer, balkon", "binnen,dag,rustige glijdende camera,interieur,impressie"),
 "h2-appartement-eetkamer": ("Appartement type D - open woon- en eetkamer", "interieur woon-eetkamer", "binnen,dag,rustige dolly,interieur,impressie"),
 "h3-wijk-zeeland": ("Terneuzen - woonwijk met eengezinswoningen vanuit de lucht", "luchtfoto woonwijk", "buiten,dag,drone,wijk,luchtfoto"),
 "h4-park-toren": ("Pattistpark - woontoren in het park", "gevel en park", "buiten,dag,rustige kanteling omhoog,gevel,impressie"),
 "h5-dijk-water": ("Pattistpark - torens aan het water langs de dijk", "gebouwen aan het water", "buiten,schemering,rustige push-in,water,impressie"),
 "b1-zonsondergang": ("Pattistpark - torens bij zonsondergang aan de Westerschelde", "luchtbeeld zonsondergang", "buiten,zonsondergang,drone,water,impressie"),
 "b2-balkon": ("Pattistpark - balkon met uitzicht over het water", "balkon met ontbijttafel en zeezicht", "buiten,dag,rustige push-in,balkon,uitzicht,impressie"),
 "b3-kust": ("Zeeuwse kust - wad en dijk vanuit de lucht", "kustlandschap met wad en dijk", "buiten,dag,drone,kust,natuur,luchtfoto"),
 "b4-keuken": ("Appartement type F - open keuken en woonkamer", "interieur keuken en woonkamer", "binnen,dag,rustige glijdende camera,interieur,impressie"),
 "b5-luchtfoto": ("Pattistpark - bouwlocatie vanuit de lucht", "luchtfoto bouwplaats aan de Westerschelde", "buiten,dag,drone,bouw,luchtfoto"),
}
meta = {m["naam"]: m for m in json.loads((ROOT / "scripts/startframes.json").read_text())}
for n, (titel, wat, tags) in T.items():
    bronpad = ROOT / "bron-orig" / meta[n]["bron"]
    s_sha = sha(bronpad)
    try:
        b.save_library_asset(bronpad, f"Pattistpark II - {titel} - bronbeeld origineel", f"Origineel aangeleverd bronbeeld: {wat}. Landschap/oorspronkelijke verhouding, geschikt als bron voor staande crops.", tags.split(",") + ["origineel"], "source_render")
        b.save_library_asset(ROOT / "public/bron" / f"{n}.png", f"Pattistpark II - {titel} - staand startframe - 9x16", f"Architectuurgetrouwe staande uitsnede (1080x1920) van het bronbeeld: {wat}. Geschikt als startbeeld voor image-to-video.", tags.split(",") + ["portret"], "portrait_image", source_sha256=s_sha)
        b.save_library_asset(ROOT / "ai-broll" / f"{n}.mp4", f"Pattistpark II - {titel} - rustige camerabeweging - 9x16", f"Native 1080x1920 beweging (8 s, geen geluid) van: {wat}. Geschikt voor opening/hook of body. Beperking: AI-animatie van een impressiebeeld, geen echte opname.", tags.split(",") + ["motion"], "motion_clip", source_sha256=sha(ROOT / "public/bron" / f"{n}.png"), generation_id=gen[n]["generation_id"])
        print("opgeslagen", n, flush=True)
    except Exception as e:
        print("FOUT", n, type(e).__name__, getattr(e, "status", ""), getattr(e, "detail", str(e))[:200], flush=True)
