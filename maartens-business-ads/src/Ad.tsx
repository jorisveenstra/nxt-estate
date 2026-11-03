import React from "react";
import { AbsoluteFill, Audio, Img, OffthreadVideo, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig, Easing } from "remotion";

export type AdProps = {
  id: string; title: string; fps: number; duration: number; hookEnd: number; audio: string;
  words: { w: string; s: number; e: number; hook: boolean }[];
  shots: { s: number; e: number; clip: string; off: number }[];
  callouts: { text: string; s: number; e: number; cta: boolean }[];
};

// Merk: donkerrood uit logo/knoppen, antraciet en wit; Raleway (koppen) en DM Sans (tekst) lokaal geladen
const RED = "#800000";
const RED_LIGHT = "#b32020";
const fontCss = `
@font-face{font-family:'RalewayL';font-weight:700;src:url(${staticFile("fonts/raleway-latin-700-normal.woff2")}) format('woff2')}
@font-face{font-family:'RalewayL';font-weight:800;src:url(${staticFile("fonts/raleway-latin-800-normal.woff2")}) format('woff2')}
@font-face{font-family:'RalewayL';font-weight:900;src:url(${staticFile("fonts/raleway-latin-900-normal.woff2")}) format('woff2')}
@font-face{font-family:'DMSansL';font-weight:500;src:url(${staticFile("fonts/dm-sans-latin-500-normal.woff2")}) format('woff2')}
@font-face{font-family:'DMSansL';font-weight:700;src:url(${staticFile("fonts/dm-sans-latin-700-normal.woff2")}) format('woff2')}
@font-face{font-family:'DMSansL';font-weight:800;src:url(${staticFile("fonts/dm-sans-latin-800-normal.woff2")}) format('woff2')}
`;
const HEAD = "RalewayL, sans-serif";
const SANS = "DMSansL, sans-serif";
const shadow = "0 3px 14px rgba(0,0,0,.75), 0 0 3px rgba(0,0,0,.9)";

const Shot: React.FC<{ clip: string; off: number; dur: number }> = ({ clip, off, dur }) => {
  const frame = useCurrentFrame();
  // Rustige, continue beweging binnen één shot (geen overgang)
  const z = 1 + 0.04 * (frame / Math.max(dur, 1));
  return (
    <AbsoluteFill style={{ transform: `scale(${z})` }}>
      <OffthreadVideo src={staticFile(`clips/${clip}.mp4`)} startFrom={Math.round(off * 24)} muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />
    </AbsoluteFill>
  );
};

const Captions: React.FC<AdProps> = ({ words, hookEnd }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  // groepeer woorden in korte regels (max 4 woorden, breek op zinseinde)
  const groups: typeof words[] = [];
  let cur: typeof words = [];
  for (const w of words) {
    if (cur.length && (cur.length >= 4 || cur[0].hook !== w.hook || /[.?!]$/.test(cur[cur.length - 1].w))) { groups.push(cur); cur = []; }
    cur.push(w);
  }
  if (cur.length) groups.push(cur);
  const g = groups.find((x, i) => t >= x[0].s - 0.05 && t < (groups[i + 1]?.[0].s ?? 1e9) - 0.0) ;
  if (!g || t > g[g.length - 1].e + 0.5) return null;
  const isHook = g[0].hook;
  const gs = g[0].s;
  const pop = spring({ frame: frame - Math.round(gs * fps), fps, config: { damping: 14, stiffness: 200 } });
  return (
    <div style={{ position: "absolute", left: 60, right: 60, top: isHook ? 560 : 1330, display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "0 22px", transform: `scale(${0.9 + 0.1 * pop})`, opacity: pop }}>
      {g.map((w, i) => {
        const active = t >= w.s && t <= w.e + 0.05;
        const past = t > w.e;
        return (
          <span key={i} style={{ fontFamily: HEAD, fontWeight: 900, fontSize: isHook ? 104 : 84, lineHeight: 1.15, textTransform: isHook ? "uppercase" : "none", color: "#fff", textShadow: shadow, background: active ? RED : "transparent", padding: "0 14px", borderRadius: 8, opacity: active || past ? 1 : 0.75 }}>
            {w.w}
          </span>
        );
      })}
    </div>
  );
};

