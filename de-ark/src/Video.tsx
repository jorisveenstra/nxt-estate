import React from "react";
import { AbsoluteFill, Audio, Easing, Img, interpolate, OffthreadVideo, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { colors, fonts, loadFonts } from "./brand";
import { ACCENT, BODIES, HOOK_CLIPS } from "./config";
import timing from "./timing.json";

export type VideoProps = { body: number; hook: number };

type Timing = { words: [number, number, string][]; hookWords: number; hookEnd: number; sentenceStarts: number[]; end: number };
const T = timing as unknown as Record<string, Timing>;

export const TAIL = 2.2; // seconden na de laatste zin
const CLIP_LEN = 8;
const CTA_PANEL_AT = 0.2; // seconden voor de CTA-zin

export type Part = "full" | "hook" | "body";

// Hook en body worden apart gerenderd (de body één keer per body) en daarna met ffmpeg aan elkaar gezet.
// De body-tijden zijn relatief aan het eerste woord van de body, zodat ze voor elke hook gelijk zijn.
const bodyStart = (key: string) => Math.max(0, T[key].words[T[key].sentenceStarts[0]][0] - 0.08);
const partRange = (key: string, part: Part): [number, number] => {
  const t = T[key];
  if (part === "hook") return [0, bodyStart(key)];
  if (part === "body") {
    const ref = `b${key.slice(1).split("h")[0]}h1`;
    return [bodyStart(ref), T[ref].end + TAIL];
  }
  return [0, t.end + TAIL];
};
export const getDuration = (key: string, fps: number, part: Part = "full") => {
  const [a, b] = partRange(key, part);
  return Math.round((b - a) * fps);
};

type Segment = { clip: string; from: number; to: number; offset: number };

// Harde sneden op het eerste woord van elke zin; een hergebruikte clip begint verderop in de clip
const buildSegments = (key: string, body: number, hook: number, part: Part): Segment[] => {
  const t = T[key];
  const cfg = BODIES[body];
  const cuts = [0, ...t.sentenceStarts.map((i) => Math.max(0, t.words[i][0] - 0.08)), t.end + TAIL];
  const clips = [HOOK_CLIPS[body][hook], ...cfg.clips];
  return clips.slice(0, cuts.length - 1).map((clip, i) => {
    const dur = cuts[i + 1] - cuts[i];
    // De hook speelt het laatste stuk van zijn clip, zodat dezelfde clip in de body niet identiek herhaalt
    const offset = i === 0 && cfg.clips.includes(clip) ? Math.max(0, CLIP_LEN - 0.2 - dur) : 0;
    return { clip, from: cuts[i], to: cuts[i + 1], offset };
  });
};

const ClipSegment: React.FC<{ seg: Segment; durationInFrames: number }> = ({ seg, durationInFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const dur = durationInFrames / fps;
  const avail = CLIP_LEN - 0.15 - seg.offset;
  const rate = Math.min(1, avail / dur);
  // Rustige, continue beweging binnen één shot (geen overgang)
  const scale = interpolate(frame, [0, durationInFrames], [1.0, 1.06], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ transform: `scale(${scale})` }}>
      <OffthreadVideo src={staticFile(`clips/${seg.clip}.mp4`)} muted playbackRate={rate} startFrom={Math.round(seg.offset * fps)} />
    </AbsoluteFill>
  );
};

const Badge: React.FC<{ pop?: boolean }> = ({ pop: animate = true }) => {
  const frame = useCurrentFrame();
  const pop = animate ? spring({ frame, fps: 30, config: { damping: 14 } }) : 1;
  return (
    <div style={{ position: "absolute", top: 150, left: 56, transform: `scale(${pop})`, transformOrigin: "left top", fontFamily: fonts.head, fontWeight: 700, color: colors.white, background: colors.navy, borderLeft: `8px solid ${colors.gold}`, padding: "12px 26px 12px 20px", borderRadius: 6, fontSize: 40, letterSpacing: 1 }}>
      DE ARK <span style={{ fontFamily: fonts.sans, fontWeight: 400, color: colors.goldLight, fontSize: 30, marginLeft: 10 }}>SLUISKIL</span>
    </div>
  );
};

const FactChip: React.FC<{ tekst: string; durationInFrames: number }> = ({ tekst, durationInFrames }) => {
  const frame = useCurrentFrame();
  const inn = spring({ frame, fps: 30, config: { damping: 16, stiffness: 140 } });
  const out = interpolate(frame, [durationInFrames - 8, durationInFrames], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div style={{ position: "absolute", top: 262, left: 56, right: 56, display: "flex", opacity: out, transform: `translateX(${(1 - inn) * -80}px)` }}>
      <div style={{ background: "rgba(16,38,56,0.88)", border: `3px solid ${colors.gold}`, color: colors.white, fontFamily: fonts.sans, fontWeight: 700, fontSize: 44, lineHeight: 1.15, padding: "14px 26px", borderRadius: 10, boxShadow: "0 8px 30px rgba(0,0,0,0.35)" }}>
        <span style={{ color: colors.goldLight }}>◆ </span>
        {tekst}
      </div>
    </div>
  );
};

