import React from "react";
import { AbsoluteFill, Audio, Img, interpolate, OffthreadVideo, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { colors, fonts } from "./brand";
import clipInfo from "./clips.json";
import { CTA_TEXT, GRAPHICS, Graphic, HOOK_ACCENT, HOOK_CLIPS, SCENE_CLIPS } from "./config";
import { Icon } from "./icons";
import { appear, clamp, ease, getTiming, norm, Scene, useF, wordTime } from "./ui";

export type VideoProps = { body: number; hook: number };
export const TAIL = 2.4; // seconden na de laatste zin

// ---------- Achtergrondclips ----------
type Segment = { clip: string; from: number; to: number };

const buildSegments = (body: number, hook: number, scenes: Scene[], end: number): Segment[] => {
  const segs: Segment[] = [];
  scenes.forEach((sc, i) => {
    const sceneEnd = i + 1 < scenes.length ? scenes[i + 1].start - 0.2 : end;
    const list = sc.id === "hook" ? HOOK_CLIPS[`b${body}h${hook}`] : SCENE_CLIPS[`${body}:${sc.id}`];
    list.forEach(([clip, word, nth], k) => {
      const from = k === 0 ? (i === 0 ? 0 : sc.start - 0.2) : wordTime(sc, [word!, nth ?? 0]);
      const next = list[k + 1];
      const to = next ? wordTime(sc, [next[1]!, next[2] ?? 0]) : sceneEnd;
      segs.push({ clip, from, to });
    });
  });
  return segs;
};

const FADE = 10; // frames zachte overvloeiing bij elke clipwissel

const ClipSegment: React.FC<{ seg: Segment; frames: number }> = ({ seg, frames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const info = (clipInfo as Record<string, { w: number; h: number; x: number; y: number }>)[seg.clip];
  const dur = frames / fps;
  const rate = Math.min(1, 7.8 / dur); // clips zijn 8 s; langere stukken iets vertraagd
  const ratio = info.w / info.h;
  const loss = 1 - Math.min(ratio / (16 / 9), 16 / 9 / ratio);
  const fade = interpolate(frame, [0, FADE], [0, 1], clamp);
  const src = staticFile(`clips/${seg.clip}.mp4`);
  const cx = info.x + info.w / 2, cy = info.y + info.h / 2;
  const vid = (style: React.CSSProperties) => (
    <OffthreadVideo src={src} muted playbackRate={rate} style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080, transformOrigin: "0 0", ...style }} />
  );
  let inner: React.ReactNode;
  if (loss > 0.2) {
    // Te smal/breed beeld: uitgelicht in beeld + onscherpe vulling (geen zwarte balken)
    const sBg = 1.25;
    const s = 1920 / info.w;
    inner = (
      <>
        <AbsoluteFill style={{ filter: "blur(36px) brightness(0.7)" }}>{vid({ transform: `translate(${960 - 960 * sBg}px, ${540 - 540 * sBg}px) scale(${sBg})` })}</AbsoluteFill>
        {vid({ transform: `translate(${-info.x * s}px, ${540 - cy * s}px) scale(${s})` })}
      </>
    );
  } else {
    const s = Math.max(1920 / info.w, 1080 / info.h);
    inner = vid({ transform: `translate(${960 - cx * s}px, ${540 - cy * s}px) scale(${s})` });
  }
  return <AbsoluteFill style={{ opacity: fade, overflow: "hidden" }}>{inner}</AbsoluteFill>;
};

