import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, OffthreadVideo, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import "./fonts";
import { colors, fonts } from "./brand";
import { BODIES, Callout, PAUSE, TAIL } from "./config";
import vo from "./vo.json";

type Word = { t: string; s: number; e: number };
type Zin = { tekst: string; s: number; e: number; words: Word[] };
type Vo = { duur: number; zinnen: Zin[] };
const VO = vo as Record<string, Vo>;

export const hookFrames = (b: number, h: number, fps: number) => Math.ceil((VO[`b${b}h${h}`].duur + PAUSE) * fps);
export const bodyFrames = (b: number, fps: number) => Math.ceil((VO[`body${b}`].duur + TAIL) * fps);

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// Eén continue clip, full-bleed (cover). Geen overgangseffecten: shots wisselen met een harde cut.
const Shot: React.FC<{ foto: number; frames: number }> = ({ foto, frames }) => {
  const { fps } = useVideoConfig();
  const rate = Math.min(1, 7.9 / (frames / fps)); // clips zijn 8 s; langere shots iets vertraagd
  return (
    <AbsoluteFill>
      <OffthreadVideo src={staticFile(`clips/foto${String(foto).padStart(2, "0")}.mp4`)} muted playbackRate={rate}
        style={{ width: "100%", height: "100%", objectFit: "cover" }} />
    </AbsoluteFill>
  );
};

const Shade: React.FC = () => (
  <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(20,21,15,0.45) 0%, rgba(20,21,15,0) 30%, rgba(20,21,15,0) 55%, rgba(20,21,15,0.55) 100%)" }} />
);

const Logo: React.FC = () => (
  <div style={{ position: "absolute", top: 110, right: 64, width: 96, height: 128, background: colors.ink, padding: 8, borderRadius: 4,
    boxShadow: "0 6px 20px rgba(0,0,0,0.35)" }}>
    <Img src={staticFile("logo/business-nomads.png")} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
  </div>
);

