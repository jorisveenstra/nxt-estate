"""
Audio-revisie zonder het beeld opnieuw te renderen: neemt de videostream van een eerder geleverde
eind-MP4 ongewijzigd over (-c:v copy) en zet de nieuwe mix uit public/mix eronder. Bruikbaar als
alleen de audiomix verandert (bijv. muziek/geluidseffecten zachter). Voor beeldwijzigingen: render.py.

Gebruik: python3 scripts/remux_audio.py <b1_h1> <vorige.mp4> <uit.mp4>
"""
import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PLAN = json.loads((ROOT / "src/plan.json").read_text())


def main():
    key, vorige, uit = sys.argv[1], Path(sys.argv[2]), Path(sys.argv[3])
    b = key.split("_h")[0]
    frames = PLAN["hooks"][key]["frames"] + PLAN["bodies"][b]["frames"]
    subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-y", "-i", str(vorige), "-i", str(ROOT / f"public/mix/{key}.wav"),
                    "-map", "0:v:0", "-map", "1:a:0", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-ar", "48000",
                    "-t", f"{frames / 30:.3f}", "-movflags", "+faststart", str(uit)], check=True)
    info = json.loads(subprocess.run(["ffprobe", "-v", "error", "-show_entries",
                                      "stream=codec_type,width,height,sample_aspect_ratio:stream_side_data=rotation:format=duration",
                                      "-of", "json", str(uit)], capture_output=True, text=True, check=True).stdout)
    v = next(s for s in info["streams"] if s["codec_type"] == "video")
    assert (v["width"], v["height"]) == (1080, 1920) and v.get("sample_aspect_ratio", "1:1") in ("1:1", "N/A")
    assert not any(float(d.get("rotation", 0)) for d in v.get("side_data_list", []))
    assert any(s["codec_type"] == "audio" for s in info["streams"])
    assert abs(float(info["format"]["duration"]) - frames / 30) < 0.15
    print(f"klaar {uit.name}: 1080x1920 {float(info['format']['duration']):.2f}s")


if __name__ == "__main__":
    main()
