import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { colors, fonts } from "./brand";
import { Card, Line, Spec, Stat } from "./config";
import { Scene, useEase, usePop, wordTime } from "./ui";

const fmt = (n: number) => Math.round(n).toLocaleString("nl-NL");

// Rode balk die zich uittekent, in de stijl van de dakhoek uit het logo
const Bar: React.FC<{ at: number; width: number }> = ({ at, width }) => {
  const p = useEase(at, 0.45);
  return <div style={{ height: 10, width: width * p, background: colors.red, marginBottom: 14 }} />;
};

const StatCard: React.FC<{ s: Stat; scene: Scene; big: boolean }> = ({ s, scene, big }) => {
  const at = wordTime(scene, s.at);
  const pop = usePop(at);
  const count = useEase(at, 0.9);
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const flash = interpolate(frame - at * fps, [0, 6], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const value = s.text ?? `${s.prefix ?? ""}${fmt((s.to ?? 0) * count)}${s.suffix ?? ""}`;
  const size = big ? 190 : 150;
  return (
    <div
      style={{
        width: 900,
        padding: "34px 44px 38px",
        background: `rgba(20,20,20,${0.86 - flash * 0.3})`,
        borderLeft: `14px solid ${colors.red}`,
        transform: `translateX(${(1 - pop) * -900}px) scale(${1 + flash * 0.03})`,
        opacity: Math.min(1, pop * 3),
        boxShadow: "0 18px 50px rgba(0,0,0,0.45)",
      }}
    >
      <div style={{ fontFamily: fonts.head, fontWeight: 900, fontSize: size, lineHeight: 1, color: colors.white, letterSpacing: -2, whiteSpace: "nowrap" }}>
        {s.text ? value : `${s.prefix ?? ""}${fmt((s.to ?? 0) * count)}${s.suffix ?? ""}`}
      </div>
      <div style={{ fontFamily: fonts.sans, fontWeight: 700, fontSize: 46, color: "#e8e8e8", marginTop: 10, textTransform: "uppercase", letterSpacing: 3 }}>{s.label}</div>
    </div>
  );
};

const toneColor = (t?: string) => (t === "red" ? colors.white : t === "ghost" ? "rgba(255,255,255,0.78)" : colors.white);

const BigLine: React.FC<{ l: Line; scene: Scene; size: number }> = ({ l, scene, size }) => {
  const at = wordTime(scene, l.at);
  const pop = usePop(at, { damping: 13, stiffness: 190, mass: 0.7 });
  const red = l.tone === "red";
  return (
    <div style={{ overflow: "hidden", marginBottom: 10 }}>
      <div
        style={{
          display: "inline-block",
          fontFamily: fonts.head,
          fontWeight: 900,
          fontSize: size,
          lineHeight: 1.05,
          color: toneColor(l.tone),
          background: red ? colors.red : "transparent",
          padding: red ? "6px 26px 10px" : "0 4px",
          textShadow: red ? "none" : "0 6px 26px rgba(0,0,0,0.7)",
          transform: `translateY(${(1 - pop) * 140}px) scale(${0.9 + pop * 0.1})`,
          transformOrigin: "left center",
          opacity: Math.min(1, pop * 2.5),
        }}
      >
        {l.text}
      </div>
    </div>
  );
};

const Chip: React.FC<{ text: string; at: number }> = ({ text, at }) => {
  const pop = usePop(at);
  return (
    <div
      style={{
        marginTop: 34,
        alignSelf: "flex-start",
        fontFamily: fonts.sans,
        fontWeight: 800,
        fontSize: 46,
        color: colors.white,
        background: colors.red,
        padding: "14px 30px",
        letterSpacing: 2,
        transform: `scale(${pop})`,
        transformOrigin: "left center",
      }}
    >
      {text}
    </div>
  );
};

const CardBox: React.FC<{ c: Card; scene: Scene; i: number }> = ({ c, scene, i }) => {
  const at = wordTime(scene, c.at);
  const pop = usePop(at);
  return (
    <div
      style={{
        width: 900,
        padding: "34px 44px",
        background: i % 2 ? colors.red : "rgba(20,20,20,0.88)",
        transform: `translateX(${(1 - pop) * (i % 2 ? 900 : -900)}px)`,
        boxShadow: "0 18px 50px rgba(0,0,0,0.45)",
      }}
    >
      <div style={{ fontFamily: fonts.head, fontWeight: 900, fontSize: 118, lineHeight: 1, color: colors.white }}>{c.title}</div>
      {c.sub && <div style={{ fontFamily: fonts.sans, fontWeight: 700, fontSize: 46, color: "#f0f0f0", marginTop: 10 }}>{c.sub}</div>}
    </div>
  );
};

const Blocks: React.FC<{ done: number; total: number; scene: Scene; at: string }> = ({ done, total, scene, at }) => {
  const t0 = wordTime(scene, at);
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const headPop = usePop(t0);
  const filled = Math.min(done, Math.max(0, Math.floor((frame - t0 * fps) / 4)));
  return (
    <div style={{ width: 900 }}>
      <div style={{ fontFamily: fonts.head, fontWeight: 900, fontSize: 210, lineHeight: 1, color: colors.white, transform: `scale(${headPop})`, transformOrigin: "left center", textShadow: "0 8px 30px rgba(0,0,0,0.6)" }}>
        {Math.max(0, filled)} <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 120 }}>/ {total}</span>
      </div>
      <div style={{ fontFamily: fonts.sans, fontWeight: 800, fontSize: 56, color: colors.white, letterSpacing: 4, margin: "6px 0 28px", textShadow: "0 3px 14px rgba(0,0,0,0.7)" }}>UNITS VERKOCHT</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 14 }}>
        {Array.from({ length: total }, (_, k) => {
          const on = k < filled;
          return <div key={k} style={{ height: 120, background: on ? colors.red : "rgba(255,255,255,0.18)", border: `3px solid ${on ? colors.redLight : "rgba(255,255,255,0.4)"}`, transform: `scale(${on && k === filled - 1 ? 1.12 : 1})` }} />;
        })}
      </div>
    </div>
  );
};

export const Graphic: React.FC<{ spec: Spec; scene: Scene }> = ({ spec, scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const out = interpolate(frame, [(scene.end + 0.35) * fps - 0, (scene.end + 0.35) * fps + 8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.in(Easing.cubic) });
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", paddingTop: 260, paddingBottom: 300, opacity: 1 - out }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 26, width: 900 }}>
        {spec.kind === "stat" && spec.stats!.map((s, i) => <StatCard key={i} s={s} scene={scene} big={spec.stats!.length === 1} />)}
        {spec.kind === "big" && (
          <div>
            <Bar at={scene.start} width={300} />
            {spec.lines!.map((l, i) => (
              <BigLine key={i} l={l} scene={scene} size={l.text.length > 16 ? 76 : l.text.length > 10 ? 96 : l.text.length > 7 ? 118 : 150} />
            ))}
          </div>
        )}
        {spec.kind === "split" && spec.cards!.map((c, i) => <CardBox key={i} c={c} scene={scene} i={i} />)}
        {spec.kind === "blocks" && <Blocks {...spec.blocks!} scene={scene} />}
        {spec.chip && <Chip text={spec.chip.text} at={wordTime(scene, spec.chip.at)} />}
      </div>
    </AbsoluteFill>
  );
};
