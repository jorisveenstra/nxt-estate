import React from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  OffthreadVideo,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { colors, fonts } from "./brand";
import { Box, Briefcase, Calendar, Crane, GarageDoor, Window } from "./icons";
import { Card, Chip, CountUp, Kicker, norm, rounded, Scene, usePop, useOut, wordTime } from "./ui";

export type SceneProps = { scene: Scene; outAt: number };

const useF = () => {
  const { fps } = useVideoConfig();
  return (sec: number) => Math.round(sec * fps);
};

const has = (scene: Scene, text: string) => scene.words.some((w) => norm(w.t).startsWith(norm(text)));

// Starttijd (frames) van een woord; valt terug op een aandeel van de scène als het woord niet wordt gevonden
const useWt = () => {
  const F = useF();
  return (scene: Scene, text: string, frac = 0, nth = 0) => {
    try {
      return F(wordTime(scene, text, nth));
    } catch {
      return F(scene.start + (scene.end - scene.start) * frac);
    }
  };
};

const Top: React.FC<{ children: React.ReactNode; gap?: number; top?: number }> = ({ children, gap = 24, top = 250 }) => (
  <AbsoluteFill style={{ padding: `${top}px 70px 0`, display: "flex", flexDirection: "column", gap, alignItems: "flex-start" }}>
    {children}
  </AbsoluteFill>
);

const head: React.CSSProperties = { fontFamily: fonts.sans, fontWeight: 800, color: colors.ink, lineHeight: 1.08, letterSpacing: -1 };

// Gekleurde blokjes uit het Dok-beeldmerk (kleuren uit logo/beeldmerk.svg), die één voor één op hun plek vallen
const BLOCK_COLORS = ["#958c66", "#958c66", "#95c11f", "#f1efe0", "#c9d8e1"];
export const Beeldmerk: React.FC<{ at: number; size: number }> = ({ at, size }) => {
  // 2 kolommen x 3 rijen, van onder naar boven gestapeld zoals het logo: onder twee khaki blokken,
  // in het midden groen en crème, bovenaan alleen rechts het blauwe blok
  const cells = [
    [0, 2],
    [1, 2],
    [0, 1],
    [1, 1],
    [1, 0],
  ];
  return (
    <div style={{ position: "relative", width: size * 2, height: size * 3 }}>
      {cells.map(([c, r], i) => (
        <Block key={i} at={at + i * 3} x={c * size} y={r * size} size={size} color={BLOCK_COLORS[i]} />
      ))}
    </div>
  );
};

const Block: React.FC<{ at: number; x: number; y: number; size: number; color: string }> = ({ at, x, y, size, color }) => {
  const p = usePop(at, { damping: 10, stiffness: 220, mass: 0.6 });
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: size,
        height: size,
        background: color,
        transform: `translateY(${(1 - p) * -size * 2}px)`,
        opacity: Math.min(1, p * 2),
      }}
    />
  );
};

const DokLogo: React.FC<{ width: number; white?: boolean; style?: React.CSSProperties }> = ({ width, white, style }) => (
  <Img src={staticFile("logo/dok.svg")} style={{ width, display: "block", filter: white ? "brightness(0) invert(1)" : undefined, ...style }} />
);

// ---------- Hook ----------
export const HookScene: React.FC<SceneProps & { accent: string[] }> = ({ scene, outAt, accent }) => {
  const F = useF();
  const frame = useCurrentFrame();
  const acc = accent.map(norm);
  const fontSize = scene.words.length > 17 ? 64 : 74;
  return (
    <Top top={280}>
      <Card at={0} outAt={F(outAt) - 6} cut={44} style={{ padding: "44px 54px 52px", maxWidth: 940 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 22 }}>
          <div style={{ display: "flex", gap: 4 }}>
            {[colors.khaki, colors.green, colors.blue].map((c) => (
              <div key={c} style={{ width: 18, height: 18, background: c }} />
            ))}
          </div>
          <Kicker>Dok Schiebroek</Kicker>
        </div>
        <div style={{ ...head, fontSize, display: "flex", flexWrap: "wrap", columnGap: "0.24em", rowGap: 8 }}>
          {scene.words.map((w, i) => {
            const at = F(w.s) - 2;
            const p = interpolate(frame, [at, at + 6], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.back(2)) });
            const isAccent = acc.includes(norm(w.t));
            const mark = interpolate(frame, [at + 2, at + 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
            return (
              <span
                key={i}
                style={{
                  position: "relative",
                  display: "inline-block",
                  opacity: p,
                  transform: `translateY(${(1 - p) * 40}px) scale(${0.7 + 0.3 * p})`,
                }}
              >
                {isAccent ? (
                  <span
                    style={{
                      position: "absolute",
                      left: -6,
                      right: -6,
                      top: "18%",
                      bottom: "4%",
                      background: colors.green,
                      transform: `scaleX(${mark})`,
                      transformOrigin: "left",
                    }}
                  />
                ) : null}
                <span style={{ position: "relative" }}>{w.t}</span>
              </span>
            );
          })}
        </div>
      </Card>
    </Top>
  );
};

