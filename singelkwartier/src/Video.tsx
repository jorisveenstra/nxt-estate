import React, { useEffect, useState } from "react";
import { AbsoluteFill, Audio, Img, OffthreadVideo, Sequence, Series, continueRender, delayRender, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { colors, FONT, FPS, loadFonts } from "./brand";
import { BODY_CLIPS, CALLOUTS, Callout, END_CARD, HOOK_CLIPS, Word, bodyData, bodyFrames, buildCuts, clipFrames, hookData, hookFrames, secToF } from "./config";

const useFonts = () => {
  const [h] = useState(() => delayRender("fonts"));
  useEffect(() => {
    loadFonts();
    Promise.all([500, 600, 700, 800].map((w) => document.fonts.load(`${w} 40px ${FONT}`))).then(() => continueRender(h));
  }, [h]);
};

// ---------- beeld ----------
const Footage: React.FC<{ files: string[]; total: number }> = ({ files, total }) => (
  <>
    {buildCuts(files, total).map((c, i) => (
      <Sequence key={i} from={c.from} durationInFrames={c.dur} layout="none">
        <AbsoluteFill>
          <OffthreadVideo src={staticFile(`clips/${c.file}`)} muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </AbsoluteFill>
      </Sequence>
    ))}
  </>
);

const Shade: React.FC = () => (
  <AbsoluteFill style={{ background: "linear-gradient(to bottom, rgba(29,41,61,0.35) 0%, rgba(29,41,61,0) 18%, rgba(29,41,61,0) 52%, rgba(29,41,61,0.55) 100%)" }} />
);

const Logo: React.FC = () => (
  <Img src={staticFile("logo.png")} style={{ position: "absolute", left: 44, top: 50, width: 120, padding: "10px 14px", borderRadius: 28, background: "rgba(29,41,61,0.88)", boxSizing: "content-box" }} />
);

const Progress: React.FC<{ total: number; offset?: number }> = ({ total }) => {
  const f = useCurrentFrame();
  return <div style={{ position: "absolute", left: 0, top: 0, height: 10, width: `${(f / total) * 100}%`, background: colors.goldLight }} />;
};

// ---------- ondertitels ----------
type Group = { s: number; e: number; words: Word[] };
const groupWords = (words: Word[]): Group[] => {
  const g: Group[] = [];
  let cur: Word[] = [];
  const flush = () => {
    if (cur.length) g.push({ s: cur[0][0], e: cur[cur.length - 1][1], words: cur });
    cur = [];
  };
  for (const w of words) {
    cur.push(w);
    const len = cur.map((x) => x[2]).join(" ").length;
    if (/[.!?,:]$/.test(w[2]) || cur.length >= 3 || len > 22) flush();
  }
  flush();
  return g;
};

const Captions: React.FC<{ words: Word[]; y: number }> = ({ words, y }) => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const groups = React.useMemo(() => groupWords(words), [words]);
  const idx = groups.findIndex((g, i) => t >= g.s - 0.04 && t < (groups[i + 1] ? groups[i + 1].s - 0.04 : g.e + 0.4));
  if (idx < 0) return null;
  const g = groups[idx];
  const pop = spring({ frame: f - secToF(g.s), fps: FPS, config: { damping: 18, stiffness: 220 }, durationInFrames: 10 });
  return (
    <div style={{ position: "absolute", left: 60, right: 60, top: y, textAlign: "center", transform: `scale(${0.92 + 0.08 * pop})`, fontFamily: FONT, fontWeight: 800, fontSize: 84, lineHeight: 1.12, color: colors.white, textShadow: "0 3px 0 rgba(29,41,61,0.9), 0 0 22px rgba(29,41,61,0.85), 0 0 6px rgba(0,0,0,0.6)" }}>
      {g.words.map((w, i) => (
        <span key={i} style={{ color: t >= w[0] - 0.02 && t < w[1] + 0.02 ? colors.goldLight : colors.white, marginRight: 18, display: "inline-block" }}>
          {w[2].replace(/[.,:]$/, "")}
        </span>
      ))}
    </div>
  );
};

