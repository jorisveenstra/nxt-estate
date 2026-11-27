import React from "react";
import {
  AbsoluteFill,
  Audio,
  Easing,
  Img,
  interpolate,
  OffthreadVideo,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { colors, fonts, FPS } from "./brand";
import clipLengths from "./clips.json";
import { Accent, BODY_SHOTS, CTA, HOOK_SHOTS } from "./config";
import { Icon } from "./icons";
import vo from "./vo.json";

type Word = [number, number, string];
type Piece = { woorden: Word[]; zinnen: [number, number][]; duur: number; tekst: string[] };
const VO = vo as unknown as Record<string, Piece>;

export const HOOK_GAP = 0.4; // stilte na de hook, dan harde knip naar de body
export const TAIL = 2.2; // seconden na de CTA

export const hookFrames = (b: number, h: number) => Math.round((VO[`b${b}h${h}`].duur + HOOK_GAP) * FPS);
export const bodyFrames = (b: number) => Math.round((VO[`b${b}`].duur + TAIL) * FPS);

type Seg = { clip: string; from: number; to: number };

// Zinnen -> clipsegmenten (seconden binnen het deel). Harde knips op zinsgrenzen of halverwege een zin.
const segmentsFor = (zinnen: [number, number][], shots: string[][], end: number): Seg[] => {
  const segs: Seg[] = [];
  zinnen.forEach(([s], i) => {
    const start = i === 0 ? 0 : s - 0.08;
    const stop = i + 1 < zinnen.length ? zinnen[i + 1][0] - 0.08 : end;
    const list = shots[i];
    if (!list.length) {
      segs[segs.length - 1].to = stop;
      return;
    }
    list.forEach((clip, k) => {
      const a = start + ((stop - start) * k) / list.length;
      const z = start + ((stop - start) * (k + 1)) / list.length;
      segs.push({ clip, from: a, to: z });
    });
  });
  return segs;
};

const Footage: React.FC<{ segs: Seg[] }> = ({ segs }) => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ background: colors.navy }}>
      {segs.map((s, i) => {
        const from = Math.round(s.from * fps);
        const dur = Math.round(s.to * fps) - from;
        const len = (clipLengths as Record<string, number>)[s.clip] - 0.1;
        const rate = Math.min(1, len / (dur / fps)); // vertragen als het shot langer is dan de clip
        return (
          <Sequence key={i} from={from} durationInFrames={dur}>
            <OffthreadVideo
              src={staticFile(`clips/${s.clip}.mp4`)}
              muted
              playbackRate={rate}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </Sequence>
        );
      })}
      {/* lichte verlopen voor leesbaarheid van logo en ondertitels; beeld blijft volledig zichtbaar */}
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(20,24,36,0.35) 0%, rgba(20,24,36,0) 18%, rgba(20,24,36,0) 55%, rgba(20,24,36,0.5) 100%)" }} />
    </AbsoluteFill>
  );
};