// ---------- Bouwstenen voor de uitleggrafieken ----------
const Coin: React.FC<{ at: number; size?: number; label?: string; color?: string; fg?: string; strike?: number; style?: React.CSSProperties }> = ({
  at,
  size = 110,
  label = "€",
  color = colors.orange,
  fg = colors.white,
  strike = 0,
  style,
}) => {
  const p = usePop(at, { damping: 9, stiffness: 230, mass: 0.6 });
  return (
    <div style={{ position: "relative", width: size, height: size, transform: `scale(${p})`, ...style }}>
      <div
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          background: color,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          ...head,
          color: fg,
          fontSize: size * 0.52,
        }}
      >
        {label}
      </div>
      {strike > 0 ? (
        <div
          style={{
            position: "absolute",
            left: -8,
            top: size / 2 - 7,
            height: 14,
            width: (size + 16) * strike,
            background: colors.ink,
            borderRadius: 7,
            transform: "rotate(-28deg)",
            transformOrigin: "left center",
          }}
        />
      ) : null}
    </div>
  );
};

const Check: React.FC<{ size?: number; color?: string; progress: number }> = ({ size = 70, color = colors.green, progress }) => (
  <svg width={size} height={size} viewBox="0 0 48 48">
    <circle cx="24" cy="24" r="22" fill={color} />
    <path d="M13 25l8 8 15-17" stroke={colors.ink} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" fill="none" strokeDasharray={40} strokeDashoffset={40 * (1 - progress)} />
  </svg>
);

const Pin: React.FC<{ size?: number; color: string }> = ({ size = 56, color }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill={color}>
    <path d="M24 4c-8 0-14 6-14 14 0 10 14 26 14 26s14-16 14-26c0-8-6-14-14-14zm0 19a5 5 0 110-10 5 5 0 010 10z" />
  </svg>
);

const Bolt: React.FC<{ size?: number; color: string }> = ({ size = 70, color }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill={color}>
    <path d="M27 3L9 27h13l-3 18 20-26H26z" />
  </svg>
);

const m = (s: number, x: number) => interpolate(s, [0, 1], [0, x]);
const prog = (frame: number, a: number, b: number) => interpolate(frame, [a, b], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) });

// ---------- Koop: logo, dan de belofte ----------
export const KoopScene: React.FC<SceneProps> = ({ scene, outAt }) => {
  const F = useF();
  const wt = useWt();
  const frame = useCurrentFrame();
  const park = has(scene, "kleinschalig");
  const tCard = wt(scene, park ? "kleinschalig" : "eigen", 0.3);
  const tNoord = wt(scene, "rotterdam", 0.5);
  const tZonder = wt(scene, park ? "23" : "zonder", 0.7);
  const end = F(outAt) - 6;
  const strike = prog(frame, tZonder + 14, tZonder + 26);
  return (
    <>
      <AbsoluteFill style={{ justifyContent: "flex-start", alignItems: "center", paddingTop: 290 }}>
        <Card at={F(scene.start)} outAt={tCard - 8} bg={colors.white} cut={48} style={{ padding: "50px 64px", display: "flex", alignItems: "flex-end", gap: 40 }}>
          <Beeldmerk at={F(scene.start) + 4} size={56} />
          <div>
            <DokLogo width={330} />
            <div style={{ fontFamily: fonts.sans, fontWeight: 700, fontSize: 56, color: colors.khakiDark, marginTop: 12 }}>Schiebroek</div>
          </div>
        </Card>
      </AbsoluteFill>
      <Top top={270} gap={26}>
        <Card at={tCard - 2} outAt={end} from="left" cut={44} style={{ padding: "34px 50px 40px", width: 940 }}>
          <Kicker>{park ? "Kleinschalig bedrijvenpark" : "Koop je eigen"}</Kicker>
          <div style={{ ...head, fontSize: 104, marginTop: 8 }}>{park ? "23 koopunits" : "bedrijfsunit"}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 18, opacity: usePop(tNoord).valueOf() }}>
            <Pin color={colors.orange} />
            <div style={{ ...head, fontSize: 52, color: colors.khakiDark }}>Rotterdam-Noord</div>
          </div>
        </Card>
        {!park ? (
          <Card at={tZonder - 2} outAt={end} from="right" bg={colors.green} cut={44} style={{ padding: "30px 50px 36px", width: 940, display: "flex", alignItems: "center", gap: 36 }}>
            <Coin at={tZonder} size={150} label="€" color={colors.ink} fg={colors.green} strike={strike} />
            <div>
              <div style={{ ...head, fontSize: 64 }}>Geen jaarlijkse</div>
              <div style={{ ...head, fontSize: 64 }}>erfpachtcanon</div>
            </div>
          </Card>
        ) : null}
      </Top>
    </>
  );
};

