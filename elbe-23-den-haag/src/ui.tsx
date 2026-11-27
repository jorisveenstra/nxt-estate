import React from "react";
import { AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { colors, FONT } from "./brand";
import { ACCENT } from "./config";

export type Word = [number, number, string];

const norm = (w: string) => w.replace(/[.,!?]/g, "");

// Ingangsanimatie (alleen voor graphics; shots wisselen altijd met een harde cut)
export const useEnter = (startSec: number, delay = 0) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: f - Math.round((startSec + delay) * fps), fps, config: { damping: 16, stiffness: 140 } });
};

export const Scrims: React.FC = () => (
  <AbsoluteFill style={{ pointerEvents: "none" }}>
    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 420,
      background: "linear-gradient(rgba(10,14,12,0.55), rgba(10,14,12,0))" }} />
    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 760,
      background: "linear-gradient(rgba(10,14,12,0), rgba(10,14,12,0.6))" }} />
  </AbsoluteFill>
);

export const Logo: React.FC<{ height?: number; style?: React.CSSProperties }> = ({ height = 156, style }) => (
  <Img src={staticFile("logo/business-nomads.png")} style={{ height, position: "absolute", left: 60, top: 70, ...style }} />
);

// Ondertitels per woordgroep; het gesproken woord licht op in een olijf blok
export const Captions: React.FC<{ words: Word[]; offset?: number; top?: number }> = ({ words, offset = 0, top = 1330 }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = f / fps - offset;
  const groups: Word[][] = [];
  let cur: Word[] = [];
  for (const w of words) {
    cur.push(w);
    const len = cur.map((x) => x[2]).join(" ").length;
    if (/[.,!?]$/.test(w[2]) || cur.length >= 4 || len > 20) { groups.push(cur); cur = []; }
  }
  if (cur.length) groups.push(cur);
  const gi = groups.findIndex((g, i) => t >= g[0][0] - 0.05 && t < (groups[i + 1]?.[0][0] ?? g[g.length - 1][1] + 0.6) - 0.05);
  if (gi < 0) return null;
  const g = groups[gi];
  return (
    <div style={{ position: "absolute", top, left: 70, right: 70, display: "flex", flexWrap: "wrap",
      justifyContent: "center", gap: "6px 18px", fontFamily: FONT, fontWeight: 800, fontSize: 70,
      lineHeight: 1.15, color: colors.white, textTransform: "uppercase", letterSpacing: -0.5 }}>
      {g.map((w, i) => {
        const on = t >= w[0] - 0.03 && t < (g[i + 1]?.[0] ?? w[1] + 0.6);
        const acc = ACCENT.some((a) => norm(w[2]).toLowerCase() === a.toLowerCase());
        return (
          <span key={i} style={{ padding: "2px 14px", borderRadius: 12,
            background: on ? colors.olive : "transparent",
            color: !on && acc ? colors.cream : colors.white,
            textShadow: on ? "none" : "0 4px 18px rgba(0,0,0,0.85), 0 2px 4px rgba(0,0,0,0.9)" }}>
            {norm(w[2]) === w[2] ? w[2] : w[2].replace(/[,.]$/, "")}
          </span>
        );
      })}
    </div>
  );
};

export const Pill: React.FC<{ text: string; at: number; top: number; bg?: string; dot?: boolean }> = ({ text, at, top, bg = colors.green, dot }) => {
  const p = useEnter(at);
  return (
    <div style={{ position: "absolute", left: 60, top, opacity: p, transform: `translateY(${(1 - p) * -24}px)`,
      background: bg, color: colors.white, fontFamily: FONT, fontWeight: 700, fontSize: 30, letterSpacing: 2,
      padding: "12px 24px", borderRadius: 8, textTransform: "uppercase", display: "flex", alignItems: "center", gap: 14 }}>
      {dot && <div style={{ width: 14, height: 14, borderRadius: 7, background: "#5be38a" }} />}
      {text}
    </div>
  );
};

