import React from "react";
import { AbsoluteFill, Audio, Easing, Img, interpolate, OffthreadVideo, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { colors, FPS, font } from "./brand";
import { BODIES, Callout, HOOKS } from "./config";
import timing from "./timing.json";

type Word = { t: string; s: number; e: number };
type Scene = { id: string; start: number; end: number; words: Word[] };

export const HOOK_PAUSE = 0.35;
export const TAIL = 2.0;
export const hookFrames = (key: string) => Math.ceil(((timing.hooks as any)[key].end + HOOK_PAUSE) * FPS);
export const bodyFrames = (b: string) => Math.ceil(((timing.bodies as any)[b].end + TAIL) * FPS);

const norm = (w: string) => w.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9+]/g, "");
const clampX = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// ---------- footage: hard cuts, full-bleed, geen overgangen ----------
const Clip: React.FC<{ name: string }> = ({ name }) => (
  <AbsoluteFill style={{ background: colors.ink }}>
    <OffthreadVideo src={staticFile(`clips/${name}.mp4`)} muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />
  </AbsoluteFill>
);

const Shade: React.FC = () => (
  <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(14,14,14,0.45) 0%, rgba(14,14,14,0) 20%, rgba(14,14,14,0) 52%, rgba(14,14,14,0.72) 100%)" }} />
);

// ---------- logo ----------
const Logo: React.FC<{ size?: number }> = ({ size = 128 }) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [0, 12], [0, 1], clampX);
  return (
    <div style={{ position: "absolute", top: 70, left: 54, width: size, height: size, borderRadius: 22, background: colors.white, display: "flex", alignItems: "center", justifyContent: "center", opacity: p, transform: `translateY(${(1 - p) * -20}px)`, boxShadow: "0 8px 28px rgba(0,0,0,0.35)" }}>
      <Img src={staticFile("logo/bn-logo.png")} style={{ width: size * 0.72 }} />
    </div>
  );
};

// ---------- ondertitels: woord voor woord ----------
const chunkWords = (words: Word[], max: number) => {
  const chunks: Word[][] = [];
  let cur: Word[] = [];
  words.forEach((w) => {
    cur.push(w);
    if (/[.,?!]$/.test(w.t) || cur.length >= max || cur.map((c) => c.t).join(" ").length > 22) {
      chunks.push(cur);
      cur = [];
    }
  });
  if (cur.length) chunks.push(cur);
  return chunks;
};