// ---------- Erfpacht: jaarlijks betalen vs. eenmalig afgekocht ----------
export const ErfpachtScene: React.FC<SceneProps> = ({ scene, outAt }) => {
  const F = useF();
  const wt = useWt();
  const frame = useCurrentFrame();
  const end = F(outAt) - 6;
  const t0 = F(scene.start);
  const tKoopt = wt(scene, "koopt", 0.12);
  const tGeen = wt(scene, "geen", 0.55);
  const strike = prog(frame, tKoopt + 4, tKoopt + 20);
  const years = [1, 2, 3, 4, 5];
  return (
    <Top top={250} gap={22}>
      <Card at={t0 - 2} outAt={end} from="left" cut={44} style={{ padding: "26px 40px 34px", width: 940 }}>
        <Kicker>Normaal: erfpachtcanon</Kicker>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 20 }}>
          {years.map((y, i) => (
            <div key={y} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
              <Coin at={t0 + 4 + i * 5} size={112} strike={strike} />
              <div style={{ fontFamily: fonts.sans, fontWeight: 700, fontSize: 30, color: colors.khaki }}>jaar {y}</div>
            </div>
          ))}
        </div>
      </Card>
      <Card at={tKoopt + 10} outAt={end} from="right" bg={colors.khaki} cut={44} style={{ padding: "26px 40px 34px", width: 940 }}>
        <Kicker color={colors.cream}>Dok Schiebroek</Kicker>
        <div style={{ display: "flex", alignItems: "center", gap: 28, marginTop: 14 }}>
          <Coin at={tKoopt + 14} size={150} label="1x" color={colors.green} fg={colors.ink} />
          <div style={{ ...head, fontSize: 56, color: colors.white }}>
            afgekocht door
            <br />
            Dok Nederland
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 24 }}>
          {years.map((y, i) => (
            <div key={y} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, transform: `scale(${usePop(tGeen + i * 4)})` }}>
              <Check size={96} progress={prog(frame, tGeen + i * 4 + 2, tGeen + i * 4 + 12)} />
              <div style={{ fontFamily: fonts.sans, fontWeight: 800, fontSize: 34, color: colors.white }}>€ 0</div>
            </div>
          ))}
        </div>
      </Card>
    </Top>
  );
};

// ---------- Units: aantal, oppervlak en verdiepingen ----------
export const UnitsScene: React.FC<SceneProps> = ({ scene, outAt }) => {
  const F = useF();
  const wt = useWt();
  const end = F(outAt) - 6;
  const t23 = wt(scene, "23", 0.1);
  const t90 = wt(scene, "90", 0.4);
  const t112 = wt(scene, "112", 0.6);
  const tVerd = wt(scene, "verdeeld", 0.75);
  const frame = useCurrentFrame();
  const cols = 8;
  const sqm = Math.round(interpolate(frame, [t112 - 4, t112 + 12], [90, 112], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) }));
  return (
    <Top top={250} gap={20}>
      <Card at={t23 - 4} outAt={end} from="left" cut={44} style={{ padding: "20px 44px 26px", width: 940 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 30 }}>
          <div style={{ ...head, fontSize: 190, color: colors.khaki, lineHeight: 1 }}>
            <CountUp at={t23} to={23} dur={16} />
          </div>
          <div>
            <div style={{ ...head, fontSize: 64 }}>bedrijfsunits</div>
            <div style={{ fontFamily: fonts.sans, fontWeight: 700, fontSize: 38, color: colors.khakiDark }}>Ratelaarweg</div>
          </div>
        </div>
        {/* 23 units die één voor één neerploffen */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 20 }}>
          {Array.from({ length: 23 }, (_, i) => (
            <UnitBlock key={i} at={t23 + i * 1.4} size={(940 - 88 - (cols - 1) * 10) / cols} />
          ))}
        </div>
      </Card>
      <Card at={t90 - 4} outAt={end} from="right" bg={colors.green} cut={40} style={{ padding: "18px 40px 22px", display: "flex", alignItems: "baseline", gap: 18 }}>
        <div style={{ ...head, fontSize: 110, fontVariantNumeric: "tabular-nums" }}>{sqm}</div>
        <div style={{ ...head, fontSize: 52 }}>m² per unit</div>
        <div style={{ fontFamily: fonts.sans, fontWeight: 700, fontSize: 32 }}>90 – 112</div>
      </Card>
      <Card at={tVerd - 4} outAt={end} bg={colors.khaki} from="left" cut={40} style={{ padding: "18px 40px 22px", display: "flex", alignItems: "flex-end", gap: 28 }}>
        <div style={{ display: "flex", flexDirection: "column-reverse", gap: 6 }}>
          {[0, 1].map((i) => (
            <div key={i} style={{ width: 150, height: 38, background: i === 1 ? colors.cream : colors.paper, ...rounded(8), transform: `scale(${usePop(tVerd + i * 5)})` }} />
          ))}
        </div>
        <div style={{ ...head, fontSize: 62, color: colors.white }}>2 volwaardige verdiepingen</div>
      </Card>
    </Top>
  );
};

