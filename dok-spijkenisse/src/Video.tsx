import React from "react";
import { AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { colors, FONT, FPS, HOOK_GAP, TAIL } from "./brand";
import { BODY, CTA_TEXT, HOOK_ACCENT, HOOK_CLIPS } from "./config";
import timing from "./timing.json";
import { Brand, ChipPop, chunk, Fonts, norm, Progress, Scrim, Shots, StepDots, stroke, W } from "./ui";

type Scene = { id: string; words: W[]; start: number; end: number };
const T = timing as unknown as Record<string, { body: { duration: number; scenes: Scene[] }; hooks: Record<string, { duration: number; words: W[] }> }>;

export const bodySeconds = (b: number) => T[`b${b}`].body.duration + TAIL;
export const hookSeconds = (b: number, h: number) => T[`b${b}`].hooks[String(h)].duration + HOOK_GAP;

const groups = (words: W[]) => {
  const out: W[][] = [];
  let cur: W[] = [];
  for (const w of words) {
    cur.push(w);
    if (/[.,?!:;]$/.test(w[2]) || cur.length >= 4 || cur.map((x) => x[2]).join(" ").length > 24) { out.push(cur); cur = []; }
  }
  if (cur.length) out.push(cur);
  return out;
};

const Captions: React.FC<{ words: W[]; endT: number; bottom: number; color?: string }> = ({ words, endT, bottom }) => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const gs = groups(words);
  const gi = gs.findIndex((g, i) => t >= g[0][0] - 0.04 && (i + 1 >= gs.length ? t <= endT : t < gs[i + 1][0][0] - 0.04));
  if (gi < 0) return null;
  const g = gs[gi];
  const pop = spring({ frame: f - Math.round(g[0][0] * FPS), fps: FPS, config: { damping: 14, stiffness: 220 } });
  return (
    <div style={{ position: "absolute", left: 60, right: 60, bottom, textAlign: "center", fontFamily: FONT, fontWeight: 800, fontSize: 74, lineHeight: 1.12, color: colors.white, transform: `scale(${0.94 + 0.06 * pop})`, ...stroke(10) }}>
      {g.map((w, i) => {
        const active = t >= w[0] && t < (g[i + 1]?.[0] ?? w[1] + 0.15);
        return <span key={i} style={{ color: active ? colors.green : colors.white, marginRight: 18, display: "inline-block" }}>{w[2]}</span>;
      })}
    </div>
  );
};

const CtaButton: React.FC<{ text: string; at: number }> = ({ text, at }) => {
  const f = useCurrentFrame();
  const t = f / FPS;
  if (t < at) return null;
  const p = spring({ frame: f - Math.round(at * FPS), fps: FPS, config: { damping: 11 } });
  const pulse = 1 + 0.035 * Math.sin((t - at) * 6);
  return (
    <div style={{ position: "absolute", left: 90, right: 90, bottom: 120, transform: `scale(${p * pulse})` }}>
      <div style={{ background: colors.orange, color: colors.ink, fontFamily: FONT, fontWeight: 800, fontSize: 50, textAlign: "center", padding: "30px 20px", borderRadius: 70, boxShadow: "0 12px 34px rgba(0,0,0,.45)" }}>{text} →</div>
    </div>
  );
};

const EndCard: React.FC<{ from: number }> = ({ from }) => {
  const f = useCurrentFrame();
  const t = f / FPS;
  if (t < from) return null;
  const p = spring({ frame: f - Math.round(from * FPS), fps: FPS, config: { damping: 14 } });
  return (
    <>
      <AbsoluteFill style={{ background: "rgba(20,24,14,.38)", opacity: p }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 640, textAlign: "center", opacity: p, transform: `scale(${0.9 + 0.1 * p})` }}>
        <Img src={staticFile("logo/dok-logo.png")} style={{ width: 520, filter: "brightness(0) invert(1) drop-shadow(0 4px 14px rgba(0,0,0,.5))" }} />
        <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 86, color: colors.white, marginTop: 10, ...stroke(8) }}>Spijkenisse</div>
        <div style={{ display: "flex", justifyContent: "center", gap: 10, marginTop: 26 }}>
          {[colors.sky, colors.green, colors.cream, colors.khaki].map((c, i) => <div key={i} style={{ width: 54, height: 54, borderRadius: 8, background: c }} />)}
        </div>
      </div>
    </>
  );
};

export const BodyVideo: React.FC<{ body: number }> = ({ body }) => {
  const sc = T[`b${body}`].body.scenes;
  const total = bodySeconds(body);
  const { durationInFrames } = useVideoConfig();
  const span = (i: number): [number, number] => [i === 0 ? 0 : sc[i].start, i + 1 < sc.length ? sc[i + 1].start : total];
  const shots = sc.flatMap((s, i) => chunk(span(i)[0], span(i)[1], BODY[body][s.id].clips));
  const cta = sc[sc.length - 1];
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Fonts />
      <Shots list={shots} />
      <Scrim />
      <Brand />
      {sc.map((s, i) => {
        const cfg = BODY[body][s.id];
        const slotBase = cfg.steps ? 1 : 0;
        const until = span(i)[1] - 0.05;
        const tw = (key: string) => (s.words.find((w) => norm(w[2]) === key) ?? s.words[0])[0];
        return (
          <React.Fragment key={s.id}>
            {cfg.steps && <StepDots at={tw(cfg.steps.at)} until={until} count={cfg.steps.count} />}
            {(cfg.chips ?? []).map((c, k) => <ChipPop key={k} text={c.text} color={c.color} slot={k + slotBase} at={tw(c.at)} until={until} />)}
          </React.Fragment>
        );
      })}
      <Captions words={sc.flatMap((s) => s.words)} endT={cta.end + 0.3} bottom={sc.length ? 360 : 360} />
      <CtaButton text={CTA_TEXT[body]} at={cta.start + 1.2} />
      <EndCard from={cta.end + 0.35} />
      <Progress total={durationInFrames} />
    </AbsoluteFill>
  );
};

export const HookVideo: React.FC<{ body: number; hook: number }> = ({ body, hook }) => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const d = T[`b${body}`].hooks[String(hook)];
  const total = hookSeconds(body, hook);
  const acc = HOOK_ACCENT[body][hook];
  const shots = chunk(0, total, HOOK_CLIPS[body][hook]);
  const { durationInFrames } = useVideoConfig();
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Fonts />
      <Shots list={shots} />
      <AbsoluteFill style={{ background: "linear-gradient(to top, rgba(0,0,0,.55) 0%, rgba(0,0,0,0) 55%)" }} />
      <Brand />
      <div style={{ position: "absolute", left: 60, right: 60, bottom: 330, textAlign: "center", fontFamily: FONT, fontWeight: 800, fontSize: 80, lineHeight: 1.14, color: colors.white, ...stroke(11) }}>
        {d.words.map((w, i) => {
          const p = spring({ frame: f - Math.round(w[0] * FPS), fps: FPS, config: { damping: 13, stiffness: 240 } });
          const hot = acc.includes(norm(w[2]));
          return <span key={i} style={{ display: "inline-block", marginRight: 20, opacity: t >= w[0] ? 1 : 0, transform: `scale(${0.85 + 0.15 * p})`, color: hot ? colors.orange : colors.white }}>{w[2]}</span>;
        })}
      </div>
      <Progress total={durationInFrames} />
    </AbsoluteFill>
  );
};
