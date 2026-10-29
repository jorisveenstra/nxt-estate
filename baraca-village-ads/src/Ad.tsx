import React, { useEffect } from "react";
import { AbsoluteFill, Audio, interpolate, OffthreadVideo, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { colors, loadFonts } from "./brand";

export type Word = { s: number; e: number; t: string };
export type AdProps = {
  frames: number; // lengte van dit deel
  shots: { src: string; from: number; dur: number }[]; // harde cuts, geen overgangen
  audio: { src: string; from: number }[]; // voice-over (eleven_v4)
  music: { src: string; offsetFrames: number; volume: number } | null;
  words: Word[]; // ondertitels, seconden relatief aan dit deel
  duckWords: Word[]; // alle spraak op de globale tijdlijn (muziekducking)
  globalOffsetFrames: number;
  totalFrames: number; // totale lengte van de hele video (voor fade-out)
  accents: { s: number; e: number; text: string; sub?: string }[]; // spaarzame tekstaccenten
  cta: { s: number; title: string; sub: string } | null;
  wordmark: boolean;
  fadeIn: boolean;
  fadeOut: boolean;
};

const PUNCT = /[.,?!:;]$/;
const chunkWords = (words: Word[]) => {
  const chunks: { words: Word[]; s: number }[] = [];
  let cur: Word[] = [];
  const flush = () => { if (cur.length) { chunks.push({ words: cur, s: cur[0].s }); cur = []; } };
  for (const w of words) {
    cur.push(w);
    const len = cur.map((x) => x.t).join(" ").length;
    if (PUNCT.test(w.t) || cur.length >= 3 || len > 20) flush();
  }
  flush();
  return chunks;
};

const Captions: React.FC<{ words: Word[] }> = ({ words }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const chunks = React.useMemo(() => chunkWords(words), [words]);
  const idx = chunks.findIndex((c, i) => t >= c.s - 0.05 && t < (chunks[i + 1]?.s ?? c.words[c.words.length - 1].e + 0.5) - 0.02);
  if (idx < 0) return null;
  const c = chunks[idx];
  return (
    <div style={{ position: "absolute", left: 70, right: 70, top: 1290, display: "flex", justifyContent: "center", textAlign: "center",
      fontFamily: "Poppins", fontWeight: 700, fontSize: 70, lineHeight: 1.15, letterSpacing: -0.5, flexWrap: "wrap", gap: "0 18px" }}>
      {c.words.map((w, i) => (
        <span key={i} style={{ color: t >= w.s - 0.03 && t < w.e + 0.02 ? colors.gold : colors.white,
          textShadow: "0 3px 14px rgba(0,0,0,.75), 0 0 3px rgba(0,0,0,.9)" }}>{w.t}</span>
      ))}
    </div>
  );
};

const Accent: React.FC<{ a: AdProps["accents"][number] }> = ({ a }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const o = interpolate(t, [a.s, a.s + 0.25, a.e - 0.25, a.e], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  if (o <= 0) return null;
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 250, display: "flex", justifyContent: "center", opacity: o }}>
      <div style={{ fontFamily: "Poppins", color: colors.white, textAlign: "center", textShadow: "0 2px 12px rgba(0,0,0,.7)" }}>
        <div style={{ fontWeight: 600, fontSize: 56, letterSpacing: 1, borderBottom: `3px solid ${colors.gold}`, display: "inline-block", paddingBottom: 6 }}>{a.text}</div>
        {a.sub ? <div style={{ fontWeight: 500, fontSize: 32, marginTop: 10, opacity: 0.92 }}>{a.sub}</div> : null}
      </div>
    </div>
  );
};

const Cta: React.FC<{ cta: NonNullable<AdProps["cta"]> }> = ({ cta }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const o = interpolate(t, [cta.s, cta.s + 0.4], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  if (o <= 0) return null;
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 1560, display: "flex", flexDirection: "column", alignItems: "center", opacity: o,
      transform: `translateY(${(1 - o) * 24}px)` }}>
      <div style={{ background: colors.gold, color: colors.olive, fontFamily: "Poppins", fontWeight: 700, fontSize: 44, padding: "22px 54px", borderRadius: 60,
        boxShadow: "0 8px 30px rgba(0,0,0,.35)" }}>{cta.title}</div>
      <div style={{ marginTop: 18, color: colors.white, fontFamily: "Poppins", fontWeight: 500, fontSize: 32, textShadow: "0 2px 10px rgba(0,0,0,.8)" }}>{cta.sub}</div>
    </div>
  );
};

const Wordmark: React.FC = () => (
  <div style={{ position: "absolute", top: 96, left: 0, right: 0, textAlign: "center", color: colors.white, textShadow: "0 2px 12px rgba(0,0,0,.85), 0 0 4px rgba(0,0,0,.6)" }}>
    <div style={{ fontFamily: "Marcellus", fontSize: 40, letterSpacing: 8 }}>BARACA VILLAGE</div>
    <div style={{ fontFamily: "Poppins", fontWeight: 500, fontSize: 20, letterSpacing: 5, color: colors.gold, marginTop: 6 }}>TAMPAH BEACH VILLA'S · LOMBOK</div>
  </div>
);

export const Ad: React.FC<AdProps> = (p) => {
  useEffect(() => { loadFonts(); }, []);
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const g = frame + p.globalOffsetFrames; // globale frame
  const musicVol = (f: number) => {
    if (!p.music) return 0;
    const t = (f + p.globalOffsetFrames) / fps;
    let d = 9;
    for (const w of p.duckWords) { const x = t < w.s ? w.s - t : t > w.e ? t - w.e : 0; if (x < d) d = x; if (d === 0) break; }
    const base = 0.07 + (0.19 - 0.07) * Math.min(1, d / 0.6);
    const fin = p.fadeIn ? Math.min(1, (f + p.globalOffsetFrames) / (fps * 1.0)) : 1;
    const fout = p.fadeOut ? Math.min(1, Math.max(0, (p.totalFrames - (f + p.globalOffsetFrames)) / (fps * 1.5))) : 1;
    return base * p.music.volume * fin * fout;
  };
  void g;
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {p.shots.map((s, i) => (
        <Sequence key={i} from={s.from} durationInFrames={s.dur}>
          <OffthreadVideo src={staticFile(s.src)} muted style={{ width: 1080, height: 1920, objectFit: "cover" }} />
        </Sequence>
      ))}
      {p.music ? <Audio src={staticFile(p.music.src)} startFrom={p.music.offsetFrames} volume={musicVol} /> : null}
      {p.audio.map((a, i) => (
        <Sequence key={i} from={a.from}><Audio src={staticFile(a.src)} volume={1} /></Sequence>
      ))}
      {p.wordmark ? <Wordmark /> : null}
      {p.accents.map((a, i) => <Accent key={i} a={a} />)}
      <Captions words={p.words} />
      {p.cta ? <Cta cta={p.cta} /> : null}
    </AbsoluteFill>
  );
};
