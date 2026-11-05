import React from "react";
import { AbsoluteFill, Audio, Easing, Img, interpolate, OffthreadVideo, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import data from "./data.json";

export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;
// Huisstijl (referentie: fresh-loods-breda.afspraakbij.info): Poppins, goud #BFA349, blauw #57779B, salie #B8C4AD, antraciet #1A1A1A
const C = { gold: "#BFA349", blue: "#57779B", sage: "#B8C4AD", ink: "#1A1A1A", sand: "#E7E2DA", white: "#fff" };
const FONT = "PoppinsLocal, sans-serif";
const GAP = 0.3; // seconden tussen hook en body
const TAIL = 0.9;

type W = { t: string; s: number; e: number };
type D = { hookDur: number; bodyDur: number; hookWords: W[]; bodyWords: W[] };
const D = (b: number, h: number) => (data as any)[`b${b}h${h}`] as D;
export const totalFrames = (d: D) => Math.ceil((d.hookDur + GAP + d.bodyDur + TAIL) * FPS);

const HOOK_CHIPS: Record<number, string[]> = {
  1: ["Ruimte voor materiaal & voorraad", "Meer ruimte nodig?", "Bedrijf gegroeid?", "Groeien zonder pand te kopen", "19 units te huur"],
  2: ["Webshopvoorraad uit huis", "Ruimte om in te pakken", "Vaste plek in Haarlem", "Opschalen met ruimte", "19 units te huur"],
};
const BODY_CHIPS: Record<number, string[]> = {
  1: ["Je eigen bedrijfsruimte te HUUR", "Geen aankoopinvestering", "In en rond Haarlem blijven", "Past de unit bij materiaal, bussen & team?", "Vraag maten & voorzieningen op"],
  2: ["Je eigen unit te HUUR", "Budget vrij voor voorraad & marketing", "Voorraad, inpaktafel & verzending op één adres", "Eerst weten wat het kost?", "Bekijk huurvoorwaarden, maten & voorzieningen"],
};
// Vaste, harde sneden: [clip, startSec] — geen overgangen.
const OPENERS: Record<number, string[]> = {
  1: ["trap", "kantoor", "voorkant", "achterkant", "overview"],
  2: ["flex", "trap", "kantoor", "achterkant", "overview"],
};
const BODY_SEQ: Record<number, [string, number][]> = {
  1: [["voorkant", 0], ["achterkant", 0], ["trap", 4], ["overview", 4], ["kantoor", 0], ["flex", 0], ["voorkant", 4], ["achterkant", 4], ["kantoor", 4], ["trap", 0], ["flex", 4], ["overview", 0]],
  2: [["achterkant", 0], ["kantoor", 4], ["flex", 4], ["voorkant", 0], ["trap", 4], ["overview", 4], ["achterkant", 4], ["voorkant", 4], ["kantoor", 0], ["flex", 0], ["overview", 0], ["trap", 0]],
};

const ease = Easing.out(Easing.cubic);
const useIn = (at: number, dur = 10) => {
  const f = useCurrentFrame();
  return interpolate(f, [at, at + dur], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });
};

const Shots: React.FC<{ b: number; h: number; total: number; hookEnd: number }> = ({ b, h, total, hookEnd }) => {
  const opener = OPENERS[b][h - 1];
  const shots: { clip: string; from: number; frames: number }[] = [{ clip: opener, from: 0, frames: hookEnd }];
  let used = hookEnd;
  const seq = BODY_SEQ[b].filter(([c, s]) => !(c === opener && s === 0));
  let i = 0;
  while (used < total) {
    const [clip, from] = seq[i % seq.length];
    const frames = Math.min(4 * FPS, total - used);
    shots.push({ clip, from, frames: total - used - frames < FPS ? total - used : frames });
    used += shots[shots.length - 1].frames;
    i++;
  }
  let at = 0;
  return (
    <>
      {shots.map((s, k) => {
        const el = (
          <Sequence key={k} from={at} durationInFrames={s.frames}>
            <OffthreadVideo src={staticFile(`clips/${s.clip}.mp4`)} startFrom={s.from * FPS} muted style={{ width: WIDTH, height: HEIGHT, objectFit: "cover" }} />
          </Sequence>
        );
        at += s.frames;
        return el;
      })}
    </>
  );
};

const Chip: React.FC<{ text: string; at: number; until: number; accent?: boolean }> = ({ text, at, until, accent }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: f - at, fps, config: { damping: 13, stiffness: 160 } });
  const out = interpolate(f, [until - 8, until], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  if (f < at || f > until) return null;
  return (
    <div style={{ position: "absolute", left: 60, right: 60, top: 330, display: "flex", justifyContent: "flex-start", transform: `translateY(${(1 - p) * -50}px) scale(${0.9 + 0.1 * p})`, opacity: Math.min(1, p) * out }}>
      <div style={{ background: accent ? C.gold : "rgba(26,26,26,0.82)", color: accent ? C.ink : C.white, fontFamily: FONT, fontWeight: 700, fontSize: 54, lineHeight: 1.15, padding: "22px 36px", borderRadius: 24, borderLeft: `10px solid ${accent ? C.ink : C.gold}`, boxShadow: "0 12px 40px rgba(0,0,0,0.35)", maxWidth: 900 }}>{text}</div>
    </div>
  );
};

