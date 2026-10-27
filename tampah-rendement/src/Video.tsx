import React from "react";
import { AbsoluteFill, Easing, interpolate, OffthreadVideo, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { colors, fonts } from "./brand";
import * as Icons from "./icons";
import plan from "./plan.json";

type Word = { t: string; s: number; e: number };
type Sticker = { at: string; text: string; sub: string; icon: string; count: number | null; t: number; t_end: number };
type Scene = { id: string; start: number; end: number; clips: { clip: number; from_: number; dur: number }[]; stickers: Sticker[] };
type Part = { kind: string; frames: number; words: Word[]; scenes: Scene[] };
export type VideoProps = { part: string };

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ICONS: Record<string, React.FC<{ size?: number; color: string }>> = {
  chart: Icons.ChartUp, house: Icons.House, umbrella: Icons.Umbrella, plane: Icons.Plane, eye: Icons.Eye, wave: Icons.Wave,
  racket: Icons.Racket, pin: Icons.Pin, shield: Icons.Shield, check: Icons.Check, calendar: Icons.Calendar,
};

// Hard cut tussen shots; binnen de shot een rustige, realistische camera-drift
const Shot: React.FC<{ clip: number; dur: number }> = ({ clip, dur }) => {
  const frame = useCurrentFrame();
  const scale = interpolate(frame, [0, dur], [1, 1.05], clamp);
  return (
    <AbsoluteFill style={{ transform: `scale(${scale})` }}>
      <OffthreadVideo src={staticFile(`clips/${clip}.mp4`)} muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />
    </AbsoluteFill>
  );
};

// Dikke, kleine sticker in huisstijl: veert in, wiebelt zacht, veert uit
const StickerView: React.FC<{ st: Sticker; k: number; from: number; to: number }> = ({ st, k, from, to }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - from, fps, config: { damping: 9, stiffness: 190, mass: 0.7 } });
  const out = interpolate(frame, [to - 8, to], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) });
  const left = k % 2 === 0;
  const bob = Math.sin((frame - from) / 7 + k) * 5;
  const rot = (1 - p) * (left ? -10 : 10) + Math.sin((frame - from) / 11) * 1.2;
  const Icon = ICONS[st.icon];
  const val = st.count !== null ? Math.round(interpolate(frame, [from + 2, from + 22], [0, st.count], { ...clamp, easing: Easing.out(Easing.cubic) })) + "%" : st.text;
  const scale = p * (1 - out);
  return (
    <div
      style={{
        position: "absolute", top: 300 + k * 170, [left ? "left" : "right"]: 44,
        transform: `translateY(${bob}px) scale(${scale}) rotate(${rot}deg)`, transformOrigin: left ? "left center" : "right center",
        display: "flex", alignItems: "center", gap: 18, padding: "16px 28px 16px 18px",
        background: colors.oliveDark, border: `5px solid ${colors.gold}`, borderRadius: 34,
        boxShadow: "0 12px 0 rgba(30,24,12,0.35), 0 18px 40px rgba(30,24,12,0.35)",
        maxWidth: 800,
      }}
    >
      <div style={{ width: 72, height: 72, borderRadius: 36, background: colors.gold, display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
        <Icon size={46} color={colors.oliveDark} />
      </div>
      <div>
        <div style={{ fontFamily: fonts.sans, fontWeight: 800, fontSize: st.text.length > 18 ? 40 : 54, lineHeight: 1.05, color: colors.cream, letterSpacing: 1, fontVariantNumeric: "tabular-nums" }}>{val}</div>
        {st.sub ? <div style={{ fontFamily: fonts.sans, fontWeight: 600, fontSize: 28, color: colors.gold, marginTop: 4 }}>{st.sub}</div> : null}
      </div>
    </div>
  );
};

const Woordmerk: React.FC<{ width: number; color: string }> = ({ width, color }) => {
  const s = width / 520;
  return (
    <div style={{ width, textAlign: "center", color }}>
      <div style={{ fontFamily: fonts.sans, fontWeight: 300, fontSize: 92 * s, letterSpacing: 30 * s, marginRight: -30 * s, lineHeight: 1 }}>TAMPAH</div>
      <div style={{ fontFamily: fonts.sans, fontWeight: 500, fontSize: 22 * s, letterSpacing: 13 * s, marginRight: -13 * s, marginTop: 10 * s }}>BEACH VILLAS</div>
    </div>
  );
};

// Ondertitels: korte groepjes woorden, het gesproken woord licht op in goud
const Captions: React.FC<{ words: Word[] }> = ({ words }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const chunks: Word[][] = [];
  let cur: Word[] = [];
  words.forEach((w) => {
    cur.push(w);
    if (/[.,?!]$/.test(w.t) || cur.length >= 4 || cur.map((c) => c.t).join(" ").length > 20) { chunks.push(cur); cur = []; }
  });
  if (cur.length) chunks.push(cur);
  const idx = chunks.findIndex((c, i) => t >= c[0].s - 0.05 && (i + 1 >= chunks.length || t < chunks[i + 1][0].s - 0.05));
  const chunk = idx >= 0 ? chunks[idx] : null;
  if (!chunk || t > chunk[chunk.length - 1].e + 0.5) return null;
  const pop = interpolate((t - chunk[0].s) * fps, [0, 4], [0.85, 1], clamp);
  return (
    <AbsoluteFill style={{ justifyContent: "flex-start", alignItems: "center", paddingTop: 1330 }}>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", columnGap: 16, maxWidth: 940, transform: `scale(${pop})`, fontFamily: fonts.sans, fontWeight: 800, fontSize: 58, textAlign: "center" }}>
        {chunk.map((w, i) => {
          const active = t >= w.s - 0.03 && t < (chunk[i + 1]?.s ?? w.e + 0.5);
          return (
            <span key={i} style={{ color: active ? colors.ink : colors.white, background: active ? colors.gold : "transparent", padding: "2px 12px", borderRadius: active ? 8 : undefined, textShadow: active ? "none" : "0 3px 14px rgba(0,0,0,0.75), 0 1px 3px rgba(0,0,0,0.9)" }}>{w.t}</span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// Slotscène: groot woordmerk bovenin en een pulserende knop-sticker
const Cta: React.FC<{ from: number; label: string }> = ({ from, label }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - from, fps, config: { damping: 10, stiffness: 160 } });
  const pulse = 1 + Math.sin((frame - from) / 6) * 0.025;
  return (
    <>
      <div style={{ position: "absolute", top: 230, left: 0, right: 0, display: "flex", justifyContent: "center", opacity: p, transform: `scale(${0.8 + 0.2 * p})`, filter: "drop-shadow(0 4px 14px rgba(0,0,0,0.6))" }}>
        <Woordmerk width={520} color={colors.cream} />
      </div>
      <div style={{ position: "absolute", top: 1560, left: 0, right: 0, display: "flex", justifyContent: "center", transform: `scale(${p * pulse})` }}>
        <div style={{ background: colors.gold, color: colors.ink, border: `5px solid ${colors.cream}`, borderRadius: 60, padding: "24px 56px", fontFamily: fonts.sans, fontWeight: 800, fontSize: 52, boxShadow: "0 12px 0 rgba(30,24,12,0.4)" }}>{label} ↓</div>
      </div>
    </>
  );
};

export const TampahVideo: React.FC<VideoProps> = ({ part }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const d = (plan as unknown as Record<string, Part>)[part];
  const F = (s: number) => Math.round(s * fps);
  const isBody = d.kind === "body";
  const cta = d.scenes.find((s) => s.id === "cta");
  const noot = d.scenes.flatMap((s) => s.stickers.filter((x) => x.count !== null).map((x) => [F(x.t), F(s.end)]));
  const showsRendement = noot.some(([a, b]) => frame >= a && frame < b);
  return (
    <AbsoluteFill style={{ backgroundColor: colors.ink }}>
      {d.scenes.flatMap((sc) =>
        sc.clips.map((c, i) => (
          <Sequence key={`${sc.id}-${i}`} from={c.from_} durationInFrames={c.dur}>
            <Shot clip={c.clip} dur={c.dur} />
          </Sequence>
        )),
      )}
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(40,32,18,0.5) 0%, rgba(40,32,18,0) 20%, rgba(40,32,18,0) 62%, rgba(40,32,18,0.6) 100%)" }} />
      {!cta || frame < F(cta.start) ? (
        <div style={{ position: "absolute", top: 76, left: 50, filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.5))" }}>
          <Woordmerk width={220} color={colors.cream} />
        </div>
      ) : null}
      {d.scenes.flatMap((sc) =>
        sc.stickers.map((st, k) => {
          const from = F(st.t);
          const to = F(sc.end);
          return (
            <Sequence key={`${sc.id}-st${k}`} from={from} durationInFrames={Math.max(1, to - from)} layout="none">
              <StickerView st={st} k={k} from={0} to={Math.max(1, to - from)} />
            </Sequence>
          );
        }),
      )}
      {showsRendement ? (
        <div style={{ position: "absolute", bottom: 90, left: 0, right: 0, textAlign: "center", fontFamily: fonts.sans, fontWeight: 600, fontSize: 26, color: colors.cream, textShadow: "0 2px 8px rgba(0,0,0,0.8)" }}>
          *Begroot nettorendement, geen garantie
        </div>
      ) : null}
      <Captions words={d.words} />
      {cta ? (
        <Sequence from={F(cta.start)}>
          <Cta from={0} label={part.startsWith("b1") ? "Plan een gesprek" : "Plan een gesprek"} />
        </Sequence>
      ) : null}
    </AbsoluteFill>
  );
};
