import React from "react";
import { AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { colors, FONT } from "./brand";
import { Icon } from "./icons";

// Geanimeerde accenten (grafische intensiteit "a_lot"), altijd compact in de bovenste helft
// zodat het beeld dominant blijft (ruim onder 35% van het frame).
export type Accent = { type: string; start: number; end: number; [k: string]: any };

const shadow = "0 3px 14px rgba(0,0,0,0.6), 0 0 3px rgba(0,0,0,0.8)";

const useIn = (delay = 0) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - delay * fps, fps, config: { damping: 16, stiffness: 140 } });
};

const Wrap: React.FC<{ children: React.ReactNode; dur: number; top?: number; center?: boolean }> = ({ children, dur, top = 300, center }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = useIn();
  const out = interpolate(frame, [dur * fps - 6, dur * fps], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ top, left: center ? 0 : 64, right: center ? 0 : undefined, alignItems: center ? "center" : "flex-start" }}>
      <div style={{ opacity: Math.min(p, out), transform: `translateY(${(1 - p) * 40}px)` }}>{children}</div>
    </AbsoluteFill>
  );
};

const Chip: React.FC<{ a: Accent; dur: number }> = ({ a, dur }) => {
  const p = useIn(0.08);
  return (
    <Wrap dur={dur}>
      <div style={{ display: "flex", alignItems: "center", gap: 22, background: "rgba(248,245,239,0.94)", borderRadius: 999, padding: "16px 36px 16px 16px", boxShadow: "0 10px 30px rgba(0,0,0,0.25)" }}>
        <div style={{ width: 76, height: 76, borderRadius: 999, background: colors.gold, display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${p})` }}>
          <Icon name={a.icon} size={42} color={colors.white} />
        </div>
        <div style={{ fontFamily: FONT }}>
          <div style={{ fontWeight: 700, fontSize: 44, color: colors.ink, lineHeight: 1.1 }}>{a.text}</div>
          {a.sub ? <div style={{ fontWeight: 500, fontSize: 28, color: colors.goldDark, marginTop: 4 }}>{a.sub}</div> : null}
        </div>
      </div>
    </Wrap>
  );
};

const Stat: React.FC<{ a: Accent; dur: number }> = ({ a, dur }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const bar = interpolate(frame, [4, 22], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  return (
    <Wrap dur={dur}>
      <div style={{ fontFamily: FONT }}>
        <div style={{ display: "inline-block", background: colors.gold, color: colors.white, fontWeight: 600, fontSize: 30, letterSpacing: 4, textTransform: "uppercase", padding: "8px 22px", borderRadius: 999 }}>
          {a.label}
        </div>
        <div style={{ fontWeight: 800, fontSize: 150, color: colors.white, lineHeight: 1.05, textShadow: shadow, marginTop: 6 }}>{a.value}</div>
        <div style={{ height: 10, width: 420 * bar, background: colors.sand, borderRadius: 6 }} />
      </div>
    </Wrap>
  );
};

const Duo: React.FC<{ a: Accent; dur: number }> = ({ a, dur }) => {
  const pa = useIn(0);
  const pb = useIn(a.cueB ?? 0.4);
  const kol = (d: [string, string], p: number) => (
    <div style={{ opacity: p, transform: `translateY(${(1 - p) * 30}px)`, minWidth: 380 }}>
      <div style={{ fontWeight: 800, fontSize: 116, color: colors.white, lineHeight: 1.05, textShadow: shadow }}>{d[0]}</div>
      <div style={{ display: "inline-block", background: "rgba(248,245,239,0.94)", color: colors.ink, fontWeight: 600, fontSize: 30, padding: "8px 20px", borderRadius: 999 }}>{d[1]}</div>
    </div>
  );
  return (
    <Wrap dur={dur}>
      <div style={{ fontFamily: FONT }}>
        <div style={{ display: "flex", gap: 40 }}>
          {kol(a.a, pa)}
          {kol(a.b, pb)}
        </div>
        {a.note ? (
          <div style={{ marginTop: 18, color: colors.white, fontWeight: 500, fontSize: 28, letterSpacing: 2, textTransform: "uppercase", textShadow: shadow }}>{a.note}</div>
        ) : null}
      </div>
    </Wrap>
  );
};

const Lijst: React.FC<{ a: Accent; dur: number }> = ({ a, dur }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <Wrap dur={dur}>
      <div style={{ fontFamily: FONT, display: "flex", flexDirection: "column", gap: 16 }}>
        {a.items.map((it: string, i: number) => {
          const p = spring({ frame: frame - (a.cues?.[i] ?? i * 0.5) * fps, fps, config: { damping: 15, stiffness: 150 } });
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 18, opacity: p, transform: `translateX(${(1 - p) * -40}px)` }}>
              <div style={{ width: 62, height: 62, borderRadius: 999, background: colors.green, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon name="check" size={38} color={colors.white} />
              </div>
              <div style={{ background: "rgba(248,245,239,0.94)", borderRadius: 18, padding: "10px 26px", fontWeight: 700, fontSize: 42, color: colors.ink }}>{it}</div>
            </div>
          );
        })}
      </div>
    </Wrap>
  );
};

const Kamers: React.FC<{ a: Accent; dur: number }> = ({ a, dur }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <Wrap dur={dur}>
      <div style={{ fontFamily: FONT, display: "flex", alignItems: "center", gap: 20 }}>
        {a.items.map((it: string, i: number) => {
          const p = spring({ frame: frame - (a.cues?.[i] ?? i * 0.4) * fps, fps, config: { damping: 12, stiffness: 160 } });
          return (
            <div key={i} style={{ width: 130, height: 130, borderRadius: 999, background: colors.gold, color: colors.white, fontWeight: 800, fontSize: 76, display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${p})`, boxShadow: "0 8px 24px rgba(0,0,0,0.3)" }}>
              {it}
            </div>
          );
        })}
        <div style={{ color: colors.white, fontWeight: 700, fontSize: 52, textShadow: shadow, marginLeft: 8 }}>{a.label}</div>
      </div>
    </Wrap>
  );
};

