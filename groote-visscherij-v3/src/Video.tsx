import React, { useEffect, useState } from "react";
import { AbsoluteFill, continueRender, delayRender, Easing, Img, interpolate, OffthreadVideo, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { chamfer, colors, fonts } from "./brand";
import clipLen from "./clips.json";
import timing from "./timing.json";
import config from "../scripts/config.json";

const T = timing as any, C = config as any, L = clipLen as Record<string, number>;

const useFonts = () => {
  const [h] = useState(() => delayRender("fonts"));
  useEffect(() => {
    Promise.all([
      new FontFace("GelasioLocal", `url(${staticFile("fonts/gelasio-700.woff2")})`, { weight: "100 900" }).load(),
      new FontFace("InstrumentLocal", `url(${staticFile("fonts/instrument-700.woff2")})`, { weight: "100 900" }).load(),
    ]).then((fs) => { fs.forEach((f) => document.fonts.add(f)); continueRender(h); }).catch(() => continueRender(h));
  }, [h]);
};

// Harde knippen: een lijst clips wordt over [from,to] verdeeld in stukken van max. de cliplengte.
type Seg = { clip: string; from: number; to: number };
const planClips = (clips: string[], from: number, to: number): Seg[] => {
  const segs: Seg[] = []; let t = from, i = 0;
  while (t < to - 0.01) {
    const clip = clips[i % clips.length], len = Math.min(L[clip] - 0.1, 3.6);
    const end = Math.min(to, t + len);
    segs.push({ clip, from: t, to: end }); t = end; i++;
  }
  // geen te korte laatste stuk
  if (segs.length > 1 && segs[segs.length - 1].to - segs[segs.length - 1].from < 0.8) { const l = segs.pop()!; segs[segs.length - 1].to = l.to; }
  return segs;
};

const Footage: React.FC<{ segs: Seg[] }> = ({ segs }) => {
  const { fps } = useVideoConfig();
  return (
    <>
      {segs.map((s, i) => {
        const from = Math.round(s.from * fps), dur = Math.max(1, Math.round(s.to * fps) - from);
        return (
          <Sequence key={i} from={from} durationInFrames={dur}>
            <AbsoluteFill><OffthreadVideo src={staticFile(`clips/${s.clip}.mp4`)} muted style={{ width: "100%", height: "100%", objectFit: "cover" }} /></AbsoluteFill>
          </Sequence>
        );
      })}
    </>
  );
};

const Chip: React.FC<{ at: number; out: number; top: number; children: React.ReactNode; dark?: boolean }> = ({ at, out, top, children, dark }) => {
  const frame = useCurrentFrame(); const { fps } = useVideoConfig();
  const p = spring({ frame: frame - at, fps, config: { damping: 14, stiffness: 180 } });
  const o = interpolate(frame, [out - 6, out], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div style={{ position: "absolute", top, left: 70, opacity: Math.min(1, p * 1.5) * o, transform: `translateX(${(1 - p) * -60}px)`,
      background: dark ? colors.olive : colors.cream, color: dark ? colors.white : colors.ink, clipPath: chamfer(16), padding: "16px 30px",
      fontFamily: fonts.sans, fontWeight: 700, fontSize: 46, lineHeight: 1.1, maxWidth: 800 }}>{children}</div>
  );
};

const Logo: React.FC = () => <Img src={staticFile("logo-licht.svg")} style={{ position: "absolute", top: 80, left: 70, width: 230, filter: "brightness(0) invert(1)" }} />;

type W = { t: string; s: number; e: number };
const Captions: React.FC<{ words: W[] }> = ({ words }) => {
  const frame = useCurrentFrame(); const { fps } = useVideoConfig(); const t = frame / fps;
  const chunks: W[][] = []; let cur: W[] = [];
  words.forEach((w) => { cur.push(w); if (/[.,?!:]$/.test(w.t) || cur.length >= 4 || cur.map((c) => c.t).join(" ").length > 20) { chunks.push(cur); cur = []; } });
  if (cur.length) chunks.push(cur);
  const idx = chunks.findIndex((c, i) => t >= c[0].s - 0.05 && (i + 1 >= chunks.length || t < chunks[i + 1][0].s - 0.05));
  const ch = idx >= 0 ? chunks[idx] : null;
  if (!ch || t > ch[ch.length - 1].e + 0.6) return null;
  return (
    <AbsoluteFill style={{ justifyContent: "flex-start", alignItems: "center", paddingTop: 1330 }}>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", columnGap: 16, maxWidth: 940, fontFamily: fonts.sans, fontWeight: 700, fontSize: 62, textAlign: "center" }}>
        {ch.map((w, i) => {
          const active = t >= w.s - 0.03 && t < (ch[i + 1]?.s ?? w.e + 0.6);
          return <span key={i} style={{ color: colors.white, background: active ? colors.red : "transparent", padding: "2px 12px", textShadow: active ? "none" : "0 3px 14px rgba(0,0,0,0.75), 0 1px 3px rgba(0,0,0,0.9)" }}>{w.t}</span>;
        })}
      </div>
    </AbsoluteFill>
  );
};

const Shade: React.FC = () => <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(20,22,18,0.5) 0%, rgba(20,22,18,0) 22%, rgba(20,22,18,0) 58%, rgba(20,22,18,0.6) 100%)" }} />;