// Ondertitels: korte groepjes, gesproken woord in olijf gemarkeerd
const Captions: React.FC<{ words: Word[]; top: number; size?: number }> = ({ words, top, size = 60 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const chunks: Word[][] = [];
  let cur: Word[] = [];
  words.forEach((w) => {
    cur.push(w);
    const len = cur.map((c) => c.t).join(" ").length;
    if (/[.,?!]$/.test(w.t) || cur.length >= 4 || len > 18) { chunks.push(cur); cur = []; }
  });
  if (cur.length) chunks.push(cur);
  const idx = chunks.findIndex((c, i) => t >= c[0].s - 0.05 && (i + 1 >= chunks.length || t < chunks[i + 1][0].s - 0.05));
  const chunk = idx >= 0 ? chunks[idx] : null;
  if (!chunk || t > chunk[chunk.length - 1].e + 0.5) return null;
  const pop = interpolate((t - chunk[0].s) * fps, [0, 4], [0.9, 1], clamp);
  return (
    <div style={{ position: "absolute", top, left: 60, right: 60, display: "flex", flexWrap: "wrap", justifyContent: "center", columnGap: 14, rowGap: 6,
      transform: `scale(${pop})`, fontFamily: fonts.sans, fontWeight: 800, fontSize: size, lineHeight: 1.2, textAlign: "center" }}>
      {chunk.map((w, i) => {
        const active = t >= w.s - 0.03 && t < (chunk[i + 1]?.s ?? w.e + 0.5);
        return (
          <span key={i} style={{ color: colors.white, background: active ? colors.olive : "transparent", padding: "0 12px", borderRadius: 6,
            textShadow: active ? "none" : "0 3px 14px rgba(0,0,0,0.8), 0 1px 3px rgba(0,0,0,0.9)" }}>{w.t}</span>
        );
      })}
    </div>
  );
};

// Feitelijk accent per zin (max. ~15% van het beeld), schuift in binnen het shot; geen scène-overgang
const CalloutCard: React.FC<{ c: Callout; frames: number }> = ({ c, frames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const inn = spring({ frame: frame - 4, fps, config: { damping: 16, stiffness: 140 } });
  const out = interpolate(frame, [frames - 8, frames - 1], [1, 0], clamp);
  const bar = interpolate(frame, [6, 22], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  if (c.kind === "cta") return null;
  const box: React.CSSProperties = { position: "absolute", top: 300, left: 60, maxWidth: 820, opacity: out,
    transform: `translateX(${(1 - inn) * -120}px)`, fontFamily: fonts.sans };
  return (
    <div style={box}>
      {c.kicker && (
        <div style={{ display: "inline-block", background: colors.cream, color: colors.ink, fontWeight: 600, fontSize: 32, letterSpacing: 1,
          padding: "8px 18px", textTransform: "uppercase", borderRadius: 4 }}>{c.kicker}</div>
      )}
      {c.kind === "stat" && (
        <div style={{ marginTop: 12, color: colors.white, fontWeight: 800, fontSize: c.big.length > 18 ? 62 : 84, lineHeight: 1.05, textTransform: "uppercase",
          textShadow: "0 4px 18px rgba(0,0,0,0.6)" }}>{c.big}</div>
      )}
      {c.kind === "chips" && (
        <div style={{ marginTop: 14, display: "flex", flexWrap: "wrap", gap: 12 }}>
          {c.chips.map((ch, i) => {
            const s = spring({ frame: frame - 8 - i * 5, fps, config: { damping: 14, stiffness: 160 } });
            return (
              <div key={i} style={{ background: colors.olive, color: colors.white, fontWeight: 700, fontSize: 44, padding: "10px 24px", borderRadius: 6,
                transform: `scale(${s})`, boxShadow: "0 6px 18px rgba(0,0,0,0.3)" }}>{ch}</div>
            );
          })}
        </div>
      )}
      <div style={{ marginTop: 14, height: 8, width: 240 * bar, background: colors.olive, borderRadius: 4 }} />
      {c.sub && (
        <div style={{ marginTop: 12, color: colors.white, fontWeight: 600, fontSize: 38, textShadow: "0 3px 12px rgba(0,0,0,0.7)" }}>{c.sub}</div>
      )}
    </div>
  );
};

const CtaCard: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const inn = spring({ frame, fps, config: { damping: 15, stiffness: 120 } });
  const bob = Math.sin(frame / 6) * 8;
  return (
    <div style={{ position: "absolute", left: 90, right: 90, top: 1450, display: "flex", flexDirection: "column", alignItems: "center", gap: 18,
      transform: `translateY(${(1 - inn) * 80}px)`, opacity: inn, fontFamily: fonts.sans }}>
      <div style={{ background: colors.olive, color: colors.white, fontWeight: 700, fontSize: 50, padding: "22px 48px", borderRadius: 10,
        boxShadow: "0 10px 30px rgba(0,0,0,0.35)" }}>Plan een afspraak in</div>
      <div style={{ background: colors.white, color: colors.ink, fontWeight: 600, fontSize: 34, padding: "12px 30px", borderRadius: 10 }}>
        Business Nomads · Elbe 23 · Den Haag
      </div>
      <svg width="64" height="64" viewBox="0 0 24 24" style={{ transform: `translateY(${bob}px)` }}>
        <path d="M12 4v14M5 12l7 7 7-7" stroke={colors.white} strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
};

// HOOK: één shot, label + hookvraag als grote ondertitel
export const HookVideo: React.FC<{ body: number; hook: number }> = ({ body, hook }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const z = VO[`b${body}h${hook}`].zinnen[0];
  const tag = spring({ frame: frame - 3, fps, config: { damping: 15 } });
  return (
    <AbsoluteFill style={{ backgroundColor: colors.ink }}>
      <Shot foto={BODIES[body].hookClips[hook - 1]} frames={durationInFrames} />
      <Shade />
      <div style={{ position: "absolute", top: 300, left: 60, display: "flex", gap: 14, alignItems: "center", fontFamily: fonts.sans,
        transform: `translateX(${(1 - tag) * -100}px)`, opacity: tag }}>
        <div style={{ background: colors.green, color: colors.white, fontWeight: 700, fontSize: 30, padding: "8px 16px", letterSpacing: 1.5 }}>NU IN VERKOOP</div>
        <div style={{ color: colors.white, fontWeight: 600, fontSize: 34, textShadow: "0 3px 12px rgba(0,0,0,0.7)" }}>Forepark · Den Haag</div>
      </div>
      <Logo />
      <Captions words={z.words} top={1180} size={70} />
    </AbsoluteFill>
  );
};

// BODY: shots per zin met harde cuts, accent per zin, ondertitels, CTA
export const BodyVideo: React.FC<{ body: number }> = ({ body }) => {
  const { fps, durationInFrames } = useVideoConfig();
  const cfg = BODIES[body];
  const zinnen = VO[`body${body}`].zinnen;
  const F = (s: number) => Math.round(s * fps);
  const starts = zinnen.map((z, i) => (i === 0 ? 0 : F(z.s) - 2));
  const ends = starts.map((s, i) => (i + 1 < starts.length ? starts[i + 1] : durationInFrames));
  const shots: { foto: number; from: number; len: number }[] = [];
  zinnen.forEach((_, i) => {
    const list = cfg.shots[i];
    const len = ends[i] - starts[i];
    if (list.length > 1 && len > 7.4 * fps) {
      const half = Math.round(len / 2);
      shots.push({ foto: list[0], from: starts[i], len: half }, { foto: list[1], from: starts[i] + half, len: len - half });
    } else shots.push({ foto: list[0], from: starts[i], len });
  });
  const ctaIdx = cfg.callouts.findIndex((c) => c.kind === "cta");
  const allWords = zinnen.flatMap((z) => z.words);
  return (
    <AbsoluteFill style={{ backgroundColor: colors.ink }}>
      {shots.map((s, i) => (
        <Sequence key={i} from={s.from} durationInFrames={s.len}><Shot foto={s.foto} frames={s.len} /></Sequence>
      ))}
      <Shade />
      {cfg.callouts.map((c, i) => (
        <Sequence key={`c${i}`} from={starts[i]} durationInFrames={ends[i] - starts[i]}><CalloutCard c={c} frames={ends[i] - starts[i]} /></Sequence>
      ))}
      <Logo />
      <Captions words={allWords} top={ctaIdx >= 0 ? 1180 : 1300} />
      <Sequence from={starts[ctaIdx]}><CtaCard /></Sequence>
    </AbsoluteFill>
  );
};