const Trend: React.FC<{ a: Accent; dur: number }> = ({ a, dur }) => {
  const frame = useCurrentFrame();
  const len = interpolate(frame, [4, 30], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  return (
    <Wrap dur={dur}>
      <div style={{ display: "flex", alignItems: "center", gap: 26, fontFamily: FONT }}>
        <svg width={200} height={130} viewBox="0 0 200 130">
          <polyline points="8,118 60,92 100,100 150,48 192,14" fill="none" stroke={colors.sand} strokeWidth={12} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={320} strokeDashoffset={320 * (1 - len)} />
          <polygon points="192,14 166,16 186,38" fill={colors.sand} opacity={len > 0.9 ? 1 : 0} />
        </svg>
        <div>
          <div style={{ fontWeight: 800, fontSize: 66, color: colors.white, textShadow: shadow, lineHeight: 1.05 }}>{a.text}</div>
          <div style={{ fontWeight: 600, fontSize: 34, color: colors.white, textShadow: shadow }}>{a.sub}</div>
        </div>
      </div>
    </Wrap>
  );
};

const Fases: React.FC<{ a: Accent; dur: number }> = ({ a, dur }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <Wrap dur={dur}>
      <div style={{ fontFamily: FONT }}>
        <div style={{ fontWeight: 800, fontSize: 70, color: colors.white, textShadow: shadow }}>{a.label}</div>
        <div style={{ display: "flex", gap: 12, marginTop: 10 }}>
          {[0, 1, 2, 3, 4].map((i) => {
            const p = spring({ frame: frame - (4 + i * 4), fps, config: { damping: 16 } });
            return (
              <div key={i} style={{ width: 150, height: 44, borderRadius: 12, background: i === 0 ? colors.gold : "rgba(248,245,239,0.35)", border: `3px solid ${i === 0 ? colors.gold : colors.cream}`, transform: `scaleX(${p})`, transformOrigin: "left" }} />
            );
          })}
        </div>
        <div style={{ marginTop: 12, fontWeight: 600, fontSize: 32, letterSpacing: 4, textTransform: "uppercase", color: colors.white, textShadow: shadow }}>{a.sub}</div>
      </div>
    </Wrap>
  );
};

