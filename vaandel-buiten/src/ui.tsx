import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { colors, fonts } from "./brand";
import { Icon } from "./config";

export type Word = { t: string; s: number; e: number };
export type Scene = { id: string; start: number; end: number; words: Word[] };

export const norm = (w: string) => w.toLowerCase().replace(/[^a-z0-9à-ÿ]/g, "");

export const wordTime = (sc: Scene, word: string) => {
  const w = sc.words.find((x) => norm(x.t) === norm(word));
  if (!w) throw new Error(`woord "${word}" niet in scène ${sc.id}`);
  return w.s;
};

// ---------- pictogrammen (eenvoudige lijn-iconen) ----------
export const IconSvg: React.FC<{ icon: Icon; size: number; color: string }> = ({ icon, size, color }) => {
  const p = { fill: "none", stroke: color, strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  const body = {
    house: (<><path {...p} d="M3 11 12 3l9 8" /><path {...p} d="M5 10v10h14V10" /><path {...p} d="M10 20v-6h4v6" /></>),
    tree: (<><circle {...p} cx="12" cy="9" r="6" /><path {...p} d="M12 15v6M9 21h6" /></>),
    smile: (<><circle {...p} cx="12" cy="12" r="9" /><path {...p} d="M8 14c1.3 2.2 6.7 2.2 8 0" /><path {...p} d="M9 9.5h.01M15 9.5h.01" /></>),
    car: (<><path {...p} d="M4 17v-4l2-5h12l2 5v4z" /><path {...p} d="M4 13h16" /><circle {...p} cx="8" cy="17" r="1.6" /><circle {...p} cx="16" cy="17" r="1.6" /></>),
    euro: (<><circle {...p} cx="12" cy="12" r="9" /><path {...p} d="M15.5 8.5A4.5 4.5 0 0 0 9 10.5v3a4.5 4.5 0 0 0 6.5 2M7.5 11h6M7.5 13h6" /></>),
    calendar: (<><rect {...p} x="3.5" y="5" width="17" height="15" rx="2" /><path {...p} d="M3.5 10h17M8 3v4M16 3v4" /></>),
    check: (<><circle {...p} cx="12" cy="12" r="9" /><path {...p} d="m7.5 12.5 3 3 6-6.5" /></>),
    area: (<><path {...p} d="M4 20V4h16" /><path {...p} d="M4 20 20 4M4 4l16 16" strokeOpacity="0" /><path {...p} d="M8 8h8v8H8z" /></>),
    bath: (<><path {...p} d="M3.5 12h17v3a4 4 0 0 1-4 4h-9a4 4 0 0 1-4-4z" /><path {...p} d="M6 12V6a2 2 0 0 1 4 0M7 19l-1 2M17 19l1 2" /></>),
    key: (<><circle {...p} cx="8" cy="12" r="4" /><path {...p} d="M12 12h9M18 12v3M21 12v2" /></>),
    heart: (<path {...p} d="M12 20S4 14.5 4 9a4 4 0 0 1 8-1 4 4 0 0 1 8 1c0 5.500-8 11-8 11z" />),
  }[icon];
  return <svg width={size} height={size} viewBox="0 0 24 24">{body}</svg>;
};

// ---------- logo ----------
export const Logo: React.FC<{ width: number; shadow?: boolean }> = ({ width, shadow = true }) => (
  <Img src={staticFile("logo.png")} style={{ width, display: "block", filter: shadow ? "drop-shadow(0 4px 14px rgba(0,0,0,0.35))" : undefined }} />
);

// ---------- feit-label: schuift in beeld, blijft staan tot het einde van de scène ----------
export const CalloutCard: React.FC<{ icon: Icon; title: string; sub?: string; start: number; end: number; slot: number }> = ({ icon, title, sub, start, end, slot }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const f0 = Math.round(start * fps);
  const f1 = Math.round(end * fps);
  if (frame < f0 || frame > f1 + 12) return null;
  const inn = spring({ frame: frame - f0, fps, config: { damping: 14, stiffness: 140, mass: 0.7 } });
  const out = interpolate(frame, [f1 - 2, f1 + 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.in(Easing.cubic) });
  const x = (1 - inn) * -700 - out * 700;
  // pulserende rand terwijl hij staat
  const pulse = 0.5 + 0.5 * Math.sin((frame - f0) / 9);
  return (
    <div style={{ position: "absolute", left: 40, top: 300 + slot * 190, transform: `translateX(${x}px)`, display: "flex", alignItems: "center", gap: 22, background: "rgba(50,80,89,0.94)", borderRadius: 26, padding: "20px 34px 20px 22px", boxShadow: `0 10px 30px rgba(0,0,0,0.35), 0 0 0 ${2 + pulse * 3}px rgba(255,255,255,0.18)`, maxWidth: 940 }}>
      <div style={{ width: 92, height: 92, borderRadius: 46, background: colors.white, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <IconSvg icon={icon} size={58} color={colors.teal} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <div style={{ fontFamily: fonts.head, fontWeight: 800, fontSize: 50, lineHeight: 1.08, color: colors.white }}>{title}</div>
        {sub ? <div style={{ fontFamily: fonts.body, fontWeight: 700, fontSize: 30, color: "rgba(255,255,255,0.88)" }}>{sub}</div> : null}
      </div>
    </div>
  );
};

// ---------- ondertitels: korte woordgroepjes, gesproken woord licht op ----------
export const Captions: React.FC<{ words: Word[]; offset?: number }> = ({ words, offset = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps - offset;
  const chunks: Word[][] = [];
  let cur: Word[] = [];
  words.forEach((w) => {
    cur.push(w);
    const len = cur.map((c) => c.t).join(" ").length;
    if (/[.,?!:]$/.test(w.t) || cur.length >= 4 || len > 22) {
      chunks.push(cur);
      cur = [];
    }
  });
  if (cur.length) chunks.push(cur);
  const idx = chunks.findIndex((c, i) => t >= c[0].s - 0.05 && (i + 1 >= chunks.length || t < chunks[i + 1][0].s - 0.05));
  const chunk = idx >= 0 ? chunks[idx] : null;
  if (!chunk || t > chunk[chunk.length - 1].e + 0.5) return null;
  const since = (t - chunk[0].s) * fps;
  const pop = interpolate(since, [0, 4], [0.9, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ justifyContent: "flex-start", alignItems: "center", paddingTop: 1290 }}>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", columnGap: 14, rowGap: 6, maxWidth: 960, transform: `scale(${pop})`, fontFamily: fonts.head, fontWeight: 800, fontSize: 62, textAlign: "center" }}>
        {chunk.map((w, i) => {
          const active = t >= w.s - 0.03 && t < (chunk[i + 1]?.s ?? w.e + 0.5);
          return (
            <span key={i} style={{ color: colors.white, background: active ? colors.teal : "transparent", padding: "0 14px", borderRadius: 12, textShadow: active ? "none" : "0 3px 16px rgba(0,0,0,0.8), 0 1px 3px rgba(0,0,0,0.9)" }}>
              {w.t}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
