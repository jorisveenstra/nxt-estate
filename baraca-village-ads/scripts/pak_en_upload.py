"""Plakt hook + body hard aan elkaar (ffmpeg, video copy), verifieert met ffprobe, maakt de bewerkbare bron-ZIP en uploadt
naar Frame.io (videoUploadParts) en sourceUploadUrl. Gebruik: pak_en_upload.py <body> <hook>"""
import json, pathlib, subprocess, sys, urllib.request, uuid, zipfile, shutil
sys.path.insert(0, str(pathlib.Path(__file__).parent)); import portal
ROOT = pathlib.Path(__file__).resolve().parent.parent
WORK = pathlib.Path("/tmp/claude-0/work/final"); WORK.mkdir(exist_ok=True)
IDS = WORK / "output-ids.json"; ids = json.loads(IDS.read_text()) if IDS.exists() else {}

def probe(p):
    j = json.loads(subprocess.run(["ffprobe", "-v", "error", "-show_streams", "-show_format", "-of", "json", str(p)], capture_output=True, text=True, check=True).stdout)
    v = next(s for s in j["streams"] if s["codec_type"] == "video")
    return v, float(j["format"]["duration"]), j

def build(b, h):
    name = f"Body {b} Hook {h}"
    mp4 = WORK / f"baraca-village-body{b}-hook{h}.mp4"
    if not mp4.exists():
        lst = WORK / f"b{b}h{h}.txt"
        lst.write_text(f"file '{ROOT}/out/delen/b{b}h{h}-hook.mp4'\nfile '{ROOT}/out/delen/body{b}.mp4'\n")
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", str(lst), "-c:v", "copy", "-c:a", "aac", "-b:a", "192k",
                        "-movflags", "+faststart", str(mp4)], check=True)
    v, dur, _ = probe(mp4)
    assert (v["width"], v["height"]) == (1080, 1920) and v.get("sample_aspect_ratio") in ("1:1", None) and not any("rotation" in d for d in v.get("side_data_list", [])), v
    assert dur < 600 and mp4.stat().st_size <= 250_000_000
    return name, mp4, dur

def make_zip(b, h):
    z = WORK / f"baraca-village-body{b}-hook{h}-bron.zip"
    used = set(); props = [f"props/b{b}h{h}-hook.json", f"props/body{b}.json"]
    for pf in props:
        d = json.loads((ROOT / pf).read_text())
        used |= {s["src"] for s in d["shots"]} | {a["src"] for a in d["audio"]} | ({d["music"]["src"]} if d["music"] else set())
    fixed = ["package.json", "package-lock.json", "tsconfig.json", "remotion.config.ts", "README-bron.md", "vo-meta.json", "muziek-meta.json", "shots.json",
             "src", "scripts", "public/fonts"] + props
    with zipfile.ZipFile(z, "w", zipfile.ZIP_STORED) as zf:
        for item in fixed + [f"public/{u}" for u in sorted(used)]:
            p = ROOT / item
            files = [p] if p.is_file() else [x for x in p.rglob("*") if x.is_file()]
            for f in files:
                rel = f.relative_to(ROOT).as_posix()
                if "node_modules" in rel or rel.endswith(".env") or "tts-cache" in rel: continue
                zf.write(f, rel)
    assert z.stat().st_size <= 200_000_000, z.stat().st_size
    return z

def put_parts(grant, mp4):
    with mp4.open("rb") as f:
        for part in grant["videoUploadParts"]:
            hdr = dict(grant["videoUploadHeaders"]); hdr["Content-Length"] = str(part["size"])
            req = urllib.request.Request(part["url"], f.read(part["size"]), hdr, method="PUT")
            with urllib.request.urlopen(req, timeout=600) as r: assert 200 <= r.status < 300, r.status

def main(b, h):
    key = f"b{b}h{h}"; name, mp4, dur = build(b, h); z = make_zip(b, h)
    oid = ids.setdefault(key, str(uuid.uuid4())); IDS.write_text(json.dumps(ids))
    grant = portal.post("uploads", {"outputId": oid, "title": name, "fileSize": mp4.stat().st_size})
    put_parts(grant, mp4)
    req = urllib.request.Request(grant["sourceUploadUrl"], z.read_bytes(), {"Content-Type": "application/zip"}, method="PUT")
    with urllib.request.urlopen(req, timeout=600) as r: assert 200 <= r.status < 300
    print("geupload", name, round(dur, 1), "s", mp4.stat().st_size // 1024, "KB zip", z.stat().st_size // 1024, "KB", flush=True)

if __name__ == "__main__":
    main(int(sys.argv[1]), int(sys.argv[2]))
