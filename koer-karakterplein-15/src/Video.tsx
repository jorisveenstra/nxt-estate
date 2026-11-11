import React from "react";
import { AbsoluteFill, OffthreadVideo, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import timing from "./timing.json";
import { colors, FONT, FPS } from "./brand";
import { BODY_SHOTS, CALLOUTS, HOOK_SHOTS } from "./config";

type T = { words: [string, number, number][]; end: number; sentenceStart?: number[]; sentenceEnd?: number[] };
const TT = timing as unknown as Record<string, T>;
const PAUZE = 0.35; // stilte na de hook; de hook-beelden blijven staan
const STAART = 0.7; // beeld na het laatste woord van de body

export const segmentFrames = (key: string, isBody: boolean) => Math.ceil((TT[key].end + (isBody ? STAART : PAUZE)) * FPS);

type Shot = { id: string; from: number; to: number };
const MAXSHOT = 7.4;
const buildShots = (starts: number[], total: number, pool: string[]): Shot[] => {
  const shots: Shot[] = [];
  let n = 0;
  starts.forEach((s, i) => {
    const a = i === 0 ? 0 : s;
    const b = i + 1 < starts.length ? starts[i + 1] : total;
    const parts = Math.max(1, Math.ceil((b - a) / MAXSHOT));
    for (let p = 0; p < parts; p++) {
      shots.push({ id: pool[n++ % pool.length], from: a + ((b - a) * p) / parts, to: a + ((b - a) * (p + 1)) / parts });
    }
  });
  return shots;
};

const Pill: React.FC<{ children: React.ReactNode; bg: string; color?: string; style?: React.CSSProperties }> = ({ children, bg, color = colors.white, style }) => (
  <div style={{ background: bg, color, fontFamily: FONT, fontWeight: 800, fontSize: 30, letterSpacing: 1.5, padding: "12px 24px", borderRadius: 999, textTransform: "uppercase", ...style }}>{children}</div>
);

const Subtitles: React.FC<{ words: [string, number, number][]; t: number }> = ({ words, t }) => {
  // Blokken van ~4 woorden, of tot leesteken
  const chunks: number[][] = [];
  let cur: number[] = [];
  words.forEach((w, i) => {
    cur.push(i);
    if (cur.length >= 4 || /[.?!:,]$/.test(w[0])) { chunks.push(cur); cur = []; }
  });
  if (cur.length) chunks.push(cur);
  let ci = chunks.findIndex((c) => t < words[c[c.length - 1]][2] + 0.12);
  if (ci < 0) ci = chunks.length - 1;
  if (t < words[0][1] - 0.05) return null;
  const chunk = chunks[ci];
  return (
    <div style={{ position: "absolute", left: 60, right: 60, top: 1190, display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "6px 18px", fontFamily: FONT, fontWeight: 900, fontSize: 84, lineHeight: 1.08, textAlign: "center", textShadow: "0 4px 18px rgba(0,0,0,.75), 0 0 4px rgba(0,0,0,.6)" }}>
      {chunk.map((i) => {
        const active = t >= words[i][1] && t <= words[i][2] + 0.02;
        return (
          <span key={i} style={{ color: active ? "#ffe08a" : colors.white, transform: `scale(${active ? 1.08 : 1})`, display: "inline-block" }}>{words[i][0]}</span>
        );
      })}
    </div>
  );
};

const Callout: React.FC<{ text: string; from: number }> = ({ text, from }) => {
  const frame = useCurrentFrame();
  const f = frame - from * FPS;
  if (f < 0) return null;
  const s = spring({ frame: f, fps: FPS, config: { damping: 14, stiffness: 140 } });
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 330, display: "flex", justifyContent: "center", transform: `translateY(${(1 - s) * 40}px) scale(${0.85 + 0.15 * s})`, opacity: s }}>
      <Pill bg={colors.terracotta} style={{ fontSize: 42, padding: "18px 38px", boxShadow: "0 8px 30px rgba(0,0,0,.35)" }}>{text}</Pill>
    </div>
  );
};

// Oppervlakte-accent: telt op naar ca. 225 m² met daaronder "veel slaapkamers" (± 7% van het beeld).
const SizeCallout: React.FC = () => {
  const frame = useCurrentFrame();
  const s = spring({ frame, fps: FPS, config: { damping: 14, stiffness: 140 } });
  const n = Math.round(interpolate(frame, [0, 26], [0, 225], { extrapolateRight: "clamp", easing: (x) => 1 - Math.pow(1 - x, 3) }));
  const s2 = spring({ frame: frame - 12, fps: FPS, config: { damping: 14, stiffness: 140 } });
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 300, display: "flex", flexDirection: "column", alignItems: "center", gap: 14, fontFamily: FONT }}>
      <div style={{ transform: `translateY(${(1 - s) * 40}px) scale(${0.85 + 0.15 * s})`, opacity: s, background: colors.terracotta, color: colors.white, borderRadius: 30, padding: "10px 40px", boxShadow: "0 8px 30px rgba(0,0,0,.35)", display: "flex", alignItems: "baseline", gap: 12 }}>
        <span style={{ fontWeight: 700, fontSize: 40 }}>ca.</span>
        <span style={{ fontWeight: 900, fontSize: 96, fontVariantNumeric: "tabular-nums" }}>{n}</span>
        <span style={{ fontWeight: 800, fontSize: 56 }}>m²</span>
      </div>
      <div style={{ transform: `translateY(${(1 - s2) * 30}px)`, opacity: Math.max(0, s2) }}>
        <Pill bg={colors.green} style={{ fontSize: 36, padding: "14px 30px", boxShadow: "0 8px 30px rgba(0,0,0,.3)" }}>Grote woning · veel slaapkamers</Pill>
      </div>
    </div>
  );
};