// Feitenkaart: donker groenzwart met olijf rand (zoals de site), groot getal + label
export const Stat: React.FC<{ at: number; top: number; value: string; label: string; icon?: React.ReactNode; right?: boolean }> = ({ at, top, value, label, icon, right }) => {
  const p = useEnter(at);
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fill = interpolate(f - at * fps, [6, 26], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div style={{ position: "absolute", top, [right ? "right" : "left"]: 60, opacity: p,
      transform: `translateX(${(1 - p) * (right ? 60 : -60)}px)`, display: "flex", alignItems: "center", gap: 26,
      background: "rgba(27,34,31,0.86)", borderRadius: 20, padding: "22px 34px 22px 26px", maxWidth: 700,
      borderLeft: `10px solid ${colors.olive}`, boxShadow: "0 14px 40px rgba(0,0,0,0.35)", overflow: "hidden" }}>
      {icon && <div style={{ width: 92, height: 92, flexShrink: 0 }}>{icon}</div>}
      <div>
        <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 66, lineHeight: 1, color: colors.white }}>{value}</div>
        <div style={{ fontFamily: FONT, fontWeight: 500, fontSize: 30, lineHeight: 1.25, color: colors.cream, marginTop: 8 }}>{label}</div>
        <div style={{ height: 5, marginTop: 14, width: `${fill * 100}%`, background: colors.oliveSoft, borderRadius: 3 }} />
      </div>
    </div>
  );
};

const stroke = { stroke: colors.oliveSoft, strokeWidth: 6, fill: "none", strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
export const Icons = {
  door: (
    <svg viewBox="0 0 92 92"><path d="M10 82V22L46 8l36 14v60" {...stroke} />
      <rect x="22" y="34" width="48" height="48" {...stroke} />
      {[44, 54, 64, 74].map((y) => <line key={y} x1="22" x2="70" y1={y} y2={y} {...stroke} strokeWidth={4} />)}</svg>
  ),
  area: (
    <svg viewBox="0 0 92 92"><rect x="12" y="12" width="68" height="68" rx="4" {...stroke} />
      <path d="M12 46h30v34M42 12v20" {...stroke} /></svg>
  ),
  parking: (
    <svg viewBox="0 0 92 92"><rect x="8" y="8" width="76" height="76" rx="16" fill={colors.olive} />
      <path d="M34 70V24h16a12 12 0 0 1 0 24H34" stroke="#fff" strokeWidth={9} fill="none" strokeLinejoin="round" /></svg>
  ),
  office: (
    <svg viewBox="0 0 92 92"><rect x="16" y="10" width="60" height="74" rx="4" {...stroke} />
      {[24, 40, 56].map((y) => [30, 54].map((x) => <rect key={`${x}${y}`} x={x - 6} y={y} width="12" height="9" fill={colors.oliveSoft} />))}
      <path d="M38 84V72h16v12" {...stroke} /></svg>
  ),
  build: (
    <svg viewBox="0 0 92 92"><path d="M8 84h76M18 84V30h56v54M18 46h56M18 62h56M40 30v54M58 30v54" {...stroke} />
      <path d="M30 18h32" {...stroke} /></svg>
  ),
  calendar: (
    <svg viewBox="0 0 92 92"><rect x="10" y="16" width="72" height="66" rx="8" {...stroke} />
      <path d="M10 36h72M30 8v16M62 8v16" {...stroke} /><path d="M32 58l10 10 20-20" {...stroke} /></svg>
  ),
};

// Nederlandse A-weg-schildjes (rood met wit)
export const Shield: React.FC<{ text: string; at: number; left: number; top: number }> = ({ text, at, left, top }) => {
  const p = useEnter(at);
  return (
    <div style={{ position: "absolute", left, top, transform: `scale(${0.6 + 0.4 * p})`, opacity: p,
      background: "#c8102e", border: "6px solid #fff", borderRadius: 16, padding: "10px 30px",
      fontFamily: FONT, fontWeight: 800, fontSize: 76, color: "#fff", boxShadow: "0 12px 30px rgba(0,0,0,0.4)" }}>{text}</div>
  );
};
