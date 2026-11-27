import React, { useEffect, useState } from "react";
import {
  AbsoluteFill,
  Audio,
  continueRender,
  delayRender,
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
import { colors, FONT, fontCss, TAIL } from "./brand";
import { Accent, ACCENTS, AUDIENCE, HIGHLIGHT, HOOK_CLIPS, SCENE_CLIPS } from "./config";
import { Icon } from "./icons";
import timingJson from "./timing.json";

// Opbouw: footage vult altijd het hele 9:16-beeld, harde knippen tussen shots (geen overgangen).
// Grafische accenten blijven klein (ruim onder 35% van het beeld) zodat het beeld dominant blijft.

type Word = { t: string; s: number; e: number };
type Scene = { id: string; start: number; words: Word[] };
type Timing = Record<string, { body: { dur: number; end: number; scenes: Scene[] }; hooks: Record<string, { dur: number; words: Word[] }> }>;
const timing = timingJson as unknown as Timing;

export const hookFrames = (b: number, h: number, fps: number) => Math.round(timing[`b${b}`].hooks[String(h)].dur * fps);
export const bodyFrames = (b: number, fps: number) => Math.round((timing[`b${b}`].body.end + TAIL) * fps);

const useFonts = () => {
  const [handle] = useState(() => delayRender("fonts"));
  useEffect(() => {
    const style = document.createElement("style");
    style.innerHTML = fontCss;
    document.head.appendChild(style);
    Promise.all([500, 600, 700, 800].map((w) => document.fonts.load(`${w} 40px ${FONT}`)))
      .then(() => continueRender(handle))
      .catch(() => continueRender(handle));
  }, [handle]);
};

type Seg = { clip: string; from: number; to: number };

const Footage: React.FC<{ segs: Seg[] }> = ({ segs }) => {
  const { fps } = useVideoConfig();
  const F = (s: number) => Math.round(s * fps);
  return (
    <>
      {segs.map((seg, i) => {
        const dur = Math.max(1, F(seg.to) - F(seg.from));
        const sec = dur / fps;
        const rate = sec > 7.6 ? 7.6 / sec : 1; // clips zijn 8 s; langer stuk iets vertraagd i.p.v. stilstaand
        return (
          <Sequence key={i} from={F(seg.from)} durationInFrames={dur}>
            <AbsoluteFill>
              <OffthreadVideo
                src={staticFile(`clips/${seg.clip}.mp4`)}
                muted
                playbackRate={rate}
                startFrom={6}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </AbsoluteFill>
          </Sequence>
        );
      })}
    </>
  );
};

const Shade: React.FC = () => (
  <AbsoluteFill
    style={{
      background:
        "linear-gradient(180deg, rgba(26,26,26,0.45) 0%, rgba(26,26,26,0) 18%, rgba(26,26,26,0) 52%, rgba(26,26,26,0.55) 80%, rgba(26,26,26,0.35) 100%)",
    }}
  />
);

const Logo: React.FC<{ width?: number; top?: number }> = ({ width = 190, top = 90 }) => (
  <div
    style={{
      position: "absolute",
      top,
      right: 56,
      padding: "14px 18px 10px",
      background: "rgba(246,244,239,0.92)",
      borderRadius: 14,
      boxShadow: "0 6px 22px rgba(0,0,0,0.25)",
    }}
  >
    <Img src={staticFile("logo/hbc-logo-dark.png")} style={{ width, display: "block" }} />
  </div>
);

// Ondertitels: korte groepjes, gesproken woord in goud; feitwoorden altijd goud
const Captions: React.FC<{ words: Word[]; offset?: number; top?: number }> = ({ words, offset = 0, top = 1210 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps - offset;
  const chunks: Word[][] = [];
  let cur: Word[] = [];
  words.forEach((w) => {
    cur.push(w);
    const len = cur.map((c) => c.t).join(" ").length;
    if (/[.,?!]$/.test(w.t) || cur.length >= 4 || len > 18) {
      chunks.push(cur);
      cur = [];
    }
  });
  if (cur.length) chunks.push(cur);
  const idx = chunks.findIndex((c, i) => t >= c[0].s - 0.05 && (i + 1 >= chunks.length || t < chunks[i + 1][0].s - 0.05));
  const chunk = idx >= 0 ? chunks[idx] : null;
  if (!chunk || t > chunk[chunk.length - 1].e + 0.5) return null;
  const since = (t - chunk[0].s + 0.05) * fps;
  const pop = interpolate(since, [0, 5], [0.9, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.back(2)) });
  return (
    <div
      style={{
        position: "absolute",
        top,
        left: 70,
        right: 70,
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        columnGap: 14,
        rowGap: 6,
        transform: `scale(${pop})`,
        fontFamily: FONT,
        fontWeight: 800,
        fontSize: 62,
        lineHeight: 1.15,
        textAlign: "center",
      }}
    >
      {chunk.map((w, i) => {
        const active = t >= w.s - 0.03 && t < (chunk[i + 1]?.s ?? w.e + 0.5);
        const hl = HIGHLIGHT.test(w.t.replace(/[.,?!:;]/g, ""));
        return (
          <span
            key={i}
            style={{
              color: active ? colors.ink : colors.white,
              background: active ? colors.gold : "transparent",
              boxShadow: !active && hl ? `inset 0 -8px 0 ${colors.brown}` : undefined,
              padding: "0 12px",
              borderRadius: 10,
              textShadow: active ? "none" : "0 3px 14px rgba(0,0,0,0.8), 0 1px 3px rgba(0,0,0,0.9)",
            }}
          >
            {w.t}
          </span>
        );
      })}
    </div>
  );
};

// Feitenlabel: schuift van links in, blijft staan, schuift weer weg (animatie binnen het shot, geen overgang)
const AccentChip: React.FC<{ a: Accent; dur: number; top: number; delay: number }> = ({ a, dur, top, delay }) => {
  const frame = useCurrentFrame() - delay;
  const { fps } = useVideoConfig();
  if (frame < 0) return null;
  const inP = spring({ frame, fps, config: { damping: 16, stiffness: 140 } });
  const outP = interpolate(frame, [dur - delay - 8, dur - delay], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.in(Easing.cubic) });
  const x = interpolate(inP, [0, 1], [-560, 0]) + interpolate(outP, [0, 1], [0, -620]);
  const bar = interpolate(frame, [6, 22], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  return (
    <div
      style={{
        position: "absolute",
        top,
        left: 56,
        transform: `translateX(${x}px)`,
        display: "flex",
        alignItems: "center",
        gap: 22,
        padding: "20px 34px 20px 22px",
        background: "rgba(246,244,239,0.94)",
        borderRadius: 22,
        borderLeft: `10px solid ${colors.brown}`,
        boxShadow: "0 10px 30px rgba(0,0,0,0.28)",
        fontFamily: FONT,
        maxWidth: 760,
      }}
    >
      <div style={{ width: 84, height: 84, borderRadius: 42, background: colors.brown, display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${inP})`, flexShrink: 0 }}>
        <Icon name={a.icon} size={48} color={colors.cream} />
      </div>
      <div>
        <div style={{ fontSize: 28, fontWeight: 600, color: colors.brown, letterSpacing: 0.5, textTransform: "uppercase" }}>{a.label}</div>
        <div style={{ fontSize: 50, fontWeight: 800, color: colors.ink, lineHeight: 1.1 }}>{a.value}</div>
        <div style={{ height: 5, width: `${bar * 100}%`, background: colors.gold, borderRadius: 3, marginTop: 8 }} />
      </div>
    </div>
  );
};

const splitScene = (sc: Scene, end: number, clips: string[], first: boolean): Seg[] => {
  const from = first ? 0 : sc.start;
  if (clips.length === 1) return [{ clip: clips[0], from, to: end }];
  const mid = (from + end) / 2;
  const cut = sc.words.reduce((best, w) => (Math.abs(w.s - mid) < Math.abs(best - mid) ? w.s : best), sc.words[0].s);
  const at = cut - from < 1.5 || end - cut < 1.5 ? mid : cut;
  return [
    { clip: clips[0], from, to: at },
    { clip: clips[1], from: at, to: end },
  ];
};

const Kicker: React.FC<{ text: string }> = ({ text }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - 3, fps, config: { damping: 15 } });
  return (
    <div style={{ position: "absolute", top: 110, left: 56, transform: `translateY(${(1 - p) * -40}px)`, opacity: p, fontFamily: FONT }}>
      <div style={{ display: "inline-block", background: colors.brown, color: colors.cream, fontWeight: 700, fontSize: 34, padding: "12px 26px", borderRadius: 40, letterSpacing: 0.5 }}>
        {text}
      </div>
      <div style={{ marginTop: 14, color: colors.white, fontWeight: 600, fontSize: 32, textShadow: "0 2px 10px rgba(0,0,0,0.7)" }}>Haarlem · aan Het Spaarne</div>
    </div>
  );
};

// HOOK-segment (per variant apart gerenderd)
export const HookSegment: React.FC<{ body: number; hook: number; withAudio?: boolean }> = ({ body, hook, withAudio }) => {
  useFonts();
  const h = timing[`b${body}`].hooks[String(hook)];
  const { durationInFrames, fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ backgroundColor: colors.ink }}>
      <Footage segs={[{ clip: HOOK_CLIPS[body][hook], from: 0, to: durationInFrames / fps }]} />
      <Shade />
      <Kicker text={AUDIENCE[body]} />
      <Logo />
      <Captions words={h.words} top={1120} />
      {withAudio ? <Audio src={staticFile(`vo/b${body}h${hook}-hook.wav`)} /> : null}
    </AbsoluteFill>
  );
};

const CtaCard: React.FC<{ start: number }> = ({ start }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const f = frame - Math.round(start * fps);
  if (f < 0) return null;
  const p = spring({ frame: f, fps, config: { damping: 15, stiffness: 120 } });
  const bounce = Math.sin((f / fps) * Math.PI * 2.2) * 8;
  return (
    <>
      <div style={{ position: "absolute", top: 210, left: 0, right: 0, display: "flex", justifyContent: "center", opacity: p, transform: `scale(${0.85 + 0.15 * p})` }}>
        <div style={{ background: "rgba(246,244,239,0.95)", borderRadius: 26, padding: "28px 44px 22px", boxShadow: "0 12px 36px rgba(0,0,0,0.3)" }}>
          <Img src={staticFile("logo/hbc-logo-dark.png")} style={{ width: 330, display: "block" }} />
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          left: 70,
          right: 70,
          top: 1440,
          transform: `translateY(${(1 - p) * 220}px)`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 18,
          fontFamily: FONT,
        }}
      >
        <div style={{ background: colors.brown, color: colors.cream, fontWeight: 800, fontSize: 46, padding: "26px 54px", borderRadius: 60, boxShadow: "0 12px 30px rgba(0,0,0,0.35)", display: "flex", alignItems: "center", gap: 20 }}>
          Plan een afspraak op locatie
          <span style={{ display: "inline-block", transform: `translateY(${bounce}px)` }}>
            <Icon name="arrow" size={46} color={colors.gold} />
          </span>
        </div>
        <div style={{ color: colors.white, fontWeight: 600, fontSize: 32, textShadow: "0 2px 10px rgba(0,0,0,0.8)" }}>Kuipersweg 4, Haarlem · met de makelaar</div>
      </div>
    </>
  );
};

// BODY-segment (één keer per body gerenderd; tijden relatief aan het begin van de body)
export const BodySegment: React.FC<{ body: number; withAudio?: boolean }> = ({ body, withAudio }) => {
  useFonts();
  const { fps } = useVideoConfig();
  const tb = timing[`b${body}`].body;
  const end = tb.end + TAIL;
  const scenes = tb.scenes;
  const segs = scenes.flatMap((sc, i) => splitScene(sc, i + 1 < scenes.length ? scenes[i + 1].start : end, SCENE_CLIPS[body][sc.id], i === 0));
  const cta = scenes.find((s) => s.id === "cta")!;
  const F = (s: number) => Math.round(s * fps);
  const words = scenes.flatMap((s) => s.words);
  return (
    <AbsoluteFill style={{ backgroundColor: colors.ink }}>
      <Footage segs={segs} />
      <Shade />
      <Sequence from={0} durationInFrames={F(cta.start)} layout="none">
        <Logo />
      </Sequence>
      {scenes.map((sc, i) => {
        const from = i === 0 ? 0 : sc.start;
        const to = i + 1 < scenes.length ? scenes[i + 1].start : end;
        const acc = ACCENTS[body][sc.id] ?? [];
        const dur = F(to) - F(from);
        return (
          <Sequence key={sc.id} from={F(from)} durationInFrames={dur} layout="none">
            {acc.map((a, k) => (
              <AccentChip key={k} a={a} dur={dur} top={300 + k * 190} delay={8 + k * Math.round(Math.min(dur * 0.4, 45))} />
            ))}
          </Sequence>
        );
      })}
      <Captions words={words} top={1210} />
      <CtaCard start={cta.start} />
      {withAudio ? <Audio src={staticFile(`vo/b${body}-body.wav`)} /> : null}
    </AbsoluteFill>
  );
};

// Volledige video (alleen voor preview in de studio): hook + body met stem en muziek
export const FullVideo: React.FC<{ body: number; hook: number }> = ({ body, hook }) => {
  const { fps } = useVideoConfig();
  const hf = hookFrames(body, hook, fps);
  return (
    <AbsoluteFill>
      <Sequence from={0} durationInFrames={hf}>
        <HookSegment body={body} hook={hook} withAudio />
      </Sequence>
      <Sequence from={hf}>
        <BodySegment body={body} withAudio />
      </Sequence>
      <Audio src={staticFile(`muziek/b${body}.mp3`)} volume={0.12} />
    </AbsoluteFill>
  );
};
