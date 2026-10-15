import React, { createContext, useContext } from "react";
import { interpolate, OffthreadVideo, spring, staticFile, useCurrentFrame, useVideoConfig, Sequence, Img } from "remotion";
import { colors, fonts, FPS } from "./brand";

export type Word = { t: string; s: number; e: number };
export type SceneInfo = { id: string; start: number; end: number; words: Word[] };

// Context per scène: tijden zijn in seconden, relatief aan het begin van de scène
const Ctx = createContext<{ words: Word[]; dur: number }>({ words: [], dur: 1 });
export const SceneProvider = Ctx.Provider;
export const useScene = () => useContext(Ctx);

/** Seconden (scène-lokaal) waarop het eerste woord dat de regex matcht wordt uitgesproken. */
export const useCue = () => {
  const { words, dur } = useScene();
  return (re: RegExp, fallback = 0): number => {
    const w = words.find((x) => re.test(x.t));
    return w ? Math.max(0, w.s - 0.05) : Math.min(fallback, dur);
  };
};

export const useT = () => useCurrentFrame() / FPS;

/** Veer 0..1 vanaf `at` seconden. */
export const usePop = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (at: number, damping = 13, stiffness = 150): number =>
    spring({ frame: f - at * fps, fps, config: { damping, stiffness, mass: 0.8 } });
};

/** Lineair 0..1 tussen a en b seconden. */
export const useRamp = () => {
  const t = useT();
  return (a: number, b: number): number => interpolate(t, [a, b], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
};

export const ease = (x: number) => 1 - Math.pow(1 - x, 3);

// ------------------------------------------------------------ beeld

/** Achtergrondclip(s): harde sneden, geen overgangseffecten. Eerste frames overslaan (letterbox in frame 0). */
export const ClipBg: React.FC<{ clips: string[]; dur: number }> = ({ clips, dur }) => {
  const per = Math.ceil((dur * FPS) / clips.length);
  return (
    <>
      {clips.map((c, i) => (
        <Sequence key={i} from={i * per} durationInFrames={per + (i === clips.length - 1 ? 60 : 0)}>
          <OffthreadVideo src={staticFile(`clips/${c}.mp4`)} startFrom={6} muted style={{ width: 1080, height: 1920, objectFit: "cover" }} />
        </Sequence>
      ))}
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(27,38,43,0.55) 0%, rgba(27,38,43,0.25) 30%, rgba(27,38,43,0.55) 60%, rgba(27,38,43,0.92) 100%)" }} />
    </>
  );
};

export const Logo: React.FC<{ w?: number; style?: React.CSSProperties }> = ({ w = 170, style }) => (
  <Img src={staticFile("logo/hbc-logo.png")} style={{ width: w, ...style }} />
);

export const Panel: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <div
    style={{
      position: "absolute", left: 50, right: 50, top: 250, height: 1000, borderRadius: 44,
      background: "rgba(27,38,43,0.82)", border: "2px solid rgba(255,255,255,0.14)",
      boxShadow: "0 30px 80px rgba(0,0,0,0.45)", overflow: "hidden", ...style,
    }}
  >
    {children}
  </div>
);

export const Kicker: React.FC<{ children: React.ReactNode; color?: string; style?: React.CSSProperties }> = ({ children, color = colors.orange, style }) => (
  <div style={{ fontFamily: fonts.head, fontSize: 40, letterSpacing: 5, textTransform: "uppercase", color, ...style }}>{children}</div>
);

export const Big: React.FC<{ children: React.ReactNode; size?: number; color?: string; style?: React.CSSProperties }> = ({ children, size = 150, color = colors.white, style }) => (
  <div style={{ fontFamily: fonts.head, fontSize: size, lineHeight: 0.95, color, textTransform: "uppercase", ...style }}>{children}</div>
);

export const Label: React.FC<{ children: React.ReactNode; size?: number; color?: string; style?: React.CSSProperties }> = ({ children, size = 46, color = colors.white, style }) => (
  <div style={{ fontFamily: fonts.sans, fontWeight: 700, fontSize: size, lineHeight: 1.1, color, ...style }}>{children}</div>
);

