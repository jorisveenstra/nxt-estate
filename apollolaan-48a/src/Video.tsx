import React from "react";
import { AbsoluteFill, Img, OffthreadVideo, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import timingData from "./timing.json";
import { Accent, BODIES, FPS, HOOKS, PAUZE, STAART } from "./config";
import { KLEUR, KOP, TEKST, laadFonts } from "./brand";
import { Icon } from "./icons";

type Woord = [number, number, string];
type Timing = Record<string, { body: { duur: number; woorden: Woord[]; zinnen: { i: number; start: number; end: number; cta: boolean }[] }; hooks: Record<string, { duur: number; woorden: Woord[] }> }>;
const T = timingData as unknown as Timing;

const CLIP_EIND = 7.85; // bruikbaar tot deze seconde van een 8 s-clip
// Na visuele controle: aan het eind van deze clips drijft de camera af naar verzonnen details
// (o.a. extra dakraam bij achtergevel-terras), dus alleen het betrouwbare begin gebruiken.
const MAX_EIND: Record<string, number> = { "achtergevel-terras": 4.5, "achtergevel-boot": 5.5, "achtergevel-woning": 5.5, "keuken-eettafel": 6, "keuken-kookeiland": 6 };

export const hookFrames = (b: string, h: number) => Math.ceil((T[b].hooks[String(h)].duur + PAUZE) * FPS);
export const bodyFrames = (b: string) => Math.ceil((T[b].body.duur + STAART) * FPS);

type Shot = { clip: string; from: number; len: number };

const verdeel = (clips: string[], from: number, to: number): Shot[] => {
  const n = clips.length;
  const out: Shot[] = [];
  for (let i = 0; i < n; i++) {
    const a = Math.round(from + ((to - from) * i) / n);
    const z = Math.round(from + ((to - from) * (i + 1)) / n);
    out.push({ clip: clips[i], from: a, len: z - a });
  }
  return out;
};

// Harde cuts: elke shot is een eigen Sequence, zonder overgangseffect.
const Shots: React.FC<{ shots: Shot[] }> = ({ shots }) => (
  <>
    {shots.map((s, i) => {
      const [naam, vanaf] = s.clip.split("@");
      const start = Number(vanaf ?? "0.3");
      const sec = s.len / FPS;
      const beschikbaar = (MAX_EIND[naam] ?? CLIP_EIND) - start;
      // Langer dan het beschikbare deel: iets vertraagd afspelen (binnen dezelfde doorlopende shot, geen stilstaand beeld).
      const rate = sec > beschikbaar ? Math.max(0.45, beschikbaar / sec) : 1;
      return (
        <Sequence key={i} from={s.from} durationInFrames={s.len}>
          <AbsoluteFill>
            <OffthreadVideo src={staticFile(`clips/${naam}.mp4`)} muted startFrom={Math.round(start * FPS)} playbackRate={rate} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </AbsoluteFill>
        </Sequence>
      );
    })}
  </>
);

// Lichte verlopen boven/onder voor leesbaarheid; beeld blijft volledig zichtbaar.
const Verloop: React.FC = () => (
  <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.38) 0%, rgba(0,0,0,0) 22%, rgba(0,0,0,0) 52%, rgba(0,0,0,0.42) 100%)" }} />
);

const Logo: React.FC = () => (
  <div style={{ position: "absolute", left: 56, top: 70, background: "rgba(255,255,255,0.94)", borderRadius: 18, padding: "14px 20px", boxShadow: "0 6px 24px rgba(0,0,0,0.18)" }}>
    <Img src={staticFile("djzn-logo.png")} style={{ width: 170, display: "block" }} />
  </div>
);

const ProjectTag: React.FC = () => (
  <div style={{ position: "absolute", right: 56, top: 86, fontFamily: KOP, fontWeight: 800, fontSize: 40, color: KLEUR.wit, textAlign: "right", lineHeight: 1.05, textShadow: "0 2px 12px rgba(0,0,0,0.55)" }}>
    Apollolaan 48a
    <div style={{ fontFamily: TEKST, fontWeight: 600, fontSize: 26, color: KLEUR.wit, letterSpacing: 1 }}>
      <span style={{ color: KLEUR.oranje }}>●</span> Oostzaan
    </div>
  </div>
);

