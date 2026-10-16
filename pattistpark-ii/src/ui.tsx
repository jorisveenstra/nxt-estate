import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { BRAND, FONT } from "./brand";

const S = { fill: "none", stroke: "#fff", strokeWidth: 6, strokeLinecap: "round", strokeLinejoin: "round" } as const;

export const Icon: React.FC<{ name: string; size?: number }> = ({ name, size = 96 }) => {
  const p: Record<string, React.ReactNode> = {
    building: (<><rect x="26" y="12" width="48" height="76" {...S} /><path d="M38 28h8M54 28h8M38 44h8M54 44h8M38 60h8M54 60h8" {...S} /><path d="M44 88V74h12v14" {...S} /></>),
    floor: (<><path d="M14 46 50 16l36 30" {...S} /><path d="M24 40v38h52V40" {...S} /><path d="M10 88h80" {...S} stroke={BRAND.orange} /></>),
    pin: (<><path d="M50 90S22 60 22 40a28 28 0 0 1 56 0c0 20-28 50-28 50z" {...S} /><circle cx="50" cy="40" r="10" {...S} /></>),
    coffee: (<><path d="M20 38h46v24a22 22 0 0 1-22 22h-2a22 22 0 0 1-22-22z" {...S} /><path d="M66 46h8a10 10 0 0 1 0 20h-10" {...S} /><path d="M32 12c-6 6 6 8 0 16M46 12c-6 6 6 8 0 16" {...S} stroke={BRAND.orange} /></>),
    sparkle: (<><path d="M50 10l9 31 31 9-31 9-9 31-9-31-31-9 31-9z" {...S} /></>),
    people: (<><circle cx="36" cy="32" r="12" {...S} /><circle cx="68" cy="36" r="10" {...S} /><path d="M14 84c0-18 10-28 22-28s22 10 22 28M56 62c14-4 28 4 30 22" {...S} /></>),
    calendar: (<><rect x="14" y="20" width="72" height="66" rx="8" {...S} /><path d="M14 40h72M32 10v18M68 10v18" {...S} /><path d="M32 56h10M58 56h10M32 70h10" {...S} stroke={BRAND.orange} /></>),
    key: (<><circle cx="32" cy="50" r="18" {...S} /><path d="M50 50h40M76 50v14M64 50v10" {...S} /></>),
    question: (<><circle cx="50" cy="50" r="38" {...S} /><path d="M38 38a12 12 0 1 1 18 10c-5 3-6 6-6 12" {...S} /><circle cx="50" cy="74" r="2" {...S} /></>),
    search: (<><circle cx="42" cy="42" r="26" {...S} /><path d="M62 62l26 26" {...S} /><path d="M32 42l8 8 14-16" {...S} stroke={BRAND.orange} /></>),
    euro: (<><circle cx="50" cy="50" r="38" {...S} /><path d="M64 36a18 18 0 1 0 0 28M30 44h28M30 56h28" {...S} /></>),
    check: (<><circle cx="50" cy="50" r="38" {...S} /><path d="M32 52l14 14 24-28" {...S} stroke={BRAND.orange} /></>),
    home: (<><path d="M10 48 50 14l40 34" {...S} /><path d="M20 42v44h60V42" {...S} /><path d="M42 86V62h16v24" {...S} /></>),
    eye: (<><path d="M6 50C22 24 78 24 94 50 78 76 22 76 6 50z" {...S} /><circle cx="50" cy="50" r="14" {...S} stroke={BRAND.orange} /></>),
    arrow: (<><path d="M50 14v66M26 58l24 24 24-24" {...S} /></>),
  };
  return <svg width={size} height={size} viewBox="0 0 100 100">{p[name] ?? p.sparkle}</svg>;
};

