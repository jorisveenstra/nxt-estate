import React from "react";
import { AbsoluteFill, Easing, interpolate, OffthreadVideo, Sequence, staticFile, useCurrentFrame, useVideoConfig, delayRender, continueRender } from "remotion";
import { colors, FONT, FONT_CSS, FPS } from "./brand";
import { CTA_TEKST, HOOK_ACCENT, HOOK_CLIPS, Item, POOL, SCENE_CLIPS, SCENE_ITEMS, SITE, TAAL } from "./config";
import { Icon } from "./icons";
import { Chip, clamp, getTiming, norm, Scene, Stat, usePop, useOut, wordTime } from "./ui";

export const TAIL = 2.6; // seconden na de laatste zin
const SEG_MAX = 6.5; // een clip duurt 8 s; per segment max 6,5 s, langere stukken krijgen een extra harde knip
const CLIP_LEN = 8;

// Hook en body worden apart gerenderd (body één keer per body) en met ffmpeg aan elkaar gezet.
// De body begint op het eerste beeld na de hook: hookFrames = begin van de body in de voice-over.
export const hookFrames = (body: number, hook: number) => {
  const t = getTiming(body, hook);
  return Math.round(t.scenes[1].start * FPS) - Math.round(0.02 * FPS);
};
export const bodyFrames = (body: number) => {
  const t = getTiming(body, 1);
  return Math.ceil((t.end + TAIL) * FPS) - hookFrames(body, 1);
};

type Segment = { clip: string; from: number; to: number; offset: number };

// Verdeelt [from,to] over n clips, met knippunten op woordgrenzen
const plan = (scene: Scene | null, from: number, to: number, list: string[], taken: string[], used: Record<string, number>): Segment[] => {
  const n = Math.max(list.length, Math.ceil((to - from) / SEG_MAX));
  const clips = [...list];
  for (const c of POOL) {
    if (clips.length >= n) break;
    if (!clips.includes(c) && c !== taken[taken.length - 1]) clips.push(c);
  }
  const cuts = [from];
  for (let i = 1; i < n; i++) {
    const ideal = from + ((to - from) * i) / n;
    const w = scene?.words.map((x) => x.s).filter((s) => s > cuts[i - 1] + 1.2 && s < to - 1.2) ?? [];
    cuts.push(w.length ? w.reduce((a, b) => (Math.abs(b - ideal) < Math.abs(a - ideal) ? b : a)) : ideal);
  }
  cuts.push(to);
  return clips.slice(0, n).map((clip, i) => {
    const len = cuts[i + 1] - cuts[i];
    const k = used[clip] ?? 0;
    used[clip] = k + 1;
    return { clip, from: cuts[i], to: cuts[i + 1], offset: Math.max(0, Math.min(k * 2.2, CLIP_LEN - 0.2 - len)) };
  });
};

const ClipSegment: React.FC<{ seg: Segment }> = ({ seg }) => (
  <AbsoluteFill>
    <OffthreadVideo src={staticFile(`clips/${seg.clip}.mp4`)} muted trimBefore={Math.round(seg.offset * FPS)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
  </AbsoluteFill>
);

const Fonts: React.FC = () => {
  const [handle] = React.useState(() => delayRender("fonts"));
  React.useEffect(() => {
    Promise.all([600, 700, 800, 900].map((w) => document.fonts.load(`${w} 40px Poppins`))).then(() => continueRender(handle));
  }, [handle]);
  return <style>{FONT_CSS}</style>;
};

// Tekstlogo: ACE in oranje vlak, "fase 2" ernaast (de site toont geen apart ACE-logo)
const Logo: React.FC = () => (
  <div style={{ position: "absolute", top: 84, left: 56, display: "flex", alignItems: "center", gap: 16, filter: "drop-shadow(0 3px 10px rgba(0,0,0,0.45))", fontFamily: FONT }}>
    <div style={{ background: colors.orange, color: colors.white, fontWeight: 900, fontSize: 40, letterSpacing: 2, padding: "10px 20px", borderRadius: 14 }}>ACE</div>
    <div style={{ color: colors.white, fontWeight: 700, fontSize: 36, lineHeight: 1 }}>fase 2<div style={{ fontWeight: 600, fontSize: 22, opacity: 0.9, marginTop: 4 }}>Amsterdam</div></div>
  </div>
);

const Scrim: React.FC = () => (
  <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0) 20%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.6) 100%)" }} />
);