// ---------- Ondertitels ----------
const Captions: React.FC<{ scenes: Scene[] }> = ({ scenes }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const words = scenes.filter((s) => s.id !== "cta").flatMap((s) => s.words);
  const chunks: Scene["words"][] = [];
  let cur: Scene["words"] = [];
  words.forEach((w) => {
    cur.push(w);
    const len = cur.map((c) => c.t).join(" ").length;
    if (/[.,?!]$/.test(w.t) || cur.length >= 4 || len > 26) {
      chunks.push(cur);
      cur = [];
    }
  });
  if (cur.length) chunks.push(cur);
  const idx = chunks.findIndex((c, i) => t >= c[0].s - 0.05 && (i + 1 >= chunks.length || t < chunks[i + 1][0].s - 0.05));
  const chunk = idx >= 0 ? chunks[idx] : null;
  if (!chunk || t > chunk[chunk.length - 1].e + 0.5) return null;
  return (
    <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: 70 }}>
      <div style={{ display: "flex", gap: 14, padding: "12px 26px", borderRadius: 20, background: "rgba(28,39,43,0.82)", fontFamily: fonts.body, fontWeight: 800, fontSize: 58 }}>
        {chunk.map((w, i) => {
          const active = t >= w.s - 0.03 && t < (chunk[i + 1]?.s ?? w.e + 0.5);
          return (
            <span key={i} style={{ color: colors.white, background: active ? colors.bronze : "transparent", padding: "0 12px", borderRadius: 10 }}>
              {w.t}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ---------- Graphics ----------
const Panel: React.FC<{ children: React.ReactNode; dur: number; width?: number }> = ({ children, dur, width = 1100 }) => {
  const frame = useCurrentFrame();
  const outP = interpolate(frame, [dur - 12, dur], [1, 0], clamp);
  return (
    <AbsoluteFill style={{ padding: "120px 0 0 90px", alignItems: "flex-start", justifyContent: "flex-start" }}>
      <div style={{ width, opacity: outP, display: "flex", flexDirection: "column", gap: 22, alignItems: "flex-start" }}>{children}</div>
    </AbsoluteFill>
  );
};

const card: React.CSSProperties = { background: "rgba(41,55,61,0.95)", borderLeft: `12px solid ${colors.bronze}`, borderRadius: 20, boxShadow: "0 20px 60px rgba(0,0,0,0.38)" };

const Kicker: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ alignSelf: "flex-start", background: colors.bronze, color: colors.white, fontFamily: fonts.head, fontWeight: 800, fontSize: 36, letterSpacing: 4, textTransform: "uppercase", padding: "8px 24px", borderRadius: 8 }}>
    {children}
  </div>
);

const Title: React.FC<{ text: string; accent?: string[]; size?: number; frame: number }> = ({ text, accent = [], size = 96, frame }) => {
  const acc = accent.map(norm);
  return (
    <div style={{ ...card, padding: "26px 44px 30px 38px", fontFamily: fonts.head, fontWeight: 900, fontSize: size, lineHeight: 1.05, textTransform: "uppercase", color: colors.white, display: "flex", flexWrap: "wrap", columnGap: "0.28em", ...appear(frame, 6) }}>
      {text.split(" ").map((w, i) => (
        <span key={i} style={{ color: acc.includes(norm(w)) ? colors.bronzeLight : colors.white }}>{w}</span>
      ))}
    </div>
  );
};

const GraphicScene: React.FC<{ scene: Scene; g: Graphic; t0: number; dur: number }> = ({ scene, g, t0, dur }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const at = (k: import("./config").Key) => Math.round((wordTime(scene, k) - t0) * fps) - 4;
  const grid = (g.tiles?.length ?? 0) === 4;
  return (
    <Panel dur={dur}>
      {g.kicker && <Kicker>{g.kicker}</Kicker>}
      {g.title && <Title text={g.title} accent={g.accent} frame={frame} />}
      {g.stats && (
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
          {g.stats.map((s, i) => {
            const a = at(s.at);
            const v = s.count != null ? Math.round(interpolate(frame, [a, a + 22], [0, s.count], { ...clamp, easing: ease })) : s.value;
            return (
              <div key={i} style={{ ...card, ...appear(frame, a), padding: "22px 40px 26px 34px" }}>
                <div style={{ fontFamily: fonts.head, fontWeight: 900, fontSize: g.stats!.length > 2 ? 120 : 160, lineHeight: 1, color: colors.bronzeLight, fontVariantNumeric: "tabular-nums" }}>{v}</div>
                <div style={{ fontFamily: fonts.body, fontWeight: 700, fontSize: 46, color: colors.white, marginTop: 6 }}>{s.label}</div>
              </div>
            );
          })}
        </div>
      )}
      {g.tiles && (
        <div style={{ display: "grid", gridTemplateColumns: grid ? "1fr 1fr" : "auto", gap: 18, justifyItems: "start" }}>
          {g.tiles.map((tl, i) => (
            <div key={i} style={{ ...appear(frame, at(tl.at), 14, 20), ...card, display: "flex", alignItems: "center", gap: 24, padding: "14px 30px 14px 16px" }}>
              <div style={{ width: 108, height: 108, borderRadius: 18, background: colors.bronze, color: colors.white, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon name={tl.icon} size={72} />
              </div>
              <div>
                <div style={{ fontFamily: fonts.body, fontWeight: 800, fontSize: grid ? 40 : 52, color: colors.white, lineHeight: 1.1 }}>{tl.label}</div>
                {tl.sub && <div style={{ fontFamily: fonts.body, fontWeight: 600, fontSize: 34, color: colors.bronzeLight, marginTop: 4 }}>{tl.sub}</div>}
              </div>
            </div>
          ))}
        </div>
      )}
      {g.chips && (
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          {g.chips.map((c, i) => (
            <div key={i} style={{ ...appear(frame, at(c.at), 12, 16), background: colors.bronze, boxShadow: "0 12px 36px rgba(0,0,0,0.35)", color: colors.white, fontFamily: fonts.body, fontWeight: 800, fontSize: 50, padding: "12px 32px", borderRadius: 999 }}>
              {c.label}
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
};

const HookScene: React.FC<{ scene: Scene; accent: string[]; dur: number }> = ({ scene, accent, dur }) => {
  const frame = useCurrentFrame();
  const F = useF();
  const acc = accent.map(norm);
  const outP = interpolate(frame, [dur - 12, dur], [1, 0], clamp);
  const inP = interpolate(frame, [0, 14], [0, 1], { ...clamp, easing: ease });
  return (
    <AbsoluteFill style={{ padding: "150px 0 0 90px", alignItems: "flex-start", justifyContent: "flex-start" }}>
      <div style={{ width: 1280, background: "rgba(41,55,61,0.95)", borderLeft: `14px solid ${colors.bronze}`, borderRadius: 24, padding: "50px 60px 56px 54px", boxShadow: "0 30px 80px rgba(0,0,0,0.4)", opacity: inP * outP, display: "flex", flexDirection: "column", gap: 30 }}>
        <div style={{ alignSelf: "flex-start", background: colors.bronze, color: colors.white, fontFamily: fonts.head, fontWeight: 800, fontSize: 36, letterSpacing: 4, textTransform: "uppercase", padding: "8px 24px", borderRadius: 8 }}>
          Haarlem Business Center
        </div>
        <div style={{ fontFamily: fonts.head, fontWeight: 800, fontSize: scene.words.length > 17 ? 76 : 86, lineHeight: 1.12, color: colors.white, display: "flex", flexWrap: "wrap", columnGap: "0.28em", rowGap: 6 }}>
          {scene.words.map((w, i) => {
            const wa = F(w.s) - 3;
            const p = interpolate(frame, [wa, wa + 8], [0, 1], { ...clamp, easing: ease });
            const isAcc = acc.includes(norm(w.t));
            return (
              <span key={i} style={{ opacity: p, display: "inline-block", color: isAcc ? colors.bronzeLight : colors.white, borderBottom: isAcc ? `8px solid ${colors.bronze}` : "8px solid transparent" }}>
                {w.t}
              </span>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};

const LogoChip: React.FC<{ endF: number }> = ({ endF }) => {
  const frame = useCurrentFrame();
  const o = interpolate(frame, [0, 20, endF - 14, endF], [0, 1, 1, 0], clamp);
  return (
    <AbsoluteFill style={{ alignItems: "flex-end", justifyContent: "flex-start", padding: "44px 56px 0 0", opacity: o }}>
      <div style={{ background: colors.slate, borderRadius: 18, padding: "10px 24px", boxShadow: "0 12px 40px rgba(0,0,0,0.35)" }}>
        <Img src={staticFile("logo/hbc-logo.png")} style={{ width: 170, display: "block" }} />
      </div>
    </AbsoluteFill>
  );
};

const CtaScene: React.FC<{ body: number; knop: string; dur: number }> = ({ body, knop, dur }) => {
  const frame = useCurrentFrame();
  const bg = interpolate(frame, [0, 22], [0, 0.9], clamp);
  const t = CTA_TEXT[body];
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ background: colors.slate, opacity: bg }} />
      <AbsoluteFill style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 110, padding: "0 110px" }}>
        <div style={{ ...appear(frame, 8, 16) }}>
          <Img src={staticFile("logo/hbc-logo.png")} style={{ width: 560, display: "block" }} />
        </div>
        <div style={{ width: 880, display: "flex", flexDirection: "column", gap: 30 }}>
          <div style={{ ...appear(frame, 14, 16), fontFamily: fonts.head, fontWeight: 900, fontSize: 76, lineHeight: 1.06, textTransform: "uppercase", color: colors.white }}>{t.kop}</div>
          <div style={{ ...appear(frame, 22, 16), fontFamily: fonts.body, fontWeight: 600, fontSize: 42, lineHeight: 1.25, color: colors.cream }}>{t.sub}</div>
          <div style={{ ...appear(frame, 32, 16), alignSelf: "flex-start", display: "flex", alignItems: "center", gap: 22, background: colors.bronze, color: colors.white, fontFamily: fonts.head, fontWeight: 800, fontSize: 52, letterSpacing: 1, padding: "26px 52px", borderRadius: 16, boxShadow: "0 14px 40px rgba(0,0,0,0.35)" }}>
            {knop}
            <svg width="44" height="44" viewBox="0 0 44 44" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"><path d="M8 22h28M24 10l12 12-12 12" /></svg>
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const getDuration = (body: number, hook: number, fps: number) => Math.ceil((getTiming(body, hook).end + TAIL) * fps);

export const HbcVideo: React.FC<VideoProps> = ({ body, hook }) => {
  const { fps } = useVideoConfig();
  const timing = getTiming(body, hook);
  const end = timing.end + TAIL;
  const F = (s: number) => Math.round(s * fps);
  const segs = buildSegments(body, hook, timing.scenes, end);
  const cta = timing.scenes.find((s) => s.id === "cta")!;
  const ctaStart = cta.start - 0.2;

  return (
    <AbsoluteFill style={{ backgroundColor: colors.slate }}>
      {segs.map((seg, i) => {
        const nextFrom = segs[i + 1] ? F(segs[i + 1].from) : F(end);
        const from = F(seg.from);
        const frames = Math.max(1, nextFrom - from + FADE);
        return (
          <Sequence key={i} from={from} durationInFrames={frames}>
            <ClipSegment seg={seg} frames={frames} />
          </Sequence>
        );
      })}

      {/* Zacht verloop onder de ondertitels */}
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(28,39,43,0.25) 0%, rgba(28,39,43,0) 25%, rgba(28,39,43,0) 70%, rgba(28,39,43,0.5) 100%)" }} />

      {timing.scenes.map((sc, i) => {
        if (sc.id === "cta") return null;
        const t0 = i === 0 ? 0 : sc.start - 0.25;
        const next = timing.scenes[i + 1].start - 0.2;
        const dur = F(next) - F(t0);
        return (
          <Sequence key={sc.id} from={F(t0)} durationInFrames={dur}>
            {sc.id === "hook" ? (
              <HookScene scene={sc} accent={HOOK_ACCENT[`b${body}h${hook}`]} dur={dur} />
            ) : (
              <GraphicScene scene={sc} g={GRAPHICS[`${body}:${sc.id}`]} t0={t0} dur={dur} />
            )}
          </Sequence>
        );
      })}

      <Sequence from={0} durationInFrames={F(ctaStart) + 14}>
        <LogoChip endF={F(ctaStart) + 14} />
      </Sequence>

      <Captions scenes={timing.scenes} />

      <Sequence from={F(ctaStart)}>
        <CtaScene body={body} knop={timing.knop} dur={F(end) - F(ctaStart)} />
      </Sequence>

      <Audio src={staticFile(`vo/b${body}h${hook}.wav`)} />
      {/* Upbeat achtergrondmuziek (ElevenLabs Music): zacht onder de stem, na de laatste zin iets luider en dan uitfaden */}
      <Audio
        src={staticFile("muziek/achtergrond.mp3")}
        volume={(f) =>
          interpolate(f, [0, 20, F(timing.end), F(timing.end) + 15, F(end) - 30, F(end)], [0, 0.13, 0.13, 0.26, 0.26, 0], clamp)
        }
      />
    </AbsoluteFill>
  );
};
