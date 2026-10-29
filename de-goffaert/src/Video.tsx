import React from "react";
import { AbsoluteFill, Audio, Easing, Img, interpolate, OffthreadVideo, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { colors, fonts } from "./brand";
import clipLengths from "./clips.json";
import { Card, CTA_TEXT, HOOK_ACCENT, HOOK_CLIPS, KICKER, SCENE_CARDS, SCENE_CLIPS } from "./config";
import { clamp, getTiming, norm, Scene, usePop } from "./ui";

export type VideoProps = { body: number; hook: number };

export const TAIL = 2.2; // seconden na de laatste zin

type Segment = { clip: string; from: number; to: number };

// Shots: harde sneden, geen overgangen. Elke scène wordt gelijk verdeeld over zijn clips.
const buildSegments = (body: number, hook: number, scenes: Scene[], end: number): Segment[] => {
  const segs: Segment[] = [];
  scenes.forEach((sc, i) => {
    const from = i === 0 ? 0 : sc.start;
    const to = i + 1 < scenes.length ? scenes[i + 1].start : end;
    const list = sc.id === "hook" ? HOOK_CLIPS[body][hook] : SCENE_CLIPS[body][sc.id];
    const step = (to - from) / list.length;
    list.forEach((clip, k) => segs.push({ clip, from: from + k * step, to: from + (k + 1) * step }));
  });
  return segs;
};

const ClipSegment: React.FC<{ seg: Segment; durationInFrames: number }> = ({ seg, durationInFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const dur = durationInFrames / fps;
  const len = (clipLengths as Record<string, number>)[seg.clip] - 0.1;
  // Een shot langer dan de clip wordt licht vertraagd; anders normale snelheid vanaf het begin
  const rate = Math.min(1, len / dur);
  // Ruim binnen de clip blijven: zachte, trage inzoom binnen één shot (geen overgang)
  const drift = interpolate(frame, [0, durationInFrames], [1.0, 1.05], clamp);
  return (
    <AbsoluteFill style={{ transform: `scale(${drift})` }}>
      <OffthreadVideo src={staticFile(`clips/${seg.clip}.mp4`)} muted playbackRate={rate} />
    </AbsoluteFill>
  );
};

const Check: React.FC<{ at: number }> = ({ at }) => {
  const frame = useCurrentFrame();
  const p = usePop(at, { damping: 10, stiffness: 220, mass: 0.6 });
  const d = interpolate(frame, [at + 3, at + 12], [0, 1], clamp);
  return (
    <svg width={46} height={46} viewBox="0 0 64 64" style={{ transform: `scale(${p})`, flexShrink: 0 }}>
      <circle cx={32} cy={32} r={30} fill={colors.sand} />
      <path d="M18 33l9 9 19-20" stroke={colors.white} strokeWidth={7} fill="none" strokeLinecap="round" strokeLinejoin="round" strokeDasharray={50} strokeDashoffset={50 * (1 - d)} />
    </svg>
  );
};

// Compacte callout linksboven onder het logo; blijft ruim onder 35% van het beeld
const SceneCard: React.FC<{ card: Card; startF: number; endF: number }> = ({ card, startF, endF }) => {
  const frame = useCurrentFrame();
  const out = interpolate(frame, [endF - 8, endF - 2], [0, 1], clamp);
  const local = frame - startF;
  const p = usePop(startF + 3);
  if (local < 0 || frame > endF) return null;
  const rows = card.lines ?? [];
  return (
    <AbsoluteFill style={{ padding: "270px 56px 0", alignItems: "flex-start" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 14, alignItems: "flex-start", opacity: p * (1 - out), transform: `translateY(${(1 - p) * 40 - out * 20}px)` }}>
        {card.chips?.map((c, i) => (
          <div key={i} style={{ background: i % 2 ? colors.terra : colors.ink, color: colors.white, fontFamily: fonts.head, fontWeight: 700, fontSize: 44, padding: "14px 30px", borderRadius: 18, boxShadow: "0 10px 30px rgba(0,0,0,0.3)" }}>
            {c}
          </div>
        ))}
        {card.kicker || card.big || rows.length ? (
          <div style={{ background: "rgba(50,49,50,0.88)", borderRadius: 24, padding: "26px 34px", boxShadow: "0 18px 50px rgba(0,0,0,0.35)", maxWidth: 800 }}>
            {card.kicker ? <div style={{ fontFamily: fonts.head, fontWeight: 600, fontSize: 30, letterSpacing: 1.5, textTransform: "uppercase", color: colors.sand, marginBottom: 6 }}>{card.kicker}</div> : null}
            {card.big ? <div style={{ fontFamily: fonts.head, fontWeight: 800, fontSize: 70, lineHeight: 1.08, color: colors.white }}>{card.big}</div> : null}
            {rows.map((r, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 16, marginTop: card.big || card.kicker || i ? 12 : 0, fontFamily: fonts.head, fontWeight: 600, fontSize: card.big ? 40 : 42, color: colors.white, lineHeight: 1.15 }}>
                {!card.big ? <Check at={startF + 6 + i * 6} /> : null}
                <span>{r}</span>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};

// Ondertitels: korte groepjes woorden, het gesproken woord licht op (accentwoorden in terracotta)
const Captions: React.FC<{ scenes: Scene[]; accent: string[] }> = ({ scenes, accent }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const acc = accent.map(norm);
  const words = scenes.filter((s) => s.id !== "cta").flatMap((s) => s.words.map((w) => ({ ...w, hook: s.id === "hook" })));
  const chunks: (typeof words)[] = [];
  let cur: typeof words = [];
  words.forEach((w) => {
    cur.push(w);
    const len = cur.map((c) => c.t).join(" ").length;
    if (/[.,?!]$/.test(w.t) || cur.length >= 4 || len > 20) {
      chunks.push(cur);
      cur = [];
    }
  });
  if (cur.length) chunks.push(cur);
  const idx = chunks.findIndex((c, i) => t >= c[0].s - 0.05 && (i + 1 >= chunks.length || t < chunks[i + 1][0].s - 0.05));
  const chunk = idx >= 0 ? chunks[idx] : null;
  if (!chunk || t > chunk[chunk.length - 1].e + 0.6) return null;
  const since = (t - chunk[0].s) * fps;
  const pop = interpolate(since, [0, 4], [0.9, 1], clamp);
  return (
    <AbsoluteFill style={{ justifyContent: "flex-start", alignItems: "center", paddingTop: 1330 }}>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", columnGap: 16, maxWidth: 960, transform: `scale(${pop})`, fontFamily: fonts.head, fontWeight: 700, fontSize: 60, textAlign: "center" }}>
        {chunk.map((w, i) => {
          const active = t >= w.s - 0.03 && t < (chunk[i + 1]?.s ?? w.e + 0.6);
          const isAcc = w.hook && acc.includes(norm(w.t));
          return (
            <span
              key={i}
              style={{
                color: colors.white,
                background: active ? (isAcc ? colors.terra : colors.sand) : isAcc ? "rgba(194,113,79,0.85)" : "transparent",
                padding: "2px 12px",
                borderRadius: 8,
                textShadow: active || isAcc ? "none" : "0 3px 14px rgba(0,0,0,0.8), 0 1px 3px rgba(0,0,0,0.9)",
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

const CtaScene: React.FC<{ scene: Scene; endF: number; body: number }> = ({ scene, endF, body }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const startF = Math.round(scene.start * fps);
  const p = usePop(startF + 2);
  const p2 = usePop(startF + 14);
  const pulse = 1 + 0.03 * Math.sin((frame - startF) / 6);
  if (frame < startF) return null;
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(50,49,50,0.55) 0%, rgba(50,49,50,0.35) 40%, rgba(50,49,50,0.8) 100%)", opacity: interpolate(frame, [startF, startF + 6], [0, 1], clamp) }} />
      <AbsoluteFill style={{ alignItems: "center", paddingTop: 330 }}>
        <Img src={staticFile("logo/de-goffaert-wit.svg")} style={{ width: 560, opacity: p, transform: `scale(${0.9 + 0.1 * p})` }} />
      </AbsoluteFill>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "flex-start", paddingTop: 1230, gap: 26, display: "flex", flexDirection: "column" }}>
        <div style={{ fontFamily: fonts.head, fontWeight: 700, fontSize: 56, color: colors.white, textAlign: "center", maxWidth: 900, lineHeight: 1.2, opacity: p2, textShadow: "0 3px 14px rgba(0,0,0,0.6)" }}>{CTA_TEXT[body]}</div>
        <div style={{ background: colors.terra, color: colors.white, fontFamily: fonts.head, fontWeight: 800, fontSize: 56, padding: "26px 64px", borderRadius: 999, transform: `scale(${p2 * pulse})`, boxShadow: "0 18px 50px rgba(0,0,0,0.4)" }}>Plan je afspraak</div>
        <div style={{ fontFamily: fonts.head, fontWeight: 600, fontSize: 44, color: colors.sand, opacity: p2 }}>degoffaert.nl</div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const getDuration = (body: number, hook: number, fps: number) => Math.ceil((getTiming(body, hook).end + TAIL) * fps);

export const GoffaertVideo: React.FC<VideoProps> = ({ body, hook }) => {
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame();
  const timing = getTiming(body, hook);
  const end = timing.end + TAIL;
  const F = (s: number) => Math.round(s * fps);
  const segs = buildSegments(body, hook, timing.scenes, end);
  const cta = timing.scenes.find((s) => s.id === "cta")!;
  const total = F(end);
  const kickIn = usePop(4);
  const kickOut = interpolate(frame, [F(timing.scenes[1].start) - 8, F(timing.scenes[1].start)], [0, 1], clamp);

  return (
    <AbsoluteFill style={{ backgroundColor: colors.ink }}>
      {segs.map((seg, i) => (
        <Sequence key={i} from={F(seg.from)} durationInFrames={Math.max(1, F(seg.to) - F(seg.from))}>
          <ClipSegment seg={seg} durationInFrames={Math.max(1, F(seg.to) - F(seg.from))} />
        </Sequence>
      ))}

      {/* Verloop boven en onder voor leesbaarheid */}
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(40,38,40,0.55) 0%, rgba(40,38,40,0) 24%, rgba(40,38,40,0) 58%, rgba(40,38,40,0.62) 100%)" }} />

      {/* Klein logo linksboven (verdwijnt in de CTA, waar het logo groot staat) */}
      <div style={{ position: "absolute", top: 80, left: 56, opacity: frame < F(cta.start) - 4 ? 1 : 0, filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.5))" }}>
        <Img src={staticFile("logo/de-goffaert-horizontaal-wit.svg")} style={{ width: 360 }} />
      </div>

      {/* Hook: label met doelgroep */}
      <div style={{ position: "absolute", top: 230, left: 56, opacity: kickIn * (1 - kickOut), transform: `translateY(${(1 - kickIn) * 30}px)` }}>
        <div style={{ background: colors.terra, color: colors.white, fontFamily: fonts.head, fontWeight: 700, fontSize: 40, padding: "12px 28px", borderRadius: 14 }}>{KICKER[body]}</div>
      </div>

      {timing.scenes.map((sc, i) => {
        const card = SCENE_CARDS[body][sc.id];
        if (!card) return null;
        const next = timing.scenes[i + 1]?.start ?? end;
        return <SceneCard key={sc.id} card={card} startF={F(sc.start) + 4} endF={F(next) + 4} />;
      })}

      <Captions scenes={timing.scenes} accent={HOOK_ACCENT[body][hook]} />
      <CtaScene scene={cta} endF={total} body={body} />

      <Audio src={staticFile(`vo/b${body}h${hook}.wav`)} />
      <Audio
        src={staticFile("muziek/goffaert-opbeurend.mp3")}
        volume={(f) => 0.1 * interpolate(f, [0, 24, total - 45, total], [0, 1, 1, 0], clamp)}
      />
    </AbsoluteFill>
  );
};