const Logo: React.FC = () => (
  <div style={{ position: "absolute", top: 70, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
    <div style={{ background: "rgba(238,233,226,0.92)", borderRadius: 18, padding: "16px 30px", boxShadow: "0 6px 24px rgba(0,0,0,0.18)" }}>
      <Img src={staticFile("logo-watering.png")} style={{ width: 250, display: "block" }} />
    </div>
  </div>
);

// Ondertitels: korte groepjes woorden, het gesproken woord in goud
const Captions: React.FC<{ words: Word[]; until?: number }> = ({ words, until }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  if (until !== undefined && t >= until) return null;
  const chunks: Word[][] = [];
  let cur: Word[] = [];
  words.forEach((w) => {
    cur.push(w);
    const len = cur.map((c) => c[2]).join(" ").length;
    if (/[.,?!:]$/.test(w[2]) || cur.length >= 4 || len > 22) {
      chunks.push(cur);
      cur = [];
    }
  });
  if (cur.length) chunks.push(cur);
  const idx = chunks.findIndex((c, i) => t >= c[0][0] - 0.05 && (i + 1 >= chunks.length || t < chunks[i + 1][0][0] - 0.05));
  const chunk = idx >= 0 ? chunks[idx] : null;
  if (!chunk || t > chunk[chunk.length - 1][1] + 0.5) return null;
  const since = (t - chunk[0][0]) * fps;
  const pop = interpolate(since, [0, 4], [0.9, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ justifyContent: "flex-start", alignItems: "center", paddingTop: 1290 }}>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          columnGap: 18,
          maxWidth: 920,
          transform: `scale(${pop})`,
          fontFamily: fonts.head,
          fontWeight: 700,
          fontSize: 64,
          lineHeight: 1.15,
          textTransform: "uppercase",
          textAlign: "center",
        }}
      >
        {chunk.map((w, i) => {
          const active = t >= w[0] - 0.03 && t < (chunk[i + 1]?.[0] ?? w[1] + 0.5);
          return (
            <span
              key={i}
              style={{
                color: active ? colors.goldLight : colors.white,
                textShadow: "0 3px 16px rgba(0,0,0,0.8), 0 1px 3px rgba(0,0,0,0.9)",
              }}
            >
              {w[2]}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// Geanimeerd accent per zin: compacte marineblauwe kaart met goud icoon (± 5% van het beeld)
const AccentCard: React.FC<{ a: NonNullable<Accent>; dur: number }> = ({ a, dur }) => {
  const frame = useCurrentFrame();
  const inn = interpolate(frame, [0, 12], [0, 1], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const out = interpolate(frame, [dur - 8, dur], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const line = interpolate(frame, [8, 24], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const iconPop = interpolate(frame, [4, 16], [0.4, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.back(2)) });
  return (
    <div
      style={{
        position: "absolute",
        top: 300,
        left: 60,
        opacity: inn * out,
        transform: `translateX(${(1 - inn) * -80}px)`,
        display: "flex",
        alignItems: "center",
        gap: 24,
        background: "rgba(38,45,68,0.9)",
        borderRadius: 22,
        padding: "22px 34px 22px 22px",
        boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
        maxWidth: 760,
      }}
    >
      <div style={{ width: 92, height: 92, borderRadius: 46, background: colors.gold, display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${iconPop})` }}>
        <Icon name={a.icon} size={54} color={colors.white} />
      </div>
      <div>
        <div style={{ fontFamily: fonts.head, fontWeight: 700, fontSize: 46, color: colors.white, textTransform: "uppercase", letterSpacing: 1.5, lineHeight: 1.1 }}>{a.text}</div>
        {a.sub && <div style={{ fontFamily: fonts.body, fontSize: 30, color: colors.sand, marginTop: 6 }}>{a.sub}</div>}
        <div style={{ height: 4, background: colors.goldLight, marginTop: 12, width: `${line * 100}%`, borderRadius: 2 }} />
      </div>
    </div>
  );
};

const Accents: React.FC<{ zinnen: [number, number][]; shots: { accent: Accent }[] }> = ({ zinnen, shots }) => {
  const { fps } = useVideoConfig();
  return (
    <>
      {shots.map((s, i) => {
        if (!s.accent) return null;
        const from = Math.round((zinnen[i][0] + 0.1) * fps);
        const to = Math.round((zinnen[i][1] + 0.2) * fps);
        return (
          <Sequence key={i} from={from} durationInFrames={Math.max(20, to - from)}>
            <AccentCard a={s.accent} dur={Math.max(20, to - from)} />
          </Sequence>
        );
      })}
    </>
  );
};

const HookTag: React.FC = () => {
  const frame = useCurrentFrame();
  const inn = interpolate(frame, [4, 16], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  return (
    <div style={{ position: "absolute", top: 300, left: 0, right: 0, display: "flex", justifyContent: "center", opacity: inn, transform: `translateY(${(1 - inn) * 20}px)` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, background: colors.gold, borderRadius: 40, padding: "12px 30px" }}>
        <Icon name="pin" size={34} color={colors.white} stroke={2.2} />
        <span style={{ fontFamily: fonts.head, fontWeight: 700, fontSize: 34, letterSpacing: 3, color: colors.white, textTransform: "uppercase" }}>Bungalows in Oosthuizen</span>
      </div>
    </div>
  );
};

const CtaCard: React.FC = () => {
  const frame = useCurrentFrame();
  const inn = interpolate(frame, [0, 14], [0, 1], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const btn = interpolate(frame, [12, 24], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.back(1.6)) });
  const pulse = 1 + 0.03 * Math.sin(Math.max(0, frame - 24) / 6);
  return (
    <div
      style={{
        position: "absolute",
        left: 70,
        right: 70,
        bottom: 260,
        opacity: inn,
        transform: `translateY(${(1 - inn) * 60}px)`,
        background: "rgba(38,45,68,0.93)",
        borderRadius: 30,
        padding: "44px 50px 50px",
        textAlign: "center",
        boxShadow: "0 16px 40px rgba(0,0,0,0.3)",
      }}
    >
      <div style={{ fontFamily: fonts.head, fontWeight: 700, fontSize: 64, color: colors.white, textTransform: "uppercase", letterSpacing: 2 }}>{CTA.title}</div>
      <div style={{ fontFamily: fonts.body, fontSize: 34, color: colors.sand, marginTop: 14 }}>{CTA.sub}</div>
      <div style={{ height: 3, width: 160, background: colors.goldLight, margin: "28px auto" }} />
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 16,
          background: colors.sand,
          color: colors.navy,
          borderRadius: 16,
          padding: "20px 38px",
          fontFamily: fonts.head,
          fontWeight: 700,
          fontSize: 38,
          textTransform: "uppercase",
          letterSpacing: 1,
          transform: `scale(${btn * pulse})`,
        }}
      >
        {CTA.button}
        <span style={{ color: colors.gold, fontSize: 44 }}>↓</span>
      </div>
    </div>
  );
};

export type PartProps = { body: number; hook: number };

export const HookPart: React.FC<PartProps> = ({ body, hook }) => {
  const p = VO[`b${body}h${hook}`];
  const end = hookFrames(body, hook) / FPS;
  return (
    <AbsoluteFill>
      <Footage segs={segmentsFor([[0, end]], [HOOK_SHOTS[body][hook]], end)} />
      <Logo />
      <HookTag />
      <Captions words={p.woorden} />
    </AbsoluteFill>
  );
};

export const BodyPart: React.FC<{ body: number }> = ({ body }) => {
  const p = VO[`b${body}`];
  const shots = BODY_SHOTS[body];
  const end = bodyFrames(body) / FPS;
  const ctaStart = p.zinnen[p.zinnen.length - 1][0];
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill>
      <Footage segs={segmentsFor(p.zinnen, shots.map((s) => s.clips), end)} />
      <Logo />
      <Accents zinnen={p.zinnen} shots={shots} />
      <Captions words={p.woorden} until={ctaStart - 0.05} />
      <Sequence from={Math.round(ctaStart * fps)}>
        <CtaCard />
      </Sequence>
    </AbsoluteFill>
  );
};

// Muziek onder de stem: zacht tijdens spraak (ducking), iets voller in pauzes, korte fades.
const musicVolume = (t: number, words: Word[], total: number) => {
  let dist = 10;
  for (const [s, e] of words) {
    if (t >= s - 0.15 && t <= e + 0.25) {
      dist = 0;
      break;
    }
    dist = Math.min(dist, Math.abs(t - s), Math.abs(t - e));
  }
  const duck = interpolate(dist, [0, 0.5], [0.1, 0.24], { extrapolateRight: "clamp" });
  const fade = Math.min(interpolate(t, [0, 0.6], [0, 1], { extrapolateRight: "clamp" }), interpolate(t, [total - 1.8, total], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  return duck * fade;
};

// Volledige video (hook + body) met audio: voor preview/bewerken én voor de audiomix bij het renderen.
export const FullVideo: React.FC<PartProps & { audioOnly?: boolean }> = ({ body, hook, audioOnly }) => {
  const { fps, durationInFrames } = useVideoConfig();
  const hf = hookFrames(body, hook);
  const off = hf / fps;
  const words: Word[] = [
    ...VO[`b${body}h${hook}`].woorden,
    ...VO[`b${body}`].woorden.map(([s, e, w]) => [s + off, e + off, w] as Word),
  ];
  const total = durationInFrames / fps;
  return (
    <AbsoluteFill style={{ background: colors.navy }}>
      {!audioOnly && (
        <>
          <Sequence durationInFrames={hf}>
            <HookPart body={body} hook={hook} />
          </Sequence>
          <Sequence from={hf}>
            <BodyPart body={body} />
          </Sequence>
        </>
      )}
      <Audio src={staticFile(`vo/b${body}h${hook}.wav`)} />
      <Sequence from={hf}>
        <Audio src={staticFile(`vo/b${body}.wav`)} />
      </Sequence>
      <Audio src={staticFile("music/muziek.mp3")} volume={(f) => musicVolume(f / fps, words, total)} />
    </AbsoluteFill>
  );
};