// Grafisch accent boven in beeld: pictogram in cirkel, label en subtitel, met pulserende ring.
export const Badge: React.FC<{ icon: string; label: string; sub?: string; start: number; end: number }> = ({ icon, label, sub, start, end }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = f - start;
  if (f < start || f > end) return null;
  const pop = spring({ frame: t, fps, config: { damping: 11, stiffness: 140 } });
  const out = interpolate(f, [end - 6, end], [1, 0], { extrapolateLeft: "clamp" });
  const ring = (t % 45) / 45;
  const lbl = interpolate(t, [4, 16], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div style={{ position: "absolute", top: 270, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center", opacity: out, transform: `scale(${0.4 + 0.6 * pop})` }}>
      <div style={{ position: "relative", width: 190, height: 190 }}>
        <div style={{ position: "absolute", inset: -ring * 40, borderRadius: "50%", border: `5px solid ${BRAND.taupe}`, opacity: 1 - ring }} />
        <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: BRAND.navy, border: `6px solid ${BRAND.taupe}`, boxShadow: "0 12px 40px rgba(0,0,0,.45)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon name={icon} size={118} />
        </div>
      </div>
      <div style={{ marginTop: 22, fontFamily: FONT, fontWeight: 800, fontSize: label.length > 20 ? 52 : 66, letterSpacing: 3, color: "#fff", textAlign: "center", maxWidth: 960, lineHeight: 1.05, textShadow: "0 4px 22px rgba(0,0,0,.75), 0 0 6px rgba(0,0,0,.6)", opacity: lbl, transform: `translateY(${(1 - lbl) * 24}px)` }}>{label}</div>
      {sub && (
        <div style={{ marginTop: 14, fontFamily: FONT, fontWeight: 600, fontSize: 40, color: BRAND.cream, textAlign: "center", maxWidth: 900, textShadow: "0 3px 16px rgba(0,0,0,.8)", opacity: lbl }}>
          <span style={{ display: "inline-block", width: 60 * lbl, height: 5, background: BRAND.orange, verticalAlign: "middle", marginRight: 16 }} />
          {sub}
        </div>
      )}
    </div>
  );
};

export const Logo: React.FC = () => (
  <div style={{ position: "absolute", top: 110, left: 56, fontFamily: FONT, color: "#fff", textShadow: "0 3px 16px rgba(0,0,0,.7)" }}>
    <div style={{ fontWeight: 800, fontSize: 46, letterSpacing: 5, lineHeight: 1 }}>PATTISTPARK <span style={{ color: BRAND.taupe }}>II</span></div>
    <div style={{ fontWeight: 600, fontSize: 24, letterSpacing: 9, color: BRAND.cream, marginTop: 6 }}>TERNEUZEN</div>
    <div style={{ width: 120, height: 5, background: BRAND.orange, marginTop: 10 }} />
  </div>
);

// Vliegende sterretjes/lichtpuntjes als extra animatie (niveau "a_lot"); klein en doorzichtig.
export const Sparkles: React.FC<{ seed?: number }> = ({ seed = 1 }) => {
  const f = useCurrentFrame();
  const items = Array.from({ length: 7 }, (_, i) => {
    const r = (n: number) => ((Math.sin((i + 1) * 12.9898 * (n + seed)) * 43758.5453) % 1 + 1) % 1;
    const cycle = 90 + r(1) * 60;
    const p = ((f + r(2) * cycle) % cycle) / cycle;
    return { x: 40 + r(3) * 1000, y: 1700 - p * 1500, s: 14 + r(4) * 22, o: Math.sin(p * Math.PI) * 0.75, rot: p * 180 };
  });
  return (
    <>
      {items.map((it, i) => (
        <svg key={i} width={it.s * 2} height={it.s * 2} viewBox="0 0 100 100" style={{ position: "absolute", left: it.x, top: it.y, opacity: it.o, transform: `rotate(${it.rot}deg)` }}>
          <path d="M50 0l12 38 38 12-38 12-12 38-12-38L0 50l38-12z" fill={i % 2 ? BRAND.taupe : "#fff"} />
        </svg>
      ))}
    </>
  );
};

export const Progress: React.FC<{ total: number; offset?: number; full?: number }> = ({ total, offset = 0, full }) => {
  const f = useCurrentFrame();
  const w = ((f + offset) / (full ?? total)) * 100;
  return (
    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 12, background: "rgba(255,255,255,.25)" }}>
      <div style={{ width: `${w}%`, height: "100%", background: `linear-gradient(90deg, ${BRAND.taupe}, ${BRAND.orange})` }} />
    </div>
  );
};

