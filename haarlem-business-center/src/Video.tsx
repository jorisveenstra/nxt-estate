import React from "react";
import { AbsoluteFill, continueRender, delayRender, Easing, interpolate, OffthreadVideo, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig, Img } from "remotion";
import { colors, FPS, fonts, TAIL } from "./brand";
import { CALLOUTS, HOOK_CLIPS, SCENE_CLIPS } from "./config";
import timing from "./timing.json";

type W = { t: string; s: number; e: number };
type Scene = { id: string; start: number; end: number; words: W[] };
const T = timing as Record<string, any>;

// Lokale fonts van de projectwebsite (geen runtime-fetch)
const FONTS: [string, string, string][] = [
  ["Fivo Sans", "fonts/FivoSans-700.woff2", "700"],
  ["Fivo Sans", "fonts/FivoSans-300.woff2", "300"],
  ["TradeGothic Ext", "fonts/TradeGothicExt-700.woff2", "700"],
];
const useFonts = () => {
  const [h] = React.useState(() => delayRender("fonts"));
  React.useEffect(() => {
    Promise.all(
      FONTS.map(async ([fam, f, w]) => {
        const face = new FontFace(fam, `url(${staticFile(f)})`, { weight: w });
        await face.load();
        document.fonts.add(face);
      }),
    ).finally(() => continueRender(h));
  }, [h]);
};

const Clip: React.FC<{ clip: number; dur: number }> = ({ clip, dur }) => {
  const frame = useCurrentFrame();
  const rate = Math.min(1, 7.8 / dur);
  const id = String(clip).padStart(2, "0");
  return (
    <AbsoluteFill style={{ background: colors.ink }}>
      <OffthreadVideo src={staticFile(`clips/p${id}.mp4`)} muted playbackRate={rate} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      <AbsoluteFill style={{ background: "linear-gradient(to bottom, rgba(41,55,61,0) 55%, rgba(41,55,61,0.55) 100%)" }} />
    </AbsoluteFill>
  );
};

// Beeld: alleen harde sneden tussen clips
const Footage: React.FC<{ segs: { clip: number; from: number; to: number }[] }> = ({ segs }) => (
  <AbsoluteFill>
    {segs.map((s, i) => {
      const from = Math.round(s.from * FPS);
      const to = Math.round(s.to * FPS);
      return (
        <Sequence key={i} from={from} durationInFrames={Math.max(1, to - from)} layout="none">
          <AbsoluteFill>
            <Clip clip={s.clip} dur={(to - from) / FPS} />
          </AbsoluteFill>
        </Sequence>
      );
    })}
  </AbsoluteFill>
);

const buildSegs = (body: number, scenes: Scene[], end: number) => {
  const out: { clip: number; from: number; to: number }[] = [];
  scenes.forEach((sc, i) => {
    const sEnd = i + 1 < scenes.length ? scenes[i + 1].start : end;
    const sStart = i === 0 ? 0 : sc.start;
    const list = SCENE_CLIPS[body][sc.id];
    const dur = sEnd - sStart;
    const n = Math.min(list.length, Math.max(1, Math.round(dur / 5)));
    for (let k = 0; k < n; k++) {
      const from = k === 0 ? sStart : sc.words[Math.floor((k * sc.words.length) / n)].s;
      const to = k + 1 < n ? sc.words[Math.floor(((k + 1) * sc.words.length) / n)].s : sEnd;
      out.push({ clip: list[k], from, to });
    }
  });
  return out;
};

const Captions: React.FC<{ words: W[] }> = ({ words }) => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const groups: W[][] = [];
  for (let i = 0; i < words.length; ) {
    let n = 3;
    // zinseinde en komma sluiten een groepje af
    for (let k = 0; k < 3 && i + k < words.length; k++) if (/[.,?!]$/.test(words[i + k].t)) { n = k + 1; break; }
    groups.push(words.slice(i, i + n));
    i += n;
  }
  let gi = groups.findIndex((g, k) => t >= g[0].s - 0.05 && (k + 1 >= groups.length || t < groups[k + 1][0].s - 0.05));
  if (gi < 0) return null;
  const g = groups[gi];
  if (t > g[g.length - 1].e + 0.6) return null;
  return (
    <div style={{ position: "absolute", left: 60, right: 60, top: 1390, height: 220, display: "flex", justifyContent: "center", alignItems: "center", flexWrap: "wrap", gap: "0 22px", textAlign: "center" }}>
      {g.map((w, k) => {
        const active = t >= w.s && t < w.e + 0.04;
        return (
          <span key={k} style={{ fontFamily: fonts.sans, fontWeight: 700, fontSize: 84, lineHeight: 1.12, color: active ? colors.orange : colors.white, textShadow: "0 4px 22px rgba(20,28,32,0.85), 0 0 4px rgba(20,28,32,0.7)", transform: `scale(${active ? 1.06 : 1})` }}>
            {w.t.replace(/[.,]$/, "")}
          </span>
        );
      })}
    </div>
  );
};

