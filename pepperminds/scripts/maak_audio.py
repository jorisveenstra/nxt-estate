"""
Bouwt per video de muziek voor intro en outro uit de muziek die al in de video zit.

Gebruik:  python3 scripts/maak_audio.py <naam> <video.mp4> <drop-sec> <maat-samples> [--geen-bed]

- drop-sec:      tijd (s) van de drop-klap in de video (begin van de carrousel-muziek)
- maat-samples:  exacte lengte van 1 maat in samples bij 48 kHz (gemeten met kruiscorrelatie)
- --geen-bed:    de video heeft zelf al muziek onder het praten; intro-muziek stopt dan op de knip

Schrijft public/<naam>-audio-verlengd.wav (video-audio + 6 s outro) en public/<naam>-muziek-intro.wav,
en print de waarden voor src/Root.tsx.
"""
import json
import subprocess
import sys
import wave

import numpy as np

SR = 48000
FPS = 25
OUTRO = 6.0
FADE_START = 5.2  # outro-tijd waarop de muziek begint uit te faden


def load(path):
    raw = subprocess.run(
        ["ffmpeg", "-v", "error", "-i", path, "-vn", "-ac", "2", "-ar", str(SR), "-f", "f32le", "-"],
        capture_output=True, check=True,
    ).stdout
    return np.frombuffer(raw, dtype=np.float32).reshape(-1, 2)


def write(path, a):
    w = wave.open(path, "wb")
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((np.clip(a, -1, 1) * 32767).astype("<i2").tobytes())
    w.close()


def render(s, segs, total):
    """segs: [(start in tijdlijn, verschuiving naar bron, crossfade naar dit segment)]"""
    out = np.zeros((total, 2), np.float32)
    seg = lambda t0, t1, off: s[t0 + off : t1 + off]
    for i, (t0, off, xf) in enumerate(segs):
        t1 = segs[i + 1][0] if i + 1 < len(segs) else total
        out[t0:t1] = seg(t0, t1, off)
        if xf:
            # Lineair: de stukken rond de naad zijn bijna gelijk, equal-power zou daar boven 0 dB uitkomen
            fin = np.linspace(0, 1, xf)[:, None]
            fout = 1 - fin
            out[t0 - xf : t0] = seg(t0 - xf, t0, segs[i - 1][1]) * fout + seg(t0 - xf, t0, off) * fin
    return out


def main():
    name, path, drop_s, bar = sys.argv[1], sys.argv[2], float(sys.argv[3]), int(sys.argv[4])
    geen_bed = "--geen-bed" in sys.argv
    s = load(path)
    m = s.mean(1)
    V = len(s)
    h1 = int(drop_s * SR)
    D = int(0.006 * SR)  # knip net vóór de klap
    beat = bar / 4

    # --- Outro ---
    # Maatstreep (op het raster van de drop) waar de drop opnieuw invalt: vanaf daar moet
    # de muziek aaneengesloten tot het eind van de outro kunnen doorlopen.
    need = int((OUTRO + 0.02) * SR)
    k = 1
    while h1 + k * bar < max(V, h1 + need):
        k += 1
    B = h1 + k * bar
    # Tussen video-einde en B: n maten terug, zodat we binnen de muziek blijven
    n = 1
    while B - n * bar > V - int(0.03 * SR):
        n += 1
    off1 = -n * bar
    XF1 = int(0.015 * SR)
    best = None
    for p in range(V - int(0.6 * SR), V - int(0.02 * SR), 48):
        if p + off1 - XF1 < h1:
            continue
        a, b = m[p - XF1 : p + XF1], m[p + off1 - XF1 : p + off1 + XF1]
        err = np.sum((a - b) ** 2) / (np.sum(a**2) + np.sum(b**2) + 1e-9)
        if best is None or err < best[0]:
            best = (err, p)
    err, ps1 = best
    total = V + int(OUTRO * SR)
    segs = [(0, 0, 0), (ps1, off1, XF1), (B - D, h1 - B, int(0.010 * SR))]
    assert total + h1 - B <= V, "te weinig muziek na de drop"
    ext = render(s, segs, total)
    a0, a1 = V + int(FADE_START * SR), total
    env = np.ones(total, np.float32)
    env[a0:a1] = np.cos(np.linspace(0, np.pi / 2, a1 - a0)) ** 2
    ext *= env[:, None]
    write(f"public/{name}-audio-verlengd.wav", ext)

    # --- Intro ---
    # Begint 0,08 s vóór de drop; loopt per hele maten terug naar de drop zolang dat nodig is.
    loop_bars = max(1, (V - int(0.02 * SR) - h1) // bar)
    intro_len = 14 * SR
    isegs, t, pos = [(0, h1 - int(0.08 * SR), 0)], 0, h1 - int(0.08 * SR)
    first_jump = h1 + loop_bars * bar - D - pos
    t = first_jump
    while t < intro_len:
        isegs.append((t, h1 - D - t, int(0.010 * SR)))
        t += loop_bars * bar
    write(f"public/{name}-muziek-intro.wav", render(s, isegs, intro_len))

    # --- Waarden voor Remotion ---
    beat_frames = beat / SR * FPS
    vid = V / SR
    grid = [(h1 + j * beat) / SR - vid for j in range(0, 200)]
    outro_beats = [g for g in grid if g >= 0.35]
    first_beat = outro_beats[0] * FPS
    bars_local = [(h1 + j * bar) / SR - vid for j in range(0, 50)]
    final_hit = max(g for g in bars_local if g <= FADE_START) * FPS
    info = {
        "name": name,
        "videoDuration": round(vid * FPS),
        "beatFrames": round(beat_frames, 3),
        "outroFirstBeat": round(first_beat, 2),
        "outroFinalHit": round(final_hit),
        "dropInOutro": round((B / SR - vid) * FPS, 1),
        "naad": round(ps1 / SR, 3),
        "mismatch": round(float(err), 3),
        "bpm": round(60 / (beat / SR), 1),
        "geenBed": geen_bed,
    }
    print(json.dumps(info))


if __name__ == "__main__":
    main()
