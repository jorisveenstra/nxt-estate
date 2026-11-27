import React, { useEffect, useState } from "react";
import {
  AbsoluteFill,
  Audio,
  continueRender,
  delayRender,
  interpolate,
  OffthreadVideo,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { colors, FONT, FPS, PAUSE, TAIL } from "./brand";
import { Accent, BODY_PLAN, CLIP_SECONDS, HOOK_PLAN, Shot } from "./config";
import timingJson from "./timing.json";

type Word = [number, number, string];
type BodyTiming = {
  words: Word[];
  sentences: { start: number; end: number; first: number; count: number }[];
  end: number;
  hooks: Record<string, { words: Word[]; end: number }>;
};
const timing = timingJson as unknown as Record<string, BodyTiming>;

export const hookFrames = (b: number, h: number) => Math.ceil((timing[`b${b}`].hooks[String(h)].end + PAUSE) * FPS);
export const bodyFrames = (b: number) => Math.ceil((timing[`b${b}`].end + TAIL) * FPS);

// ---------- lettertype (lokaal, geen Google Fonts-fetch tijdens renderen) ----------
let fontsPromise: Promise<unknown> | null = null;
const loadFonts = () => {
  if (!fontsPromise) {
    fontsPromise = Promise.all(
      [400, 600, 700, 800].map((w) => {
        const f = new FontFace(FONT, `url(${staticFile(`fonts/Poppins-${w}.woff2`)}) format("woff2")`, { weight: String(w) });
        return f.load().then((l) => document.fonts.add(l));
      }),
    );
  }
  return fontsPromise;
};
const useFonts = () => {
  const [handle] = useState(() => delayRender("fonts"));
  useEffect(() => {
    loadFonts().then(() => continueRender(handle));
  }, [handle]);
};

// ---------- beeld ----------
type Cut = { clip: string; from: number; start: number; end: number }; // seconden binnen het segment

const splitShots = (shots: Shot[], start: number, end: number): Cut[] => {
  const len = (end - start) / shots.length;
  return shots.map(([clip, from], i) => ({ clip, from, start: start + i * len, end: start + (i + 1) * len }));
};

const Footage: React.FC<{ cuts: Cut[] }> = ({ cuts }) => (
  <AbsoluteFill style={{ backgroundColor: colors.ink }}>
    {cuts.map((c, i) => {
      const from = Math.round(c.start * FPS);
      const dur = Math.round(c.end * FPS) - from;
      const avail = CLIP_SECONDS[c.clip] - c.from - 0.1;
      // Langer dan de clip? Dan iets vertraagd afspelen (nooit stilstaand beeld of herhaling).
      const rate = Math.min(1, avail / (dur / FPS));
      return (
        <Sequence key={i} from={from} durationInFrames={dur} layout="none">
          <AbsoluteFill>
            <OffthreadVideo
              src={staticFile(`clips/${c.clip}.mp4`)}
              startFrom={Math.round(c.from * FPS)}
              playbackRate={rate}
              muted
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </AbsoluteFill>
        </Sequence>
      );
    })}
    {/* subtiele verloop-schaduw boven en onder voor leesbaarheid; geen paneel */}
    <AbsoluteFill
      style={{
        background:
          "linear-gradient(180deg, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0) 22%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.5) 100%)",
      }}
    />
  </AbsoluteFill>
);

// ---------- woordmerk ----------
const Wordmark: React.FC = () => (
  <div style={{ position: "absolute", top: 90, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center" }}>
    <div style={{ fontFamily: FONT, fontWeight: 600, fontSize: 34, letterSpacing: 9, color: colors.white, textShadow: "0 2px 10px rgba(0,0,0,0.5)" }}>
      TAMPAH BEACH VILLA'S
    </div>
    <div style={{ width: 120, height: 3, background: colors.gold, marginTop: 10, borderRadius: 2 }} />
  </div>
);

// ---------- ondertitels ----------
type Chunk = { start: number; end: number; words: Word[] };
const chunkWords = (words: Word[], segEnd: number): Chunk[] => {
  const out: Chunk[] = [];
  let cur: Word[] = [];
  const flush = () => {
    if (cur.length) out.push({ start: cur[0][0], end: 0, words: cur });
    cur = [];
  };
  for (const w of words) {
    cur.push(w);
    const chars = cur.map((x) => x[2]).join(" ").length;
    if (/[.,?!:;]$/.test(w[2]) || cur.length >= 3 || chars >= 17) flush();
  }
  flush();
  out.forEach((c, i) => {
    const last = c.words[c.words.length - 1][1];
    c.end = i + 1 < out.length ? Math.min(out[i + 1].start, last + 0.6) : Math.min(segEnd, last + 0.6);
  });
  return out;
};

const Captions: React.FC<{ words: Word[]; segEnd: number; big?: boolean }> = ({ words, segEnd, big }) => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const chunk = chunkWords(words, segEnd).find((c) => t >= c.start - 0.05 && t < c.end);
  if (!chunk) return null;
  const pop = spring({ frame: frame - Math.round(chunk.start * FPS), fps: FPS, config: { damping: 14, mass: 0.6 } });
  return (
    <div style={{ position: "absolute", left: 60, right: 60, top: big ? 1080 : 1150, display: "flex", justifyContent: "center" }}>
      <div
        style={{
          fontFamily: FONT,
          fontWeight: 800,
          fontSize: big ? 84 : 74,
          lineHeight: 1.15,
          textAlign: "center",
          color: colors.white,
          textShadow: "0 4px 18px rgba(0,0,0,0.75), 0 0 3px rgba(0,0,0,0.9)",
          transform: `scale(${0.92 + 0.08 * pop})`,
        }}
      >
        {chunk.words.map((w, i) => {
          const active = t >= w[0] - 0.03 && t < w[1] + 0.05;
          return (
            <span key={i} style={{ color: active ? colors.goldLight : colors.white }}>
              {w[2]}
              {i < chunk.words.length - 1 ? " " : ""}
            </span>
          );
        })}
      </div>
    </div>
  );
};

// ---------- grafische accenten (max ~35% van het beeld) ----------
const card: React.CSSProperties = {
  fontFamily: FONT,
  background: "rgba(26,26,26,0.62)",
  border: `2px solid ${colors.gold}`,
  borderRadius: 26,
  color: colors.white,
  padding: "26px 40px",
  backdropFilter: "blur(6px)",
};

const PinIcon: React.FC = () => (
  <svg width="46" height="58" viewBox="0 0 24 30">
    <path d="M12 0C5.4 0 0 5.2 0 11.7 0 20.4 12 30 12 30s12-9.6 12-18.3C24 5.2 18.6 0 12 0z" fill={colors.gold} />
    <circle cx="12" cy="11.5" r="4.6" fill={colors.white} />
  </svg>
);

const TrendIcon: React.FC<{ p: number }> = ({ p }) => (
  <svg width="120" height="80" viewBox="0 0 120 80">
    {[0, 1, 2, 3].map((i) => {
      const h = (20 + i * 18) * Math.min(1, Math.max(0, p * 4 - i));
      return <rect key={i} x={i * 30} y={80 - h} width="20" height={h} rx="4" fill={i === 3 ? colors.gold : colors.goldLight} />;
    })}
  </svg>
);

const AccentView: React.FC<{ a: Accent; dur: number }> = ({ a, dur }) => {
  const frame = useCurrentFrame();
  const s = (d = 0) => spring({ frame: frame - d, fps: FPS, config: { damping: 15, mass: 0.7 } });
  const enter = s(0);
  const base: React.CSSProperties = {
    position: "absolute",
    left: 0,
    right: 0,
    display: "flex",
    justifyContent: "center",
    opacity: enter,
    transform: `translateY(${(1 - enter) * 40}px)`,
  };
  const top = 300;
  if (a.kind === "pin")
    return (
      <div style={{ ...base, top }}>
        <div style={{ ...card, display: "flex", alignItems: "center", gap: 24 }}>
          <PinIcon />
          <div>
            <div style={{ fontWeight: 700, fontSize: 50 }}>{a.text}</div>
            {a.sub && <div style={{ fontWeight: 400, fontSize: 34, color: colors.cream }}>{a.sub}</div>}
          </div>
        </div>
      </div>
    );
  if (a.kind === "stat")
    return (
      <div style={{ ...base, top }}>
        <div style={{ ...card, textAlign: "center", padding: "26px 50px" }}>
          <div style={{ fontWeight: 400, fontSize: 32, letterSpacing: 2, color: colors.cream, textTransform: "uppercase" }}>{a.label}</div>
          <div style={{ fontWeight: 800, fontSize: 104, color: colors.goldLight, lineHeight: 1.1, transform: `scale(${0.85 + 0.15 * s(4)})` }}>{a.value}</div>
          {a.sub && <div style={{ fontWeight: 400, fontSize: 32, color: colors.cream }}>{a.sub}</div>}
        </div>
      </div>
    );
  if (a.kind === "chips")
    return (
      <div style={{ ...base, top, flexDirection: "column", alignItems: "center", gap: 16, opacity: 1, transform: "none" }}>
        {a.title && (
          <div style={{ fontFamily: FONT, fontWeight: 600, fontSize: 34, letterSpacing: 3, color: colors.goldLight, textTransform: "uppercase", textShadow: "0 2px 10px rgba(0,0,0,0.7)", opacity: enter }}>
            {a.title}
          </div>
        )}
        {a.items.map((it, i) => {
          const p = s(5 + i * 6);
          return (
            <div
              key={i}
              style={{
                fontFamily: FONT,
                fontWeight: 600,
                fontSize: 44,
                color: colors.white,
                background: "rgba(26,26,26,0.6)",
                border: `2px solid ${colors.gold}`,
                borderRadius: 60,
                padding: "12px 38px",
                display: "flex",
                alignItems: "center",
                gap: 16,
                opacity: p,
                transform: `translateX(${(1 - p) * -60}px)`,
              }}
            >
              <span style={{ width: 16, height: 16, borderRadius: 8, background: colors.gold, display: "inline-block" }} />
              {it}
            </div>
          );
        })}
      </div>
    );
  if (a.kind === "steps")
    return (
      <div style={{ ...base, top }}>
        <div style={{ ...card, width: 900 }}>
          <div style={{ fontWeight: 700, fontSize: 44, color: colors.goldLight, textAlign: "center", marginBottom: 22 }}>{a.title}</div>
          <div style={{ display: "flex", justifyContent: "space-between", position: "relative" }}>
            <div style={{ position: "absolute", top: 21, left: 80, height: 4, background: colors.gold, width: `${interpolate(frame, [6, 6 + dur * 0.6], [0, 660], { extrapolateRight: "clamp", extrapolateLeft: "clamp" })}px` }} />
            {a.items.map((it, i) => {
              const p = s(6 + i * Math.round((dur * 0.6) / 4));
              return (
                <div key={i} style={{ width: 200, display: "flex", flexDirection: "column", alignItems: "center", gap: 10, opacity: 0.3 + 0.7 * p }}>
                  <div style={{ width: 46, height: 46, borderRadius: 23, background: colors.gold, fontWeight: 700, fontSize: 28, display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${0.6 + 0.4 * p})` }}>
                    {i + 1}
                  </div>
                  <div style={{ fontWeight: 500, fontSize: 28, textAlign: "center" }}>{it}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  if (a.kind === "trend")
    return (
      <div style={{ ...base, top }}>
        <div style={{ ...card, display: "flex", alignItems: "center", gap: 30 }}>
          <TrendIcon p={interpolate(frame, [4, 40], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })} />
          <div style={{ maxWidth: 640 }}>
            <div style={{ fontWeight: 700, fontSize: 44, lineHeight: 1.15 }}>{a.text}</div>
            {a.sub && <div style={{ fontWeight: 400, fontSize: 32, color: colors.cream, marginTop: 6 }}>{a.sub}</div>}
          </div>
        </div>
      </div>
    );
  if (a.kind === "note")
    return (
      <div style={{ ...base, top }}>
        <div style={{ fontFamily: FONT, fontWeight: 600, fontSize: 42, color: colors.ink, background: colors.goldLight, borderRadius: 60, padding: "14px 40px" }}>{a.text}</div>
      </div>
    );
  // cta
  const bob = Math.sin(frame / 6) * 10;
  return (
    <div style={{ ...base, top: 1480, flexDirection: "column", alignItems: "center", gap: 18 }}>
      <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 46, color: colors.white, background: colors.gold, borderRadius: 70, padding: "24px 54px", boxShadow: "0 10px 30px rgba(0,0,0,0.35)", transform: `scale(${0.96 + 0.04 * Math.sin(frame / 8)})` }}>
        {a.text}
      </div>
      <svg width="60" height="60" viewBox="0 0 24 24" style={{ transform: `translateY(${bob}px)` }}>
        <path d="M12 4v14M5 12l7 7 7-7" stroke={colors.white} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
};

const Accents: React.FC<{ items: { a: Accent; start: number; end: number }[] }> = ({ items }) => (
  <>
    {items.map((it, i) => {
      const from = Math.round(it.start * FPS);
      const dur = Math.round(it.end * FPS) - from;
      return dur > 0 ? (
        <Sequence key={i} from={from} durationInFrames={dur} layout="none">
          <AccentView a={it.a} dur={dur} />
        </Sequence>
      ) : null;
    })}
  </>
);

// ---------- segmenten ----------
export const HookPart: React.FC<{ body: number; hook: number }> = ({ body, hook }) => {
  useFonts();
  const ht = timing[`b${body}`].hooks[String(hook)];
  const end = hookFrames(body, hook) / FPS;
  const plan = HOOK_PLAN[body][hook];
  return (
    <AbsoluteFill>
      <Footage cuts={splitShots(plan.shots, 0, end)} />
      <Wordmark />
      {plan.accent && <Accents items={[{ a: plan.accent, start: 0.6, end }]} />}
      <Captions words={ht.words} segEnd={end} big />
    </AbsoluteFill>
  );
};

export const BodyPart: React.FC<{ body: number }> = ({ body }) => {
  useFonts();
  const bt = timing[`b${body}`];
  const end = bodyFrames(body) / FPS;
  const plan = BODY_PLAN[body];
  const bounds = bt.sentences.map((s, i) => [i === 0 ? 0 : Math.max(0, s.start - 0.08), i + 1 < bt.sentences.length ? bt.sentences[i + 1].start - 0.08 : end]);
  const cuts = plan.flatMap((p, i) => splitShots(p.shots, bounds[i][0], bounds[i][1]));
  const acc = plan.flatMap((p, i) => (p.accent ? [{ a: p.accent, start: bounds[i][0] + 0.15, end: bounds[i][1] }] : []));
  return (
    <AbsoluteFill>
      <Footage cuts={cuts} />
      <Wordmark />
      <Accents items={acc} />
      <Captions words={bt.words} segEnd={end} />
    </AbsoluteFill>
  );
};

// Volledige advertentie (hook + body) met voice-over en muziek, voor bekijken/bewerken in Remotion Studio.
// De eindrender plakt de los gerenderde segmenten en mixt dezelfde audio met ffmpeg (scripts/render.py).
export const FullAd: React.FC<{ body: number; hook: number; audio?: boolean }> = ({ body, hook, audio = true }) => {
  const hf = hookFrames(body, hook);
  const total = hf + bodyFrames(body);
  return (
    <AbsoluteFill>
      <Sequence durationInFrames={hf}>
        <HookPart body={body} hook={hook} />
      </Sequence>
      <Sequence from={hf}>
        <BodyPart body={body} />
      </Sequence>
      {audio && (
        <>
          <Audio src={staticFile(`vo/b${body}h${hook}-hook.mp3`)} />
          <Sequence from={hf}>
            <Audio src={staticFile(`vo/b${body}-body.mp3`)} />
          </Sequence>
          <Audio
            src={staticFile("music/muziek.mp3")}
            volume={(f) => 0.13 * interpolate(f, [0, 15, total - 45, total], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}
          />
        </>
      )}
    </AbsoluteFill>
  );
};