// ---------- kaders ----------
const Icon: React.FC<{ k: Callout["icon"] }> = ({ k }) => {
  const p = { fill: "none", stroke: colors.navy, strokeWidth: 2.6, strokeLinecap: "round", strokeLinejoin: "round" } as const;
  const paths: Record<Callout["icon"], React.ReactNode> = {
    pin: <><path d="M12 21s-6-5.6-6-10.2A6 6 0 0 1 18 10.8C18 15.4 12 21 12 21Z" {...p} /><circle cx="12" cy="10.5" r="2.2" {...p} /></>,
    home: <path d="M4 11 12 4l8 7v9H4Zm5 9v-6h6v6" {...p} />,
    check: <path d="m5 12.5 4.5 4.5L19 7" {...p} />,
    box: <path d="M4 8l8-4 8 4v9l-8 4-8-4Zm0 0 8 4 8-4M12 12v9" {...p} />,
    car: <><path d="M4 16v-4l2-5h12l2 5v4M4 16h16M4 16v2m16-2v2" {...p} /><circle cx="8" cy="13" r=".6" {...p} /><circle cx="16" cy="13" r=".6" {...p} /></>,
    wave: <path d="M2 9c3-3 5 3 8 0s5 3 8 0 3-1 4-1M2 15c3-3 5 3 8 0s5 3 8 0 3-1 4-1" {...p} />,
    euro: <path d="M17 6.5A6 6 0 1 0 17 17.5M5 10h9M5 14h9" {...p} />,
    key: <><circle cx="8" cy="12" r="3.5" {...p} /><path d="M11.5 12H21m-3 0v3m-3-3v2" {...p} /></>,
    ruler: <path d="M3 8h18v8H3Zm4 0v3m4-3v4m4-4v3m4-3v4" {...p} />,
  };
  return <svg width="38" height="38" viewBox="0 0 24 24">{paths[k]}</svg>;
};

const Chip: React.FC<{ c: Callout; start: number; dur: number; y: number }> = ({ c, start, dur, y }) => {
  const f = useCurrentFrame();
  const inn = spring({ frame: f - start, fps: FPS, config: { damping: 15, stiffness: 190 }, durationInFrames: 14 });
  const out = interpolate(f, [start + dur - 8, start + dur], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  if (f < start || f > start + dur) return null;
  return (
    <div style={{ position: "absolute", left: 44, top: y, display: "flex", alignItems: "center", gap: 16, padding: "12px 34px 12px 14px", borderRadius: 80, background: "rgba(29,41,61,0.9)", border: `3px solid ${colors.gold}`, fontFamily: FONT, fontWeight: 700, fontSize: 44, color: colors.white, opacity: out, transform: `translateX(${(1 - inn) * -80}px) scale(${0.9 + 0.1 * inn})`, transformOrigin: "left center", boxShadow: "0 8px 24px rgba(0,0,0,0.35)" }}>
      <span style={{ width: 62, height: 62, borderRadius: 31, background: colors.goldLight, display: "flex", alignItems: "center", justifyContent: "center" }}><Icon k={c.icon} /></span>
      {c.text}
    </div>
  );
};

const Callouts: React.FC<{ b: number }> = ({ b }) => {
  const words = bodyData(b).words;
  let from = 0;
  const items: { c: Callout; start: number }[] = [];
  for (const c of CALLOUTS[`b${b}`]) {
    const i = words.findIndex((w, k) => k >= from && w[2].toLowerCase().startsWith(c.w));
    if (i < 0) throw new Error(`callout ${c.w} niet gevonden`);
    items.push({ c, start: secToF(words[i][0]) - 3 });
    from = i + 1;
  }
  return <>{items.map((it, i) => <Chip key={i} c={it.c} start={it.start} dur={Math.min(78, (items[i + 1]?.start ?? 1e9) - it.start - 4)} y={330} />)}</>;
};

// ---------- onderdelen ----------
export const HookPart: React.FC<{ b: number; h: number }> = ({ b, h }) => {
  useFonts();
  const total = hookFrames(b, h);
  const d = hookData(b, h);
  const f = useCurrentFrame();
  const pop = spring({ frame: f - 6, fps: FPS, config: { damping: 15, stiffness: 190 }, durationInFrames: 14 });
  const out = interpolate(f, [60, 68], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ background: colors.navy }}>
      <Footage files={HOOK_CLIPS[`b${b}h${h}`]} total={total} />
      <Shade />
      <Logo />
      <div style={{ position: "absolute", left: 44, top: 330, padding: "12px 34px", borderRadius: 80, background: "rgba(29,41,61,0.9)", border: `3px solid ${colors.gold}`, fontFamily: FONT, fontWeight: 700, fontSize: 44, color: colors.white, opacity: out, transform: `scale(${0.9 + 0.1 * pop})`, transformOrigin: "left center" }}>Singelkwartier Vlissingen</div>
      <Captions words={d.words} y={1180} />
      <Progress total={total} />
    </AbsoluteFill>
  );
};

