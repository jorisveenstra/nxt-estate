"""
Maakt van stilstaande woningfoto's bewegende "renders" (1080x1920, 30 fps) met een 3D-camerabeweging.

Werkwijze: een AI-dieptemodel (Depth Anything V2) schat per pixel de diepte. Daarmee wordt een virtuele
camera door de foto bewogen: dichtbij beweegt sneller dan veraf (parallax), zodat het beeld echt diepte krijgt.

Gebruik: python maak_renders.py <map met foto's> <uitvoermap>
"""
import json
import subprocess
import sys
from pathlib import Path

import cv2
import numpy as np
import torch
from PIL import Image
from transformers import pipeline

W, H, FPS, SEC = 1080, 1920, 30, 5.0

# Per foto: (bestandsnaam, uitvoernaam, beweging, opties)
#  dolly  = camera rijdt naar binnen (dichtbij groeit sneller dan veraf)
#  truck  = camera schuift zijwaarts langs (dir = 1 of -1)
#  crane  = camera stijgt op (dir = 1 omhoog, -1 omlaag)
#  drone  = luchtfoto die langzaam draait en inzoomt
SHOTS = [
    ("733.avif", "voorgevel", "dolly", {}),
    ("tuin.avif", "achtergevel-tuin", "crane", {"dir": 1}),
    ("achtertuin.webp", "achtertuin", "truck", {"dir": -1}),
    ("achtertuin 2.webp", "achtertuin-2", "dolly", {}),
    ("drone overhead.avif", "drone", "drone", {}),
    ("voordeur vanuit binnen.webp", "hal-voordeur", "dolly", {}),
    ("woonkamer.avif", "woonkamer-1", "truck", {"dir": 1}),
    ("woonkamer .avif", "woonkamer-2", "dolly", {}),
    ("woonkamer 2.avif", "woonkamer-3", "truck", {"dir": -1}),
    ("eettafel.webp", "eettafel", "dolly", {}),
    ("keuken 1.avif", "keuken-1", "truck", {"dir": 1}),
    ("keuken 2.webp", "keuken-2", "dolly", {}),
    ("slaapkamer.avif", "slaapkamer-1", "dolly", {}),
    ("slaapkamer 2.webp", "slaapkamer-2", "truck", {"dir": -1}),
    ("slaapkamer.webp", "slaapkamer-3", "truck", {"dir": 1}),
    ("douche.webp", "badkamer-douche", "crane", {"dir": -1}),
    ("zolder.webp", "zolder", "dolly", {}),
]


def ease(t):
    return t * t * (3 - 2 * t)


def laad(pad: Path) -> np.ndarray:
    """Leest elk formaat (ook avif/webp) via ffmpeg naar BGR."""
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", str(pad), "-f", "image2pipe", "-vcodec", "png", "-"], capture_output=True, check=True).stdout
    img = cv2.imdecode(np.frombuffer(raw, np.uint8), cv2.IMREAD_COLOR)
    # Kleine foto's eerst opschalen met verscherping, zodat de staande uitsnede niet te zacht wordt
    if img.shape[0] < 1400:
        f = 1440 / img.shape[0]
        img = cv2.resize(img, None, fx=f, fy=f, interpolation=cv2.INTER_LANCZOS4)
        blur = cv2.GaussianBlur(img, (0, 0), 1.2)
        img = cv2.addWeighted(img, 1.45, blur, -0.45, 0)
    return img


def diepte(model, img: np.ndarray) -> np.ndarray:
    rgb = Image.fromarray(cv2.cvtColor(img, cv2.COLOR_BGR2RGB))
    d = np.array(model(rgb)["depth"], dtype=np.float32)  # groter = dichterbij
    d = cv2.resize(d, (img.shape[1], img.shape[0]), interpolation=cv2.INTER_CUBIC)
    d = (d - np.percentile(d, 2)) / (np.percentile(d, 98) - np.percentile(d, 2) + 1e-6)
    d = np.clip(d, 0, 1)
    # Zachte diepte voorkomt scheuren langs randen
    return cv2.GaussianBlur(d, (0, 0), img.shape[0] / 180)


