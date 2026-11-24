import React from "react";
import { AbsoluteFill, Audio, Img, interpolate, OffthreadVideo, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { C, FONT, FPS } from "./brand";
import { Icoon } from "./icons";
import timing from "./timing.json";

type Woord = [number, number, string];
type Accent = { label?: string; tekst?: string; stat?: string; icoon?: string } | null;

const clipSrc = (n: number) => staticFile(`clips/foto${String(n).padStart(2, "0")}.mp4`);

// Footage altijd full-bleed (cover), harde cuts: elke shot is een eigen Sequence zonder overgang.
const Shot: React.FC<{ clip: number }> = ({ clip }) => (
  <AbsoluteFill>
    <OffthreadVideo src={clipSrc(clip)} muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />
  </AbsoluteFill>
);

// Subtiele verlopen voor leesbaarheid (geen ondoorzichtige vlakken).
const Scrims: React.FC = () => (
  <>
    <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(20,22,18,0.55) 0%, rgba(20,22,18,0) 22%)" }} />
    <AbsoluteFill style={{ background: "linear-gradient(0deg, rgba(20,22,18,0.62) 0%, rgba(20,22,18,0) 38%)" }} />
  </>
);

const Logo: React.FC = () => (
  <Img src={staticFile("logo/business-nomads-wit.png")} style={{ position: "absolute", top: 70, right: 64, width: 118, filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.45))" }} />
);

// Ondertitels: korte groepen woorden, actief woord met olijf markering.
function groepen(woorden: Woord[]): Woord[][] {
  const uit: Woord[][] = [];
  let cur: Woord[] = [];
  let tekens = 0;
  woorden.forEach((w, i) => {
    cur.push(w);
    tekens += w[2].length + 1;
    const volgende = woorden[i + 1];
    const pauze = volgende ? volgende[0] - w[1] > 0.25 : true;
    if (/[.,?!:]$/.test(w[2]) || tekens > 20 || cur.length >= 4 || pauze) {
      uit.push(cur);
      cur = [];
      tekens = 0;
    }
  });
  if (cur.length) uit.push(cur);
  return uit;
}

