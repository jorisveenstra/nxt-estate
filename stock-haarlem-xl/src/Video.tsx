import React from "react";
import {
  AbsoluteFill,
  Audio,
  Easing,
  Img,
  interpolate,
  OffthreadVideo,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { colors, FONT, FPS } from "./brand";
import { Accent, BODY, CLIP_SECONDS, HOOK_CLIPS } from "./config";
import timing from "./timing.json";

type Word = { t: string; s: number; e: number };
const T = timing as {
  hooks: Record<string, { duration: number; words: Word[] }>;
  bodies: Record<string, { duration: number; sentences: { start: number; end: number; words: Word[] }[] }>;
};

export const hookFrames = (b: number, h: number) => Math.round(T.hooks[`${b}-${h}`].duration * FPS);
export const bodyFrames = (b: number) => Math.round(T.bodies[String(b)].duration * FPS);

const shadow = "0 4px 18px rgba(0,0,0,0.45)";

// ---------- beeld: altijd full-bleed, alleen harde knippen ----------
const Footage: React.FC<{ clip: string; frames: number }> = ({ clip, frames }) => {
  const rate = Math.min(1, (CLIP_SECONDS - 0.15) / (frames / FPS));
  return (
    <AbsoluteFill>
      <OffthreadVideo src={staticFile(`clips/${clip}.mp4`)} muted playbackRate={rate} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      {/* lichte verloop boven en onder voor leesbaarheid; beeld blijft volledig zichtbaar */}
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(17,35,55,0.45) 0%, rgba(17,35,55,0) 22%, rgba(17,35,55,0) 60%, rgba(17,35,55,0.55) 100%)" }} />
    </AbsoluteFill>
  );
};

const Logo: React.FC = () => (
  <Img src={staticFile("logo/stock-wit.png")} style={{ position: "absolute", top: 70, left: 64, width: 210, filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.5))" }} />
);

// ---------- ondertitels per woord ----------
const Captions: React.FC<{ words: Word[]; big?: boolean }> = ({ words, big }) => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const chunks: Word[][] = [];
  let cur: Word[] = [];
  words.forEach((w) => {
    cur.push(w);
    const len = cur.map((c) => c.t).join(" ").length;
    if (/[.,?!]$/.test(w.t) || cur.length >= 4 || len > 22) {
      chunks.push(cur);
      cur = [];
    }
  });
  if (cur.length) chunks.push(cur);
  const idx = chunks.findIndex((c, i) => t >= c[0].s - 0.05 && (i + 1 >= chunks.length || t < chunks[i + 1][0].s - 0.05));
  const chunk = idx >= 0 ? chunks[idx] : null;
  if (!chunk || t > chunk[chunk.length - 1].e + 0.5) return null;
  const since = (t - chunk[0].s) * FPS;
  const pop = interpolate(since, [0, 4], [0.9, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ justifyContent: "flex-start", alignItems: "center", paddingTop: big ? 1180 : 1330 }}>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", columnGap: 16, maxWidth: 960, transform: `scale(${pop})`, fontFamily: FONT, fontWeight: 800, fontSize: big ? 68 : 60, lineHeight: 1.18, textAlign: "center" }}>
        {chunk.map((w, i) => {
          const active = t >= w.s - 0.03 && t < (chunk[i + 1]?.s ?? w.e + 0.5);
          return (
            <span key={i} style={{ color: active ? colors.teal : colors.white, textShadow: "0 3px 14px rgba(0,0,0,0.85), 0 0 3px rgba(0,0,0,0.9)" }}>
              {w.t}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ---------- accenten ----------
const useIn = (delay: number) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - delay, fps, config: { damping: 16, stiffness: 140 } });
};

const Chip: React.FC<{ text: string; delay: number; strong?: boolean }> = ({ text, delay, strong }) => {
  const p = useIn(delay);
  return (
    <div style={{ opacity: p, transform: `translateX(${(1 - p) * -60}px)`, display: "flex", alignItems: "center", gap: 16, background: strong ? colors.teal : "rgba(17,35,55,0.82)", borderRadius: 14, padding: "16px 28px", boxShadow: shadow, alignSelf: "flex-start" }}>
      {!strong && <div style={{ width: 12, height: 12, borderRadius: 6, background: colors.teal }} />}
      <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 40, color: colors.white }}>{text}</span>
    </div>
  );
};