export const BodyPart: React.FC<{ b: number }> = ({ b }) => {
  useFonts();
  const total = bodyFrames(b);
  const d = bodyData(b);
  const cta = secToF(d.ctaStart);
  const f = useCurrentFrame();
  const endPop = spring({ frame: f - cta - 6, fps: FPS, config: { damping: 14, stiffness: 160 }, durationInFrames: 18 });
  const endClip = clipFrames(END_CARD);
  return (
    <AbsoluteFill style={{ background: colors.navy }}>
      <Sequence from={0} durationInFrames={cta} layout="none">
        <Footage files={BODY_CLIPS[`b${b}`]} total={cta} />
        <Shade />
      </Sequence>
      <Sequence from={cta} durationInFrames={endClip} layout="none">
        <AbsoluteFill><OffthreadVideo src={staticFile(`clips/${END_CARD}`)} muted style={{ width: "100%", height: "100%", objectFit: "cover" }} /></AbsoluteFill>
      </Sequence>
      <Sequence from={cta + endClip} layout="none">
        <AbsoluteFill><Img src={staticFile("eindkaart-last.png")} style={{ width: "100%", height: "100%", objectFit: "cover" }} /></AbsoluteFill>
      </Sequence>
      {f < cta ? <Logo /> : null}
      {f < cta ? <Callouts b={b} /> : null}
      <Captions words={d.words.filter((w) => w[0] < d.ctaStart - 0.01)} y={1180} />
      <Captions words={d.words.filter((w) => w[0] >= d.ctaStart - 0.01)} y={1470} />
      {f >= cta ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: 1740, display: "flex", justifyContent: "center", transform: `scale(${0.85 + 0.15 * endPop})`, opacity: endPop }}>
          <div style={{ padding: "22px 54px", borderRadius: 90, background: colors.copper, color: colors.white, fontFamily: FONT, fontWeight: 700, fontSize: 48, boxShadow: "0 10px 28px rgba(0,0,0,0.4)" }}>Bekijk het actuele aanbod  →</div>
        </div>
      ) : null}
      <Progress total={total} />
    </AbsoluteFill>
  );
};

// Hele video (hook + body + audio) voor Studio en als referentie; gerenderd wordt hook en body los.
export const FullVideo: React.FC<{ b: number; h: number }> = ({ b, h }) => (
  <AbsoluteFill>
    <Series>
      <Series.Sequence durationInFrames={hookFrames(b, h)}><HookPart b={b} h={h} /></Series.Sequence>
      <Series.Sequence durationInFrames={bodyFrames(b)}><BodyPart b={b} /></Series.Sequence>
    </Series>
    <Audio src={staticFile(`audio/b${b}h${h}.m4a`)} />
  </AbsoluteFill>
);
