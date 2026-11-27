import React from "react";
import { AbsoluteFill, Easing, interpolate, OffthreadVideo, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { colors, FONT } from "./brand";
import { Accent, CLIP_OFFSET } from "./config";
import { Icon } from "./icons";

export type Word = { t: string; s: number; e: number };

// Volledig beeldvullende clip (cover), harde knip: geen overgang, geen flits, geen zoom-in bij de knip
export const Clip: React.FC<{ name: string; seconds: number }> = ({ name, seconds }) => {
  const avail = 8 - CLIP_OFFSET - 0.05;
  const rate = seconds > avail ? Math.max(0.8, avail / seconds) : 1;
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ background: colors.ink }}>
      <OffthreadVideo
        src={staticFile(`clips/${name}.mp4`)}
        muted
        startFrom={Math.round(CLIP_OFFSET * fps)}
        playbackRate={rate}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
    </AbsoluteFill>
  );
};

// Zachte verlopen boven en onder voor leesbaarheid van logo en ondertitels (geen kader)
export const Shade: React.FC = () => (
  <AbsoluteFill
    style={{
      background:
        "linear-gradient(180deg, rgba(27,34,31,0.55) 0%, rgba(27,34,31,0) 16%, rgba(27,34,31,0) 55%, rgba(27,34,31,0.55) 82%, rgba(27,34,31,0.7) 100%)",
    }}
  />
);

// Woordmerk zoals op de site: "Pattistpark II" met daaronder TERNEUZEN in taupe
export const Logo: React.FC<{ scale?: number; dark?: boolean }> = ({ scale = 1, dark }) => (
  <div style={{ fontFamily: FONT, textAlign: "center", lineHeight: 1, color: dark ? colors.ink : colors.white }}>
    <div style={{ fontSize: 46 * scale, fontWeight: 600, letterSpacing: -0.5 * scale, textShadow: dark ? "none" : "0 2px 14px rgba(0,0,0,0.45)" }}>
      Pattistpark II
    </div>
    <div style={{ fontSize: 17 * scale, fontWeight: 500, letterSpacing: 6 * scale, marginTop: 8 * scale, color: dark ? colors.taupeDark : colors.taupeLight, textShadow: dark ? "none" : "0 2px 10px rgba(0,0,0,0.5)" }}>
      TERNEUZEN
    </div>
  </div>
);

export const TopLogo: React.FC = () => (
  <AbsoluteFill style={{ alignItems: "center", paddingTop: 92 }}>
    <Logo scale={1.05} />
  </AbsoluteFill>
);

// Ondertitels per woordgroep; het gesproken woord krijgt een taupe markering
const groups = (words: Word[]) => {
  const out: Word[][] = [];
  let cur: Word[] = [];
  let len = 0;
  words.forEach((w, i) => {
    cur.push(w);
    len += w.t.length + 1;
    const next = words[i + 1];
    const pause = next ? next.s - w.e > 0.25 : true;
    if (!next || len > 16 || /[.,?!:;]$/.test(w.t) || pause || cur.length >= 4) {
      out.push(cur);
      cur = [];
      len = 0;
    }
  });
  return out;
};