export const HookVideo: React.FC<{ key2: string }> = ({ key2 }) => {
  useFonts();
  const { fps, durationInFrames } = useVideoConfig();
  const frame = useCurrentFrame();
  const h = T.hooks[key2], b = key2.slice(0, 2), n = Number(key2.slice(3)) - 1;
  const [clip, l1, l2] = C[b].hooks[n];
  const segs = planClips([clip, ...C[b].scenes[1].clips], 0, durationInFrames / fps);
  const p = spring({ frame: frame - 4, fps, config: { damping: 13, stiffness: 150 } });
  return (
    <AbsoluteFill style={{ backgroundColor: colors.ink }}>
      <Footage segs={segs} /><Shade /><Logo />
      <div style={{ position: "absolute", top: 260, left: 70, opacity: Math.min(1, p * 1.5), transform: `translateY(${(1 - p) * 40}px)` }}>
        <div style={{ background: colors.olive, color: colors.white, clipPath: chamfer(18), display: "inline-block", padding: "14px 30px", fontFamily: fonts.serif, fontWeight: 700, fontSize: 62 }}>{l1}</div><br />
        <div style={{ background: colors.cream, color: colors.ink, clipPath: chamfer(18), display: "inline-block", padding: "14px 30px", marginTop: 12, fontFamily: fonts.serif, fontWeight: 700, fontSize: 56 }}>{l2}</div>
      </div>
      <Captions words={h.words} />
    </AbsoluteFill>
  );
};

export const BodyVideo: React.FC<{ body: string }> = ({ body }) => {
  useFonts();
  const { fps, durationInFrames } = useVideoConfig();
  const frame = useCurrentFrame();
  const bt = T.bodies[body], scenes: any[] = bt.scenes, end = durationInFrames / fps;
  const F = (s: number) => Math.round(s * fps);
  const allWords: W[] = scenes.filter((s) => s.id !== "cta").flatMap((s) => s.words);
  const cta = scenes[scenes.length - 1];
  const segs = scenes.flatMap((sc, i) => {
    const from = i === 0 ? 0 : sc.start, to = i + 1 < scenes.length ? scenes[i + 1].start : end;
    return planClips(i === scenes.length - 1 ? [C[body].cta, "woonkamer-fwd"] : C[body].scenes[i].clips, from, to);
  });
  const p = spring({ frame: frame - F(cta.start), fps, config: { damping: 14, stiffness: 140 } });
  const showCta = frame >= F(cta.start);
  return (
    <AbsoluteFill style={{ backgroundColor: colors.ink }}>
      <Footage segs={segs} /><Shade /><Logo />
      {scenes.slice(0, -1).map((sc, i) => {
        const nxt = scenes[i + 1].start;
        return C[body].scenes[i].chips.map((txt: string, k: number) => (
          <Chip key={`${i}-${k}`} at={F(sc.start) + 4 + k * 14} out={F(nxt)} top={260 + k * 120} dark={k === 0}>{txt}</Chip>
        ));
      })}
      {!showCta && <Captions words={allWords} />}
      {showCta && (
        <>
          <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(20,22,18,0) 40%, rgba(20,22,18,0.75) 100%)" }} />
          <div style={{ position: "absolute", left: 70, right: 70, bottom: 250, textAlign: "center", opacity: Math.min(1, p * 1.5), transform: `translateY(${(1 - p) * 60}px)`, fontFamily: fonts.serif, color: colors.white, fontWeight: 700, fontSize: 70, lineHeight: 1.15, textShadow: "0 3px 16px rgba(0,0,0,0.6)" }}>
            Ontdek De Groote Visscherij
            <div style={{ marginTop: 40, display: "inline-block", background: colors.red, color: colors.white, clipPath: chamfer(22), padding: "26px 56px", fontFamily: fonts.sans, fontSize: 56 }}>Plan een afspraak</div>
            <div style={{ marginTop: 28, fontFamily: fonts.sans, fontWeight: 500, fontSize: 40 }}>visscherij-ijmuiden.nl</div>
          </div>
        </>
      )}
    </AbsoluteFill>
  );
};