const Callout: React.FC<{ c: AdProps["callouts"][number] }> = ({ c }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = Math.round(c.s * fps), e = Math.round(c.e * fps);
  if (frame < s || frame > e + 8) return null;
  const pop = spring({ frame: frame - s, fps, config: { damping: 12, stiffness: 170, mass: 0.8 } });
  const out = interpolate(frame, [e, e + 8], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const bar = interpolate(frame, [s, s + 14], [0, 1], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  return (
    <div style={{ position: "absolute", left: 60, top: 190, opacity: out, transform: `translateX(${(1 - pop) * -140}px)` }}>
      <div style={{ display: "flex", alignItems: "stretch" }}>
        <div style={{ width: 10, background: "#fff", transformOrigin: "top", transform: `scaleY(${bar})` }} />
        <div style={{ background: RED, color: "#fff", fontFamily: HEAD, fontWeight: 800, fontSize: 56, padding: "18px 32px", borderRadius: "0 8px 8px 0", letterSpacing: 0.5, boxShadow: "0 6px 24px rgba(0,0,0,.35)" }}>{c.text}</div>
      </div>
    </div>
  );
};

const Cta: React.FC<{ start: number }> = ({ start }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({ frame: frame - start, fps, config: { damping: 11, stiffness: 160 } });
  if (frame < start) return null;
  const pulse = 1 + 0.03 * Math.sin((frame - start) / 6);
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 1560, display: "flex", justifyContent: "center", transform: `scale(${pop * pulse})` }}>
      <div style={{ background: RED, color: "#fff", fontFamily: SANS, fontWeight: 800, fontSize: 58, padding: "30px 64px", borderRadius: 8, boxShadow: "0 10px 40px rgba(0,0,0,.5)", border: "3px solid #fff" }}>Plan een afspraak</div>
    </div>
  );
};

export const Ad: React.FC<AdProps> = (p) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const ctaStart = Math.round(p.callouts[p.callouts.length - 1].s * fps);
  const progress = frame / durationInFrames;
  const logoPop = spring({ frame, fps, config: { damping: 14 } });
  const hookNow = frame / fps < p.hookEnd;
  return (
    <AbsoluteFill style={{ background: "#141414" }}>
      <style>{fontCss}</style>
      {p.shots.map((s, i) => {
        const from = Math.round(s.s * fps);
        const to = i === p.shots.length - 1 ? durationInFrames : Math.round(p.shots[i + 1].s * fps);
        return (
          <Sequence key={i} from={from} durationInFrames={Math.max(1, to - from)}>
            <Shot clip={s.clip} off={s.off} dur={to - from} />
          </Sequence>
        );
      })}
      {/* zacht verloop onder de ondertitels voor leesbaarheid (geen paneel) */}
      <AbsoluteFill style={{ background: "linear-gradient(to bottom, rgba(0,0,0,.35) 0%, rgba(0,0,0,0) 22%, rgba(0,0,0,0) 62%, rgba(0,0,0,.45) 100%)" }} />
      <Audio src={staticFile(p.audio)} />
      {!hookNow && p.callouts.map((c, i) => <Callout key={i} c={c} />)}
      <Captions {...p} />
      <Cta start={ctaStart} />
      <Img src={staticFile("logo/mb-wit.png")} style={{ position: "absolute", right: 56, top: 70, width: 150, opacity: logoPop, filter: "drop-shadow(0 3px 10px rgba(0,0,0,.6))" }} />
      <div style={{ position: "absolute", left: 0, bottom: 0, height: 10, width: `${progress * 100}%`, background: RED_LIGHT }} />
    </AbsoluteFill>
  );
};