export const Captions: React.FC<{ words: Word[]; top?: number }> = ({ words, top = 1330 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const gs = groups(words);
  const idx = gs.findIndex((g, i) => t >= g[0].s - 0.05 && (i + 1 < gs.length ? t < gs[i + 1][0].s - 0.05 : t < g[g.length - 1].e + 0.6));
  if (idx < 0) return null;
  const g = gs[idx];
  const pop = interpolate(t - (g[0].s - 0.05), [0, 0.12], [0.9, 1], { extrapolateRight: "clamp", easing: Easing.out(Easing.back(2)) });
  return (
    <AbsoluteFill style={{ top, height: 260, alignItems: "center", justifyContent: "flex-start", padding: "0 70px" }}>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "6px 14px", transform: `scale(${pop})` }}>
        {g.map((w, i) => {
          const active = t >= w.s - 0.02 && t < (g[i + 1]?.s ?? w.e + 0.6);
          return (
            <span
              key={i}
              style={{
                fontFamily: FONT,
                fontWeight: 700,
                fontSize: 70,
                lineHeight: 1.2,
                color: colors.white,
                padding: "0 12px",
                borderRadius: 12,
                background: active ? colors.taupe : "transparent",
                textShadow: active ? "none" : "0 3px 16px rgba(0,0,0,0.75), 0 0 3px rgba(0,0,0,0.6)",
              }}
            >
              {w.t}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

const useIn = (delay = 0) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - delay, fps, config: { damping: 16, stiffness: 140 } });
};

// Uitfaden van een accent tegen het einde van de zin (het beeld zelf knipt hard)
const useOut = (dur: number) => {
  const frame = useCurrentFrame();
  return interpolate(frame, [dur - 9, dur - 2], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
};

const Chip: React.FC<{ icon: string; text: string; delay: number }> = ({ icon, text, delay }) => {
  const p = useIn(delay);
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 18,
        background: "rgba(248,246,241,0.94)",
        color: colors.ink,
        borderRadius: 18,
        padding: "16px 28px 16px 18px",
        boxShadow: "0 10px 30px rgba(0,0,0,0.22)",
        transform: `translateX(${(1 - p) * -60}px)`,
        opacity: p,
        fontFamily: FONT,
        fontWeight: 600,
        fontSize: 40,
      }}
    >
      <div style={{ width: 62, height: 62, borderRadius: 14, background: colors.taupe, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icon name={icon} size={40} color={colors.white} stroke={2} />
      </div>
      {text}
    </div>
  );
};

export const AccentView: React.FC<{ accent: Accent; dur: number }> = ({ accent, dur }) => {
  const out = useOut(dur);
  const p = useIn(4);
  if (accent.kind === "chips") {
    return (
      <AbsoluteFill style={{ top: 300, left: 64, alignItems: "flex-start", opacity: out }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 18, alignItems: "flex-start" }}>
          {accent.items.map((it, i) => (
            <Chip key={i} icon={it.icon} text={it.text} delay={4 + i * 9} />
          ))}
        </div>
      </AbsoluteFill>
    );
  }
  if (accent.kind === "stat") {
    return (
      <AbsoluteFill style={{ top: 300, left: 64, opacity: out }}>
        <div style={{ display: "flex", alignItems: "center", gap: 26, transform: `translateY(${(1 - p) * 40}px)`, opacity: p, background: "rgba(27,34,31,0.55)", borderRadius: 26, padding: "22px 34px 22px 30px" }}>
          <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 170, lineHeight: 0.9, color: colors.white, textShadow: "0 6px 30px rgba(0,0,0,0.45)" }}>
            {accent.big}
          </div>
          <div style={{ width: 6, alignSelf: "stretch", background: colors.taupe, borderRadius: 3, transform: `scaleY(${p})` }} />
          <div style={{ fontFamily: FONT, fontWeight: 600, fontSize: 46, lineHeight: 1.15, color: colors.white, maxWidth: 500, textShadow: "0 3px 16px rgba(0,0,0,0.6)" }}>
            {accent.label}
          </div>
        </div>
      </AbsoluteFill>
    );
  }
  if (accent.kind === "price") {
    return (
      <AbsoluteFill style={{ top: 300, left: 64, opacity: out }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16, alignItems: "flex-start" }}>
          <div
            style={{
              background: colors.taupe,
              color: colors.white,
              fontFamily: FONT,
              fontWeight: 700,
              fontSize: 72,
              padding: "14px 34px",
              borderRadius: 20,
              boxShadow: "0 12px 34px rgba(0,0,0,0.25)",
              transform: `scale(${0.85 + 0.15 * p})`,
              transformOrigin: "left center",
              opacity: p,
            }}
          >
            {accent.lines[0]}
          </div>
          {accent.lines.slice(1).map((l, i) => (
            <Chip key={l} icon={l.includes("Oplevering") ? "calendar" : "house"} text={l} delay={14 + i * 8} />
          ))}
        </div>
      </AbsoluteFill>
    );
  }
  return <CtaCard />;
};

// Eindkaart: logo + knop + pijl naar beneden (blijft staan tot het einde)
const CtaCard: React.FC = () => {
  const frame = useCurrentFrame();
  const p = useIn(3);
  const bounce = Math.sin(frame / 5) * 10;
  return (
    <AbsoluteFill style={{ alignItems: "center", top: 330 }}>
      <div
        style={{
          background: "rgba(248,246,241,0.95)",
          borderRadius: 28,
          padding: "44px 60px 40px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 28,
          boxShadow: "0 18px 50px rgba(0,0,0,0.3)",
          transform: `translateY(${(1 - p) * 50}px)`,
          opacity: p,
        }}
      >
        <Logo scale={1.25} dark />
        <div style={{ width: 120, height: 4, background: colors.taupe, borderRadius: 2 }} />
        <div style={{ fontFamily: FONT, fontWeight: 500, fontSize: 36, color: colors.ink, textAlign: "center" }}>
          Plan een afspraak met onze makelaar
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            background: colors.taupe,
            color: colors.white,
            fontFamily: FONT,
            fontWeight: 700,
            fontSize: 40,
            padding: "18px 36px",
            borderRadius: 999,
          }}
        >
          Klik hieronder
          <span style={{ display: "inline-block", transform: `translateY(${bounce}px)` }}>
            <Icon name="arrowDown" size={40} color={colors.white} stroke={2.6} />
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