const Floors: React.FC<{ level: number | "all"; label: string; sub?: string }> = ({ level, label, sub }) => {
  const frame = useCurrentFrame();
  const p = useIn(0);
  const names = ["Bedrijfsruimte", "Kantoor", "Dakterras"];
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 24, opacity: p, transform: `translateY(${(1 - p) * 40}px)` }}>
      <div style={{ display: "flex", flexDirection: "column-reverse", gap: 8, background: "rgba(17,35,55,0.82)", padding: 16, borderRadius: 16, boxShadow: shadow }}>
        {[0, 1, 2].map((l) => {
          const on = level === "all" ? useInStatic(frame, 6 + l * 6) : l === level ? 1 : 0;
          return (
            <div key={l} style={{ width: 200, height: 54, borderRadius: 8, background: on ? colors.teal : "rgba(255,255,255,0.14)", opacity: level === "all" ? 0.35 + 0.65 * on : 1, display: "flex", alignItems: "center", paddingLeft: 14, fontFamily: FONT, fontWeight: 700, fontSize: 22, color: colors.white, transform: l === level ? `scale(${1 + 0.05 * Math.sin(frame / 6)})` : undefined }}>
              {names[l]}
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, paddingBottom: 6 }}>
        <span style={{ fontFamily: FONT, fontWeight: 800, fontSize: 50, color: colors.white, textShadow: shadow }}>{label}</span>
        {sub && <span style={{ fontFamily: FONT, fontWeight: 600, fontSize: 32, color: colors.white, textShadow: shadow, opacity: useInStatic(frame, 10) }}>{sub}</span>}
      </div>
    </div>
  );
};

const useInStatic = (frame: number, delay: number) => interpolate(frame, [delay, delay + 8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

const Badges: React.FC<{ items: string[] }> = ({ items }) => (
  <div style={{ display: "flex", flexWrap: "wrap", gap: 14, maxWidth: 900 }}>
    {items.map((t, i) => (
      <Chip key={t} text={t} delay={i * 7} strong={/A\+\+\+/.test(t)} />
    ))}
  </div>
);

const Pin: React.FC<{ title: string; sub: string }> = ({ title, sub }) => {
  const frame = useCurrentFrame();
  const p = useIn(0);
  const bob = Math.sin(frame / 7) * 6;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 22, opacity: p, transform: `scale(${0.8 + 0.2 * p})`, transformOrigin: "left center" }}>
      <svg width="86" height="110" viewBox="0 0 24 31" style={{ transform: `translateY(${bob}px)`, filter: "drop-shadow(0 4px 10px rgba(0,0,0,0.5))" }}>
        <path d="M12 0C5.4 0 0 5.2 0 11.7 0 20.4 12 31 12 31s12-10.6 12-19.3C24 5.2 18.6 0 12 0z" fill={colors.teal} />
        <circle cx="12" cy="11.5" r="4.6" fill={colors.white} />
      </svg>
      <div style={{ background: "rgba(17,35,55,0.82)", borderRadius: 16, padding: "18px 28px", boxShadow: shadow }}>
        <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 46, color: colors.white }}>{title}</div>
        <div style={{ fontFamily: FONT, fontWeight: 600, fontSize: 30, color: colors.teal }}>{sub}</div>
      </div>
    </div>
  );
};

const Stat: React.FC<{ pre: string; value: string; post: string }> = ({ pre, value, post }) => {
  const p = useIn(0);
  return (
    <div style={{ opacity: p, transform: `translateY(${(1 - p) * 30}px)`, alignSelf: "flex-start", background: "rgba(17,35,55,0.82)", borderLeft: `10px solid ${colors.teal}`, borderRadius: 14, padding: "14px 30px", boxShadow: shadow }}>
      <div style={{ fontFamily: FONT, fontWeight: 600, fontSize: 30, color: colors.teal }}>{pre}</div>
      <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 92, color: colors.white, lineHeight: 1 }}>{value}</div>
      <div style={{ fontFamily: FONT, fontWeight: 600, fontSize: 30, color: colors.white }}>{post}</div>
    </div>
  );
};

const AccentView: React.FC<{ a: Accent; idx: number }> = ({ a, idx }) => {
  const delay = idx * 12;
  return (
    <Sequence from={delay} layout="none">
      {a.kind === "chips" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {a.items.map((t, i) => <Chip key={t} text={t} delay={i * 8} strong={i === 0} />)}
        </div>
      )}
      {a.kind === "floors" && <Floors level={a.level} label={a.label} sub={a.sub} />}
      {a.kind === "badges" && <Badges items={a.items} />}
      {a.kind === "pin" && <Pin title={a.title} sub={a.sub} />}
      {a.kind === "stat" && <Stat pre={a.pre} value={a.value} post={a.post} />}
    </Sequence>
  );
};