// Ondertitels: korte groepjes woorden, het gesproken woord licht op
const Captions: React.FC<{ t: Timing; hookEnd: number; ctaAt: number; t0: number }> = ({ t, hookEnd, ctaAt, t0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const now = frame / fps + t0;
  const chunks: [number, number, string][][] = [];
  let cur: [number, number, string][] = [];
  t.words.forEach((w, i) => {
    cur.push(w);
    const len = cur.map((c) => c[2]).join(" ").length;
    if (/[.,?!:]$/.test(w[2]) || cur.length >= 4 || len > 22 || i === t.hookWords - 1) {
      chunks.push(cur);
      cur = [];
    }
  });
  if (cur.length) chunks.push(cur);
  const idx = chunks.findIndex((c, i) => now >= c[0][0] - 0.05 && (i + 1 >= chunks.length || now < chunks[i + 1][0][0] - 0.05));
  const chunk = idx >= 0 ? chunks[idx] : null;
  if (!chunk || now > chunk[chunk.length - 1][1] + 0.5) return null;
  const since = (now - chunk[0][0]) * fps;
  const pop = interpolate(since, [0, 4], [0.9, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const inHook = now < hookEnd + 0.1;
  return (
    <div style={{ position: "absolute", left: 50, right: 50, top: inHook ? 1080 : now >= ctaAt ? 880 : 1160, textAlign: "center", transform: `scale(${pop})`, fontFamily: fonts.head, fontWeight: 700, fontSize: inHook ? 84 : 70, lineHeight: 1.15, color: colors.white, textShadow: "0 3px 14px rgba(0,0,0,0.95), 0 0 6px rgba(0,0,0,0.95), 0 0 2px rgba(0,0,0,1)" }}>
      {chunk.map((w, i) => {
        const active = now >= w[0] - 0.02;
        const accent = ACCENT.test(w[2].replace(/^[„"“]/, ""));
        return (
          <span key={i} style={{ color: accent ? colors.goldLight : colors.white, opacity: active ? 1 : 0.7 }}>
            {w[2]}{" "}
          </span>
        );
      })}
    </div>
  );
};

// Slot: knop + makelaarslogo onderin, alleen tijdens de CTA
const CtaPanel: React.FC = () => {
  const frame = useCurrentFrame();
  const inn = spring({ frame, fps: 30, config: { damping: 15, stiffness: 120 } });
  const nudge = Math.sin(frame / 6) * 8;
  return (
    <div style={{ position: "absolute", left: 40, right: 40, bottom: 330, transform: `translateY(${(1 - inn) * 260}px)`, background: colors.navy, border: `3px solid ${colors.gold}`, borderRadius: 18, padding: "34px 36px 30px", textAlign: "center", boxShadow: "0 12px 40px rgba(0,0,0,0.4)" }}>
      <div style={{ fontFamily: fonts.head, fontWeight: 700, fontSize: 54, color: colors.white, lineHeight: 1.15 }}>Plan een afspraak met onze makelaar</div>
      <div style={{ margin: "26px auto 24px", width: 640, padding: "20px 0", borderRadius: 60, background: colors.gold, color: colors.white, fontFamily: fonts.sans, fontWeight: 700, fontSize: 46, letterSpacing: 1, transform: `translateY(${nudge}px)` }}>Klik op de knop ↓</div>
      <div style={{ display: "inline-block", background: colors.cream, borderRadius: 10, padding: "14px 26px" }}>
        <Img src={staticFile("logo/vermeulen.svg")} style={{ height: 46, display: "block" }} />
      </div>
    </div>
  );
};

export const DeArkVideo: React.FC<VideoProps & { part?: Part }> = ({ body, hook, part = "full" }) => {
  loadFontsOnce();
  const key = part === "body" ? `b${body}h1` : `b${body}h${hook}`;
  const t = T[key];
  const { fps, durationInFrames } = useVideoConfig();
  const [t0, t1] = partRange(key, part);
  const segs = buildSegments(key, body, hook, part).filter((s) => s.to > t0 + 0.001 && s.from < t1 - 0.001);
  const sentenceTimes = [0, ...t.sentenceStarts.map((i) => t.words[i][0])];
  const cfg = BODIES[body];
  const musicVol = (f: number) => interpolate(f, [0, 20, durationInFrames - 60, durationInFrames], [0, 0.17, 0.17, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const ctaAbs = t.words[t.sentenceStarts[t.sentenceStarts.length - 1]][0] - CTA_PANEL_AT;
  const sec = (x: number) => Math.round((x - t0) * fps);
  return (
    <AbsoluteFill style={{ background: colors.deep }}>
      {segs.map((s, i) => {
        const from = sec(Math.max(s.from, t0));
        const to = sec(Math.min(s.to, t1));
        return (
          <Sequence key={i} from={from} durationInFrames={Math.max(1, to - from)}>
            <ClipSegment seg={s} durationInFrames={Math.max(1, to - from)} />
          </Sequence>
        );
      })}
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(16,38,56,0.35) 0%, rgba(16,38,56,0) 22%, rgba(16,38,56,0) 40%, rgba(16,38,56,0.62) 100%)" }} />
      <Badge pop={part !== "body"} />
      {part !== "hook" &&
        cfg.chips.map((c, i) => {
          const from = sec(sentenceTimes[c.zin + 1] + 0.1);
          const end = sec((sentenceTimes[c.zin + 2] ?? t.end) - 0.15);
          return end > from + 10 ? (
            <Sequence key={i} from={from} durationInFrames={end - from}>
              <FactChip tekst={c.tekst} durationInFrames={end - from} />
            </Sequence>
          ) : null;
        })}
      <Captions t={t} hookEnd={t.hookEnd} ctaAt={ctaAbs} t0={t0} />
      {part !== "hook" && (
        <Sequence from={sec(ctaAbs)}>
          <CtaPanel />
        </Sequence>
      )}
      {part === "full" && <Audio src={staticFile(`vo/${key}.wav`)} />}
      {part === "full" && <Audio src={staticFile("muziek/muziek.mp3")} volume={musicVol} />}
    </AbsoluteFill>
  );
};

let fontsLoaded = false;
const loadFontsOnce = () => {
  if (fontsLoaded) return;
  fontsLoaded = true;
  loadFonts();
};
