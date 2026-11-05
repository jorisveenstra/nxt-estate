"""Slaat de nieuwe portret-startbeelden en Veo-bewegingsclips op in de Bronnenbibliotheek van het project (Frame.io) via de portal-bridge."""
import json, sys, pathlib, concurrent.futures as cf
sys.path.insert(0, "/tmp/claude-0/work")
import br
R = pathlib.Path(__file__).resolve().parent.parent
import os; os.chdir(R / "scripts")
D = {  # shot: (onderwerp, beweging, licht, zichtbaar/gebruik, tags)
 "real-gevel": ("Voorgevel met groene gevelbekleding en entree", "rustige push-in", "daglicht", "Echte foto van de voorgevel; opening/overzicht van het gebouw. Let op: op de deur is nummer 15 zichtbaar (buurwoning).", ["buiten","gevel","dag","push-in","echte foto"]),
 "real-binnentuin": ("Binnentuin en baksteenrijwoningen vanaf het hekwerk", "langzame pan naar rechts", "daglicht", "Echte foto; sfeer van de omgeving/binnentuin.", ["buiten","binnentuin","dag","pan","echte foto"]),
 "real-terras": ("Terras langs groene gevel", "rustige voorwaartse dolly", "daglicht", "Echte foto; buitenruimte en uitzicht.", ["buiten","terras","dag","dolly","echte foto"]),
 "real-ruimte": ("Grote lege ruimte met raampartij", "rustige push-in", "daglicht", "Echte foto van de ruwbouwruimte; potentie/leeg canvas.", ["binnen","ruimte","dag","push-in","echte foto"]),
 "real-ramen": ("Ruimte met lange raampartij", "rustige pan", "daglicht", "Echte foto; licht en ruimte.", ["binnen","ramen","dag","pan","echte foto"]),
 "imp-terras": ("Ingericht terras eerste verdieping (impressie)", "rustige push-in", "zonlicht", "Ontwerpimpressie, geen echte situatie; buitenruimte.", ["buiten","terras","dag","push-in","impressie"]),
 "imp-atelier": ("Lichte benedenruimte als kunstatelier (impressie)", "rustige push-in", "daglicht", "Ontwerpimpressie; wonen en maken, atelier.", ["binnen","atelier","dag","push-in","impressie"]),
 "imp-studio": ("Lichte benedenruimte als ontwerpstudio (impressie)", "rustige push-in", "daglicht", "Ontwerpimpressie; ontwerpers/werkplek.", ["binnen","werkplek","dag","push-in","impressie"]),
 "imp-werkkamer": ("Werkkamer met bureau bij het raam (impressie)", "rustige push-in", "daglicht", "Ontwerpimpressie; werken aan huis.", ["binnen","werkkamer","dag","push-in","impressie"]),
 "imp-keuken": ("Keuken eerste verdieping met kookeiland (impressie)", "rustige dolly", "warm daglicht", "Ontwerpimpressie; keuken.", ["binnen","keuken","dag","dolly","impressie"]),
 "imp-woonkamer": ("Woonkamer eerste verdieping (impressie)", "rustige push-in", "daglicht", "Ontwerpimpressie; woonkamer.", ["binnen","woonkamer","dag","push-in","impressie"]),
 "imp-woonwerk": ("Lichte woon-werkruimte begane grond (impressie)", "rustige pan", "daglicht", "Ontwerpimpressie; woon-werkruimte.", ["binnen","woonwerk","dag","pan","impressie"]),
 "imp-slaapkamer": ("Hoofdslaapkamer bij grote ramen (impressie)", "rustige push-in", "daglicht", "Ontwerpimpressie; slaapkamer.", ["binnen","slaapkamer","dag","push-in","impressie"]),
}
L = json.load(open("gen_ledger.json")); H = json.load(open("start_hashes.json"))
b = br.get()
def save(shot):
    onderwerp, beweging, licht, gebruik, tags = D[shot]
    out = {}
    out["foto"] = b.save_library_asset(str(R / "start" / f"{shot}.jpg"), f"Karakterplein 13 - {onderwerp} - portretuitsnede - {licht} - 9x16",
        f"Prachtig portret-startbeeld (1080x1920, onderwerp-bewuste uitsnede van de bronfoto, geen verzonnen architectuur) voor beeld-naar-video. {gebruik}", tags + ["portretbeeld"], "portrait_image", source_sha256=H[shot]["source_sha256"])
    out["clip"] = b.save_library_asset(str(R / "public/clips" / f"{shot}.mp4"), f"Karakterplein 13 - {onderwerp} - {beweging} - {licht} - 9x16",
        f"Bewegingsclip 8 s, native 1080x1920, Veo 3.1 (ElevenLabs), één doorlopende opname zonder cuts. {gebruik}", tags + ["bewegingsclip"], "motion_clip",
        source_sha256=H[shot]["start_sha256"], generation_id=L[shot]["generation_id"])
    return shot, out["foto"].get("id"), out["clip"].get("id")
with cf.ThreadPoolExecutor(3) as ex:
    futs = {ex.submit(save, s): s for s in D}
    for f in cf.as_completed(futs):
        try: print("ok", f.result(), flush=True)
        except Exception as e: print("FOUT", futs[f], type(e).__name__, getattr(e, "status", ""), getattr(e, "detail", ""), flush=True)