const UnitBlock: React.FC<{ at: number; size: number }> = ({ at, size }) => {
  const p = usePop(at, { damping: 10, stiffness: 240, mass: 0.5 });
  return <div style={{ width: size, height: 44, background: colors.khaki, borderRadius: 6, transform: `scale(${p})`, opacity: Math.min(1, p * 2) }} />;
};

// ---------- Verdiepingen: doorsnede van een unit ----------
export const VerdiepingenScene: React.FC<SceneProps> = ({ scene, outAt }) => {
  const F = useF();
  const wt = useWt();
  const end = F(outAt) - 6;
  const tGround = has(scene, "beneden") ? wt(scene, "beneden", 0) : wt(scene, "twee", 0.05);
  const tTop = has(scene, "boven") ? wt(scene, "boven", 0.5) : wt(scene, "verdiepingen", 0.25);
  const ground: [string, string][] = [["werkplaats", "Werkplaats"], ["opslag", "Opslag"], ["showroom", "Showroom"]];
  const top: [string, string][] = [["kantoor", "Kantoor"], ["extra", "Extra werkruimte"]];
  const Floor: React.FC<{ at: number; label: string; items: [string, string][]; bg: string; fg: string; door?: boolean }> = ({ at, label, items, bg, fg, door }) => {
    const p = usePop(at, { damping: 13, stiffness: 160, mass: 0.9 });
    return (
      <div style={{ width: 940, height: 300, background: bg, ...rounded(36), padding: "26px 40px", display: "flex", alignItems: "center", gap: 30, transform: `translateY(${(1 - p) * -260}px)`, opacity: Math.min(1, p * 2) }}>
        <div style={{ flex: 1 }}>
          <Kicker color={fg}>{label}</Kicker>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 16 }}>
            {items
              .filter(([w]) => has(scene, w))
              .map(([w, l]) => (
                <Chip key={w} at={wt(scene, w, 0.5) - 2} outAt={end} style={{ fontSize: 40, padding: "14px 26px" }}>
                  {l}
                </Chip>
              ))}
          </div>
        </div>
        {door ? <GarageDoor size={150} color={fg} open={prog(useCurrentFrame(), at + 10, at + 34)} /> : <Window size={150} color={fg} />}
      </div>
    );
  };
  return (
    <Top top={250} gap={8}>
      <div style={{ opacity: 1 - useOut(end, 8), display: "flex", flexDirection: "column", gap: 8 }}>
        <Floor at={tTop} label="Boven" items={top} bg={colors.cream} fg={colors.ink} />
        <Floor at={tGround} label="Beneden" items={ground} bg={colors.khaki} fg={colors.white} door />
      </div>
    </Top>
  );
};

// ---------- Kenmerken (b1): deur, parkeerplaats, ramen ----------
const DoorDimension: React.FC<{ at: number; end: number; frame: number }> = ({ at, end, frame }) => {
  const line = prog(frame, at, at + 14);
  const o = useOut(end, 8);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 18, opacity: 1 - o }}>
      <div style={{ position: "relative", width: 40, height: 240 }}>
        <div style={{ position: "absolute", left: 18, top: 0, width: 6, height: 240 * line, background: colors.orange }} />
        <div style={{ position: "absolute", left: 4, top: 0, width: 34, height: 6, background: colors.orange }} />
        <div style={{ position: "absolute", left: 4, top: 240 * line - 6, width: 34, height: 6, background: colors.orange }} />
      </div>
      <div style={{ ...head, fontSize: 84, color: colors.orange, opacity: line }}>3,20 m</div>
    </div>
  );
};

