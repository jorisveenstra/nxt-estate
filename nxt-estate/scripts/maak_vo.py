"""
Bouwt de voice-overs per video (hook + korte pauze + body/CTA) uit de aangeleverde opnames en
maakt scripts/scripts.json + scripts/woorden-tts.json (timing per woord) voor scripts/lijn_uit.py.

De woordtiming komt van ElevenLabs speech-to-text (scripts/woorden-stt.json). In beeld staat wat er
écht gezegd wordt, met een paar spellingscorrecties.
"""
import json
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BRON = ROOT / "public/vo-bron"  # aangeleverde opnames (.m4a), niet in git
PAUZE = 0.2
VOOR, NA = 0.12, 0.25  # marge rond de eerste/laatste woorden bij het bijknippen
MAX_STILTE = 0.28  # langere stiltes tussen woorden/zinnen worden ingekort...
NIEUWE_STILTE = 0.2  # ...tot deze lengte, zodat het verhaal sneller doorloopt maar menselijk blijft

# Scènes per body: (id, eerste woorden van de scène in de gesproken tekst)
SCENES = {
    1: [("belofte", "Dan zetten"), ("mis", "Want dit"), ("idee", "En jij"), ("systeem1", "Het probleem"), ("belteam", "Ons eigen"),
        ("gesprekken", "Je verkoopteam"), ("cases", "Zo verkochten"), ("partners", "Inmiddels"), ("cta", "Start je")],
    2: [("belofte", "Wij zetten"), ("eilandjes", "Nu heb"), ("schip", "Leads vallen"), ("partner", "Bij ons"),
        ("grip", "Geen lead"), ("partners", "Zo zijn"), ("cta", "Wil jij")],
    3: [("belofte", "Wij gaan"), ("stoppen", "De meeste"), ("vragen", "Wie belt"), ("verloren", "En zo"),
        ("agenda", "Wij nemen"), ("belteam", "Ons eigen"), ("geenlead", "Zo gaat"), ("cases", "Voor een"), ("cta", "Wil jij")],
    4: [("belofte", "Wij zorgen"), ("helft", "Want te"), ("leeg", "Zo blijft"), ("systeem", "Ons systeem"),
        ("vol", "Je verkoopteam"), ("meer", "Meer leads,"), ("cases", "Voor een"), ("cta", "Start je")],
}

# Spelling in beeld
SPELLING = {"kantoor units": "kantoorunits", "vijf units": "5 units", "tien verkopen": "10 verkopen", "drie maanden": "3 maanden"}


def duur(p):
    return float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(p)], capture_output=True, text=True).stdout)


def knip(naam, ws, uit):
    """Knipt de opname bij en kort lange stiltes in. Geeft de woorden met aangepaste tijden terug."""
    stukken = []  # (van, tot) in de bron
    a = max(0.0, ws[0][0] - VOOR)
    for w, nxt in zip(ws, ws[1:] + [None]):
        if nxt is None:
            stukken.append((a, w[1] + NA))
            break
        gat = nxt[0] - w[1]
        if gat > MAX_STILTE:
            # Iets meer ruimte ná een woord (uitklinken) dan vóór het volgende
            stukken.append((a, w[1] + NIEUWE_STILTE * 0.65))
            a = nxt[0] - NIEUWE_STILTE * 0.35
    # Nieuwe tijden: bron-tijd -> uitvoer-tijd
    def omzet(t):
        tot = 0.0
        for van, eind in stukken:
            if t <= eind:
                return round(tot + max(0.0, t - van), 3)
            tot += eind - van
        return round(tot, 3)
    nieuw = [[omzet(s_), omzet(e), t] for s_, e, t in ws]
    filt = "".join(f"[0]atrim={van:.3f}:{eind:.3f},asetpts=PTS-STARTPTS,afade=t=in:d=0.01,afade=t=out:st={eind - van - 0.012:.3f}:d=0.012[s{i}];" for i, (van, eind) in enumerate(stukken))
    filt += "".join(f"[s{i}]" for i in range(len(stukken))) + f"concat=n={len(stukken)}:v=0:a=1[o]"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(BRON / f"{naam}.m4a"), "-filter_complex", filt, "-map", "[o]", "-ar", "48000", "-ac", "1", str(uit)], check=True)
    return nieuw


def tekst(ws):
    t = " ".join(w[2] for w in ws)
    for a, b in SPELLING.items():
        t = t.replace(a, b)
    return t


def main():
    stt = json.loads((ROOT / "scripts/woorden-stt.json").read_text())
    tmp = ROOT / "scripts/tmp"
    tmp.mkdir(exist_ok=True)
    scripts, alle = {}, {}
    for v, scenes in SCENES.items():
        bnaam = f"Kantoorunits V{v} Body + CTA"
        bws = knip(bnaam, stt[bnaam], tmp / f"b{v}.wav")
        btekst = tekst(bws)
        # Body opdelen in scènes op de beginwoorden
        zinnen = []
        for i, (sid, start) in enumerate(scenes):
            a = btekst.index(start)
            b = btekst.index(scenes[i + 1][1], a + 1) if i + 1 < len(scenes) else len(btekst)
            zinnen.append([sid, btekst[a:b].strip()])
        hooks = []
        for h in (1, 2, 3):
            hnaam = f"Kantoorunits V{v} Hook {h}"
            hws = knip(hnaam, stt[hnaam], tmp / f"h{v}{h}.wav")
            hooks.append(tekst(hws))
            hd = duur(tmp / f"h{v}{h}.wav")
            key = f"b{v}h{h}"
            alle[key] = hws + [[round(s + hd + PAUZE, 3), round(e + hd + PAUZE, 3), t] for s, e, t in bws]
            subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(tmp / f"h{v}{h}.wav"), "-i", str(tmp / f"b{v}.wav"), "-filter_complex",
                            f"[0]apad=pad_dur={PAUZE}[a];[a][1]concat=n=2:v=0:a=1,loudnorm=I=-14:TP=-1:LRA=9", "-ar", "48000", str(ROOT / f"public/vo/{key}.wav")], check=True)
            print(key, f"{duur(ROOT / f'public/vo/{key}.wav'):.1f}s")
        scripts[f"b{v}"] = {"hooks": hooks, "zinnen": zinnen}
    (ROOT / "scripts/scripts.json").write_text(json.dumps(scripts, ensure_ascii=False, indent=2))
    (ROOT / "scripts/woorden-tts.json").write_text(json.dumps(alle, ensure_ascii=False))


if __name__ == "__main__":
    main()
