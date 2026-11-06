import React from "react";
import { AbsoluteFill, Audio, Easing, interpolate, OffthreadVideo, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { colors, FONT, fontCss, FPS } from "./brand";
import { BODY_CLIPS, HOOK_CLIPS } from "./config";
import timing from "./timing.json";

export type VideoProps = { hook: number };
const TAIL = 1.2;
type W = { t: string; s: number; e: number };

const layout = (hook: number) => {
  const h = timing.hooks[hook - 1];
  const off = h.dur + timing.pause;
  const body: W[] = timing.body.words.map((w) => ({ t: w.t, s: w.s + off, e: w.e + off }));
  const sent = timing.body.sentences.map((z) => ({ id: z.id, words: body.slice(z.from, z.to), start: body[z.from].s, end: body[z.to - 1].e }));
  const end = body[body.length - 1].e + TAIL;
  return { hw: h.words as W[], hd: h.dur, off, body, sent, end };
};
export const getDuration = (hook: number) => Math.ceil(layout(hook).end * FPS);

type Seg = { clip: string; from: number; to: number };
const segments = (hook: number): Seg[] => {
  const L = layout(hook);
  const segs: Seg[] = [];
  const hc = HOOK_CLIPS[hook];
  hc.forEach(([clip, wi], k) => {
    const from = k === 0 ? 0 : L.hw[wi].s;
    const to = k + 1 < hc.length ? L.hw[hc[k + 1][1]].s : L.off;
    segs.push({ clip, from, to });
  });
  L.sent.forEach((z, i) => {
    const list = BODY_CLIPS[z.id];
    const from = i === 0 ? L.off : z.start - 0.1;
    const to = i + 1 < L.sent.length ? L.sent[i + 1].start - 0.1 : L.end;
    list.forEach((clip, k) => segs.push({ clip, from: from + ((to - from) * k) / list.length, to: from + ((to - from) * (k + 1)) / list.length }));
  });
  segs[segs.length - 1].to = L.end;
  return segs;
};

// Harde knip; rustige drift binnen één shot. Clips zijn 8 s; langere stukken worden vertraagd afgespeeld.
const ClipSegment: React.FC<{ seg: Seg; frames: number }> = ({ seg, frames }) => {
  const frame = useCurrentFrame();
  const dur = frames / FPS;
  const rate = Math.min(1, 7.8 / dur);
  const scale = interpolate(frame, [0, frames], [1.0, 1.05]);
  return (
    <AbsoluteFill style={{ transform: `scale(${scale})` }}>
      <OffthreadVideo src={staticFile(`clips/${seg.clip}.mp4`)} muted playbackRate={rate} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
    </AbsoluteFill>
  );
};

const Pop: React.FC<{ at: number; until: number; children: React.ReactNode; style?: React.CSSProperties; from?: "left" | "right" | "up" }> = ({ at, until, children, style, from = "left" }) => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  if (t < at || t > until + 0.3) return null;
  const sp = spring({ frame: frame - Math.round(at * FPS), fps: FPS, config: { damping: 16, stiffness: 140 } });
  const out = interpolate(t, [until, until + 0.25], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const dx = from === "left" ? -60 : from === "right" ? 60 : 0;
  const dy = from === "up" ? 40 : 0;
  return (
    <div style={{ position: "absolute", opacity: sp * out, transform: `translate(${(1 - sp) * dx}px, ${(1 - sp) * dy}px)`, fontFamily: FONT, ...style }}>{children}</div>
  );
};

const Chip: React.FC<{ children: React.ReactNode; accent?: boolean }> = ({ children, accent }) => (
  <div style={{ background: accent ? colors.orange : "rgba(26,34,53,0.82)", color: colors.white, padding: "14px 30px", borderRadius: 40, fontSize: 44, fontWeight: 700, display: "inline-block", boxShadow: "0 6px 24px rgba(0,0,0,0.35)" }}>{children}</div>
);

const Captions: React.FC<{ words: W[] }> = ({ words }) => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const chunks: W[][] = [];
  let cur: W[] = [];
  words.forEach((w) => {
    cur.push(w);
    if (/[.,?!]$/.test(w.t) || cur.length >= 4 || cur.map((c) => c.t).join(" ").length > 22) { chunks.push(cur); cur = []; }
  });
  if (cur.length) chunks.push(cur);
  const idx = chunks.findIndex((c, i) => t >= c[0].s - 0.05 && (i + 1 >= chunks.length || t < chunks[i + 1][0].s - 0.05));
  const chunk = idx >= 0 ? chunks[idx] : null;
  if (!chunk || t > chunk[chunk.length - 1].e + 0.5) return null;
  return (
    <AbsoluteFill style={{ alignItems: "center", paddingTop: 1180 }}>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", columnGap: 14, maxWidth: 960, fontFamily: FONT, fontWeight: 800, fontSize: 70, textAlign: "center", lineHeight: 1.15 }}>
        {chunk.map((w, i) => {
          const active = t >= w.s - 0.03 && t < (chunk[i + 1]?.s ?? w.e + 0.5);
          return (
            <span key={i} style={{ color: colors.white, background: active ? colors.orange : "transparent", padding: "0 12px", borderRadius: 10, textShadow: active ? "none" : "0 3px 16px rgba(0,0,0,0.85), 0 1px 4px rgba(0,0,0,0.9)" }}>
              {w.t}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

const Logo: React.FC = () => (
  <div style={{ position: "absolute", top: 80, left: 54, fontFamily: FONT, color: colors.white, textShadow: "0 2px 12px rgba(0,0,0,0.6)" }}>
    <div style={{ fontSize: 46, fontWeight: 800, letterSpacing: 5 }}>PATTISTPARK <span style={{ color: colors.orange }}>II</span></div>
    <div style={{ fontSize: 26, fontWeight: 500, letterSpacing: 6, color: colors.sand }}>TERNEUZEN</div>
  </div>
);

export const PattistVideo: React.FC<VideoProps> = ({ hook }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const L = layout(hook);
  const F = (s: number) => Math.round(s * fps);
  const segs = segments(hook);
  const Z = (id: string) => L.sent.find((z) => z.id === id)!;
  const Y = 1540; // chips onder de ondertitels
  const sold = interpolate(frame / fps, [Z("b4").start + 0.9, Z("b4").start + 2.4], [0, 80], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const ctaIn = Z("cta").start;
  const total = L.end;
  const musicVol = (f: number) => interpolate(f / fps, [0, 1.5, total - 2, total], [0, 0.13, 0.13, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ backgroundColor: colors.navy }}>
      <style>{fontCss}</style>
      {segs.map((s, i) => (
        <Sequence key={i} from={F(s.from)} durationInFrames={Math.max(1, F(s.to) - F(s.from))}>
          <ClipSegment seg={s} frames={Math.max(1, F(s.to) - F(s.from))} />
        </Sequence>
      ))}
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(26,34,53,0.5) 0%, rgba(26,34,53,0) 18%, rgba(26,34,53,0) 55%, rgba(26,34,53,0.6) 100%)" }} />
      <Logo />

      {/* Hook: locatielabel + accent */}
      <Pop at={0.3} until={L.hd} style={{ left: 54, top: Y }}>
        <Chip accent>Wonen aan de Westerschelde</Chip>
      </Pop>

      {/* Body-accenten */}
      <Pop at={Z("b1").start + 1.6} until={Z("b1").end + 0.3} style={{ left: 54, top: Y }}><Chip accent>Vanaf 105 m²</Chip></Pop>
      <Pop at={Z("b2").start + 0.2} until={Z("b2").end} style={{ left: 54, top: Y }}><Chip accent>Alles gelijkvloers</Chip></Pop>
      <Pop at={Z("b2").start + 2.0} until={Z("b2").end + 0.3} style={{ left: 54, top: Y + 90 }}><Chip>Uitzicht over de Westerschelde</Chip></Pop>
      <Pop at={Z("b3").start + 0.4} until={Z("b3").end} style={{ left: 54, top: Y }}><Chip accent>Wonen aan het water</Chip></Pop>
      <Pop at={Z("b3").start + 3.4} until={Z("b3").end + 0.3} style={{ left: 54, top: Y + 90 }}><Chip>Stad dichtbij</Chip></Pop>
      <Pop at={Z("b4").start + 0.3} until={Z("b4").end + 0.3} from="up" style={{ left: 54, top: Y - 20, width: 972 }}>
        <div style={{ background: "rgba(26,34,53,0.85)", borderRadius: 28, padding: "22px 32px", color: colors.white }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 44, fontWeight: 800 }}><span>{Math.round(sold)}% verkocht</span><span style={{ color: colors.taupe }}>nog enkele woningen</span></div>
          <div style={{ marginTop: 14, height: 22, borderRadius: 11, background: "rgba(255,255,255,0.2)" }}>
            <div style={{ width: `${sold}%`, height: "100%", borderRadius: 11, background: colors.orange }} />
          </div>
        </div>
      </Pop>
      <Pop at={Z("b5").start + 0.2} until={Z("b5").end} style={{ left: 54, top: Y }}><Chip accent>Gasloze nieuwbouw</Chip></Pop>
      <Pop at={Z("b5").start + 1.6} until={Z("b5").end} style={{ left: 54, top: Y + 90 }}><Chip>Oplevering voorjaar 2027</Chip></Pop>
      <Pop at={Z("b5").start + 3.6} until={Z("b5").end + 0.3} style={{ left: 54, top: Y + 180 }}><Chip accent>Vanaf € 474.950 v.o.n.</Chip></Pop>

      {/* CTA onderin (minder dan 35% van het beeld) */}
      <Pop at={ctaIn + 0.2} until={total + 1} from="up" style={{ left: 54, top: 1400, width: 972 }}>
        <div style={{ background: "rgba(26,34,53,0.9)", borderRadius: 36, padding: "36px 40px", color: colors.white, textAlign: "center" }}>
          <div style={{ fontSize: 40, fontWeight: 500, color: colors.sand }}>Nog maar enkele woningen beschikbaar</div>
          <div style={{ fontSize: 58, fontWeight: 800, marginTop: 8 }}>Plan vandaag nog een afspraak</div>
          <div style={{ marginTop: 24, display: "inline-block", background: colors.orange, borderRadius: 50, padding: "20px 56px", fontSize: 52, fontWeight: 800 }}>Pattistpark II · Terneuzen</div>
        </div>
      </Pop>

      <Captions words={[...L.hw, ...L.body]} />
      <Audio src={staticFile(`vo/hook${hook}.mp3`)} />
      <Sequence from={F(L.off)}>
        <Audio src={staticFile("vo/body.mp3")} />
      </Sequence>
      <Audio src={staticFile("muziek/muziek.mp3")} volume={musicVol} />
    </AbsoluteFill>
  );
};