// Hook: grote tekst die woord voor woord verschijnt, accentwoorden in oranje vlak
const HookText: React.FC<{ scene: Scene; accent: string[] }> = ({ scene, accent }) => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const acc = accent.map(norm);
  return (
    <AbsoluteFill style={{ padding: "300px 60px 0", alignItems: "flex-start" }}>
      <div style={{ display: "flex", flexWrap: "wrap", columnGap: 18, rowGap: 6, fontFamily: FONT, fontWeight: 800, fontSize: 70, lineHeight: 1.12, color: colors.white }}>
        {scene.words.map((w, i) => {
          const isAcc = acc.some((a) => norm(w.t).startsWith(a));
          const p = interpolate(t, [w.s - 0.05, w.s + 0.14], [0, 1], { ...clamp, easing: Easing.out(Easing.back(2)) });
          return (
            <span
              key={i}
              style={{
                opacity: p,
                transform: `translateY(${(1 - p) * 40}px) scale(${0.8 + 0.2 * p})`,
                background: isAcc ? colors.orange : "transparent",
                padding: isAcc ? "0 14px" : 0,
                borderRadius: 12,
                textShadow: isAcc ? "none" : "0 4px 18px rgba(0,0,0,0.8), 0 1px 3px rgba(0,0,0,0.9)",
              }}
            >
              {w.t}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// Ondertitels: korte groepjes woorden, het gesproken woord licht op in oranje
const Captions: React.FC<{ scenes: Scene[]; offset: number }> = ({ scenes, offset }) => {
  const frame = useCurrentFrame();
  const t = frame / FPS + offset;
  const words = scenes.flatMap((s) => s.words);
  const chunks: (typeof words)[] = [];
  let cur: typeof words = [];
  words.forEach((w) => {
    cur.push(w);
    const len = cur.map((c) => c.t).join(" ").length;
    if (/[.,?!]$/.test(w.t) || cur.length >= 4 || len > 22) {
      chunks.push(cur);
      cur = [];
    }
  });
  if (cur.length) chunks.push(cur);
  const idx = chunks.findIndex((c, i) => t >= c[0].s - 0.05 && (i + 1 >= chunks.length || t < chunks[i + 1][0].s - 0.05));
  const chunk = idx >= 0 ? chunks[idx] : null;
  if (!chunk || t > chunk[chunk.length - 1].e + 0.6) return null;
  const pop = interpolate((t - chunk[0].s) * FPS, [0, 4], [0.88, 1], clamp);
  return (
    <AbsoluteFill style={{ justifyContent: "flex-start", alignItems: "center", paddingTop: 1120 }}>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", columnGap: 14, rowGap: 6, maxWidth: 960, transform: `scale(${pop})`, fontFamily: FONT, fontWeight: 800, fontSize: 62, textAlign: "center" }}>
        {chunk.map((w, i) => {
          const active = t >= w.s - 0.03 && t < (chunk[i + 1]?.s ?? w.e + 0.6);
          return (
            <span key={i} style={{ color: colors.white, background: active ? colors.orange : "transparent", padding: "0 14px", borderRadius: 12, textShadow: active ? "none" : "0 3px 14px rgba(0,0,0,0.8), 0 1px 3px rgba(0,0,0,0.9)" }}>
              {w.t}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// Chips en kengetallen, onder elkaar linksboven, elk op het moment van het bijbehorende woord
const Accents: React.FC<{ scene: Scene; items: Item[]; offset: number; outAt: number }> = ({ scene, items, offset, outAt }) => (
  <AbsoluteFill style={{ padding: "290px 56px 0", flexDirection: "column", gap: 22 }}>
    {items.map((it, i) => {
      const at = Math.round((wordTime(scene, it.w) - offset + (it.w ? 0 : 0.15 + i * 0.35)) * FPS);
      return it.k === "chip" ? <Chip key={i} at={at} outAt={outAt} icon={it.icon} text={it.text} /> : <Stat key={i} at={at} outAt={outAt} big={it.big} small={it.small} />;
    })}
  </AbsoluteFill>
);

const Cta: React.FC<{ body: number; at: number }> = ({ body, at }) => {
  const frame = useCurrentFrame();
  const tx = CTA_TEKST[TAAL[body]];
  const p = usePop(at + 4, { damping: 13, stiffness: 150, mass: 0.9 });
  const pulse = 1 + 0.035 * Math.sin(((frame - at) / FPS) * Math.PI * 2.4);
  const arrow = Math.sin(((frame - at) / FPS) * Math.PI * 3) * 8;
  return (
    <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: 190 }}>
      <div style={{ width: 960, background: colors.cream, borderRadius: 40, padding: "34px 40px 38px", fontFamily: FONT, boxShadow: "0 24px 60px rgba(0,0,0,0.45)", transform: `translateY(${(1 - p) * 520}px)`, opacity: Math.min(1, p * 2) }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ background: colors.orange, color: colors.white, fontWeight: 900, fontSize: 38, padding: "6px 18px", borderRadius: 12, letterSpacing: 2 }}>ACE</div>
          <div style={{ fontWeight: 800, fontSize: 56, color: colors.ink, letterSpacing: -1 }}>{tx.kop}</div>
        </div>
        <div style={{ marginTop: 22, background: colors.orange, color: colors.white, borderRadius: 999, padding: "24px 36px", fontWeight: 800, fontSize: 44, display: "flex", justifyContent: "center", alignItems: "center", gap: 18, transform: `scale(${pulse})` }}>
          {tx.knop}
          <span style={{ transform: `translateX(${arrow}px)`, display: "flex" }}><Icon name="arrow" size={50} color={colors.white} stroke={2.8} /></span>
        </div>
        <div style={{ marginTop: 18, textAlign: "center", fontWeight: 600, fontSize: 28, color: colors.steel }}>{SITE}</div>
      </div>
    </AbsoluteFill>
  );
};

export type HookProps = { body: number; hook: number };
export type BodyProps = { body: number };

const lastHookClips = (body: number) => Object.values(HOOK_CLIPS[body]).map((l) => l[l.length - 1]);

export const HookVideo: React.FC<HookProps> = ({ body, hook }) => {
  const total = hookFrames(body, hook);
  const scene = getTiming(body, hook).scenes[0];
  const segs = plan(scene, 0, total / FPS, HOOK_CLIPS[body][hook], [], {});
  return (
    <AbsoluteFill style={{ backgroundColor: colors.ink }}>
      <Fonts />
      {segs.map((s, i) => (
        <Sequence key={i} from={Math.round(s.from * FPS)} durationInFrames={Math.max(1, Math.round(s.to * FPS) - Math.round(s.from * FPS))}>
          <ClipSegment seg={s} />
        </Sequence>
      ))}
      <Scrim />
      <Logo />
      <HookText scene={scene} accent={HOOK_ACCENT[body][hook]} />
    </AbsoluteFill>
  );
};

export const BodyVideo: React.FC<BodyProps> = ({ body }) => {
  const frame = useCurrentFrame();
  const t = getTiming(body, 1);
  const offset = hookFrames(body, 1) / FPS;
  const endT = t.end + TAIL;
  const scenes = t.scenes.slice(1);
  const used: Record<string, number> = {};
  const taken: string[] = [];
  const segs: Segment[] = [];
  scenes.forEach((sc, i) => {
    const from = i === 0 ? offset : sc.start;
    const to = i + 1 < scenes.length ? scenes[i + 1].start : endT;
    let list = SCENE_CLIPS[body][sc.id];
    if (i === 0 && lastHookClips(body).includes(list[0])) throw new Error(`Eerste bodyclip ${list[0]} is ook het einde van een hook`);
    if (list[0] === taken[taken.length - 1]) list = [...list.slice(1), list[0]];
    const ss = plan(sc, from, to, list, taken, used).map((s) => ({ ...s, from: s.from - offset, to: s.to - offset }));
    ss.forEach((s) => taken.push(s.clip));
    segs.push(...ss);
  });
  const cta = scenes[scenes.length - 1];
  const F = (s: number) => Math.round(s * FPS);
  return (
    <AbsoluteFill style={{ backgroundColor: colors.ink }}>
      <Fonts />
      {segs.map((s, i) => (
        <Sequence key={i} from={F(s.from)} durationInFrames={Math.max(1, F(s.to) - F(s.from))}>
          <ClipSegment seg={s} />
        </Sequence>
      ))}
      <Scrim />
      <Logo />
      {scenes.map((sc, i) => {
        const items = SCENE_ITEMS[body][sc.id] ?? [];
        const next = (i + 1 < scenes.length ? scenes[i + 1].start : endT) - offset;
        const start = Math.max(0, F(sc.start - offset));
        if (!items.length || sc.id === "cta") return null;
        return (
          <Sequence key={sc.id} from={start} durationInFrames={Math.max(1, F(next) - start)} layout="none">
            <Accents scene={sc} items={items} offset={offset + start / FPS} outAt={F(next) - start - 8} />
          </Sequence>
        );
      })}
      <Captions scenes={scenes} offset={offset} />
      <Sequence from={F(cta.start - offset)} layout="none">
        <Cta body={body} at={0} />
      </Sequence>
    </AbsoluteFill>
  );
};

export { delayRender };
