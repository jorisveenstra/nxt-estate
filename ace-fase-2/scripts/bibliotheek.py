"""Slaat bronfoto's, portretframes en bewegende clips op in de Frame.io-bronnenbibliotheek (via bridge.save_library_asset).
Gebruik: python3 scripts/bibliotheek.py <map met originelen>  (JT = jobtoken in de omgeving, niet in de repo)"""
import hashlib, json, os, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
from bridge import PortalBridge
from portret import FOTOS
ROOT = Path(__file__).resolve().parent.parent
BRON = Path(sys.argv[1])
JOB = os.environ["JOB_URL"]
b = PortalBridge(JOB, os.environ["JT"], ["https://portal.nxt-estate.com"])
b.run_id = os.environ["RUN_ID"]
b.claim_snapshot_assets = None
ledger = json.loads((ROOT / "ai-renders/ledger.json").read_text())
sha = lambda p: hashlib.sha256(Path(p).read_bytes()).hexdigest()
OMS = {
 "padelbanen-toren": ("Buitenzijde torens en tennis- en padelbanen", "hoge torenflat en lagere woonblokken boven de rode gravelbanen, spelers op de banen", "opening hook, sportvoorziening, overzicht"),
 "waterpartij-toren": ("Toren met balkons aan waterpartij", "woontoren met balkons boven een vijver met waterlelies en een brug", "opening hook, buitenruimte, groen en water"),
 "toren-schemering": ("Woonblokken en banen in schemering", "donkere toren en gekleurd woonblok boven de banen, bewolkte avondlucht", "sfeerbeeld, avond, sportbanen"),
 "vogelvlucht": ("Vogelvlucht Sloterplas-noordzijde", "luchtbeeld van gracht, woonblokken en groen", "locatie-overzicht, Sloterplas, binnengebied"),
 "gracht-zonsondergang": ("Plint met terrassen aan gracht", "gevel met groene plint, glazen balkons en terrassen aan het water in avondlicht", "buurt, horeca, rust"),
 "wandelpad-bewoners": ("Wandelpad tussen groen en woongebouw", "wandelpad met bewoners, bomen en een woongebouw met balkons", "Sloterpark naast de deur, autoluw binnengebied"),
 "park-gracht-gebouw": ("Park en gracht voor woongebouw", "park met wandelpad langs een gracht en een woongebouw met terrasbalkons", "groen, wandelen, locatie"),
 "balkons-gracht": ("Balkons met glazen balustrade aan gracht", "ruime balkons met planten en een bewoner, gracht op de achtergrond", "buitenruimte, zuid/west balkon"),
 "cafe-plint-terras": ("Café-terras in de plint", "begane grond met terras, bomen en mensen aan tafel", "café, voorzieningen, sfeer"),
 "terras-eettafel": ("Villa-appartement terras met gedekte tafel", "gedekte eettafel op terras voor schuifpui, woonkamer erachter", "buitenruimte, wonen, terras"),
 "penthouse-woonkamer": ("Penthouse woonkamer met grote ramen", "lichte woonkamer met visgraatvloer, hoeksofa en vloerhoge ramen", "ruimte, licht, penthouse"),
 "woonkamer-oranje-bank": ("Woonkamer met oranje bank", "woonkamer met oranje hoekbank, grote ramen en balkondeur", "wonen, sfeer, stellen"),
 "maisonnette-keuken-trap": ("Maisonnette keuken met eiland en trap", "open keuken met kookeiland, houten kasten en trap naar boven", "maisonnette, keuken compleet opgeleverd"),
 "appartement-50m2": ("Compact appartement eethoek en woonkamer", "lichte eethoek en woonkamer met uitzicht, kleiner appartement", "compact wonen, 50 m²"),
}
for slug, (orig, _, _) in [(k, (v[0], 0, 0)) for k, v in FOTOS.items()]:
    titel, zien, gebruik = OMS[slug]
    pre = f"ACE fase 2 - {titel}"
    tags = ["ace-fase-2", "amsterdam", slug]
    src = BRON / orig
    # bron als origineel (liggend/ongewijzigd)
    a = b.save_library_asset(str(src), f"{pre} - origineel render - daglicht", f"Onbewerkte render: {zien}. Gebruik: bron voor staande uitsnede; niet direct geschikt voor 9x16.", tags + ["source_render"], "source_render")
    p = ROOT / "ai-renders/portret" / f"{slug}.jpg"
    b.save_library_asset(str(p), f"{pre} - staande uitsnede - 9x16", f"Architectuurgetrouwe staande uitsnede 1080x1920 van het origineel: {zien}. Gebruik: startframe voor beweging, {gebruik}.", tags + ["portrait_image"], "portrait_image", source_sha256=sha(src))
    c = ROOT / "ai-renders/clips" / f"{slug}.mp4"
    if c.exists():
        b.save_library_asset(str(c), f"{pre} - rustige camerabeweging - 9x16", f"Native 1080x1920 beweging (8 s, Veo 3.1): {zien}. Gebruik: {gebruik}. Beperking: geen geluid, geen eigen architectuur.", tags + ["motion_clip", "9x16"], "motion_clip", source_sha256=sha(p), generation_id=ledger[slug]["generation_id"])
    print("bibliotheek", slug, flush=True)