const Logo: React.FC = () => (
  <div style={{ position: "absolute", top: 70, left: 60, width: 150, height: 108, borderRadius: 12, background: colors.white, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 8px 24px rgba(20,28,32,0.35)" }}>
    <Img src={staticFile("logo/hbc.svg")} style={{ width: 128, height: "auto" }} />
  </div>
);

const ICONS: Record<string, string> = {
  pin: "M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z",
  units: "M3 21V9l9-6 9 6v12h-6v-7H9v7H3z",
  sun: "M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm0-5h0v3m0 14v3m10-10h-3M5 12H2m16.4-7.4-2.1 2.1M7.7 16.3l-2.1 2.1m0-12.8 2.1 2.1m8.6 8.6 2.1 2.1",
  car: "M5 11l1.5-4.5A2 2 0 0 1 8.4 5h7.2a2 2 0 0 1 1.9 1.5L19 11v7h-2.5v-2h-9v2H5v-7zm2.5 3a1.2 1.2 0 1 0 0-.01zm9 0a1.2 1.2 0 1 0 0-.01z",
  key: "M7 14a5 5 0 1 1 4.6-7H22v4h-2v3h-3v-3h-5.4A5 5 0 0 1 7 14zm0-6.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z",
  leaf: "M20 3C9 3 4 9 4 15c0 1.7.5 3.2 1.4 4.4C7 14 10 11 14 9c-3.500 2.500-5.800 5.700-7 10 .9.700 2 1 3.200 1C16.500 20 20 13 20 3z",
};

const Callout: React.FC<{ at: number; dur: number; icon: string; title: string; sub?: string }> = ({ at, dur, icon, title, sub }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - at, fps, config: { damping: 14, stiffness: 160, mass: 0.7 } });
  const out = interpolate(frame, [at + dur - 8, at + dur], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  if (frame < at || frame > at + dur) return null;
  return (
    <div style={{ position: "absolute", top: 250, left: 60, display: "flex", alignItems: "center", gap: 20, padding: "20px 34px 20px 24px", background: "rgba(41,55,61,0.88)", borderLeft: `8px solid ${colors.orange}`, borderRadius: 14, transform: `translateX(${(1 - p) * -500}px)`, opacity: (1 - out) * Math.min(1, p * 2), boxShadow: "0 10px 30px rgba(0,0,0,0.3)" }}>
      <svg width="64" height="64" viewBox="0 0 24 24" fill={icon === "sun" ? "none" : colors.orange} stroke={colors.orange} strokeWidth={icon === "sun" ? 1.8 : 0.4} strokeLinecap="round">
        <path d={ICONS[icon]} />
      </svg>
      <div>
        <div style={{ fontFamily: fonts.sans, fontWeight: 700, fontSize: 46, color: colors.white, lineHeight: 1.1 }}>{title}</div>
        {sub ? <div style={{ fontFamily: fonts.sans, fontWeight: 300, fontSize: 32, color: colors.gold, marginTop: 4 }}>{sub}</div> : null}
      </div>
    </div>
  );
};

const CtaBar: React.FC<{ at: number }> = ({ at }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - at, fps, config: { damping: 15, stiffness: 140 } });
  const pulse = 1 + 0.03 * Math.sin((frame - at) / 5);
  if (frame < at) return null;
  return (
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 300, background: colors.ink, transform: `translateY(${(1 - p) * 310}px)`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20, borderTop: `8px solid ${colors.orange}` }}>
      <div style={{ fontFamily: fonts.display, fontWeight: 700, fontSize: 40, letterSpacing: 4, color: colors.gold, textTransform: "uppercase" }}>Haarlem Business Center</div>
      <div style={{ fontFamily: fonts.sans, fontWeight: 700, fontSize: 60, color: colors.white, background: colors.orange, padding: "22px 64px", borderRadius: 60, transform: `scale(${pulse})` }}>Plan een afspraak</div>
      <div style={{ fontFamily: fonts.sans, fontWeight: 300, fontSize: 34, color: colors.white }}>haarlembusinesscenter.nl</div>
    </div>
  );
};

export const BodyVideo: React.FC<{ body: number }> = ({ body }) => {
  useFonts();
  const tm = T[`b${body}`];
  const scenes: Scene[] = tm.scenes;
  const end = tm.end + TAIL;
  const c2 = scenes[scenes.length - 1];
  const words = scenes.flatMap((s) => s.words);
  return (
    <AbsoluteFill style={{ background: colors.ink }}>
      <Footage segs={buildSegs(body, scenes, end)} />
      <Logo />
      {CALLOUTS[body].map((c, i) => {
        const sc = scenes.find((s) => s.id === c.scene)!;
        return <Callout key={i} at={Math.round(sc.words[c.word].s * FPS)} dur={Math.round(3.6 * FPS)} icon={c.icon} title={c.title} sub={c.sub} />;
      })}
      <Captions words={words} />
      <CtaBar at={Math.round(c2.words[0].s * FPS)} />
    </AbsoluteFill>
  );
};

export const HookVideo: React.FC<{ body: number; hook: number }> = ({ body, hook }) => {
  useFonts();
  const tm = T[`b${body}h${hook}`];
  return (
    <AbsoluteFill style={{ background: colors.ink }}>
      <Footage segs={[{ clip: HOOK_CLIPS[body][hook], from: 0, to: tm.hookEnd }]} />
      <Logo />
      <Captions words={tm.words} />
    </AbsoluteFill>
  );
};
