import React from "react";
import { AbsoluteFill, Audio, Easing, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { colors, fonts } from "./brand";
import { HOOK_ACCENT, HOOK_PHOTO, SCENES } from "./config";
import { Graphic } from "./Graphic";
import { getTiming, norm, Scene, useEase, usePop } from "./ui";

export type VideoProps = { body: number; hook: number };
export const TAIL = 2.4; // seconden na de laatste zin

export const getDuration = (body: number, hook: number, fps: number) => Math.ceil((getTiming(body, hook).end + TAIL) * fps);

const PHOTO_W = (1920 * 16) / 9;

// Foto met trage zoom en pan (Ken Burns); bij elke nieuwe scène een korte punch-in
const Photo: React.FC<{ name: string; from: number; to: number; dir: number; first: boolean }> = ({ name, from, to, dir, first }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const f0 = from * fps;
  const f1 = to * fps;
  const p = interpolate(frame, [f0, f1], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const fade = first ? 1 : interpolate(frame, [f0 - 6, f0 + 4], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const punch = interpolate(frame, [f0, f0 + 9], [0.1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const scale = 1.12 + p * 0.16 + punch;
  const pan = (p - 0.5) * 760 * dir;
  return (
    <AbsoluteFill style={{ opacity: fade }}>
      <Img src={staticFile(`foto/${name}.jpg`)} style={{ position: "absolute", height: 1920, width: PHOTO_W, left: (1080 - PHOTO_W) / 2, transform: `translateX(${pan}px) scale(${scale})`, transformOrigin: "50% 50%" }} />
    </AbsoluteFill>
  );
};

const Hook: React.FC<{ scene: Scene; accent: string[] }> = ({ scene, accent }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const out = interpolate(frame, [(scene.end + 0.25) * fps, (scene.end + 0.25) * fps + 8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const acc = accent.map(norm);
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: "0 70px", opacity: 1 - out }}>
      <div style={{ display: "flex", flexWrap: "wrap", columnGap: 22, rowGap: 6, justifyContent: "flex-start", fontFamily: fonts.head, fontWeight: 900, fontSize: 96, lineHeight: 1.1, color: colors.white }}>
        {scene.words.map((w, i) => {
          const pop = interpolate(t - w.s, [-0.02, 0.18], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.back(2)) });
          const hot = acc.includes(norm(w.t));
          return (
            <span
              key={i}
              style={{
                opacity: pop,
                transform: `translateY(${(1 - pop) * 40}px) scale(${hot ? 1 + 0.06 * Math.sin(Math.min(1, (t - w.s) * 3) * Math.PI) : 1})`,
                background: hot ? colors.red : "transparent",
                padding: hot ? "0 16px" : 0,
                textShadow: hot ? "none" : "0 6px 24px rgba(0,0,0,0.8)",
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

// Ondertitels: korte groepjes woorden, het gesproken woord licht rood op
const Captions: React.FC<{ scenes: Scene[] }> = ({ scenes }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const words = scenes.filter((s) => s.id !== "hook" && s.id !== "cta").flatMap((s) => s.words);
  const chunks: typeof words[] = [];
  let cur: typeof words = [];
  words.forEach((w) => {
    cur.push(w);
    const len = cur.map((c) => c.t).join(" ").length;
    if (/[.,?!]$/.test(w.t) || cur.length >= 4 || len > 20) {
      chunks.push(cur);
      cur = [];
    }
  });
  if (cur.length) chunks.push(cur);
  const idx = chunks.findIndex((c, i) => t >= c[0].s - 0.05 && (i + 1 >= chunks.length || t < chunks[i + 1][0].s - 0.05));
  const chunk = idx >= 0 ? chunks[idx] : null;
  if (!chunk || t > chunk[chunk.length - 1].e + 0.5) return null;
  const since = (t - chunk[0].s) * fps;
  const pop = interpolate(since, [0, 4], [0.85, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ justifyContent: "flex-start", alignItems: "center", paddingTop: 1450 }}>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", columnGap: 16, maxWidth: 960, transform: `scale(${pop})`, fontFamily: fonts.sans, fontWeight: 800, fontSize: 64, textAlign: "center" }}>
        {chunk.map((w, i) => {
          const active = t >= w.s - 0.03 && t < (chunk[i + 1]?.s ?? w.e + 0.5);
          return (
            <span key={i} style={{ color: colors.white, background: active ? colors.red : "transparent", padding: "2px 12px", textShadow: active ? "none" : "0 3px 14px rgba(0,0,0,0.85), 0 1px 3px rgba(0,0,0,0.9)" }}>
              {w.t}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

const Cta: React.FC<{ scene: Scene; label: string; sub: string }> = ({ scene, label, sub }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const a = usePop(scene.start);
  const b = usePop(scene.start + 0.5);
  const pulse = 1 + 0.035 * Math.sin((frame / fps) * Math.PI * 2.2);
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", paddingBottom: 120, background: `rgba(20,20,20,${0.55 * Math.min(1, a * 2)})` }}>
      <Img src={staticFile("logo/mb-wit.png")} style={{ width: 640, transform: `scale(${a})`, opacity: Math.min(1, a * 2), marginBottom: 90 }} />
      <div style={{ fontFamily: fonts.sans, fontWeight: 800, fontSize: 48, color: colors.white, letterSpacing: 3, textTransform: "uppercase", marginBottom: 44, opacity: Math.min(1, b * 2) }}>{sub}</div>
      <div style={{ fontFamily: fonts.sans, fontWeight: 800, fontSize: 66, color: colors.white, background: colors.red, padding: "38px 70px", letterSpacing: 3, transform: `scale(${b * pulse})`, boxShadow: "0 18px 60px rgba(0,0,0,0.5)" }}>{label} →</div>
      <div style={{ fontFamily: fonts.sans, fontWeight: 700, fontSize: 44, color: "#ddd", marginTop: 56, opacity: Math.min(1, b * 2) }}>Maartensdijk · A27 · oplevering feb 2027</div>
    </AbsoluteFill>
  );
};

export const MaartensVideo: React.FC<VideoProps> = ({ body, hook }) => {
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame();
  const t = frame / fps;
  const timing = getTiming(body, hook);
  const end = timing.end + TAIL;
  const scenes = timing.scenes;
  const specs = SCENES[body];
  const photoOf = (s: Scene) => (s.id === "hook" ? HOOK_PHOTO[body][hook] : specs[s.id].photo);
  const logoIn = useEase(scenes[1].start - 0.2, 0.4);
  const ctaScene = scenes[scenes.length - 1];
  // zacht aflopende donkere laag voor leesbaarheid
  const shade = scenes.some((s) => s.id === "hook" && t < s.end + 0.3) ? 0.62 : 0.4;
  return (
    <AbsoluteFill style={{ background: colors.ink }}>
      <Audio src={staticFile(`vo/b${body}h${hook}.wav`)} />
      {scenes.map((s, i) => (
        <Photo key={s.id} name={photoOf(s)} from={i === 0 ? 0 : s.start - 0.1} to={i + 1 < scenes.length ? scenes[i + 1].start : end} dir={i % 2 ? -1 : 1} first={i === 0} />
      ))}
      <AbsoluteFill style={{ background: `linear-gradient(180deg, rgba(20,20,20,${shade}) 0%, rgba(20,20,20,${shade * 0.6}) 40%, rgba(20,20,20,0.88) 100%)` }} />
      {scenes.map((s, i) => {
        const nextStart = i + 1 < scenes.length ? scenes[i + 1].start : end;
        if (t < s.start - 0.15 || t > nextStart + 0.1) return null;
        if (s.id === "hook") return <Hook key={s.id} scene={s} accent={HOOK_ACCENT[body][hook]} />;
        if (s.id === "cta") return <Cta key={s.id} scene={s} {...specs.cta.cta!} />;
        return <Graphic key={s.id} spec={specs[s.id]} scene={s} />;
      })}
      {t < ctaScene.start - 0.1 && <Captions scenes={scenes} />}
      {/* logo + dakhoek boven in beeld */}
      <AbsoluteFill style={{ pointerEvents: "none", opacity: logoIn * (t < ctaScene.start - 0.1 ? 1 : 0) }}>
        <Img src={staticFile("logo/mb-wit.png")} style={{ position: "absolute", left: 60, top: 90, width: 340 }} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
