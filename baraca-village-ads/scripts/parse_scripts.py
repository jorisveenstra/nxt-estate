"""Parseert snapshot.scriptHtml uit de claim naar scripts/scripts.json (3 bodies x 5 hooks)."""
import json, re, html, sys
claim = json.load(open(sys.argv[1]))
h = claim["snapshot"]["scriptHtml"]
paras = [html.unescape(re.sub(r"<[^>]+>", "", p)).strip() for p in re.findall(r"<(?:p|li)>(.*?)</(?:p|li)>", h, flags=re.S)]
bodies, cur, mode = [], None, None
for p in paras:
    if not p: continue
    m = re.match(r"Hook (\d):\s*(.*)", p)
    if m:
        cur["hooks"][int(m.group(1))] = m.group(2); mode = None; continue
    if p == "Body:": mode = "body"; continue
    if p.startswith("CTA:"): mode = "cta"; continue
    if p == "Doelgroepen": mode = "aud"; continue
    if mode == "aud": cur["audience"] = p; mode = None; continue
    if mode == "body": cur["body"].append(p); continue
    if mode == "cta": cur["cta"] = p; mode = None; continue
    # title line
    cur = {"title": p, "hooks": {}, "body": [], "cta": ""}; bodies.append(cur)
json.dump(bodies, open("scripts/scripts.json", "w"), ensure_ascii=False, indent=1)
for i, b in enumerate(bodies, 1): print(i, b["title"][:50], len(b["hooks"]), len(b["body"]), b["cta"][:40])