// Ondertitels per woord: korte zinsdelen, actief woord in oranje, geen balk erachter.
export type W = [number, number, string];
export const chunk = (words: W[]): W[][] => {
  const out: W[][] = []; let cur: W[] = [];
  words.forEach((w, i) => {
    cur.push(w);
    const end = /[.,?!:;]$/.test(w[2]);
    if (cur.length >= 4 || (end && cur.length >= 2) || cur.join(" ").length > 26 && cur.length >= 3 || i === words.length - 1) { out.push(cur); cur = []; }
  });
  return out;
};

export const Captions: React.FC<{ words: W[]; fps: number; bottom?: number }> = ({ words, fps, bottom = 560 }) => {
  const f = useCurrentFrame();
  const t = f / fps;
  const chunks = chunk(words);
  let idx = -1;
  chunks.forEach((c, i) => { if (t >= c[0][0] - 0.05) idx = i; });
  if (idx < 0) return null;
  const c = chunks[idx];
  const last = c[c.length - 1];
  const next = chunks[idx + 1];
  if (!next && t > last[1] + 0.6) return null;
  const age = Math.min(1, (t - c[0][0] + 0.05) * 9);
  return (
    <div style={{ position: "absolute", left: 40, right: 40, bottom, display: "flex", justifyContent: "center", flexWrap: "wrap", gap: "0 22px", fontFamily: FONT, fontWeight: 800, fontSize: 86, lineHeight: 1.12, textAlign: "center", transform: `scale(${0.88 + 0.12 * age})`, opacity: Math.min(1, age * 1.5) }}>
      {c.map((w, i) => {
        const active = t >= w[0] - 0.02 && t <= w[1] + 0.04;
        const done = t > w[1];
        return (
          <span key={i} style={{ color: active ? BRAND.orange : "#fff", WebkitTextStroke: `10px ${BRAND.navy}`, paintOrder: "stroke fill", textShadow: "0 6px 24px rgba(0,0,0,.55)", opacity: done || active ? 1 : 0.92, transform: active ? "scale(1.07)" : "none", display: "inline-block" }}>{w[2]}</span>
        );
      })}
    </div>
  );
};

export const CtaButton: React.FC<{ start: number; text: string }> = ({ start, text }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = f - start;
  if (t < 0) return null;
  const pop = spring({ frame: t, fps, config: { damping: 10, stiffness: 120 } });
  const pulse = 1 + 0.045 * Math.sin(t / 5);
  const bounce = Math.sin(t / 4) * 10;
  return (
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 250, display: "flex", flexDirection: "column", alignItems: "center", transform: `scale(${pop * pulse})` }}>
      <div style={{ fontFamily: FONT, fontWeight: 600, fontSize: 38, color: "#fff", textShadow: "0 3px 16px rgba(0,0,0,.8)", marginBottom: 12 }}>Klik op de knop hieronder</div>
      <div style={{ background: BRAND.orange, borderRadius: 70, padding: "26px 64px", fontFamily: FONT, fontWeight: 800, fontSize: 58, color: "#fff", boxShadow: "0 14px 40px rgba(0,0,0,.45), 0 0 0 8px rgba(255,255,255,.25)", display: "flex", alignItems: "center", gap: 22 }}>
        {text}
        <div style={{ transform: `translateY(${bounce}px)` }}><Icon name="arrow" size={64} /></div>
      </div>
    </div>
  );
};