def render(img, d, beweging, opt, uit: Path):
    ih, iw = img.shape[:2]
    portret = ih > iw
    # Staand venster in de foto (9:16); bij liggende foto's zo hoog mogelijk, met marge voor de beweging
    wh = ih * (0.86 if portret else 0.94)
    ww = wh * W / H
    if ww > iw * 0.94:
        ww = iw * 0.94
        wh = ww * H / W
    u, v = np.meshgrid((np.arange(W, dtype=np.float32) + 0.5) / W - 0.5, (np.arange(H, dtype=np.float32) + 0.5) / H - 0.5)
    n = int(SEC * FPS)
    ff = subprocess.Popen(
        ["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "bgr24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
         "-c:v", "libx264", "-crf", "17", "-preset", "medium", "-pix_fmt", "yuv420p", "-movflags", "+faststart", str(uit)],
        stdin=subprocess.PIPE,
    )
    vrij_x = (iw - ww) / 2
    vrij_y = (ih - wh) / 2
    for i in range(n):
        t = ease(i / (n - 1))
        cx, cy, zoom, rot = iw / 2, ih / 2, 1.0, 0.0
        par_x = par_y = 0.0  # parallax-verschuiving (fractie van vensterbreedte) voor dichtbij t.o.v. veraf
        dolly = 0.0
        if beweging == "dolly":
            zoom = 1.0 + 0.10 * t
            dolly = 0.16 * t
            cy = ih / 2 + vrij_y * 0.15 * t
        elif beweging == "truck":
            r = opt.get("dir", 1)
            cx = iw / 2 + r * vrij_x * 0.75 * (t - 0.5) * 2
            zoom = 1.04
            par_x = -r * 0.05 * (t - 0.5) * 2
        elif beweging == "crane":
            r = opt.get("dir", 1)
            cy = ih / 2 - r * vrij_y * 0.8 * (t - 0.5) * 2
            zoom = 1.03 + 0.04 * t
            par_y = r * 0.035 * (t - 0.5) * 2
        elif beweging == "drone":
            zoom = 1.08 + 0.14 * t
            rot = np.deg2rad(-7 + 14 * t)
        # Bronpositie zonder diepte
        xs = u * ww / zoom
        ys = v * wh / zoom
        if rot:
            xs, ys = xs * np.cos(rot) - ys * np.sin(rot), xs * np.sin(rot) + ys * np.cos(rot)
        x0 = (cx + xs).astype(np.float32)
        y0 = (cy + ys).astype(np.float32)
        dd = cv2.remap(d, x0, y0, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT) - 0.5
        # Diepte-afhankelijke verschuiving en schaal: dichtbij beweegt meer
        sc = 1.0 / (1.0 + dolly * dd)
        x = cx + (x0 - cx) * sc - par_x * ww * dd
        y = cy + (y0 - cy) * sc - par_y * wh * dd
        frame = cv2.remap(img, x.astype(np.float32), y.astype(np.float32), cv2.INTER_LANCZOS4, borderMode=cv2.BORDER_REFLECT)
        ff.stdin.write(frame.tobytes())
    ff.stdin.close()
    ff.wait()


def main():
    src, dst = Path(sys.argv[1]), Path(sys.argv[2])
    dst.mkdir(parents=True, exist_ok=True)
    dev = "mps" if torch.backends.mps.is_available() else "cpu"
    model = pipeline("depth-estimation", model="depth-anything/Depth-Anything-V2-Base-hf", device=dev)
    for naam, uitnaam, beweging, opt in SHOTS:
        img = laad(src / naam)
        d = diepte(model, img)
        cv2.imwrite(str(dst / f".diepte-{uitnaam}.jpg"), (d * 255).astype(np.uint8))
        render(img, d, beweging, opt, dst / f"{uitnaam}.mp4")
        print(f"{uitnaam}: {beweging} ({img.shape[1]}x{img.shape[0]})", flush=True)


if __name__ == "__main__":
    main()