const Subs: React.FC<{ words: { t: string; s: number; e: number }[] }> = ({ words }) => {
  const f = useCurrentFrame();
  const t = f / FPS;
  // groepjes van max 3 woorden, afgebroken bij leestekens
  const groups: typeof words[] = [];
  let cur: typeof words = [];
  for (const w of words) {
    cur.push(w);
    if (cur.length >= 3 || /[.,?!:;]$/.test(w.t)) { groups.push(cur); cur = []; }
  }
  if (cur.length) groups.push(cur);
  const g = groups.find((gr, i) => t >= gr[0].s - 0.05 && t < (groups[i + 1] ? groups[i + 1][0].s - 0.05 : gr[gr.length - 1].e + 0.4));
  if (!g) return null;
  return (
    <div style={{ position: "absolute", left: 40, right: 40, top: 1170, display: "flex", justifyContent: "center", columnGap: 30, rowGap: 0, flexWrap: "wrap" }}>
      {g.map((w, i) => {
        const active = t >= w.s - 0.02;
        return (
          <span key={i} style={{ fontFamily: FONT, fontWeight: 700, fontSize: 76, color: active ? C.gold : C.white, textShadow: "0 4px 18px rgba(0,0,0,0.85), 0 0 4px rgba(0,0,0,0.9)", transform: `scale(${active ? 1.05 : 1})`, textTransform: "none" }}>{w.t.replace(/[.,;:]$/, "")}</span>
        );
      })}
    </div>
  );
};

export const StockVideo: React.FC<{ body: number; hook: number }> = ({ body, hook }) => {
  const d = D(body, hook);
  const f = useCurrentFrame();
  const total = totalFrames(d);
  const bodyStart = d.hookDur + GAP;
  const hookEnd = Math.round(bodyStart * FPS);
  // zinnen uit body
  const sent: { s: number; e: number }[] = [];
  let st = 0;
  d.bodyWords.forEach((w, i) => { if (/[.?!]$/.test(w.t)) { sent.push({ s: d.bodyWords[st].s, e: w.e }); st = i + 1; } });
  const abs = (x: number) => Math.round((bodyStart + x) * FPS);
  const chips = BODY_CHIPS[body];
  const ctaIn = abs(sent[5].s) - 6;
  const ctaP = useIn(ctaIn, 14);
  const music = interpolate(f, [0, 20, total - 45, total - 5], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const voiceNow = (f / FPS < d.hookDur) || (f / FPS >= bodyStart && f / FPS < bodyStart + d.bodyDur);
  const subWords = [...d.hookWords, ...d.bodyWords.map((w) => ({ ...w, s: w.s + bodyStart, e: w.e + bodyStart }))];
  return (
    <AbsoluteFill style={{ background: C.ink, fontFamily: FONT }}>
      <style>{`@font-face{font-family:PoppinsLocal;font-weight:500;src:url(${staticFile("fonts/poppins-latin-500-normal.woff2")}) format("woff2")}@font-face{font-family:PoppinsLocal;font-weight:600;src:url(${staticFile("fonts/poppins-latin-600-normal.woff2")}) format("woff2")}@font-face{font-family:PoppinsLocal;font-weight:700;src:url(${staticFile("fonts/poppins-latin-700-normal.woff2")}) format("woff2")}`}</style>
      <Shots b={body} h={hook} total={total} hookEnd={hookEnd} />
      {/* zachte verloop onder/boven voor leesbaarheid; footage blijft dominant */}
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.38) 0%, rgba(0,0,0,0) 22%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.55) 100%)" }} />
      {/* permanente badge */}
      <div style={{ position: "absolute", left: 60, top: 110, display: "flex", gap: 14, alignItems: "center" }}>
        <div style={{ background: C.gold, color: C.ink, fontWeight: 700, fontSize: 44, padding: "10px 28px", borderRadius: 14, letterSpacing: 2 }}>TE HUUR</div>
        <div style={{ color: C.white, fontWeight: 600, fontSize: 40, textShadow: "0 3px 12px rgba(0,0,0,0.8)" }}>Stock Haarlem XL</div>
      </div>
      {/* hook-chip */}
      <Sequence from={0} durationInFrames={hookEnd}><Chip text={HOOK_CHIPS[body][hook - 1]} at={4} until={hookEnd - 2} accent={hook === 5} /></Sequence>
      {/* USP's per zin in de body */}
      {chips.map((c, i) => (
        <Chip key={i} text={c} at={abs(sent[i].s)} until={abs(sent[i].e) + 6} accent={i === 0 || i === 1} />
      ))}
      {voiceNow || true ? <Subs words={subWords} /> : null}
      {/* CTA */}
      {f >= ctaIn ? (
        <div style={{ position: "absolute", left: 60, right: 60, bottom: 150, opacity: ctaP, transform: `translateY(${(1 - ctaP) * 80}px)` }}>
          <div style={{ background: C.gold, color: C.ink, borderRadius: 28, padding: "30px 36px", textAlign: "center", fontWeight: 700, fontSize: 58, boxShadow: "0 16px 50px rgba(0,0,0,0.4)" }}>Vraag informatie aan</div>
          <div style={{ color: C.white, textAlign: "center", fontWeight: 600, fontSize: 40, marginTop: 20, textShadow: "0 3px 12px rgba(0,0,0,0.85)" }}>19 units te huur · Jan van Krimpenweg, Haarlem</div>
        </div>
      ) : null}
      <Audio src={staticFile(`vo/b${body}h${hook}.mp3`)} />
      <Sequence from={Math.round(bodyStart * FPS)}><Audio src={staticFile(`vo/b${body}body.mp3`)} /></Sequence>
      <Audio src={staticFile("music/music.mp3")} volume={(fr) => {
        const t = fr / FPS;
        const speaking = t < d.hookDur + 0.2 || (t >= bodyStart - 0.1 && t < bodyStart + d.bodyDur + 0.2);
        return 0.13 * music * (speaking ? 1 : 1.6);
      }} />
    </AbsoluteFill>
  );
};