const Ondertitels: React.FC<{ woorden: Woord[]; y?: number }> = ({ woorden, y = 1330 }) => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const gs = React.useMemo(() => groepen(woorden), [woorden]);
  const idx = gs.findIndex((g, i) => t >= g[0][0] - 0.05 && (i === gs.length - 1 || t < gs[i + 1][0][0] - 0.05));
  if (idx < 0) return null;
  const g = gs[idx];
  if (t > g[g.length - 1][1] + 0.6) return null;
  return (
    <div style={{ position: "absolute", left: 60, right: 60, top: y, display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "6px 16px" }}>
      {g.map((w, i) => {
        const actief = t >= w[0] - 0.03 && t < w[1] + 0.08;
        const pop = interpolate(t - w[0], [0, 0.12], [0.92, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        return (
          <span key={i} style={{
            fontFamily: FONT, fontWeight: 800, fontSize: 74, lineHeight: 1.12, letterSpacing: -0.5,
            color: C.wit, WebkitTextStroke: actief ? "0px" : "2px rgba(20,22,18,0.55)", paintOrder: "stroke fill",
            background: actief ? C.olijf : "transparent", borderRadius: 10, padding: "0 12px",
            transform: `scale(${pop})`, textShadow: actief ? "none" : "0 3px 14px rgba(0,0,0,0.85), 0 0 4px rgba(0,0,0,0.5)",
          }}>{w[2]}</span>
        );
      })}
    </div>
  );
};

// Accent-kaart per zin (graphics "a lot", maar max ca. 20% van het beeld).
const AccentKaart: React.FC<{ a: NonNullable<Accent>; frames: number }> = ({ a, frames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const inn = spring({ frame, fps, config: { damping: 16, mass: 0.7 } });
  const uit = interpolate(frame, [frames - 8, frames], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const lijn = interpolate(frame, [4, 22], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div style={{ position: "absolute", left: 60, top: 210, opacity: uit, transform: `translateX(${(1 - inn) * -80}px)`, display: "flex", alignItems: "stretch" }}>
      <div style={{ display: "flex", gap: 8, marginRight: 22 }}>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{ width: 6, background: i === 1 ? C.creme : C.olijf, borderRadius: 3, transformOrigin: "top", transform: `scaleY(${interpolate(lijn, [i * 0.15, 0.7 + i * 0.15], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })})` }} />
        ))}
      </div>
      <div style={{ background: "rgba(27,34,31,0.78)", borderRadius: 14, padding: "22px 30px 24px", maxWidth: 800, boxShadow: "0 10px 30px rgba(0,0,0,0.25)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18, color: C.olijfLicht }}>
          {a.icoon ? <Icoon naam={a.icoon} size={a.stat ? 54 : 46} color={C.olijfLicht} /> : null}
          {a.stat ? (
            <span style={{ fontFamily: FONT, fontWeight: 800, fontSize: 84, lineHeight: 1, color: C.wit }}>{a.stat}</span>
          ) : null}
          <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: a.stat ? 38 : 44, color: a.stat ? C.creme : C.wit, lineHeight: 1.15 }}>{a.label}</span>
        </div>
        {a.tekst ? (
          <div style={{ fontFamily: FONT, fontWeight: 500, fontSize: 34, color: C.creme, marginTop: 12, opacity: interpolate(frame, [8, 18], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>{a.tekst}</div>
        ) : null}
      </div>
    </div>
  );
};

const CtaKaart: React.FC<{ cta: { titel: string; sub: string; knop: string } }> = ({ cta }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const inn = spring({ frame, fps, config: { damping: 15 } });
  const puls = 1 + 0.04 * Math.sin((frame / fps) * Math.PI * 2 * 1.1);
  const pijl = 10 * Math.sin((frame / fps) * Math.PI * 2 * 1.4);
  return (
    <div style={{ position: "absolute", left: 70, right: 70, top: 220, transform: `translateY(${(1 - inn) * -60}px)`, opacity: inn,
      background: "rgba(27,34,31,0.84)", borderRadius: 20, padding: "38px 44px 40px", display: "flex", flexDirection: "column", alignItems: "center", boxShadow: "0 14px 40px rgba(0,0,0,0.3)" }}>
      <Img src={staticFile("logo/business-nomads-wit.png")} style={{ width: 128 }} />
      <div style={{ fontFamily: FONT, fontWeight: 600, fontSize: 28, letterSpacing: 4, color: C.olijfLicht, marginTop: 18 }}>ELBE 23 · FOREPARK DEN HAAG</div>
      <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 64, color: C.wit, marginTop: 10, textAlign: "center", lineHeight: 1.1 }}>{cta.titel}</div>
      <div style={{ fontFamily: FONT, fontWeight: 500, fontSize: 34, color: C.creme, marginTop: 8, textAlign: "center" }}>{cta.sub}</div>
      <div style={{ marginTop: 28, background: C.olijf, color: C.wit, fontFamily: FONT, fontWeight: 600, fontSize: 40, borderRadius: 10, padding: "18px 40px", display: "flex", alignItems: "center", gap: 16, transform: `scale(${puls})` }}>
        {cta.knop}
        <span style={{ transform: `translateY(${pijl}px)`, display: "flex" }}><Icoon naam="pijl" size={42} color={C.wit} width={2.4} /></span>
      </div>
    </div>
  );
};