export const KenmerkenScene: React.FC<SceneProps> = ({ scene, outAt }) => {
  const F = useF();
  const wt = useWt();
  const frame = useCurrentFrame();
  const end = F(outAt) - 6;
  const tDeur = wt(scene, "overheaddeur", 0.2);
  const tP = wt(scene, "parkeerplaats", 0.55);
  const tR = wt(scene, "raampartijen", 0.8);
  const open = prog(frame, tDeur + 6, tDeur + 34);
  const p = usePop(tP, { damping: 8, stiffness: 200, mass: 0.9 });
  const o = useOut(end, 8);
  const swing = Math.sin((frame - tP) / 5) * 6 * Math.exp(-Math.max(0, frame - tP) / 18);
  return (
    <Top top={250} gap={22}>
      <Card at={tDeur - 3} outAt={end} from="left" cut={44} style={{ padding: "26px 44px 30px", width: 940, display: "flex", alignItems: "center", gap: 36 }}>
        <GarageDoor size={250} color={colors.ink} open={open} />
        <div>
          <Kicker>Overheaddeur</Kicker>
          <DoorDimension at={tDeur + 8} end={end} frame={frame} />
        </div>
      </Card>
      <div style={{ display: "flex", alignItems: "center", gap: 26 }}>
        <div style={{ width: 210, height: 210, background: colors.khaki, ...rounded(36), display: "flex", alignItems: "center", justifyContent: "center", ...head, fontSize: 170, color: colors.white, transform: `scale(${p * (1 - o)}) rotate(${swing}deg)` }}>P</div>
        <Card at={tP + 4} outAt={end} from="right" style={{ padding: "26px 36px 30px" }}>
          <div style={{ ...head, fontSize: 56 }}>Eigen parkeerplaats</div>
          <div style={{ fontFamily: fonts.sans, fontWeight: 700, fontSize: 36, color: colors.khaki, marginTop: 6 }}>bij elke unit</div>
        </Card>
      </div>
      <Card at={tR - 3} outAt={end} bg={colors.blue} from="left" cut={44} style={{ padding: "22px 44px 26px", width: 940, display: "flex", alignItems: "center", gap: 30 }}>
        <Window size={130} color={colors.ink} />
        <div style={{ ...head, fontSize: 60 }}>Grote raampartijen</div>
      </Card>
    </Top>
  );
};

// ---------- Stroom (b2): 3 x 25 A ----------
export const StroomScene: React.FC<SceneProps> = ({ scene, outAt }) => {
  const F = useF();
  const wt = useWt();
  const frame = useCurrentFrame();
  const end = F(outAt) - 6;
  const tVoor = wt(scene, "voorziene", 0.05);
  const t3 = wt(scene, "drie", 0.35);
  const tAmp = wt(scene, "ampère", 0.55);
  const tNet = wt(scene, "netcongestie", 0.75);
  const pulse = 0.5 + 0.5 * Math.sin(frame / 4);
  return (
    <Top top={250} gap={22}>
      <Card at={tVoor - 3} outAt={end} from="left" cut={44} style={{ padding: "26px 44px 30px", width: 940 }}>
        <Kicker>Eigen stroomaansluiting per unit</Kicker>
        <div style={{ display: "flex", alignItems: "center", gap: 26, marginTop: 14 }}>
          <div style={{ display: "flex", gap: 14 }}>
            {[0, 1, 2].map((i) => (
              <div key={i} style={{ width: 130, height: 190, background: colors.ink, ...rounded(22), display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", transform: `scale(${usePop(t3 + i * 6)})` }}>
                <Bolt size={70} color={colors.green} />
                <div style={{ ...head, fontSize: 46, color: colors.white }}>25A</div>
              </div>
            ))}
          </div>
          <div style={{ ...head, fontSize: 120, color: colors.khaki, opacity: usePop(tAmp) }}>3×25</div>
        </div>
      </Card>
      <Card at={tNet - 3} outAt={end} from="right" bg={colors.orange} cut={44} style={{ padding: "26px 44px 30px", width: 940 }}>
        <Kicker color={colors.white}>Netcongestie</Kicker>
        <div style={{ ...head, fontSize: 58, color: colors.white, marginTop: 8 }}>nieuwe aansluitingen steeds lastiger</div>
        <div style={{ display: "flex", gap: 12, marginTop: 22, alignItems: "center" }}>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} style={{ width: 60, height: 60, borderRadius: 30, background: colors.white, opacity: 0.25 + 0.75 * (i / 6) * pulse, transform: `scale(${usePop(tNet + i * 3)})` }} />
          ))}
          <div style={{ fontFamily: fonts.sans, fontWeight: 800, fontSize: 36, color: colors.white, marginLeft: 12 }}>wachtrij</div>
        </div>
      </Card>
    </Top>
  );
};

