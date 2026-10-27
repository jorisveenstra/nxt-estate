import React from "react";
import { AbsoluteFill, Audio, Easing, Img, interpolate, OffthreadVideo, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import scripts from "../scripts/scripts.json";
import { colors, fonts, TAIL } from "./brand";
import { Icon } from "./icons";
import timing from "./timing.json";

type W = [number, number, string];
type Scene = { id: string; w0: number; w1: number; start: number; end: number };
type Co = { at: string; big: string; small: string; icon: string };
type ClipList = [string, string | null][];

const CLIP_LEN = 7.9; // gegenereerde clips duren 8 s
const KICKER: Record<number, string> = { 1: "Voor vitale senioren", 2: "Van groot huis naar onderhoudsarm", 3: "Voor starters & jonge stellen" };

const norm = (s: string) => s.toLowerCase().replace(/[.,?!:;"]/g, "");
const findWord = (words: W[], from: number, to: number, at: string) => {
  for (let i = from; i < to; i++) if (norm(words[i][2]) === norm(at)) return words[i][0];
  throw new Error(`woord "${at}" niet gevonden`);
};

export const bodyDuration = (b: number) => (timing as any)[`b${b}`].body.duur + TAIL;
export const hookDuration = (b: number, h: number) => (timing as any)[`b${b}`].hooks[String(h)].duur;

// ---------- beeld ----------
// Een clip die in dezelfde video opnieuw voorkomt krijgt een andere uitsnede (variant 1/2), zodat elke harde cut een nieuw kader laat zien
const VARIANT = [
  { zoom: 1, ox: "50%", oy: "50%" },
  { zoom: 1.24, ox: "50%", oy: "22%" },
  { zoom: 1.24, ox: "42%", oy: "78%" },
];

const Clip: React.FC<{ clip: string; dur: number; variant: number }> = ({ clip, dur, variant }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rate = Math.min(1, CLIP_LEN / (dur / fps));
  // rustige, doorlopende beweging binnen één shot; knippen zijn altijd harde cuts
  const v = VARIANT[variant % 3];
  const scale = v.zoom * interpolate(frame, [0, dur], [1.0, 1.07], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ transform: `scale(${scale})`, transformOrigin: `${v.ox} ${v.oy}` }}>
      <OffthreadVideo src={staticFile(`clips/${clip}.mp4`)} muted playbackRate={rate} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
    </AbsoluteFill>
  );
};

const Footage: React.FC<{ segs: { clip: string; from: number; to: number }[] }> = ({ segs }) => {
  const { fps } = useVideoConfig();
  const seen: Record<string, number> = {};
  return (
    <>
      {segs.map((s, i) => {
        const variant = (seen[s.clip] = (seen[s.clip] ?? -1) + 1);
        const f0 = Math.round(s.from * fps);
        const d = Math.max(1, Math.round(s.to * fps) - f0);
        return (
          <Sequence key={i} from={f0} durationInFrames={d}>
            <Clip clip={s.clip} dur={d} variant={variant} />
          </Sequence>
        );
      })}
    </>
  );
};

const Shade: React.FC<{ strong?: number }> = ({ strong = 0 }) => (
  <AbsoluteFill style={{ background: `linear-gradient(180deg, rgba(20,32,26,${0.55 + strong}) 0%, rgba(20,32,26,${strong}) 24%, rgba(20,32,26,${strong}) 52%, rgba(20,32,26,${0.72 + strong}) 100%)` }} />
);

const Logos: React.FC<{ goud: boolean; hideLogo?: boolean }> = ({ goud, hideLogo }) => {
  const frame = useCurrentFrame();
  const a = interpolate(frame, [4, 16], [0, 1], { extrapolateRight: "clamp" });
  return (
    <>
      {!hideLogo && <Img src={staticFile("logo-wit.png")} style={{ position: "absolute", top: 70, left: 52, width: 250, opacity: a, filter: "drop-shadow(0 2px 8px rgba(0,0,0,.55))" }} />}
      {goud && <Img src={staticFile("goud-logo.png")} style={{ position: "absolute", top: 52, right: 44, width: 170, opacity: a, filter: "drop-shadow(0 2px 8px rgba(0,0,0,.5))" }} />}
    </>
  );
};

const Footer: React.FC<{ total: number }> = ({ total }) => {
  const frame = useCurrentFrame();
  return (
    <>
      <div style={{ position: "absolute", bottom: 52, width: "100%", textAlign: "center", fontFamily: fonts.sans, fontWeight: 700, fontSize: 30, letterSpacing: 1, color: "rgba(255,255,255,.85)", textShadow: "0 2px 8px rgba(0,0,0,.7)" }}>
        aanbod.vorm.nl/nieuweweelde
      </div>
      <div style={{ position: "absolute", bottom: 0, left: 0, height: 12, width: `${Math.min(100, (frame / total) * 100)}%`, background: `linear-gradient(90deg, ${colors.sage}, ${colors.gold})` }} />
    </>
  );
};

// ---------- callouts ----------
const Callout: React.FC<{ co: Co; dur: number }> = ({ co, dur }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const inn = spring({ frame, fps, config: { damping: 13, stiffness: 140, mass: 0.7 } });
  const out = interpolate(frame, [dur - 8, dur], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const stat = co.big.length <= 9;
  const pulse = (frame % 45) / 45;
  const bar = interpolate(frame, [6, 22], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  return (
    <div style={{ position: "absolute", left: 52, top: 262, opacity: out, transform: `translateX(${(1 - inn) * -160}px) scale(${0.85 + 0.15 * inn}) translateY(${(1 - out) * -20}px)`, transformOrigin: "left top" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 28, background: "rgba(47,74,61,0.9)", borderRadius: 44, padding: "24px 44px 24px 24px", boxShadow: "0 14px 40px rgba(0,0,0,.4)", maxWidth: 960 }}>
        <div style={{ position: "relative", width: 124, height: 124, flex: "none" }}>
          <div style={{ position: "absolute", inset: -14 * pulse, borderRadius: "50%", border: `4px solid ${colors.goldLight}`, opacity: 1 - pulse }} />
          <div style={{ width: 124, height: 124, borderRadius: "50%", background: `linear-gradient(145deg, ${colors.goldLight}, ${colors.gold})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon name={co.icon} size={68} color={colors.ink} />
          </div>
        </div>
        <div style={{ fontFamily: fonts.sans, color: colors.white }}>
          <div style={{ fontWeight: 900, fontSize: stat ? 104 : co.big.length > 18 ? 54 : 64, lineHeight: 1.02, color: stat ? colors.goldLight : colors.white }}>{co.big}</div>
          <div style={{ fontWeight: 600, fontSize: 36, marginTop: 6, color: colors.cream }}>{co.small}</div>
          <div style={{ height: 6, borderRadius: 3, marginTop: 12, width: `${bar * 100}%`, background: colors.gold }} />
        </div>
      </div>
    </div>
  );
};

const Callouts: React.FC<{ scene: Scene; words: W[]; cos: Co[] }> = ({ scene, words, cos }) => {
  const { fps } = useVideoConfig();
  const starts = cos.map((c) => findWord(words, scene.w0, scene.w1, c.at) - 0.08);
  return (
    <>
      {cos.map((c, i) => {
        const end = Math.min(i + 1 < cos.length ? starts[i + 1] : scene.end, starts[i] + 3.4);
        const f0 = Math.round(starts[i] * fps);
        return (
          <Sequence key={i} from={f0} durationInFrames={Math.max(12, Math.round(end * fps) - f0)}>
            <Callout co={c} dur={Math.max(12, Math.round(end * fps) - f0)} />
          </Sequence>
        );
      })}
    </>
  );
};

// ---------- ondertitels ----------
const Captions: React.FC<{ words: W[]; y: number }> = ({ words, y }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const chunks: W[][] = [];
  let cur: W[] = [];
  words.forEach((w) => {
    cur.push(w);
    const len = cur.map((c) => c[2]).join(" ").length;
    if (/[.,?!]$/.test(w[2]) || cur.length >= 4 || len > 20) {
      chunks.push(cur);
      cur = [];
    }
  });
  if (cur.length) chunks.push(cur);
  const idx = chunks.findIndex((c, i) => t >= c[0][0] - 0.05 && (i + 1 >= chunks.length || t < chunks[i + 1][0][0] - 0.05));
  const chunk = idx >= 0 ? chunks[idx] : null;
  if (!chunk || t > chunk[chunk.length - 1][1] + 0.5) return null;
  const since = (t - chunk[0][0]) * fps;
  const pop = interpolate(since, [0, 4], [0.86, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ justifyContent: "flex-start", alignItems: "center", paddingTop: y }}>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", columnGap: 16, maxWidth: 960, transform: `scale(${pop})`, fontFamily: fonts.sans, fontWeight: 800, fontSize: 64, textAlign: "center" }}>
        {chunk.map((w, i) => {
          const active = t >= w[0] - 0.03 && t < (chunk[i + 1]?.[0] ?? w[1] + 0.5);
          return (
            <span key={i} style={{ color: active ? colors.ink : colors.white, background: active ? colors.goldLight : "transparent", padding: "2px 14px", borderRadius: 10, textShadow: active ? "none" : "0 3px 14px rgba(0,0,0,.8), 0 1px 3px rgba(0,0,0,.9)" }}>
              {w[2]}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ---------- CTA ----------
const Cta: React.FC<{ kop: string; dur: number }> = ({ kop, dur }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const inn = spring({ frame, fps, config: { damping: 12, stiffness: 120 } });
  const btn = spring({ frame: frame - 14, fps, config: { damping: 10, stiffness: 150 } });
  const pulse = 1 + 0.035 * Math.sin((frame / fps) * Math.PI * 2.4);
  return (
    <>
      <Img src={staticFile("logo-wit.png")} style={{ position: "absolute", top: 100, left: 290, width: 500, opacity: inn, transform: `scale(${0.8 + 0.2 * inn})`, filter: "drop-shadow(0 4px 14px rgba(0,0,0,.6))" }} />
      <div style={{ position: "absolute", top: 450, width: "100%", textAlign: "center", fontFamily: fonts.sans, fontWeight: 900, fontSize: 82, lineHeight: 1.05, color: colors.white, padding: "0 70px", boxSizing: "border-box", textShadow: "0 4px 22px rgba(0,0,0,.75)", transform: `translateY(${(1 - inn) * 60}px)`, opacity: inn }}>
        {kop}
      </div>
      <div style={{ position: "absolute", top: 1560, width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: 18, opacity: btn, transform: `translateY(${(1 - btn) * 80}px)` }}>
        <div style={{ transform: `scale(${pulse})`, background: `linear-gradient(145deg, ${colors.goldLight}, ${colors.gold})`, color: colors.ink, fontFamily: fonts.sans, fontWeight: 900, fontSize: 60, padding: "30px 70px", borderRadius: 100, boxShadow: "0 14px 36px rgba(0,0,0,.45)" }}>
          Meer informatie &nbsp;›
        </div>
        <div style={{ fontFamily: fonts.sans, fontWeight: 700, fontSize: 38, color: colors.white, textShadow: "0 3px 12px rgba(0,0,0,.8)" }}>Plan een afspraak met onze makelaar</div>
      </div>
    </>
  );
};

// ---------- body ----------
export const BodyVideo: React.FC<{ body: number }> = ({ body }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const d = (scripts as any)[`b${body}`];
  const tm = (timing as any)[`b${body}`].body;
  const words: W[] = tm.words;
  const scenes: Scene[] = tm.scenes;
  const total = tm.duur + TAIL;
  const segs: { clip: string; from: number; to: number }[] = [];
  scenes.forEach((sc, i) => {
    const list: ClipList = sc.id === "cta" ? [[d.cta.clip, null]] : d.zinnen[i].clips;
    const end = sc.id === "cta" ? total : sc.end;
    list.forEach(([clip, at], k) => {
      const from = k === 0 ? (i === 0 ? 0 : sc.start) : findWord(words, sc.w0, sc.w1, at!);
      const nx = list[k + 1];
      segs.push({ clip, from, to: nx ? findWord(words, sc.w0, sc.w1, nx[1]!) : end });
    });
  });
  const cta = scenes[scenes.length - 1];
  const inCta = frame / fps >= cta.start - 0.02;
  return (
    <AbsoluteFill style={{ backgroundColor: colors.ink }}>
      <Footage segs={segs} />
      <Shade />
      <Logos goud={!!d.goud} hideLogo={inCta} />
      {scenes.map((sc, i) =>
        sc.id === "cta" ? null : (
          <Callouts key={sc.id} scene={sc} words={words} cos={d.zinnen[i].co} />
        ),
      )}
      <Captions words={words} y={inCta ? 1330 : 1380} />
      <Sequence from={Math.round(cta.start * fps)}>
        <Cta kop={d.cta.kop} dur={Math.round((total - cta.start) * fps)} />
      </Sequence>
      <Footer total={Math.round(total * fps)} />
      <Audio src={staticFile(`vo/body${body}.wav`)} />
    </AbsoluteFill>
  );
};

// ---------- hook ----------
export const HookVideo: React.FC<{ body: number; hook: number }> = ({ body, hook }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const d = (scripts as any)[`b${body}`];
  const hk = d.hooks[hook - 1];
  const tm = (timing as any)[`b${body}`].hooks[String(hook)];
  const words: W[] = tm.words;
  const total = tm.duur;
  const t = frame / fps;
  const segs = (hk.clips as ClipList).map(([clip, at], k, arr) => ({
    clip,
    from: k === 0 ? 0 : (words.find((w) => norm(w[2]) === norm(at!)) ?? (() => { throw new Error(`hook woord ${at}`); })())[0],
    to: 0,
  }));
  segs.forEach((s, k) => (s.to = k + 1 < segs.length ? segs[k + 1].from : total));
  const n = hk.t.length;
  const size = n < 60 ? 104 : n < 80 ? 92 : n < 100 ? 80 : 72;
  const accent = new Set((hk.accent as string[]).map(norm));
  const kick = spring({ frame, fps, config: { damping: 12, stiffness: 140 } });
  return (
    <AbsoluteFill style={{ backgroundColor: colors.ink }}>
      <Footage segs={segs} />
      <AbsoluteFill style={{ background: "rgba(20,32,26,0.42)" }} />
      <Shade />
      <Logos goud={!!d.goud} />
      <div style={{ position: "absolute", top: 270, left: 0, width: "100%", display: "flex", justifyContent: "center", transform: `scale(${0.7 + 0.3 * kick})`, opacity: kick }}>
        <div style={{ background: `linear-gradient(145deg, ${colors.goldLight}, ${colors.gold})`, color: colors.ink, fontFamily: fonts.sans, fontWeight: 900, fontSize: 44, padding: "16px 44px", borderRadius: 60, boxShadow: "0 10px 30px rgba(0,0,0,.4)" }}>
          {KICKER[body]}
        </div>
      </div>
      <div style={{ position: "absolute", top: 470, left: 0, width: "100%", display: "flex", flexWrap: "wrap", justifyContent: "center", columnGap: 22, rowGap: 6, padding: "0 60px", boxSizing: "border-box", fontFamily: fonts.sans, fontWeight: 900, fontSize: size, lineHeight: 1.1, textAlign: "center" }}>
        {words.map((w, i) => {
          const s = Math.round(w[0] * fps);
          const p = spring({ frame: frame - s + 1, fps, config: { damping: 11, stiffness: 190, mass: 0.6 } });
          const acc = accent.has(norm(w[2]));
          const line = interpolate(frame - s, [2, 14], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
          return (
            <span key={i} style={{ position: "relative", display: "inline-block", opacity: frame >= s - 1 ? Math.min(1, p * 1.6) : 0, transform: `scale(${0.6 + 0.4 * p}) translateY(${(1 - p) * 40}px)`, color: acc ? colors.goldLight : colors.white, textShadow: "0 4px 24px rgba(0,0,0,.75), 0 2px 4px rgba(0,0,0,.8)" }}>
              {w[2]}
              {acc && <span style={{ position: "absolute", left: 0, bottom: -4, height: 10, width: `${line * 100}%`, background: colors.gold, borderRadius: 5 }} />}
            </span>
          );
        })}
      </div>
      <Footer total={Math.round(total * fps) * 6} />
      <Audio src={staticFile(`vo/hook${body}-${hook}.wav`)} />
    </AbsoluteFill>
  );
};