// Ondertitels per woordgroep, actief woord in DJZN-oranje.
const Ondertitels: React.FC<{ woorden: Woord[]; offset?: number }> = ({ woorden, offset = 0 }) => {
  const f = useCurrentFrame();
  const t = f / FPS - offset;
  const groepen: Woord[][] = [];
  let cur: Woord[] = [];
  woorden.forEach((w, i) => {
    cur.push(w);
    const eindeZin = /[.?!:,]$/.test(w[2]);
    const volgende = woorden[i + 1];
    const gat = volgende ? volgende[0] - w[1] > 0.35 : true;
    if (cur.length >= 4 || eindeZin || gat || cur.join(" ").length > 26) {
      groepen.push(cur);
      cur = [];
    }
  });
  if (cur.length) groepen.push(cur);
  const g = groepen.find((gr, i) => {
    const eind = groepen[i + 1] ? groepen[i + 1][0][0] : gr[gr.length - 1][1] + 0.4;
    return t >= gr[0][0] - 0.05 && t < eind;
  });
  if (!g) return null;
  return (
    <div style={{ position: "absolute", left: 60, right: 60, top: 1240, textAlign: "center" }}>
      <span style={{ fontFamily: TEKST, fontWeight: 800, fontSize: 64, lineHeight: 1.18, color: KLEUR.wit, textShadow: "0 3px 0 rgba(0,0,0,0.55), 0 0 18px rgba(0,0,0,0.6)", WebkitTextStroke: "2px rgba(0,0,0,0.35)" }}>
        {g.map((w, i) => {
          const actief = t >= w[0] - 0.03 && t < w[1] + 0.08;
          return (
            <span key={i} style={{ color: actief ? KLEUR.oranje : KLEUR.wit }}>
              {w[2].replace(/[,:]$/, "")}
              {i < g.length - 1 ? " " : ""}
            </span>
          );
        })}
      </span>
    </div>
  );
};

