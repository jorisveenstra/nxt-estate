"""
Legt de scripttekst over de woordtiming van ElevenLabs (scripts/woorden-tts.json) en bouwt de audio.

- src/timing.json: "b1" = body (tijden t.o.v. bodystart), "b1h1" = hook; met audioduur en
  exacte segmentlengte in frames (hook = audio + pauze, body = audio + staart).
- public/vo/b<b>h<h>.wav: hook (precies hookframes lang) + body (precies bodyframes lang).
In beeld staat altijd de scripttekst; de TTS-tekst wordt alleen voor de timing gebruikt.
Gebruik: python3 scripts/lijn_uit.py
"""
import difflib, json, math, re, subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FPS = 30
PAUZE = 0.35  # stilte na de hook
STAART = 1.5  # na de laatste zin
VERVANG = {"fresch": "fresh", "turnkey": "turnkey", "turn-key": "turnkey"}


def norm(w):
    w = w.lower().strip(".,?!:;\"'*")
    w = VERVANG.get(w, w)
    return re.sub(r"[^a-z0-9]", "", w)


def lijn_uit(zinnen, words):
    tokens = [(sid, w) for sid, z in zinnen for w in z.split()]
    a = [norm(w) for _, w in tokens]
    b = [norm(t) for _, _, t in words]
    sm = difflib.SequenceMatcher(None, a, b, autojunk=False)
    tijd = [None] * len(tokens)
    for blk in sm.get_matching_blocks():
        for k in range(blk.size):
            s, e, _ = words[blk.b + k]
            tijd[blk.a + k] = [s, e]
    i = 0
    while i < len(tokens):
        if tijd[i] is None:
            j = i
            while j < len(tokens) and tijd[j] is None:
                j += 1
            t0 = tijd[i - 1][1] if i > 0 else 0.0
            t1 = tijd[j][0] if j < len(tokens) else words[-1][1]
            stap = (t1 - t0) / (j - i)
            for k in range(i, j):
                tijd[k] = [round(t0 + stap * (k - i), 3), round(t0 + stap * (k - i + 1), 3)]
            i = j
        else:
            i += 1
    scenes = []
    for sid, _ in zinnen:
        idx = [k for k, (s, _) in enumerate(tokens) if s == sid]
        scenes.append({"id": sid, "start": tijd[idx[0]][0], "end": tijd[idx[-1]][1],
                       "words": [{"t": tokens[k][1], "s": tijd[k][0], "e": tijd[k][1]} for k in idx]})
    return scenes, sum(blk.size for blk in sm.get_matching_blocks()), len(tokens)


def duur(p):
    return float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(p)],
                                capture_output=True, text=True, check=True).stdout)


def main():
    scripts = json.loads((ROOT / "scripts/scripts.json").read_text())
    tts = json.loads((ROOT / "scripts/woorden-tts.json").read_text())
    herkomst = json.loads((ROOT / "scripts/vo-herkomst.json").read_text())
    mp3 = lambda k: ROOT / f"scripts/tts-cache/{herkomst[k]['cache']}.mp3"
    uit = {}
    (ROOT / "public/vo").mkdir(parents=True, exist_ok=True)
    for b, d in scripts.items():
        scenes, ok, n = lijn_uit([tuple(z) for z in d["zinnen"]], tts[b])
        ad = duur(mp3(b))
        uit[b] = {"scenes": scenes, "audio": ad, "frames": math.ceil((ad + STAART) * FPS)}
        print(f"{b}: {ok}/{n} woorden, audio {ad:.2f}s, {uit[b]['frames']} frames")
        for h, hook in enumerate(d["hooks"], 1):
            k = f"{b}h{h}"
            scenes, ok, n = lijn_uit([("hook", hook)], tts[k])
            hd = duur(mp3(k))
            uit[k] = {"scenes": scenes, "audio": hd, "frames": math.ceil((hd + PAUZE) * FPS)}
            th, tb = uit[k]["frames"] / FPS, uit[b]["frames"] / FPS
            subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(mp3(k)), "-i", str(mp3(b)), "-filter_complex",
                            f"[0]aresample=48000,apad,atrim=0:{th:.6f}[a];[1]aresample=48000,apad,atrim=0:{tb:.6f}[c];"
                            f"[a][c]concat=n=2:v=0:a=1,loudnorm=I=-14:TP=-1.5:LRA=9,aresample=48000,apad,atrim=0:{th + tb:.6f}",
                            "-ar", "48000", "-ac", "2", str(ROOT / f"public/vo/{k}.wav")], check=True)
            print(f"  {k}: {ok}/{n} woorden, hook {hd:.2f}s -> {uit[k]['frames']} frames")
    (ROOT / "src/timing.json").write_text(json.dumps(uit, ensure_ascii=False, indent=1))


if __name__ == "__main__":
    main()