const CtaCard: React.FC<{ from: number }> = ({ from }) => {
  const frame = useCurrentFrame();
  const f = frame - from * FPS;
  if (f < 0) return null;
  const s = spring({ frame: f, fps: FPS, config: { damping: 16, stiffness: 120 } });
  const pulse = 1 + 0.03 * Math.sin(f / 6);
  return (
    <div style={{ position: "absolute", left: 50, right: 50, bottom: 90, transform: `translateY(${(1 - s) * 200}px)`, opacity: s, textAlign: "center", fontFamily: FONT }}>
      <div style={{ background: colors.green, color: colors.white, borderRadius: 28, padding: "26px 30px", boxShadow: "0 12px 40px rgba(0,0,0,.4)" }}>
        <div style={{ fontWeight: 900, fontSize: 52 }}>Karakterplein 15</div>
        <div style={{ fontWeight: 600, fontSize: 32, opacity: 0.9 }}>Koer · Rotterdam</div>
        <div style={{ fontWeight: 700, fontSize: 32, marginTop: 8, color: colors.sage }}>Ca. 225 m² · veel slaapkamers</div>
        <div style={{ marginTop: 16, transform: `scale(${pulse})`, background: colors.white, color: colors.greenDark, borderRadius: 999, padding: "18px 24px", fontWeight: 900, fontSize: 40 }}>Maak vrijblijvend een kijkafspraak</div>
        <div style={{ fontWeight: 600, fontSize: 30, marginTop: 12, opacity: 0.95 }}>Ervaar de ruimte zelf</div>
      </div>
    </div>
  );
};

export const Segment: React.FC<{ b: number; h: number }> = ({ b, h }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const isBody = h === 0;
  const key = isBody ? `b${b}` : `b${b}h${h}`;
  const tt = TT[key];
  const t = frame / FPS;
  const total = durationInFrames / FPS;
  const shots = isBody ? buildShots(tt.sentenceStart!, total, BODY_SHOTS[b]) : buildShots([0], total, [HOOK_SHOTS[b][h - 1]]);
  const nSent = tt.sentenceStart?.length ?? 0;
  const callouts = isBody ? CALLOUTS[b] : {};
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {/* Harde cuts: elke shot is een eigen Sequence, volledig beeldvullend */}
      {shots.map((s, i) => (
        <Sequence key={i} from={Math.round(s.from * FPS)} durationInFrames={Math.max(1, Math.round((s.to - s.from) * FPS))}>
          <AbsoluteFill>
            <OffthreadVideo src={staticFile(`clips/${s.id}.mp4`)} muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            {/* subtiele donkere gradient voor leesbaarheid */}
            <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(0,0,0,.35) 0%, rgba(0,0,0,0) 22%, rgba(0,0,0,0) 55%, rgba(0,0,0,.55) 100%)" }} />
            <div style={{ position: "absolute", top: 70, right: 50 }}>
              {s.id.startsWith("a-") && <Pill bg="rgba(255,255,255,.92)" color={colors.greenDark} style={{ fontSize: 30 }}>Impressie</Pill>}
            </div>
          </AbsoluteFill>
        </Sequence>
      ))}
      <div style={{ position: "absolute", top: 70, left: 50 }}>
        <Pill bg={colors.green}>Karakterplein 15 · Koer</Pill>
      </div>
      {isBody && Object.entries(callouts).map(([i, txt]) => {
        const si = Number(i);
        const from = tt.sentenceStart![si] + 0.1;
        const to = (tt.sentenceEnd![si] ?? total) + 0.4;
        return (
          <Sequence key={i} from={Math.round(from * FPS)} durationInFrames={Math.max(1, Math.round((to - from) * FPS))}>
            {txt === "M2" ? <SizeCallout /> : <Callout text={txt} from={0} />}
          </Sequence>
        );
      })}
      <Subtitles words={tt.words} t={t} />
      {isBody && nSent > 0 && (
        <Sequence from={Math.round((tt.sentenceStart![nSent - 1] + 0.3) * FPS)}>
          <CtaCard from={0} />
        </Sequence>
      )}
      <div style={{ position: "absolute", left: 0, top: 0, height: 8, width: `${interpolate(frame, [0, durationInFrames], [0, 100])}%`, background: colors.sage }} />
    </AbsoluteFill>
  );
};