// HOOK: grote hooktekst die woord voor woord verschijnt.
export const HookSegment: React.FC<{ hook: string }> = ({ hook }) => {
  const d = (timing.hooks as unknown as Record<string, { woorden: Woord[]; frames: number; clip: number }>)[hook];
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const tag = spring({ frame, fps: FPS, config: { damping: 14 } });
  return (
    <AbsoluteFill style={{ backgroundColor: C.donker }}>
      <Shot clip={d.clip} />
      <Scrims />
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(20,22,18,0) 30%, rgba(20,22,18,0.35) 50%, rgba(20,22,18,0) 75%)" }} />
      <Logo />
      <div style={{ position: "absolute", left: 64, top: 92, display: "flex", alignItems: "center", gap: 14, transform: `translateX(${(1 - tag) * -60}px)`, opacity: tag }}>
        <span style={{ background: "#1F8A4C", color: C.wit, fontFamily: FONT, fontWeight: 700, fontSize: 26, letterSpacing: 2, padding: "8px 16px", borderRadius: 6 }}>NU IN VERKOOP</span>
        <span style={{ fontFamily: FONT, fontWeight: 600, fontSize: 30, color: C.wit, textShadow: "0 2px 10px rgba(0,0,0,0.6)" }}>Business Nomads · Elbe 23</span>
      </div>
      <div style={{ position: "absolute", left: 70, right: 70, top: 640, display: "flex", flexWrap: "wrap", gap: "4px 20px" }}>
        {d.woorden.map((w, i) => {
          const p = interpolate(t - w[0], [-0.02, 0.14], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          const actief = t >= w[0] && t < w[1] + 0.1;
          return (
            <span key={i} style={{ fontFamily: FONT, fontWeight: 800, fontSize: 86, lineHeight: 1.1, letterSpacing: -1,
              color: actief ? C.olijfLicht : C.wit, opacity: p, transform: `translateY(${(1 - p) * 24}px)`,
              textShadow: "0 4px 18px rgba(0,0,0,0.65)" }}>{w[2]}</span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// BODY: shots met harde cuts, accentkaart per zin, ondertitels, CTA in de laatste zin.
export const BodySegment: React.FC<{ body: string }> = ({ body }) => {
  const d = (timing.bodies as any)[body] as {
    frames: number; shots: { clip: number; from: number; frames: number }[];
    zinnen: { woorden: Woord[]; start: number; eind: number; accent: Accent }[];
    cta: { titel: string; sub: string; knop: string };
  };
  const alle = d.zinnen.flatMap((z) => z.woorden);
  const laatste = d.zinnen[d.zinnen.length - 1];
  return (
    <AbsoluteFill style={{ backgroundColor: C.donker }}>
      {d.shots.map((s, i) => (
        <Sequence key={i} from={s.from} durationInFrames={s.frames} premountFor={30}>
          <Shot clip={s.clip} />
        </Sequence>
      ))}
      <Scrims />
      <Sequence durationInFrames={laatste.start}><Logo /></Sequence>
      {d.zinnen.map((z, i) =>
        z.accent ? (
          <Sequence key={i} from={z.start + 4} durationInFrames={Math.max(20, z.eind - z.start - 6)}>
            <AccentKaart a={z.accent} frames={Math.max(20, z.eind - z.start - 6)} />
          </Sequence>
        ) : null,
      )}
      <Sequence from={laatste.start}>
        <CtaKaart cta={d.cta} />
      </Sequence>
      <Ondertitels woorden={alle} />
    </AbsoluteFill>
  );
};

// Preview met audio (Studio). De echte render gebruikt de segmenten + scripts/bouw_audio.py.
export const VolledigeVideo: React.FC<{ hook: string }> = ({ hook }) => {
  const b = hook.split("h")[0];
  const h = (timing.hooks as any)[hook];
  return (
    <AbsoluteFill>
      <Sequence durationInFrames={h.frames}><HookSegment hook={hook} /></Sequence>
      <Sequence from={h.frames}><BodySegment body={b} /></Sequence>
      <Audio src={staticFile(`vo/${hook}.wav`)} />
    </AbsoluteFill>
  );
};