export const Counter: React.FC<{ to: number; from?: number; at: number; dur?: number }> = ({ to, from = 0, at, dur = 1.2 }) => {
  const t = useT();
  const k = ease(interpolate(t, [at, at + dur], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  return <>{Math.round(from + (to - from) * k)}</>;
};

// ------------------------------------------------------------ ondertitels

/** Ondertitels in blokjes van max. ~3-4 woorden; het gesproken woord licht op. `words` zijn scène-lokaal in seconden. */
export const Subtitles: React.FC<{ words: Word[]; bottom?: number }> = ({ words, bottom = 330 }) => {
  const t = useT();
  const chunks: Word[][] = [];
  let cur: Word[] = [];
  for (const w of words) {
    const len = [...cur, w].map((x) => x.t).join(" ").length;
    if (cur.length && (len > 24 || cur.length >= 4)) {
      chunks.push(cur);
      cur = [];
    }
    cur.push(w);
  }
  if (cur.length) chunks.push(cur);
  let active = chunks.findIndex((c, i) => t >= c[0].s - 0.02 && (i === chunks.length - 1 || t < chunks[i + 1][0].s - 0.02));
  if (t < (chunks[0]?.[0].s ?? 0) - 0.02) active = -1;
  if (active < 0) return null;
  const c = chunks[active];
  return (
    <div style={{ position: "absolute", left: 40, right: 40, bottom, display: "flex", justifyContent: "center", flexWrap: "wrap", gap: "0 34px" }}>
      {c.map((w, i) => {
        const on = t >= w.s - 0.02 && t < w.e + 0.1;
        return (
          <span key={i} style={{
            fontFamily: fonts.sans, fontWeight: 700, fontSize: 84, lineHeight: 1.18, textTransform: "uppercase",
            color: on ? colors.orange : colors.white, textShadow: "0 4px 18px rgba(0,0,0,0.75), 0 0 4px rgba(0,0,0,0.6)",
            transform: `scale(${on ? 1.07 : 1})`,
          }}>{w.t.replace(/[.,]$/, "")}</span>
        );
      })}
    </div>
  );
};

// ------------------------------------------------------------ iconen (lijn, 100x100)

const I: React.FC<{ size?: number; color?: string; children: React.ReactNode; sw?: number }> = ({ size = 120, color = colors.white, children, sw = 4.5 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">{children}</svg>
);
type IP = { size?: number; color?: string };
export const IcDoor = (p: IP) => (<I {...p}><rect x="12" y="20" width="76" height="64" rx="4" /><path d="M20 32h60M20 44h60M20 56h60M20 68h60" /></I>);
export const IcGlass = (p: IP) => (<I {...p}><rect x="14" y="14" width="72" height="72" rx="3" /><path d="M38 14v72M62 14v72M14 42h72M14 64h72" /><path d="M22 30l10-10M46 34l12-12" strokeWidth="3" /></I>);
export const IcDesk = (p: IP) => (<I {...p}><rect x="22" y="22" width="56" height="36" rx="4" /><path d="M10 74h80M38 74v-16M62 74v-16M38 66h24" /></I>);
export const IcHall = (p: IP) => (<I {...p}><path d="M8 84V40L50 16l42 24v44" /><path d="M24 84V54h52v30M24 64h52M24 74h52" /></I>);
export const IcVan = (p: IP) => (<I {...p}><path d="M8 66V34h46v32M54 44h20l14 14v8H54" /><circle cx="28" cy="70" r="8" /><circle cx="72" cy="70" r="8" /></I>);
export const IcBoxes = (p: IP) => (<I {...p}><path d="M12 52h36v34H12zM52 52h36v34H52zM32 18h36v34H32z" /><path d="M12 62h36M52 62h36M32 28h36" /></I>);
export const IcBuilding = (p: IP) => (<I {...p}><path d="M18 86V30l32-14 32 14v56M10 86h80" /><path d="M32 42h8M46 42h8M60 42h8M32 56h8M46 56h8M60 56h8M32 70h8M60 70h8M46 70h8" /></I>);
export const IcRocket = (p: IP) => (<I {...p}><path d="M14 74l26-26M40 48l20-34 26 10-14 44-30 4zM24 86l-8 0 0-8" /><circle cx="66" cy="34" r="5" /></I>);
export const IcCup = (p: IP) => (<I {...p}><path d="M20 38h46v24a22 22 0 0 1-22 22h-2a22 22 0 0 1-22-22zM66 44h8a10 10 0 0 1 0 20h-8M14 90h58" /><path d="M32 28c-4-5 4-8 0-14M46 28c-4-5 4-8 0-14" /></I>);
export const IcLunch = (p: IP) => (<I {...p}><circle cx="50" cy="56" r="26" /><circle cx="50" cy="56" r="14" /><path d="M10 24v22a6 6 0 0 0 6 6M16 24v28M22 24v22a6 6 0 0 1-6 6M16 52v32M90 24c-8 4-8 22 0 28v32" /></I>);
export const IcDrink = (p: IP) => (<I {...p}><path d="M24 18h24l-4 36a8 8 0 0 1-16 0zM32 62v24M22 86h20M58 28h20l-3 30a7 7 0 0 1-14 0zM68 66v20M60 86h16" /><path d="M54 14l-4 -8M66 12l0 -8M78 14l4 -8" /></I>);
export const IcLift = (p: IP) => (<I {...p}><rect x="22" y="12" width="56" height="76" rx="4" /><path d="M50 12v76M36 40l8-10 8 10M56 62l8 10 8-10" transform="translate(-6 0)" /></I>);
export const IcLeaf = (p: IP) => (<I {...p}><path d="M20 80C16 40 40 16 84 16c0 44-24 68-60 66zM20 80c14-22 30-36 50-48" /></I>);
export const IcCamera = (p: IP) => (<I {...p}><path d="M14 36h48v28H14zM62 44l24-10v32l-24-10" /><path d="M28 64v14h24" /></I>);
export const IcHeat = (p: IP) => (<I {...p}><rect x="14" y="22" width="72" height="56" rx="8" /><circle cx="50" cy="50" r="18" /><path d="M50 32v36M32 50h36M37 37l26 26M63 37L37 63" strokeWidth="3" /></I>);
export const IcSun = (p: IP) => (<I {...p}><circle cx="50" cy="50" r="16" /><path d="M50 10v14M50 76v14M10 50h14M76 50h14M22 22l10 10M68 68l10 10M78 22L68 32M32 68L22 78" /></I>);
export const IcPlane = (p: IP) => (<I {...p}><path d="M10 56l80-34-22 56-18-20-14 12-4-20zM46 56l22-22" /></I>);
export const IcPin = (p: IP) => (<I {...p}><path d="M50 90C30 66 22 54 22 40a28 28 0 0 1 56 0c0 14-8 26-28 50z" /><circle cx="50" cy="40" r="10" /></I>);
export const IcBolt = (p: IP) => (<I {...p}><path d="M56 8L24 56h24l-6 36 34-50H52z" /></I>);
export const IcCheck = (p: IP) => (<I {...p} sw={9}><path d="M20 54l22 22 40-46" /></I>);
export const IcCar = (p: IP) => (<I {...p}><path d="M10 62V50l10-18h60l10 18v12zM10 62h80M10 62v10h14v-10M76 62v10h14V62" /><circle cx="28" cy="58" r="3" /><circle cx="72" cy="58" r="3" /></I>);
export const IcCalendar = (p: IP) => (<I {...p}><rect x="12" y="20" width="76" height="68" rx="6" /><path d="M12 42h76M32 10v18M68 10v18" /></I>);
export const IcCrane = (p: IP) => (<I {...p}><path d="M30 90V20M18 90h24M30 20h56M30 32l-14-4M30 20l36 0M72 20v28M68 48h8v8h-8z" /><path d="M30 34l20-14M30 46l32-26M30 58l40-38" strokeWidth="2.5" /></I>);
export const IcPeople = (p: IP) => (<I {...p}><circle cx="50" cy="32" r="12" /><path d="M26 82c0-18 10-28 24-28s24 10 24 28" /><circle cx="20" cy="42" r="8" /><circle cx="80" cy="42" r="8" /></I>);
export const IcKeys = (p: IP) => (<I {...p}><circle cx="30" cy="40" r="16" /><path d="M42 50l40 36M64 68l8-8M74 78l8-8" /></I>);
export const IcStar = (p: IP) => (<I {...p}><path d="M50 10l12 26 28 4-20 20 5 28-25-14-25 14 5-28-20-20 28-4z" /></I>);
export const IcSolarPanel = (p: IP) => (<I {...p}><path d="M22 28h66l-10 44H12zM17 50h66M39 28l-6 44M62 28l-3 44" /><path d="M44 72v14M30 86h28" /></I>);
export const IcWindowSun = (p: IP) => (<I {...p}><rect x="16" y="22" width="68" height="64" rx="3" /><path d="M16 54h68M50 22v64" /><path d="M42 8l8-4 8 4" /></I>);
export const IcRocketUp = IcRocket;
