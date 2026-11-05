import React from "react";
import { AbsoluteFill, Easing, interpolate, OffthreadVideo, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { colors, fonts } from "./brand";
import clipLengths from "./clips.json";
import { BODY_CLIPS, CALLOUTS, CTA_TEXT, HOOK_ACCENT, HOOK_CLIPS } from "./config";
import timing from "./timing.json";
import { CalloutCard, Captions, IconSvg, Logo, norm, Scene, Word, wordTime } from "./ui";

type Segment = { clip: string; from: number; to: number };
const CUT_LEAD = 0.1; // knip net voor het eerste woord van een zin

export const getFrames = (key: string) => (timing as any)[key].frames as number;

// ---------- footage: een clip per shot, volledig beeldvullend, harde cuts ----------
const ClipSegment: React.FC<{ seg: Segment; frames: number }> = ({ seg, frames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const dur = frames / fps;
  const len = (clipLengths as Record<string, number>)[seg.clip] - 0.15;
  const rate = Math.min(1, len / dur);
  // rustige, doorlopende camerabeweging binnen de shot (geen overgang): heel licht inzoomen
  const zoom = interpolate(frame, [0, frames], [1.0, 1.05], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ transform: `scale(${zoom})` }}>
      <OffthreadVideo src={staticFile(`clips/${seg.clip}.mp4`)} muted playbackRate={rate} style={{ width: 1080, height: 1920, objectFit: "cover" }} />
    </AbsoluteFill>
  );
};

const Footage: React.FC<{ segs: Segment[] }> = ({ segs }) => {
  const { fps } = useVideoConfig();
  return (
    <>
      {segs.map((seg, i) => {
        const from = Math.round(seg.from * fps);
        const frames = Math.max(1, Math.round(seg.to * fps) - from);
        return (
          <Sequence key={i} from={from} durationInFrames={frames}>
            <ClipSegment seg={seg} frames={frames} />
          </Sequence>
        );
      })}
    </>
  );
};

const Shade: React.FC = () => (
  <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(12,26,30,0.5) 0%, rgba(12,26,30,0) 24%, rgba(12,26,30,0) 55%, rgba(12,26,30,0.62) 100%)" }} />
);

const buildSegments = (body: number, scenes: Scene[], end: number): Segment[] => {
  const segs: Segment[] = [];
  scenes.forEach((sc, i) => {
    const sceneStart = i === 0 ? 0 : sc.start - CUT_LEAD;
    const sceneEnd = i + 1 < scenes.length ? scenes[i + 1].start - CUT_LEAD : end;
    const list = BODY_CLIPS[body][sc.id];
    if (!list.length) {
      // geen eigen clip: vorige shot loopt door
      segs[segs.length - 1].to = sceneEnd;
      return;
    }
    list.forEach(([clip, word], k) => {
      const from = k === 0 ? sceneStart : wordTime(sc, word!) - CUT_LEAD;
      const next = list[k + 1];
      const to = next ? wordTime(sc, next[1]!) - CUT_LEAD : sceneEnd;
      segs.push({ clip, from, to });
    });
  });
  return segs;
};

// ---------- CTA-kaart (bovenin, footage blijft zichtbaar) ----------
const CtaCard: React.FC<{ body: number; start: number }> = ({ body, start }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const f0 = Math.round(start * fps);
  if (frame < f0) return null;
  const inn = spring({ frame: frame - f0, fps, config: { damping: 15, stiffness: 120 } });
  const t = CTA_TEXT[body];
  const pulse = 1 + 0.03 * Math.sin((frame - f0) / 6);
  return (
    <div style={{ position: "absolute", left: 60, right: 60, top: 190, transform: `translateY(${(1 - inn) * -520}px)`, background: "rgba(50,80,89,0.95)", borderRadius: 34, padding: "36px 40px", display: "flex", alignItems: "center", gap: 34, boxShadow: "0 14px 40px rgba(0,0,0,0.4)" }}>
      <Logo width={190} shadow={false} />
      <div style={{ display: "flex", flexDirection: "column", gap: 14, flex: 1 }}>
        <div style={{ fontFamily: fonts.head, fontWeight: 800, fontSize: 52, lineHeight: 1.05, color: colors.white }}>{t.kop}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, fontFamily: fonts.body, fontWeight: 700, fontSize: 34, color: "rgba(255,255,255,0.92)" }}>
          <IconSvg icon="calendar" size={38} color={colors.white} />
          {t.datum}
        </div>
        <div style={{ alignSelf: "flex-start", transform: `scale(${pulse})`, transformOrigin: "left center", background: colors.white, color: colors.teal, borderRadius: 40, padding: "12px 34px", fontFamily: fonts.head, fontWeight: 800, fontSize: 38 }}>{t.knop} →</div>
        <div style={{ fontFamily: fonts.body, fontWeight: 700, fontSize: 30, color: "rgba(255,255,255,0.85)" }}>vaandelbuiten.nl</div>
      </div>
    </div>
  );
};

