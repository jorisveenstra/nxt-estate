import React from "react";
import { AbsoluteFill, Audio, Img, interpolate, OffthreadVideo, Sequence, staticFile, useCurrentFrame } from "remotion";
import { colors, FONT, FPS } from "./brand";
import { ACCENTS, ADRES, ClipRef, HOOK_CLIPS, SCENE_CLIPS } from "./config";
import timingJson from "./timing.json";

type Word = { t: string; s: number; e: number };
type Scene = { id: string; start: number; end: number; words: Word[] };
type Part = { scenes: Scene[]; audio: number; frames: number };
const timing = timingJson as Record<string, Part>;
const CLIP_LEN = 8; // Veo-clips zijn 8 s

export type VideoProps = { body: string; hook: string; part: "hook" | "body" | "full" };

export const partFrames = (key: string) => timing[key].frames;
export const fullFrames = (body: string, hook: string) => timing[hook].frames + timing[body].frames;
export const hasTiming = (key: string) => key in timing;

type Segment = { clip: string; offset: number; from: number; to: number };

const wordTime = (sc: Scene, w: string) => {
  const hit = sc.words.find((x) => x.t.toLowerCase().replace(/[^a-z0-9²]/g, "") === w);
  return hit ? hit.s - 0.05 : sc.start;
};

const segments = (scenes: Scene[], clipsFor: (id: string) => ClipRef[], end: number): Segment[] => {
  const segs: Segment[] = [];
  scenes.forEach((sc, i) => {
    const sceneEnd = i + 1 < scenes.length ? scenes[i + 1].start - 0.05 : end;
    const list = clipsFor(sc.id);
    list.forEach(([clip, offset, word], k) => {
      const from = k === 0 ? (i === 0 ? 0 : sc.start - 0.05) : wordTime(sc, word!);
      const to = list[k + 1] ? wordTime(sc, list[k + 1][2]!) : sceneEnd;
      segs.push({ clip, offset, from, to });
    });
  });
  return segs;
};

// Volledig beeldvullende clip; harde knip aan begin en eind, geen overgangseffecten
const Clip: React.FC<{ seg: Segment; frames: number }> = ({ seg, frames }) => {
  const dur = frames / FPS;
  const rate = Math.min(1, (CLIP_LEN - seg.offset - 0.1) / dur);
  return (
    <AbsoluteFill>
      <OffthreadVideo
        src={staticFile(`clips/${seg.clip}.mp4`)}
        muted
        startFrom={Math.round(seg.offset * FPS)}
        playbackRate={rate}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
    </AbsoluteFill>
  );
};

const Captions: React.FC<{ scenes: Scene[] }> = ({ scenes }) => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const words = scenes.flatMap((s) => s.words);
  const chunks: Word[][] = [];
  let cur: Word[] = [];
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
  if (!chunk || t > chunk[chunk.length - 1].e + 0.5) return null;
  return (
    <AbsoluteFill style={{ justifyContent: "flex-start", alignItems: "center", paddingTop: 1180 }}>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", columnGap: 18, maxWidth: 920, fontFamily: FONT, fontWeight: 700, fontSize: 60, lineHeight: 1.2, textAlign: "center" }}>
        {chunk.map((w, i) => {
          const active = t >= w.s - 0.03 && t < (chunk[i + 1]?.s ?? w.e + 0.5);
          return (
            <span key={i} style={{ color: active ? colors.gold : colors.white, textShadow: "0 3px 14px rgba(0,0,0,0.8), 0 1px 3px rgba(0,0,0,0.9)" }}>
              {w.t}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

const Accent: React.FC<{ text: string; frames: number }> = ({ text, frames }) => {
  const frame = useCurrentFrame();
  const op = interpolate(frame, [0, 6, frames - 6, frames], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div style={{ position: "absolute", top: 250, left: 60, opacity: op, background: colors.gold, color: colors.dark, fontFamily: FONT, fontWeight: 700, fontSize: 40, padding: "12px 26px", borderRadius: 6 }}>
      {text}
    </div>
  );
};

const Cta: React.FC = () => {
  const frame = useCurrentFrame();
  const op = interpolate(frame, [0, 8], [0, 1], { extrapolateRight: "clamp" });
  return (
    <div style={{ position: "absolute", left: 70, right: 70, bottom: 170, opacity: op, background: "rgba(26,26,26,0.86)", borderTop: `5px solid ${colors.gold}`, padding: "30px 40px", fontFamily: FONT, color: colors.white, textAlign: "center" }}>
      <div style={{ fontWeight: 700, fontSize: 44 }}>Fresch Loods Breda</div>
      <div style={{ fontWeight: 500, fontSize: 30, color: colors.sand, marginTop: 4 }}>{ADRES} · 10 units te huur</div>
      <div style={{ display: "inline-block", marginTop: 22, background: colors.gold, color: colors.dark, fontWeight: 700, fontSize: 36, padding: "14px 36px", borderRadius: 6 }}>
        Vraag alle informatie aan
      </div>
    </div>
  );
};

// Eén deel (hook of body) — tijden in de timing zijn relatief t.o.v. het begin van het deel
const PartView: React.FC<{ keyName: string; body: string; isHook: boolean }> = ({ keyName, body, isHook }) => {
  const part = timing[keyName];
  const end = part.frames / FPS;
  const F = (s: number) => Math.round(s * FPS);
  const segs = segments(part.scenes, (id) => (isHook ? HOOK_CLIPS[keyName] : SCENE_CLIPS[body][id]), end);
  const cta = part.scenes.find((s) => s.id === "cta");
  return (
    <AbsoluteFill>
      {segs.map((seg, i) => {
        const from = F(seg.from);
        const n = Math.max(1, (i + 1 < segs.length ? F(segs[i + 1].from) : part.frames) - from);
        return (
          <Sequence key={i} from={from} durationInFrames={n}>
            <Clip seg={seg} frames={n} />
          </Sequence>
        );
      })}
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0) 16%, rgba(0,0,0,0) 52%, rgba(0,0,0,0.45) 100%)" }} />
      {!isHook &&
        (ACCENTS[body] ?? []).map(([id, text]) => {
          const sc = part.scenes.find((s) => s.id === id);
          if (!sc) return null;
          const n = F(sc.end + 0.3) - F(sc.start + 0.3);
          return (
            <Sequence key={id} from={F(sc.start + 0.3)} durationInFrames={n} layout="none">
              <Accent text={text} frames={n} />
            </Sequence>
          );
        })}
      {cta && (
        <Sequence from={F(cta.start)} layout="none">
          <Cta />
        </Sequence>
      )}
      <Captions scenes={part.scenes} />
    </AbsoluteFill>
  );
};

const Logo: React.FC = () => (
  <Img src={staticFile("logo/loods-nederland.svg")} style={{ position: "absolute", top: 60, left: 40, width: 250, filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.55))" }} />
);

export const AdVideo: React.FC<VideoProps> = ({ body, hook, part }) => {
  return (
    <AbsoluteFill style={{ backgroundColor: colors.dark }}>
      {part === "hook" && <PartView keyName={hook} body={body} isHook />}
      {part === "body" && <PartView keyName={body} body={body} isHook={false} />}
      {part === "full" && (
        <>
          <Sequence durationInFrames={timing[hook].frames}>
            <PartView keyName={hook} body={body} isHook />
          </Sequence>
          <Sequence from={timing[hook].frames}>
            <PartView keyName={body} body={body} isHook={false} />
          </Sequence>
          <Audio src={staticFile(`vo/${hook}.wav`)} />
        </>
      )}
      <Logo />
    </AbsoluteFill>
  );
};