// ---------- Deur (b2): 3,20 m ----------
export const DeurScene: React.FC<SceneProps> = ({ scene, outAt }) => {
  const F = useF();
  const wt = useWt();
  const frame = useCurrentFrame();
  const end = F(outAt) - 6;
  const tDeur = wt(scene, "overheaddeur", 0.1);
  const tBinnen = wt(scene, "binnen", 0.8);
  const open = prog(frame, tDeur + 6, tDeur + 34);
  const box = prog(frame, tBinnen - 20, tBinnen + 8);
  return (
    <Top top={250} gap={22}>
      <Card at={tDeur - 3} outAt={end} from="left" cut={44} style={{ padding: "30px 44px 34px", width: 940, display: "flex", alignItems: "center", gap: 40 }}>
        <GarageDoor size={290} color={colors.ink} open={open} />
        <div>
          <Kicker>Overheaddeur</Kicker>
          <DoorDimension at={tDeur + 8} end={end} frame={frame} />
        </div>
      </Card>
      <Card at={wt(scene, "goederen", 0.6) - 4} outAt={end} from="right" bg={colors.green} cut={44} style={{ padding: "26px 44px 30px", width: 940, overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 26 }}>
          <div style={{ width: 120, height: 100, background: colors.ink, ...rounded(14), transform: `translateX(${box * 330}px)`, opacity: 1 - 0.7 * box }} />
          <div style={{ width: 16, height: 120, background: colors.ink, opacity: 0.5, marginLeft: 170 }} />
          <div style={{ ...head, fontSize: 56, marginLeft: -10 }}>Goederen zo naar binnen</div>
        </div>
      </Card>
    </Top>
  );
};

// ---------- Casco (b2): zelf inrichten ----------
export const CascoScene: React.FC<SceneProps> = ({ scene, outAt }) => {
  const F = useF();
  const wt = useWt();
  const frame = useCurrentFrame();
  const end = F(outAt) - 6;
  const tCasco = wt(scene, "casco", 0.1);
  const tVloer = wt(scene, "cementdekvloeren", 0.35);
  const tZelf = wt(scene, "eigen", 0.75);
  const floor = prog(frame, tVloer, tVloer + 14);
  const items: [string, React.ReactNode][] = [
    ["Stellingen", <Box key="s" color={colors.khaki} />],
    ["Werkbank", <Briefcase key="w" color={colors.khaki} />],
    ["Kantoor", <Window key="k" color={colors.khaki} />],
  ];
  return (
    <Top top={250} gap={22}>
      <Card at={tCasco - 3} outAt={end} from="left" cut={44} style={{ padding: "26px 44px 34px", width: 940 }}>
        <Kicker>Casco opgeleverd</Kicker>
        <div style={{ position: "relative", height: 360, marginTop: 18, border: `8px dashed ${colors.khaki}`, ...rounded(26), background: colors.paper }}>
          <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 90 * floor, background: colors.blue, borderTop: `6px solid ${colors.khakiDark}` }} />
          <div style={{ position: "absolute", left: 0, right: 0, bottom: 24, textAlign: "center", ...head, fontSize: 44, opacity: floor }}>cementdekvloer</div>
          <div style={{ position: "absolute", left: 40, right: 40, top: 40, display: "flex", gap: 16 }}>
            {items.map(([l, icon], i) => (
              <Chip key={l} at={tZelf + i * 6} outAt={end} style={{ fontSize: 34, padding: "14px 20px" }}>
                {icon}
                {l}
              </Chip>
            ))}
          </div>
        </div>
      </Card>
      <Card at={tZelf - 3} outAt={end} from="right" bg={colors.green} cut={44} style={{ padding: "22px 44px 26px" }}>
        <div style={{ ...head, fontSize: 62 }}>Jij richt alles zelf in</div>
      </Card>
    </Top>
  );
};

