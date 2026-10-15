import React from "react";
import { AbsoluteFill, Sequence, useCurrentFrame } from "remotion";
import { colors, fonts, FPS } from "./brand";
import { BODY_SCENES, DOELGROEPEN, HOOK_CLIPS } from "./config";
import timing from "./timing.json";
import { ease, ClipBg, Logo, SceneProvider, Subtitles, usePop, useT, Word } from "./ui";

const TAIL = 0.7; // seconden stilte na de laatste zin van de body

type T = typeof timing;
export const bodyFrames = (b: string) => Math.ceil(((timing as T).bodies as any)[b].duur * FPS + TAIL * FPS);
export const hookFrames = (key: string) => Math.round((((timing as T).hooks as any)[key].duur + timing.pauze) * FPS);

const Chrome: React.FC = () => (
  <div style={{ position: "absolute", left: 54, top: 70 }}><Logo w={150} /></div>
);

export const BodyVideo: React.FC<{ body: string }> = ({ body }) => {
  const info = (timing.bodies as any)[body];
  const scenes: { id: string; start: number; end: number; words: Word[] }[] = info.scenes;
  const total = bodyFrames(body) / FPS;
  const cfg = BODY_SCENES[body];
  return (
    <AbsoluteFill style={{ background: colors.slateDark }}>
      {scenes.map((sc, i) => {
        const start = i === 0 ? 0 : sc.start;
        const end = i === scenes.length - 1 ? total : scenes[i + 1].start;
        const dur = end - start;
        const words = sc.words.map((w) => ({ ...w, s: w.s - start, e: w.e - start }));
        return (
          <Sequence key={sc.id} from={Math.round(start * FPS)} durationInFrames={Math.round(end * FPS) - Math.round(start * FPS)}>
            <SceneProvider value={{ words, dur }}>
              <ClipBg clips={cfg[i].clips} dur={dur} />
              {cfg[i].graphic}
              <Subtitles words={words} />
            </SceneProvider>
          </Sequence>
        );
      })}
      <Chrome />
    </AbsoluteFill>
  );
};

export const HookVideo: React.FC<{ body: string; hook: number }> = ({ body, hook }) => {
  const key = `${body}h${hook}`;
  const info = (timing.hooks as any)[key];
  const words: Word[] = info.words;
  const t = useT();
  const pop = usePop();
  const dg = DOELGROEPEN[hook - 1];
  const Icon = dg.icon;
  const k = ease(pop(0.05));
  const dur = hookFrames(key) / FPS;
  return (
    <AbsoluteFill style={{ background: colors.slateDark }}>
      <SceneProvider value={{ words, dur }}>
        <ClipBg clips={[HOOK_CLIPS[key]]} dur={dur} />
        <div style={{ position: "absolute", left: 0, right: 0, top: 230, display: "flex", justifyContent: "center", transform: `scale(${0.5 + 0.5 * k})`, opacity: k }}>
          <div style={{ width: 280, height: 280, borderRadius: 140, background: colors.orange, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}>
            <Icon size={170} color={colors.slate} />
          </div>
        </div>
        <div style={{ position: "absolute", left: 50, right: 50, top: 590, minHeight: 640, borderRadius: 44, background: "rgba(27,38,43,0.88)", border: "2px solid rgba(255,255,255,0.14)", padding: "44px 46px", display: "flex", flexWrap: "wrap", alignContent: "center", gap: "0 20px" }}>
          {words.map((w, i) => {
            const spoken = t >= w.s - 0.02, on = spoken && t < w.e + 0.12;
            return (
              <span key={i} style={{ fontFamily: fonts.sans, fontWeight: 700, fontSize: words.length > 17 ? 70 : 78, lineHeight: 1.2, color: on ? colors.orange : spoken ? colors.white : "rgba(255,255,255,0.32)" }}>{w.t}</span>
            );
          })}
        </div>
        <div style={{ position: "absolute", left: 0, right: 0, top: 1330, display: "flex", justifyContent: "center", opacity: ease(pop(0.4)) }}>
          <span style={{ fontFamily: fonts.head, fontSize: 48, textTransform: "uppercase", color: colors.slate, background: colors.white, padding: "14px 40px", borderRadius: 60 }}>{dg.naam}</span>
        </div>
        <Chrome />
      </SceneProvider>
    </AbsoluteFill>
  );
};