const Termijnen: React.FC<{ a: Accent; dur: number }> = ({ a, dur }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <Wrap dur={dur}>
      <div style={{ fontFamily: FONT }}>
        <div style={{ display: "flex", gap: 14 }}>
          {Array.from({ length: a.n }, (_, i) => {
            const p = spring({ frame: frame - (3 + i * 6), fps, config: { damping: 14 } });
            return (
              <div key={i} style={{ width: 110, height: 110, borderRadius: 20, background: colors.gold, color: colors.white, fontWeight: 800, fontSize: 54, display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${p})` }}>
                {i + 1}
              </div>
            );
          })}
        </div>
        <div style={{ marginTop: 14, maxWidth: 700, fontWeight: 700, fontSize: 40, color: colors.white, textShadow: shadow }}>{a.label}</div>
      </div>
    </Wrap>
  );
};

const Vergelijk: React.FC<{ a: Accent; dur: number }> = ({ a, dur }) => {
  const pb = useIn(0.35);
  const pill = (t: string, sub: string, actief: boolean) => (
    <div style={{ textAlign: "center" }}>
      <div style={{ background: actief ? colors.gold : "rgba(248,245,239,0.94)", color: actief ? colors.white : colors.ink, fontWeight: 700, fontSize: 48, borderRadius: 999, padding: "12px 34px" }}>{t}</div>
      <div style={{ marginTop: 8, color: colors.white, fontWeight: 600, fontSize: 30, letterSpacing: 4, textTransform: "uppercase", textShadow: shadow }}>{sub}</div>
    </div>
  );
  return (
    <Wrap dur={dur}>
      <div style={{ fontFamily: FONT, display: "flex", alignItems: "flex-start", gap: 22 }}>
        {pill(a.links, a.linksSub, false)}
        <div style={{ paddingTop: 16, opacity: pb }}>
          <Icon name="pijl" size={56} color={colors.white} />
        </div>
        <div style={{ opacity: pb, transform: `scale(${0.8 + 0.2 * pb})` }}>{pill(a.rechts, a.rechtsSub, true)}</div>
      </div>
    </Wrap>
  );
};

export const Woordmerk: React.FC<{ size?: number }> = ({ size = 1 }) => (
  <div style={{ fontFamily: FONT, color: colors.white, textShadow: "0 2px 10px rgba(0,0,0,0.55)" }}>
    <div style={{ fontWeight: 700, fontSize: 40 * size, letterSpacing: 8 * size, lineHeight: 1 }}>BARACA</div>
    <div style={{ fontWeight: 600, fontSize: 22 * size, letterSpacing: 9.5 * size, marginTop: 6 * size }}>VILLAGE</div>
  </div>
);

const Cta: React.FC<{ a: Accent; dur: number }> = ({ a, dur }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pulse = 1 + 0.035 * Math.sin((frame / fps) * Math.PI * 2 * 0.9);
  const pk = useIn(0.25);
  const bounce = Math.abs(Math.sin((frame / fps) * Math.PI * 1.6)) * 16;
  return (
    <Wrap dur={dur + 1} top={560} center>
      <div style={{ fontFamily: FONT, display: "flex", flexDirection: "column", alignItems: "center", gap: 26 }}>
        <Woordmerk size={1.7} />
        <div style={{ color: colors.white, fontWeight: 500, fontSize: 32, letterSpacing: 3, textTransform: "uppercase", textShadow: shadow }}>Zuid-Lombok · Indonesië</div>
        <div style={{ opacity: pk, transform: `scale(${pulse * (0.85 + 0.15 * pk)})`, marginTop: 20, background: colors.gold, color: colors.white, fontWeight: 600, fontSize: 44, borderRadius: 999, padding: "26px 54px", boxShadow: "0 12px 34px rgba(0,0,0,0.35)" }}>
          {a.knop}
        </div>
        <div style={{ opacity: pk, color: colors.white, fontWeight: 600, fontSize: 34, textShadow: shadow }}>{a.sub}</div>
        <div style={{ opacity: pk, transform: `translateY(${bounce}px)` }}>
          <Icon name="omlaag" size={70} color={colors.white} />
        </div>
      </div>
    </Wrap>
  );
};

export const AccentView: React.FC<{ a: Accent }> = ({ a }) => {
  const dur = a.end - a.start;
  const C = { chip: Chip, stat: Stat, duo: Duo, lijst: Lijst, kamers: Kamers, trend: Trend, fases: Fases, termijnen: Termijnen, vergelijk: Vergelijk, cta: Cta }[a.type];
  return C ? <C a={a} dur={dur} /> : null;
};

export const Kicker: React.FC<{ text: string; note?: string | null; dur: number }> = ({ text, note, dur }) => {
  const frame = useCurrentFrame();
  const bar = interpolate(frame, [2, 14], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  return (
    <Wrap dur={dur + 1}>
      <div style={{ fontFamily: FONT, maxWidth: 900 }}>
        <div style={{ height: 12, width: 160 * bar, background: colors.gold, borderRadius: 6, marginBottom: 18 }} />
        <div style={{ fontWeight: 800, fontSize: 76, lineHeight: 1.08, textTransform: "uppercase", color: colors.white, textShadow: shadow }}>{text}</div>
        {note ? <div style={{ marginTop: 12, fontWeight: 500, fontSize: 30, color: colors.white, textShadow: shadow }}>* {note}</div> : null}
      </div>
    </Wrap>
  );
};