const Captions: React.FC<{ words: Word[]; top: number; size: number; accents?: string[]; offset?: number }> = ({ words, top, size, accents = [], offset = 0 }) => {
  const frame = useCurrentFrame();
  const t = frame / FPS - offset;
  const chunks = chunkWords(words, 4);
  const idx = chunks.findIndex((c, i) => t >= c[0].s - 0.04 && (i + 1 >= chunks.length || t < chunks[i + 1][0].s - 0.04));
  const chunk = idx >= 0 ? chunks[idx] : null;
  if (!chunk || t > chunk[chunk.length - 1].e + 0.7) return null;
  const since = (t - chunk[0].s) * FPS;
  const pop = interpolate(since, [0, 5], [0.9, 1], clampX);
  const acc = accents.map(norm);
  return (
    <AbsoluteFill style={{ alignItems: "center", paddingTop: top }}>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", columnGap: 14, rowGap: 6, maxWidth: 950, transform: `scale(${pop})`, fontFamily: font, fontWeight: 800, fontSize: size, lineHeight: 1.12, textAlign: "center" }}>
        {chunk.map((w, i) => {
          const active = t >= w.s - 0.03 && t < (chunk[i + 1]?.s ?? w.e + 0.7);
          const isAcc = acc.includes(norm(w.t));
          return (
            <span key={i} style={{ color: active ? colors.ink : isAcc ? colors.taupeLight : colors.white, background: active ? colors.taupe : "transparent", padding: "0 14px", borderRadius: 12, textShadow: active ? "none" : "0 3px 16px rgba(0,0,0,0.8), 0 1px 3px rgba(0,0,0,0.9)" }}>
              {w.t}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ---------- callout: korte feitelijke kaart ----------
const CalloutCard: React.FC<{ c: Callout; at: number; out: number }> = ({ c, at, out }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - at, fps, config: { damping: 14, stiffness: 150, mass: 0.8 } });
  const o = interpolate(frame, [out - 8, out], [0, 1], clampX);
  if (frame < at || frame > out) return null;
  return (
    <div style={{ position: "absolute", top: 262, left: 54, display: "flex", alignItems: "stretch", transform: `translateX(${(1 - p) * -520}px)`, opacity: (1 - o) * Math.min(1, p * 2) }}>
      <div style={{ width: 12, background: colors.taupe, borderRadius: "8px 0 0 8px" }} />
      <div style={{ background: "rgba(17,35,55,0.88)", padding: "22px 34px 22px 28px", borderRadius: "0 20px 20px 0", display: "flex", alignItems: "center", gap: 24, fontFamily: font, boxShadow: "0 12px 34px rgba(0,0,0,0.35)" }}>
        {c.big && <div style={{ fontSize: 108, fontWeight: 800, color: colors.taupe, lineHeight: 1, letterSpacing: -2 }}>{c.big}</div>}
        <div>
          <div style={{ fontSize: c.big ? 40 : 46, fontWeight: 800, color: colors.white, lineHeight: 1.1 }}>{c.text}</div>
          {c.sub && <div style={{ fontSize: 33, fontWeight: 500, color: colors.taupeLight, marginTop: 6 }}>{c.sub}</div>}
        </div>
      </div>
    </div>
  );
};

// ---------- hook ----------
export const HookVideo: React.FC<{ hookKey: string }> = ({ hookKey }) => {
  const frame = useCurrentFrame();
  const cfg = HOOKS[hookKey];
  const words: Word[] = (timing.hooks as any)[hookKey].words;
  const p = spring({ frame: frame - 4, fps: FPS, config: { damping: 14, stiffness: 160 } });
  return (
    <AbsoluteFill style={{ background: colors.ink }}>
      <Clip name={cfg.clip} />
      <Shade />
      <Logo />
      <div style={{ position: "absolute", top: 262, left: 54, transform: `translateX(${(1 - p) * -520}px)`, display: "flex" }}>
        <div style={{ width: 12, background: colors.taupe, borderRadius: "8px 0 0 8px" }} />
        <div style={{ background: "rgba(17,35,55,0.88)", color: colors.white, fontFamily: font, fontWeight: 800, fontSize: 40, padding: "20px 34px 20px 28px", borderRadius: "0 20px 20px 0", textTransform: "uppercase", letterSpacing: 2 }}>{cfg.label}</div>
      </div>
      <Captions words={words} top={1130} size={78} accents={cfg.accents} />
      <Audio src={staticFile(`vo/${hookKey}-hook.wav`)} />
    </AbsoluteFill>
  );
};

// ---------- body + CTA ----------
const CtaCard: React.FC<{ at: number }> = ({ at }) => {
  const frame = useCurrentFrame();
  const p = spring({ frame: frame - at, fps: FPS, config: { damping: 15, stiffness: 120 } });
  const btn = spring({ frame: frame - at - 14, fps: FPS, config: { damping: 9, stiffness: 180, mass: 0.7 } });
  const bob = Math.sin((frame - at) / 6) * 10;
  if (frame < at) return null;
  return (
    <AbsoluteFill style={{ alignItems: "center", fontFamily: font }}>
      <div style={{ position: "absolute", top: 220, opacity: p, transform: `translateY(${(1 - p) * 40}px)`, textAlign: "center", color: colors.white, fontWeight: 800, fontSize: 70, lineHeight: 1.1, textShadow: "0 4px 20px rgba(0,0,0,0.7)" }}>
        Business Nomads
        <div style={{ color: colors.taupe, fontSize: 96, marginTop: 4 }}>Elbe 23</div>
        <div style={{ fontSize: 42, fontWeight: 500, color: colors.taupeLight }}>Forepark · Den Haag</div>
      </div>
      <div style={{ position: "absolute", top: 1420, display: "flex", flexDirection: "column", alignItems: "center", gap: 22, transform: `scale(${btn})` }}>
        <div style={{ background: colors.taupe, color: colors.ink, fontWeight: 800, fontSize: 56, padding: "30px 64px", borderRadius: 999, boxShadow: "0 14px 40px rgba(0,0,0,0.45)" }}>Plan een afspraak ↓</div>
        <div style={{ color: colors.white, fontWeight: 700, fontSize: 40, textShadow: "0 3px 14px rgba(0,0,0,0.8)", transform: `translateY(${bob}px)` }}>businessnomads.nl/elbe-23</div>
      </div>
    </AbsoluteFill>
  );
};

export const BodyVideo: React.FC<{ body: string }> = ({ body }) => {
  const frame = useCurrentFrame();
  const total = bodyFrames(body);
  const scenes: Scene[] = (timing.bodies as any)[body].scenes;
  const cfgs = BODIES[body];
  const F = (s: number) => Math.round(s * FPS);
  const cta = scenes[scenes.length - 1];
  const bar = interpolate(frame, [0, total], [0, 100]);

  return (
    <AbsoluteFill style={{ background: colors.ink }}>
      {scenes.map((sc, i) => {
        const from = i === 0 ? 0 : F(sc.start - 0.0);
        const to = i + 1 < scenes.length ? F(scenes[i + 1].start) : total;
        const clips = cfgs[sc.id].clips;
        const per = (to - from) / clips.length;
        return clips.map((c, k) => {
          const a = from + Math.round(per * k);
          const b = k + 1 === clips.length ? to : from + Math.round(per * (k + 1));
          return (
            <Sequence key={`${sc.id}-${k}`} from={a} durationInFrames={Math.max(1, b - a)}>
              <Clip name={c} />
            </Sequence>
          );
        });
      })}
      <Shade />
      <Logo />
      <div style={{ position: "absolute", top: 0, left: 0, height: 8, width: `${bar}%`, background: colors.taupe }} />

      {scenes.map((sc, i) => {
        const cs = cfgs[sc.id].callouts ?? [];
        const sceneEnd = i + 1 < scenes.length ? F(scenes[i + 1].start) : total;
        return cs.map((c, k) => {
          const hit = sc.words.find((w) => norm(w.t).startsWith(norm(c.word)));
          if (!hit) console.warn(`callout-woord "${c.word}" niet gevonden in ${body}/${sc.id}`);
          const at = F(hit ? hit.s : sc.start) - 3;
          const nextAt = cs[k + 1] ? F((sc.words.find((w) => norm(w.t).startsWith(norm(cs[k + 1].word))) ?? sc.words[0]).s) - 3 : sceneEnd;
          return <CalloutCard key={`${sc.id}-c${k}`} c={c} at={at} out={Math.min(nextAt, sceneEnd - 2)} />;
        });
      })}

      {/* CTA-scène: donkere afdekking voor leesbaarheid, geen transitie (alleen kaart verschijnt) */}
      <Sequence from={F(cta.start)}>
        <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(14,14,14,0.55) 0%, rgba(14,14,14,0.15) 40%, rgba(14,14,14,0.6) 100%)" }} />
      </Sequence>
      <CtaCard at={F(cta.start) + 20} />

      {/* Ondertitels (niet tijdens de CTA-kaart, die heeft eigen tekst) */}
      <Captions words={scenes.filter((s) => s.id !== "cta").flatMap((s) => s.words)} top={1250} size={62} />
      <Sequence from={F(cta.start)} durationInFrames={Math.max(1, total - F(cta.start))}>
        <AbsoluteFill style={{ pointerEvents: "none" }}>
          <CtaCaptions words={cta.words} offset={cta.start} />
        </AbsoluteFill>
      </Sequence>

      <Audio src={staticFile(`vo/${body}-body.wav`)} />
    </AbsoluteFill>
  );
};

// CTA-ondertitel: kleiner, midden in beeld, boven de knop
const CtaCaptions: React.FC<{ words: Word[]; offset: number }> = ({ words, offset }) => {
  const frame = useCurrentFrame();
  const t = frame / FPS + offset;
  const chunks = chunkWords(words, 4);
  const idx = chunks.findIndex((c, i) => t >= c[0].s - 0.04 && (i + 1 >= chunks.length || t < chunks[i + 1][0].s - 0.04));
  const chunk = idx >= 0 ? chunks[idx] : null;
  if (!chunk || t > chunk[chunk.length - 1].e + 0.7) return null;
  return (
    <AbsoluteFill style={{ alignItems: "center", paddingTop: 1010 }}>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", columnGap: 12, maxWidth: 950, fontFamily: font, fontWeight: 800, fontSize: 58, textAlign: "center" }}>
        {chunk.map((w, i) => {
          const active = t >= w.s - 0.03 && t < (chunk[i + 1]?.s ?? w.e + 0.7);
          return <span key={i} style={{ color: active ? colors.ink : colors.white, background: active ? colors.taupe : "transparent", padding: "0 12px", borderRadius: 12, textShadow: active ? "none" : "0 3px 16px rgba(0,0,0,0.85)" }}>{w.t}</span>;
        })}
      </div>
    </AbsoluteFill>
  );
};
