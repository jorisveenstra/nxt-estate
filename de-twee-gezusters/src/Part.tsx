import React from "react";
import { AbsoluteFill, interpolate, OffthreadVideo, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { BODY_TAIL, colors, fonts, HOOK_PAUSE } from "./brand";
import clipLengths from "./clips.json";
import { BODY_GFX, BODY_SHOTS, Gfx, HOOK_ACCENT, HOOK_LABEL, HOOK_SHOTS, ShotList } from "./config";
import { Chip, clamp, getTiming, Icon, norm, Scene, useOut, usePop, wordTime } from "./ui";

// Eén deel van een advertentie: de hook (per variant) of de body + CTA (één keer per body).
// Tijden zijn relatief aan het begin van het deel; de definitieve video = hookdeel + bodydeel (harde knip).
export type PartProps = { body: number; hook: number | null };

const LEAD = 0.08; // knip net vóór het eerste woord
type Segment = { clip: string; from: number; to: number };

export const partKey = ({ body, hook }: PartProps) => (hook ? `b${body}-h${hook}` : `b${body}-body`);

export const partDuration = (p: PartProps, fps: number) => {
  const t = getTiming(partKey(p));
  return Math.ceil((t.audio + (p.hook ? HOOK_PAUSE : BODY_TAIL)) * fps);
};

const buildSegments = (p: PartProps, scenes: Scene[], end: number): Segment[] => {
  const segs: Segment[] = [];
  scenes.forEach((sc, i) => {
    const sceneEnd = i + 1 < scenes.length ? scenes[i + 1].start - LEAD : end;
    const list: ShotList = p.hook ? HOOK_SHOTS[p.body][p.hook] : BODY_SHOTS[p.body][sc.id];
    list.forEach(([clip, word], k) => {
      const from = k === 0 ? (i === 0 ? 0 : sc.start - LEAD) : wordTime(sc, word!) - LEAD;
      const next = list[k + 1];
      const to = next ? wordTime(sc, next[1]!) - LEAD : sceneEnd;
      segs.push({ clip, from, to });
    });
  });
  return segs;
};

// Eén shot: full-bleed, cover-fit, met hooguit een rustige drift binnen hetzelfde shot (geen overgang)
const Shot: React.FC<{ seg: Segment; frames: number }> = ({ seg, frames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const len = (clipLengths as Record<string, number>)[seg.clip] - 0.15;
  const rate = Math.min(1, len / (frames / fps));
  const scale = interpolate(frame, [0, frames], [1.0, 1.045], clamp);
  const ai = seg.clip.startsWith("ai-");
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ transform: `scale(${scale})` }}>
        <OffthreadVideo
          src={staticFile(`clips/${seg.clip}.mp4`)}
          muted
          playbackRate={rate}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </AbsoluteFill>
      {ai ? (
        <div style={{ position: "absolute", right: 40, top: 168, fontFamily: fonts.sans, fontWeight: 600, fontSize: 22, letterSpacing: 1.5, color: "rgba(255,255,255,0.92)", background: "rgba(10,22,14,0.45)", padding: "6px 14px", borderRadius: 8, textTransform: "uppercase" }}>
          Artist impression
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

// Ondertitels per woord: korte groepjes, het gesproken woord krijgt een groen blok
const Captions: React.FC<{ scenes: Scene[]; big?: boolean; accent?: string[] }> = ({ scenes, big, accent = [] }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const words = scenes.flatMap((s) => s.words);
  const chunks: (typeof words)[] = [];
  let cur: typeof words = [];
  words.forEach((w) => {
    cur.push(w);
    const len = cur.map((c) => c.t).join(" ").length;
    if (/[.,?!:]$/.test(w.t) || cur.length >= 4 || len > 19) {
      chunks.push(cur);
      cur = [];
    }
  });
  if (cur.length) chunks.push(cur);
  const idx = chunks.findIndex((c, i) => t >= c[0].s - 0.05 && (i + 1 >= chunks.length || t < chunks[i + 1][0].s - 0.05));
  const chunk = idx >= 0 ? chunks[idx] : null;
  if (!chunk || t > chunk[chunk.length - 1].e + 0.5) return null;
  const since = (t - chunk[0].s) * fps;
  const pop = interpolate(since, [0, 4], [0.9, 1], clamp);
  return (
    <AbsoluteFill style={{ justifyContent: "flex-start", alignItems: "center", paddingTop: big ? 1060 : 1150 }}>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          columnGap: 14,
          rowGap: 6,
          maxWidth: 960,
          transform: `scale(${pop})`,
          fontFamily: fonts.sans,
          fontWeight: 800,
          fontSize: big ? 70 : 60,
          lineHeight: 1.18,
          textAlign: "center",
        }}
      >
        {chunk.map((w, i) => {
          const active = t >= w.s - 0.03 && t < (chunk[i + 1]?.s ?? w.e + 0.5);
          const acc = accent.includes(norm(w.t));
          return (
            <span
              key={i}
              style={{
                color: acc && !active ? colors.leaf : colors.white,
                background: active ? colors.sage : "transparent",
                padding: "2px 12px",
                borderRadius: 10,
                textShadow: active ? "none" : "0 3px 14px rgba(0,0,0,0.8), 0 1px 3px rgba(0,0,0,0.9)",
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

// Projectnaam als tekst (er is geen geverifieerd logo beschikbaar)
const Wordmark: React.FC<{ size?: number; color?: string }> = ({ size = 1, color = colors.white }) => (
  <div style={{ fontFamily: fonts.display, color, lineHeight: 1, textShadow: "0 2px 4px rgba(0,0,0,0.55), 0 4px 22px rgba(0,0,0,0.6)" }}>
    <div style={{ fontWeight: 700, fontSize: 30 * size, letterSpacing: 6 * size, textTransform: "uppercase" }}>De Twee Gezusters</div>
    <div style={{ fontWeight: 400, fontSize: 22 * size, letterSpacing: 8 * size, textTransform: "uppercase", marginTop: 8 * size, opacity: 0.9 }}>
      Roosendaal
    </div>
  </div>
);

const TitleGfx: React.FC<{ scene: Scene; outAt: number }> = ({ scene, outAt }) => {
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame();
  const at = Math.round(scene.start * fps);
  const p = usePop(at + 2);
  const o = useOut(outAt);
  const line = interpolate(frame, [at + 6, at + 22], [0, 1], clamp);
  return (
    <div style={{ position: "absolute", left: 70, top: 300, opacity: Math.min(1, p * 1.4) * (1 - o), transform: `translateY(${(1 - p) * 40}px)` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, fontFamily: fonts.sans, fontWeight: 700, fontSize: 32, color: colors.cream, textShadow: "0 2px 4px rgba(0,0,0,0.6), 0 2px 14px rgba(0,0,0,0.6)" }}>
        <Icon name="pin" size={40} color={colors.cream} draw={line} /> ROOSENDAAL
      </div>
      <div style={{ fontFamily: fonts.display, fontWeight: 700, fontSize: 96, lineHeight: 1.0, color: colors.white, marginTop: 14, textShadow: "0 4px 24px rgba(0,0,0,0.55)" }}>
        De Twee
        <br />
        Gezusters
      </div>
      <div style={{ height: 6, width: 260 * line, background: colors.leaf, borderRadius: 3, marginTop: 22 }} />
    </div>
  );
};

const RouteGfx: React.FC<{ scene: Scene; outAt: number; text: string; sub: string }> = ({ scene, outAt, text, sub }) => {
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame();
  const at = Math.round(scene.start * fps);
  const o = useOut(outAt);
  const d = interpolate(frame, [at + 2, at + 30], [0, 1], clamp);
  const p1 = usePop(at);
  const p2 = usePop(at + 26);
  const subAt = Math.round(wordTime(scene, "logistiek") * fps);
  const p3 = usePop(subAt);
  return (
    <div style={{ position: "absolute", left: 60, top: 270, opacity: 1 - o }}>
      <svg width={520} height={150} viewBox="0 0 520 150" style={{ overflow: "visible" }}>
        <path d="M30 120 C 160 120, 200 30, 330 40 S 470 90, 490 40" fill="none" stroke={colors.cream} strokeWidth={7} strokeLinecap="round" strokeDasharray="2 18" pathLength={1000} style={{ strokeDashoffset: 0, clipPath: `inset(0 ${100 - d * 100}% 0 0)` }} />
        <circle cx={30} cy={120} r={14 * p1} fill={colors.cream} />
        <g transform={`translate(490 40) scale(${p2}) translate(-24 -44)`}>
          <path d="M24 44s-17-15-17-28a17 17 0 0 1 34 0c0 13-17 28-17 28z" fill={colors.sage} stroke={colors.cream} strokeWidth={4} />
          <circle cx={24} cy={16} r={6} fill={colors.cream} />
        </g>
      </svg>
      <div style={{ marginTop: 18 }}>
        <Chip at={at + 4} outAt={outAt} icon="pin" text={text} />
      </div>
      <div style={{ marginTop: 16, opacity: p3, transform: `translateY(${(1 - p3) * 20}px)`, fontFamily: fonts.sans, fontWeight: 700, fontSize: 36, color: colors.white, textShadow: "0 2px 12px rgba(0,0,0,0.7)", paddingLeft: 12 }}>
        {sub}
      </div>
    </div>
  );
};

const CtaGfx: React.FC<{ scene: Scene; text: string; sub: string }> = ({ scene, text, sub }) => {
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame();
  const at = Math.round(scene.start * fps);
  const knop = Math.round(wordTime(scene, "knop") * fps);
  const p = usePop(at);
  const pb = usePop(knop, { damping: 9, stiffness: 200, mass: 0.6 });
  const bounce = Math.sin(Math.max(0, frame - knop) / 5) * 10 * pb;
  return (
    <>
      <div style={{ position: "absolute", left: 70, top: 300, opacity: Math.min(1, p * 1.4), transform: `translateY(${(1 - p) * 30}px)` }}>
        <Wordmark size={1.5} />
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 1420, display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
            padding: "30px 54px",
            borderRadius: 999,
            background: colors.cream,
            color: colors.green,
            fontFamily: fonts.sans,
            fontWeight: 800,
            fontSize: 50,
            boxShadow: "0 16px 44px rgba(10,25,15,0.45)",
            transform: `scale(${pb})`,
          }}
        >
          <Icon name="calendar" size={52} color={colors.green} />
          {text}
        </div>
        <div style={{ opacity: pb, fontFamily: fonts.sans, fontWeight: 600, fontSize: 32, color: colors.white, textShadow: "0 2px 10px rgba(0,0,0,0.7)", display: "flex", alignItems: "center", gap: 10 }}>
          {sub}
          <svg width={40} height={40} viewBox="0 0 24 24" style={{ transform: `translateY(${bounce}px)` }}>
            <path d="M12 4v15M5 12l7 7 7-7" fill="none" stroke={colors.white} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
    </>
  );
};

const SceneGfx: React.FC<{ gfx: Gfx; scene: Scene; outAt: number }> = ({ gfx, scene, outAt }) => {
  const { fps } = useVideoConfig();
  const at = Math.round(scene.start * fps);
  switch (gfx.type) {
    case "title":
      return <TitleGfx scene={scene} outAt={outAt} />;
    case "chip":
      return (
        <div style={{ position: "absolute", left: 60, top: 300 }}>
          <Chip at={at + 3} outAt={outAt} icon={gfx.icon} text={gfx.text} />
        </div>
      );
    case "list":
      return (
        <div style={{ position: "absolute", left: 60, top: 280, display: "flex", flexDirection: "column", gap: 20, alignItems: "flex-start" }}>
          {gfx.items.map(([text, word]) => (
            <Chip key={text} at={Math.round(wordTime(scene, word) * fps) - 2} outAt={outAt} icon={gfx.icon} text={text} />
          ))}
        </div>
      );
    case "route":
      return <RouteGfx scene={scene} outAt={outAt} text={gfx.text} sub={gfx.sub} />;
    case "cta":
      return <CtaGfx scene={scene} text={gfx.text} sub={gfx.sub} />;
  }
};

const HookLabel: React.FC<{ text: string }> = ({ text }) => {
  const p = usePop(2);
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 300, display: "flex", justifyContent: "center" }}>
      <div
        style={{
          padding: "14px 30px",
          borderRadius: 999,
          background: colors.green,
          color: colors.cream,
          fontFamily: fonts.sans,
          fontWeight: 700,
          fontSize: 34,
          letterSpacing: 1,
          transform: `scale(${p})`,
          boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
        }}
      >
        {text}
      </div>
    </div>
  );
};

export const Part: React.FC<PartProps> = (p) => {
  const { fps, durationInFrames } = useVideoConfig();
  const frame = useCurrentFrame();
  const timing = getTiming(partKey(p));
  const end = durationInFrames / fps;
  const F = (s: number) => Math.round(s * fps);
  const segs = buildSegments(p, timing.scenes, end);
  const ctaStart = timing.scenes.find((s) => s.id === "cta")?.start ?? 1e9;
  const showMark = !p.hook && frame > F(timing.scenes[1]?.start ?? 0) - 3 && frame < F(ctaStart) - 3;

  return (
    <AbsoluteFill style={{ backgroundColor: colors.ink }}>
      {segs.map((seg, i) => {
        const from = F(seg.from);
        const frames = Math.max(1, F(seg.to) - from);
        return (
          <Sequence key={i} from={from} durationInFrames={frames}>
            <Shot seg={seg} frames={frames} />
          </Sequence>
        );
      })}

      {/* Zachte verlopen boven/onder voor leesbaarheid */}
      <AbsoluteFill
        style={{
          background: "linear-gradient(180deg, rgba(10,22,14,0.6) 0%, rgba(10,22,14,0.25) 16%, rgba(10,22,14,0) 30%, rgba(10,22,14,0) 52%, rgba(10,22,14,0.5) 100%)",
        }}
      />

      {showMark ? (
        <div style={{ position: "absolute", left: 60, top: 150, filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.5))" }}>
          <Wordmark size={0.8} />
        </div>
      ) : null}

      {p.hook ? <HookLabel text={HOOK_LABEL[p.body]} /> : null}

      {!p.hook
        ? timing.scenes.map((sc, i) => {
            const next = timing.scenes[i + 1]?.start ?? end + 1;
            return (
              <Sequence key={sc.id} from={0} layout="none">
                <SceneGfx gfx={BODY_GFX[p.body][sc.id]} scene={sc} outAt={F(next) - 8} />
              </Sequence>
            );
          })
        : null}

      <Captions scenes={timing.scenes} big={!!p.hook} accent={p.hook ? HOOK_ACCENT[p.body] : []} />
    </AbsoluteFill>
  );
};