// ---------- Locatie (b2): parkeren en A16 ----------
export const LocatieScene: React.FC<SceneProps> = ({ scene, outAt }) => {
  const F = useF();
  const wt = useWt();
  const frame = useCurrentFrame();
  const end = F(outAt) - 6;
  const tP = wt(scene, "parkeerplaats", 0.1);
  const tA16 = wt(scene, "A16", 0.45);
  const tRot = wt(scene, "rotterdam", 0.75);
  const tLans = wt(scene, "lansingerland", 0.9);
  const p = usePop(tP, { damping: 8, stiffness: 200, mass: 0.9 });
  const o = useOut(end, 8);
  const route = prog(frame, tA16 + 6, tLans + 10);
  return (
    <Top top={250} gap={24}>
      <div style={{ display: "flex", alignItems: "center", gap: 26 }}>
        <div style={{ width: 190, height: 190, background: colors.khaki, ...rounded(34), display: "flex", alignItems: "center", justifyContent: "center", ...head, fontSize: 150, color: colors.white, transform: `scale(${p * (1 - o)})` }}>P</div>
        <Card at={tP + 4} outAt={end} from="right" style={{ padding: "24px 34px 28px" }}>
          <div style={{ ...head, fontSize: 54 }}>Eigen parkeerplaats</div>
        </Card>
      </div>
      <Card at={tA16 - 4} outAt={end} from="left" cut={44} style={{ padding: "30px 44px 36px", width: 940 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 30 }}>
          <RoadSign at={tA16 - 2} text="A16" bg="#0d5ba5" fg={colors.white} />
          <div style={{ ...head, fontSize: 52 }}>nieuwe snelweg-aansluiting</div>
        </div>
        <div style={{ position: "relative", marginTop: 34, height: 150 }}>
          <div style={{ position: "absolute", left: 40, right: 40, top: 40, height: 10, background: colors.cream }} />
          <div style={{ position: "absolute", left: 40, top: 40, height: 10, width: (940 - 88 - 80) * route, background: colors.orange }} />
          <div style={{ position: "absolute", left: 10, top: 10 }}>
            <Pin color={colors.khaki} size={70} />
          </div>
          <Chip at={tRot - 2} outAt={end} style={{ position: "absolute", left: 250, top: 70, fontSize: 36, padding: "12px 22px" }}>Rotterdam</Chip>
          <Chip at={tLans - 2} outAt={end} dark style={{ position: "absolute", right: 0, top: 70, fontSize: 36, padding: "12px 22px" }}>Lansingerland</Chip>
        </div>
      </Card>
    </Top>
  );
};

const RoadSign: React.FC<{ at: number; text: string; bg: string; fg: string }> = ({ at, text, bg, fg }) => {
  const p = usePop(at, { damping: 8, stiffness: 220, mass: 0.7 });
  return (
    <div style={{ background: bg, color: fg, border: `6px solid ${fg}`, outline: `5px solid ${bg}`, borderRadius: 18, fontFamily: fonts.sans, fontWeight: 800, fontSize: 96, padding: "6px 34px", transform: `scale(${p}) rotate(${(1 - p) * 12}deg)`, boxShadow: "0 10px 30px rgba(0,0,0,0.3)" }}>
      {text}
    </div>
  );
};

