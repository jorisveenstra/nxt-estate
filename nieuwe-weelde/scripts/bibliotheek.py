"""Slaat bronbeelden, portret-startfoto's en originele motion clips op in de Frame.io-bronnenbibliotheek van het project (via portal_bridge.save_library_asset)."""
import hashlib
import json
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from portal import bridge  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
sha = lambda p: hashlib.sha256(Path(p).read_bytes()).hexdigest()

ITEMS = {
    "gevel-zomer": ("Frontale gevel appartementengebouw met binnentuin", "frontaal, rustige push-in", "zomerlicht", "gevel buiten dag", "Opening/hook en gebouwoverzicht; CTA-achtergrond."),
    "gracht-zon": ("Appartementengebouw aan de gracht, hoek met balkons", "rustige kanteling omhoog langs de gevel", "zonnig daglicht", "gevel balkons gracht buiten dag", "Balkons, groene ligging en gebouwoverzicht."),
    "park-pad": ("Wandelpad door de groene wijk naar het appartementengebouw", "rustige push-in langs het pad", "zacht daglicht", "wijk park groen buiten dag", "Groene omgeving, ontmoeting buiten, wijkbeeld."),
    "woonkamer-man": ("Woonkamer appartement - man met kopje bij het raam", "rustige push-in", "zacht daglicht", "interieur woonkamer senior binnen dag", "Wonen, comfort, senioren."),
    "buurtkamer": ("Buurtkamer - buren aan tafel", "rustige push-in", "zacht zonlicht", "interieur buurtkamer ontmoeting binnen dag", "Ontmoeting, gemeenschap, buurtkamer."),
    "luchtfoto-wijk": ("Luchtbeeld van de nieuwbouwwijk met appartementengebouwen en gracht", "rustige drone-beweging vooruit", "ochtendlicht", "luchtfoto wijk gracht buiten dag", "Locatie en wijkoverzicht."),
    "luchtfoto-hoorn": ("Luchtbeeld over Hoorn en de appartementengebouwen", "rustige drone-beweging vooruit", "mistig ochtendlicht", "luchtfoto stad omgeving buiten dag", "Locatie en voorzieningen in de omgeving."),
}
b = bridge()
led = json.loads((ROOT / "scripts/gen-ledger.json").read_text())
meta = json.loads((ROOT / "public/portret/portret.json").read_text())
os.chdir(os.environ.get("LEDGER_DIR", "/tmp"))
for naam, (onderwerp, beweging, licht, tags, gebruik) in ITEMS.items():
    bron = ROOT / "public/bron" / meta[naam]["bron"]
    por = ROOT / f"public/portret/{naam}.png"
    clip = ROOT / f"public/clips-orig/{naam}.mp4"
    s_bron, s_por = sha(bron), sha(por)
    t = f"Nieuwe Weelde - {onderwerp}"
    b.save_library_asset(str(bron), f"{t} - originele render - {licht}", f"Ongewijzigde bronrender ({meta[naam]['bronAfmeting'][0]}x{meta[naam]['bronAfmeting'][1]}). Zichtbaar: {onderwerp.lower()}. Gebruik: {gebruik} Landscape; niet direct geschikt voor 9:16.", tags.split() + ["bronrender"], "source_render")
    b.save_library_asset(str(por), f"{t} - portretstart 1080x1920 - {licht} - 9x16", f"Portret-startfoto 1080x1920, onderwerp-bewuste uitsnede uit de bronrender (geen architectuur toegevoegd of veranderd). Gebruik: {gebruik}", tags.split() + ["portret", "9x16"], "portret_image".replace("portret", "portrait"), source_sha256=s_bron)
    b.save_library_asset(str(clip), f"{t} - {beweging} - {licht} - 9x16", f"Native 1080x1920 motion clip (8 s, zonder geluid) via ElevenLabs Veo 3.1 uit de portretstart. Zichtbaar: {onderwerp.lower()}. Gebruik: {gebruik} Beperking: AI-beweging van mensen/water/blad is subtiel.", tags.split() + ["motion", "9x16"], "motion_clip", source_sha256=s_por, generation_id=led[naam]["generation_id"])
    print("bibliotheek", naam, flush=True)
