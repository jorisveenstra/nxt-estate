import React from "react";
import { AbsoluteFill, Audio, interpolate, OffthreadVideo, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { colors, FONT, fontFaces, FPS } from "./brand";
import { BODY_SHOTS, HOOK_KICKERS, HOOK_SHOTS, PAUSE_TAIL } from "./config";
import timingJson from "./timing.json";
import { Captions, Icons, Logo, Pill, Scrims, Shield, Stat, useEnter, Word } from "./ui";

type BodyT = { bodyDur: number; words: Word[]; scenes: { naam: string; start: number; end: number }[] };
type HookT = { hookDur: number; pause: number; words: Word[] };
const T = timingJson as unknown as Record<string, BodyT & HookT>;

export const hookFrames = (k: string) => Math.round((T[k].hookDur + T[k].pause) * FPS);
export const bodyFrames = (b: string) => Math.ceil((T[b].bodyDur + PAUSE_TAIL) * FPS);

const Fonts = () => <style>{fontFaces}</style>;

// Volledig beeldvullende clip (cover, nooit balken of opvulling); wissel = harde cut
const Shots: React.FC<{ shots: { clip: string; from: number; at?: number }[]; total: number }> = ({ shots, total }) => (
  <>
    {shots.map((s, i) => {
      const from = Math.round(s.from * FPS);
      const to = i + 1 < shots.length ? Math.round(shots[i + 1].from * FPS) : total;
      return (
        <Sequence key={i} from={from} durationInFrames={to - from} premountFor={15}>
          <OffthreadVideo src={staticFile(`clips/${s.clip}.mp4`)} muted startFrom={Math.round((s.at ?? 0) * FPS)}
            style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </Sequence>
      );
    })}
  </>
);

const wordAt = (b: string, frag: string, after = 0) =>
  T[b].words.find((w) => w[0] >= after && w[2].toLowerCase().startsWith(frag.toLowerCase()))?.[0] ?? after;

const Kicker: React.FC<{ lines: string[] }> = ({ lines }) => {
  const p1 = useEnter(0.05);
  const p2 = useEnter(0.25);
  return (
    <div style={{ position: "absolute", top: 330, left: 60, right: 60, fontFamily: FONT, fontWeight: 800,
      fontSize: 104, lineHeight: 1.08, textTransform: "uppercase", color: colors.white, letterSpacing: -1 }}>
      <div style={{ opacity: p1, transform: `translateY(${(1 - p1) * 40}px)`, textShadow: "0 6px 26px rgba(0,0,0,0.6)" }}>{lines[0]}</div>
      <div style={{ opacity: p2, transform: `translateY(${(1 - p2) * 40}px)`, marginTop: 10 }}>
        <span style={{ background: colors.olive, padding: "0 22px", borderRadius: 14, boxDecorationBreak: "clone" }}>{lines[1]}</span>
      </div>
    </div>
  );
};

export const HookSegment: React.FC<{ k: string }> = ({ k }) => {
  const total = hookFrames(k);
  const [a, b] = HOOK_SHOTS[k];
  const cut = Math.round(T[k].hookDur * 0.48 * 10) / 10;
  return (
    <AbsoluteFill style={{ background: colors.dark }}>
      <Fonts />
      <Shots shots={[{ clip: a, from: 0, at: 0.4 }, { clip: b, from: cut, at: 1.5 }]} total={total} />
      <Scrims />
      <Logo />
      <Pill text="Nu in verkoop · Elbe 23 Den Haag" at={0} top={250} dot />
      <Kicker lines={HOOK_KICKERS[k]} />
      <Captions words={T[k].words} />
    </AbsoluteFill>
  );
};

const CTA: React.FC<{ at: number }> = ({ at }) => {
  const p = useEnter(at);
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const bob = Math.sin((f / fps) * 2 * Math.PI * 1.2) * 10;
  return (
    <div style={{ position: "absolute", left: 60, right: 60, top: 760, opacity: p, transform: `translateY(${(1 - p) * 60}px)`,
      background: "rgba(27,34,31,0.88)", borderRadius: 26, padding: "40px 44px", borderTop: `10px solid ${colors.olive}`,
      fontFamily: FONT, color: colors.white, textAlign: "center" }}>
      <div style={{ fontWeight: 800, fontSize: 64, lineHeight: 1.05, textTransform: "uppercase" }}>Schrijf je nu in</div>
      <div style={{ fontWeight: 500, fontSize: 34, color: colors.cream, marginTop: 16, lineHeight: 1.3 }}>
        Bespreek met onze makelaar of jouw autobedrijf hier past
      </div>
      <div style={{ display: "inline-flex", alignItems: "center", gap: 18, marginTop: 30, background: colors.olive,
        borderRadius: 12, padding: "20px 40px", fontWeight: 700, fontSize: 40 }}>
        Klik op de knop hieronder
        <svg width="44" height="44" viewBox="0 0 44 44" style={{ transform: `translateY(${bob}px)` }}>
          <path d="M22 6v30M8 24l14 14 14-14" stroke="#fff" strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  );
};

export const BodySegment: React.FC<{ b: string }> = ({ b }) => {
  const total = bodyFrames(b);
  const sc = Object.fromEntries(T[b].scenes.map((s) => [s.naam, s]));
  const show = (naam: string, node: React.ReactNode, until?: number) => {
    const s = sc[naam];
    const from = Math.round(s.start * FPS);
    const end = until ?? (T[b].scenes[T[b].scenes.indexOf(s) + 1]?.start ?? total / FPS);
    return <Sequence from={from} durationInFrames={Math.round(end * FPS) - from} layout="none">{node}</Sequence>;
  };
  const rel = (naam: string, abs: number) => abs - sc[naam].start;
  return (
    <AbsoluteFill style={{ background: colors.dark }}>
      <Fonts />
      <Shots shots={BODY_SHOTS[b]} total={total} />
      <Scrims />
      <Logo />
      {show("intro", <>
        <Pill text="Elbe 23 · Forepark Den Haag" at={0.2} top={250} bg={colors.olive} />
        <Stat at={rel("intro", wordAt(b, "200"))} top={360} value="200–230 m²" label="eigen bedrijfsunit, te koop" icon={Icons.area} />
      </>)}
      {show("werkplaats", <>
        <Stat at={rel("werkplaats", wordAt(b, "117", sc.werkplaats.start))} top={260} value="tot 117 m²" label="werkplaats op de begane grond" icon={Icons.area} />
        <Stat at={rel("werkplaats", wordAt(b, "overheaddeur", sc.werkplaats.start))} top={490} value="ruim 3 m hoog" label="eigen overheaddeur" icon={Icons.door} />
        <Stat at={rel("werkplaats", wordAt(b, "tussenunits", sc.werkplaats.start))} top={720} value="ruim 4 m breed" label="overheaddeur units 2 t/m 6" icon={Icons.door} />
      </>)}
      {show("kantoor", <Stat at={0.3} top={300} value="Boven" label="kantoor + nette ontvangst voor klanten" icon={Icons.office} />)}
      {show("parkeren", <Stat at={rel("parkeren", wordAt(b, "twee", sc.parkeren.start))} top={300} value="2–3 plekken" label="parkeren op eigen terrein" icon={Icons.parking} />)}
      {show("ligging", <>
        <Shield text="A12" at={rel("ligging", wordAt(b, "A12", sc.ligging.start))} left={60} top={290} />
        <Shield text="A4" at={rel("ligging", wordAt(b, "A4", sc.ligging.start))} left={330} top={290} />
        <Pill text="op enkele minuten" at={rel("ligging", wordAt(b, "minuten", sc.ligging.start))} top={460} bg="rgba(27,34,31,0.88)" />
      </>)}
      {show("bouw", <Stat at={rel("bouw", wordAt(b, "beton", sc.bouw.start))} top={300} value="Beton & staal" label="strakke, moderne gevel" icon={Icons.build} />)}
      {show("schaarste", <>
        <Stat at={rel("schaarste", wordAt(b, "slechts", sc.schaarste.start))} top={300} value="Slechts 14" label="units in totaal · Elbe 23" icon={Icons.build} />
        <Stat at={rel("schaarste", wordAt(b, "oplevering", sc.schaarste.start))} top={530} value="Q4 2027" label="geplande oplevering" icon={Icons.calendar} />
      </>)}
      {show("cta", <CTA at={0.15} />)}
      <Captions words={T[b].words} />
    </AbsoluteFill>
  );
};

// Complete video met audio (studio/revisies). Productie mixt de audio met ffmpeg (scripts/render.sh) met dezelfde opbouw.
export const FullVideo: React.FC<{ k: string }> = ({ k }) => {
  const b = k.split("h")[0];
  const hf = hookFrames(k);
  const total = hf + bodyFrames(b);
  const f = useCurrentFrame();
  const music = interpolate(f, [0, 15, total - 45, total], [0, 0.13, 0.13, 0], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill>
      <Sequence durationInFrames={hf}><HookSegment k={k} /></Sequence>
      <Sequence from={hf}><BodySegment b={b} /></Sequence>
      <Audio src={staticFile(`vo/${k}.wav`)} />
      <Sequence from={hf}><Audio src={staticFile(`vo/${b}-body.wav`)} /></Sequence>
      <Audio src={staticFile(`muziek/${b}-bed.mp3`)} volume={() => music} />
    </AbsoluteFill>
  );
};