// ---------- Planning: vergunning verleend, bouwstart ----------
export const PlanningScene: React.FC<SceneProps> = ({ scene, outAt }) => {
  const F = useF();
  const wt = useWt();
  const frame = useCurrentFrame();
  const end = F(outAt) - 6;
  const vergunning = has(scene, "omgevingsvergunning");
  const tVerg = wt(scene, "omgevingsvergunning", 0.05);
  const tStart = wt(scene, "start", 0.35);
  const tKw = wt(scene, "2027", 0.8);
  const line = prog(frame, tStart - 6, tKw);
  const tTijd = wt(scene, "tijd", 0.7);
  const rows: [number, React.ReactNode, string, string, string][] = [];
  if (vergunning) rows.push([tVerg, <Check key="c" size={84} progress={prog(frame, tVerg + 6, tVerg + 18)} />, "Omgevingsvergunning", "Verleend", colors.green]);
  rows.push([tStart, <Crane key="k" size={70} color={colors.ink} />, "Start bouw", "Q2 2027", colors.orange]);
  return (
    <Top top={250} gap={22}>
      <Card at={tVerg - 4} outAt={end} cut={48} style={{ padding: "36px 50px 42px", width: 940 }}>
        <Kicker>Planning</Kicker>
        <div style={{ position: "relative", marginTop: 26, display: "flex", flexDirection: "column", gap: 40 }}>
          {rows.map(([at, icon, label, val, col], i) => {
            const d = usePop(at, { damping: 9, stiffness: 220, mass: 0.6 });
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 34 }}>
                <div style={{ width: 100, height: 100, borderRadius: 50, background: col, display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${d})` }}>{icon}</div>
                <div style={{ opacity: d, transform: `translateX(${(1 - d) * 40}px)` }}>
                  <div style={{ fontFamily: fonts.sans, fontWeight: 700, fontSize: 38, color: colors.khaki }}>{label}</div>
                  <div style={{ ...head, fontSize: 84 }}>{val}</div>
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ height: 10, background: colors.cream, marginTop: 34, borderRadius: 5 }}>
          <div style={{ height: 10, width: `${line * 100}%`, background: colors.green, borderRadius: 5 }} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 14, opacity: usePop(tStart) }}>
          <Calendar size={36} color={colors.khaki} />
          <div style={{ fontFamily: fonts.sans, fontWeight: 600, fontSize: 30, color: colors.khaki }}>naar verwachting</div>
        </div>
      </Card>
      {!vergunning ? (
        <Card at={tTijd - 4} outAt={end} bg={colors.green} from="left" cut={44} style={{ padding: "22px 44px 26px" }}>
          <div style={{ ...head, fontSize: 56 }}>Nu de tijd om te plannen</div>
        </Card>
      ) : null}
    </Top>
  );
};

// ---------- Call to action ----------
export const CtaScene: React.FC<SceneProps & { clip: string }> = ({ scene, clip }) => {
  const wt = useWt();
  const F = useF();
  const frame = useCurrentFrame();
  const t0 = F(scene.start) - 6;
  const tKlik = wt(scene, "klik", 0.05);
  const tInfo = wt(scene, "documentatie", 0.6);
  const panel = interpolate(frame, [t0, t0 + 14], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const frameP = usePop(t0 + 6);
  const btn = usePop(tKlik, { damping: 9, stiffness: 180, mass: 0.8 });
  const pulse = frame > tKlik + 10 ? 1 + Math.sin((frame - tKlik) / 5) * 0.035 : 1;
  const arrow = usePop(tInfo);
  const headP = usePop(t0 + 10);
  const inschrijven = has(scene, "schrijf");
  const docs = has(scene, "documentatie");
  return (
    <AbsoluteFill style={{ clipPath: `inset(${(1 - panel) * 100}% 0 0 0)`, background: colors.cream }}>
      {/* Beeld in een kader met afgeronde hoeken */}
      <div
        style={{
          position: "absolute",
          top: 120,
          left: 70,
          right: 70,
          height: 720,
          ...rounded(70),
          overflow: "hidden",
          transform: `scale(${0.9 + 0.1 * frameP})`,
          opacity: frameP,
        }}
      >
        <Sequence from={t0}>
          <OffthreadVideo src={staticFile(`clips/${clip}.mp4`)} muted playbackRate={0.6} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </Sequence>
      </div>
      <div style={{ position: "absolute", top: 740, right: 100, opacity: frameP, background: colors.white, padding: 16, borderRadius: 18, boxShadow: "0 10px 30px rgba(0,0,0,0.18)" }}>
        <Beeldmerk at={t0 + 8} size={46} />
      </div>
      <div style={{ position: "absolute", top: 900, left: 70, right: 70, display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 30 }}>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 18, opacity: frameP }}>
          <DokLogo width={200} />
          <div style={{ fontFamily: fonts.sans, fontWeight: 700, fontSize: 40, color: colors.ink, marginBottom: 4 }}>Schiebroek</div>
        </div>
        <div style={{ ...head, fontSize: 70, opacity: headP, transform: `translateY(${(1 - headP) * 40}px)` }}>
          {inschrijven ? "Schrijf je in voor jouw unit" : docs ? "Vraag de volledige documentatie aan" : "Neem contact op"}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 30 }}>
          <div
            style={{
              background: colors.orange,
              color: colors.white,
              fontFamily: fonts.sans,
              fontWeight: 800,
              fontSize: 52,
              padding: "26px 54px",
              ...rounded(24),
              transform: `scale(${btn * pulse})`,
              transformOrigin: "left center",
            }}
          >
            Klik hieronder
          </div>
          <svg width={70} height={100} viewBox="0 0 70 100" style={{ opacity: arrow, transform: `translateY(${Math.abs(Math.sin(frame / 7)) * 22}px)` }}>
            <path d="M35 6v80M10 62l25 26 25-26" stroke={colors.ink} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </svg>
        </div>
        <div style={{ fontFamily: fonts.sans, fontWeight: 600, fontSize: 38, color: colors.khaki, opacity: arrow }}>Dok Schiebroek · Ratelaarweg, Rotterdam-Noord</div>
      </div>
    </AbsoluteFill>
  );
};