// ---------- BODY ----------
export const BodyVideo: React.FC<{ body: number }> = ({ body }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const tim = (timing as any)[`b${body}`];
  const scenes: Scene[] = tim.scenes;
  const end = tim.frames / fps;
  const segs = buildSegments(body, scenes, end);
  const cta = scenes.find((s) => s.id === "cta")!;
  const allWords: Word[] = scenes.filter((s) => s.id !== "cta").flatMap((s) => s.words).concat(scenes.find((s) => s.id === "cta")!.words);
  const logoIn = interpolate(frame, [0, 12], [0, 1], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ backgroundColor: colors.ink }}>
      <Footage segs={segs} />
      <Shade />
      <div style={{ position: "absolute", top: 70, right: 50, opacity: logoIn * (frame < Math.round(cta.start * fps) - 4 ? 1 : 0) }}>
        <Logo width={150} />
      </div>
      {scenes.map((sc, i) => {
        const next = i + 1 < scenes.length ? scenes[i + 1].start - CUT_LEAD : end;
        return (CALLOUTS[body][sc.id] ?? []).map((c, k) => (
          <CalloutCard key={`${sc.id}-${k}`} icon={c.icon} title={c.title} sub={c.sub} start={wordTime(sc, c.at)} end={next} slot={k} />
        ));
      })}
      <Captions words={allWords} />
      <CtaCard body={body} start={cta.start} />
    </AbsoluteFill>
  );
};

// ---------- HOOK ----------
export const HookVideo: React.FC<{ body: number; hook: number }> = ({ body, hook }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const tim = (timing as any)[`b${body}h${hook}`];
  const words: Word[] = tim.words;
  const end = tim.frames / fps;
  const accent = HOOK_ACCENT[body][hook].map(norm);
  const t = frame / fps;
  const inn = interpolate(frame, [0, 8], [0, 1], { extrapolateRight: "clamp" });
  const size = words.length > 16 ? 66 : 78;
  return (
    <AbsoluteFill style={{ backgroundColor: colors.ink }}>
      <Footage segs={[{ clip: HOOK_CLIPS[body][hook], from: 0, to: end }]} />
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(12,26,30,0.72) 0%, rgba(12,26,30,0.35) 38%, rgba(12,26,30,0) 55%, rgba(12,26,30,0.5) 100%)" }} />
      <div style={{ position: "absolute", top: 70, right: 50, opacity: inn }}>
        <Logo width={150} />
      </div>
      <div style={{ position: "absolute", left: 60, right: 60, top: 300, display: "flex", flexWrap: "wrap", columnGap: 16, rowGap: 8, fontFamily: fonts.head, fontWeight: 800, fontSize: size, lineHeight: 1.12, color: colors.white }}>
        {words.map((w, i) => {
          const shown = t >= w.s - 0.05;
          const pop = interpolate(frame / fps - (w.s - 0.05), [0, 0.18], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
          const hi = accent.includes(norm(w.t));
          return (
            <span key={i} style={{ opacity: shown ? pop : 0.0, transform: `translateY(${(1 - pop) * 24}px)`, background: hi ? colors.teal : "transparent", padding: hi ? "0 14px" : "0", borderRadius: 14, textShadow: hi ? "none" : "0 4px 18px rgba(0,0,0,0.75)" }}>
              {w.t}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