const Accents: React.FC<{ accents: Accent[] }> = ({ accents }) => (
  <AbsoluteFill style={{ padding: "250px 64px 0", display: "flex", flexDirection: "column", gap: 26 }}>
    {accents.map((a, i) => <AccentView key={i} a={a} idx={i} />)}
  </AbsoluteFill>
);

const Cta: React.FC<{ label: string }> = ({ label }) => {
  const frame = useCurrentFrame();
  const p = useIn(0);
  const pulse = 1 + 0.03 * Math.sin(frame / 5);
  return (
    <AbsoluteFill style={{ justifyContent: "flex-start", alignItems: "center", paddingTop: 300 }}>
      <div style={{ opacity: p, transform: `translateY(${(1 - p) * 50}px)`, width: 880, background: "rgba(17,35,55,0.9)", borderRadius: 24, padding: "44px 40px", display: "flex", flexDirection: "column", alignItems: "center", gap: 22, boxShadow: shadow }}>
        <Img src={staticFile("logo/stock-wit.png")} style={{ width: 300 }} />
        <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 52, color: colors.white }}>Haarlem XL</div>
        <div style={{ fontFamily: FONT, fontWeight: 600, fontSize: 30, color: colors.teal }}>Oudeweg · N200 · oplevering Q3 2026</div>
        <div style={{ marginTop: 10, background: colors.teal, borderRadius: 999, padding: "22px 48px", transform: `scale(${pulse})`, fontFamily: FONT, fontWeight: 800, fontSize: 42, color: colors.white }}>
          {label} ↓
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------- composities ----------
export type HookProps = { body: number; hook: number };
export type BodyProps = { body: number };

export const Hook: React.FC<HookProps> = ({ body, hook }) => {
  const frames = hookFrames(body, hook);
  const tag = BODY[String(body)].tag;
  return (
    <AbsoluteFill style={{ background: colors.navy }}>
      <Footage clip={HOOK_CLIPS[String(body)][hook - 1]} frames={frames} />
      <Logo />
      <AbsoluteFill style={{ padding: "250px 64px 0", display: "flex", flexDirection: "column", gap: 16 }}>
        <Chip text={tag} delay={2} strong />
        <Chip text="Nieuwbouw in Haarlem" delay={10} />
      </AbsoluteFill>
      <Captions words={T.hooks[`${body}-${hook}`].words} big />
    </AbsoluteFill>
  );
};

export const Body: React.FC<BodyProps> = ({ body }) => {
  const b = T.bodies[String(body)];
  const cfg = BODY[String(body)];
  const total = bodyFrames(body);
  const starts = b.sentences.map((s, i) => (i === 0 ? 0 : Math.round(s.start * FPS) - 3));
  const last = b.sentences.length - 1;
  return (
    <AbsoluteFill style={{ background: colors.navy }}>
      {cfg.shots.map((shot, i) => {
        const from = starts[i];
        const to = i < last ? starts[i + 1] : total;
        return (
          <Sequence key={i} from={from} durationInFrames={to - from}>
            <Footage clip={shot.clip} frames={to - from} />
            {i < last && <Accents accents={shot.accents} />}
          </Sequence>
        );
      })}
      <Logo />
      <Sequence from={starts[last]}>
        <Cta label={cfg.cta} />
      </Sequence>
      <Captions words={b.sentences.flatMap((s) => s.words)} />
    </AbsoluteFill>
  );
};

// Volledige video met audio (voor Studio/revisies); de batch-render plakt hook en body met ffmpeg
export const Full: React.FC<HookProps> = ({ body, hook }) => {
  const hf = hookFrames(body, hook);
  return (
    <AbsoluteFill>
      <Sequence durationInFrames={hf}>
        <Hook body={body} hook={hook} />
      </Sequence>
      <Sequence from={hf}>
        <Body body={body} />
      </Sequence>
      <Audio src={staticFile(`vo/b${body}h${hook}.mp3`)} />
      <Sequence from={hf}>
        <Audio src={staticFile(`vo/body${body}.mp3`)} />
      </Sequence>
      <Audio src={staticFile(`music/body${body}.mp3`)} volume={0.12} />
    </AbsoluteFill>
  );
};