// Feitelijk accent: oranje icoonbol + witte kaart, schuift in (animatie binnen de shot, geen shotovergang).
const AccentKaart: React.FC<{ a: Accent; dur: number }> = ({ a, dur }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const inS = spring({ frame: f, fps, config: { damping: 14, stiffness: 140 } });
  const uit = interpolate(f, [dur - 8, dur], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const icoon = spring({ frame: f - 6, fps, config: { damping: 9, stiffness: 160 } });
  const balk = interpolate(f, [8, 26], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div style={{ position: "absolute", left: 56, top: 300, display: "flex", alignItems: "center", gap: 22, opacity: uit, transform: `translateX(${(1 - inS) * -720}px)` }}>
      <div style={{ width: 118, height: 118, borderRadius: 60, background: KLEUR.oranje, display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${icoon}) rotate(${(1 - icoon) * -40}deg)`, boxShadow: "0 8px 26px rgba(0,0,0,0.3)" }}>
        <Icon name={a.icon} size={66} />
      </div>
      <div style={{ background: "rgba(255,255,255,0.95)", borderRadius: 16, padding: "16px 28px 18px", maxWidth: 760, boxShadow: "0 8px 26px rgba(0,0,0,0.25)" }}>
        <div style={{ fontFamily: KOP, fontWeight: 800, fontSize: 58, color: KLEUR.zwart, lineHeight: 1 }}>{a.value}</div>
        <div style={{ height: 5, width: `${balk * 100}%`, background: KLEUR.oranje, borderRadius: 3, margin: "8px 0 8px" }} />
        <div style={{ fontFamily: TEKST, fontWeight: 600, fontSize: 30, color: KLEUR.donker, lineHeight: 1.2 }}>{a.label}</div>
      </div>
    </div>
  );
};

const Kicker: React.FC<{ tekst: string }> = ({ tekst }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: f - 4, fps, config: { damping: 13 } });
  return (
    <div style={{ position: "absolute", left: 56, top: 300, transform: `translateY(${(1 - s) * 40}px)`, opacity: s }}>
      <div style={{ display: "inline-block", background: KLEUR.oranje, color: KLEUR.wit, fontFamily: KOP, fontWeight: 800, fontSize: 54, padding: "12px 28px 14px", borderRadius: 14, boxShadow: "0 8px 26px rgba(0,0,0,0.3)" }}>{tekst}</div>
      <div style={{ marginTop: 14, fontFamily: TEKST, fontWeight: 600, fontSize: 30, color: KLEUR.wit, textShadow: "0 2px 10px rgba(0,0,0,0.6)" }}>Nieuwbouw · vergunning verleend</div>
    </div>
  );
};

const CtaKnop: React.FC<{ dur: number }> = ({ dur }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: f, fps, config: { damping: 12 } });
  const puls = 1 + 0.035 * Math.sin((f / fps) * Math.PI * 2.2);
  const pijl = 10 * Math.abs(Math.sin((f / fps) * Math.PI * 1.6));
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 1530, display: "flex", flexDirection: "column", alignItems: "center", opacity: s, transform: `translateY(${(1 - s) * 80}px)` }}>
      <div style={{ background: KLEUR.oranje, borderRadius: 60, padding: "26px 54px 28px", transform: `scale(${puls})`, boxShadow: "0 10px 30px rgba(0,0,0,0.35)", display: "flex", alignItems: "center", gap: 18 }}>
        <span style={{ fontFamily: KOP, fontWeight: 800, fontSize: 56, color: KLEUR.wit }}>Vraag de brochure aan</span>
        <Icon name="kalender" size={54} />
      </div>
      <svg width={60} height={60} viewBox="0 0 48 48" style={{ marginTop: 14 + pijl }} fill="none" stroke="#fff" strokeWidth={5} strokeLinecap="round" strokeLinejoin="round">
        <path d="M24 6v32M12 26l12 12 12-12" />
      </svg>
    </div>
  );
};

export const HookSegment: React.FC<{ b: string; h: number }> = ({ b, h }) => {
  laadFonts();
  const hook = HOOKS[b][h - 1];
  const dur = hookFrames(b, h);
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <Shots shots={verdeel(hook.clips, 0, dur)} />
      <Verloop />
      <Logo />
      <ProjectTag />
      <Kicker tekst={hook.kicker} />
      <Ondertitels woorden={T[b].hooks[String(h)].woorden} />
    </AbsoluteFill>
  );
};

export const BodySegment: React.FC<{ b: string }> = ({ b }) => {
  laadFonts();
  const dur = bodyFrames(b);
  const zinnen = T[b].body.zinnen;
  const cfg = BODIES[b].zinnen;
  if (cfg.length !== zinnen.length) throw new Error(`config ${b}: ${cfg.length} zinnen, timing ${zinnen.length}`);
  const grens = (i: number) => (i === 0 ? 0 : Math.round(zinnen[i].start * FPS) - 3);
  const shots: Shot[] = [];
  let i = 0;
  while (i < cfg.length) {
    let j = i + 1;
    while (j < cfg.length && cfg[j].clips.length === 0) j++;
    const to = j < cfg.length ? grens(j) : dur;
    shots.push(...verdeel(cfg[i].clips, grens(i), to));
    i = j;
  }
  const ctaStart = grens(cfg.length - 1);
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <Shots shots={shots} />
      <Verloop />
      <Logo />
      <ProjectTag />
      {cfg.map((z, k) => {
        if (!z.accent) return null;
        const from = grens(k) + 4;
        const to = k + 1 < cfg.length ? grens(k + 1) : dur;
        return (
          <Sequence key={k} from={from} durationInFrames={to - from}>
            <AccentKaart a={z.accent} dur={to - from} />
          </Sequence>
        );
      })}
      <Sequence from={ctaStart + 6} durationInFrames={dur - ctaStart - 6}>
        <CtaKnop dur={dur - ctaStart - 6} />
      </Sequence>
      <Ondertitels woorden={T[b].body.woorden} />
    </AbsoluteFill>
  );
};
