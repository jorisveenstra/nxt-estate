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
import { Box, Briefcase, Calendar, ChartUp, Clock, Concrete, Crane, Eye, Fence, GarageDoor, Key, Pin, Shield, Van, Wrench } from "./icons";
import { Card, Chip, CountUp, Hoek, Kicker, norm, rounded, Scene, usePop, wordTime } from "./ui";

export type SceneProps = { scene: Scene; outAt: number };

const useF = () => {
  const { fps } = useVideoConfig();
  return (sec: number) => Math.round(sec * fps);
};

const has = (scene: Scene, text: string) => scene.words.some((w) => norm(w.t).startsWith(norm(text)));
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const Top: React.FC<{ children: React.ReactNode; gap?: number; top?: number }> = ({ children, gap = 24, top = 250 }) => (
  <AbsoluteFill style={{ padding: `${top}px 70px 0`, display: "flex", flexDirection: "column", gap, alignItems: "flex-start" }}>
    {children}
  </AbsoluteFill>
);

// Koppen: Raleway zwaar, zoals de titels op de site
const head: React.CSSProperties = { fontFamily: fonts.head, fontWeight: 800, color: colors.ink, lineHeight: 1.06, letterSpacing: -0.5 };
const caps: React.CSSProperties = { ...head, textTransform: "uppercase", letterSpacing: 0.5 };
const sub: React.CSSProperties = { fontFamily: fonts.sans, fontWeight: 700, fontSize: 38, color: colors.grey };

const Logo: React.FC<{ width: number; white?: boolean; style?: React.CSSProperties }> = ({ width, white, style }) => (
  <Img src={staticFile(`logo/${white ? "mb-wit" : "mb-kleur"}.png`)} style={{ width, display: "block", ...style }} />
);

// Rood label met witte tekst
const Badge: React.FC<{ at: number; children: React.ReactNode; style?: React.CSSProperties }> = ({ at, children, style }) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [at, at + 6], [0, 1], clamp);
  return (
    <div
      style={{
        display: "inline-block",
        padding: "6px 18px",
        background: colors.red,
        color: colors.white,
        fontFamily: fonts.sans,
        fontWeight: 800,
        fontSize: 34,
        borderRadius: 6,
        opacity: p,
        transform: `translateX(${(1 - p) * -30}px)`,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

// Rode streep die over een tekst heen getrokken wordt
const Strike: React.FC<{ at: number; angle?: number }> = ({ at, angle = -8 }) => {
  const frame = useCurrentFrame();
  const s = interpolate(frame, [at, at + 10], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  return (
    <div
      style={{
        position: "absolute",
        left: -12,
        top: "47%",
        height: 14,
        width: `${s * 106}%`,
        background: colors.red,
        transform: `rotate(${angle}deg)`,
        transformOrigin: "left center",
      }}
    />
  );
};

// ---------- Hook ----------
export const HookScene: React.FC<SceneProps & { accent: string[] }> = ({ scene, outAt, accent }) => {
  const F = useF();
  const frame = useCurrentFrame();
  const acc = accent.map(norm);
  const fontSize = scene.words.length > 18 ? 62 : scene.words.length > 14 ? 68 : 76;
  return (
    <Top top={280}>
      <Card at={0} outAt={F(outAt) - 6} hoek style={{ padding: "52px 54px 54px 60px", maxWidth: 940 }}>
        <div style={{ marginBottom: 24 }}>
          <Kicker>Maartens Business · Maartensdijk</Kicker>
        </div>
        <div style={{ ...head, fontSize, display: "flex", flexWrap: "wrap", columnGap: "0.24em", rowGap: 8 }}>
          {scene.words.map((w, i) => {
            const at = F(w.s) - 2;
            const p = interpolate(frame, [at, at + 6], [0, 1], { ...clamp, easing: Easing.out(Easing.back(2)) });
            const isAccent = acc.includes(norm(w.t));
            const mark = interpolate(frame, [at + 2, at + 10], [0, 1], clamp);
            return (
              <span
                key={i}
                style={{
                  position: "relative",
                  display: "inline-block",
                  opacity: p,
                  transform: `translateY(${(1 - p) * 40}px) scale(${0.7 + 0.3 * p})`,
                  color: isAccent && mark > 0.5 ? colors.white : colors.ink,
                }}
              >
                {isAccent ? (
                  <span
                    style={{
                      position: "absolute",
                      left: -8,
                      right: -8,
                      top: "6%",
                      bottom: "-2%",
                      background: colors.red,
                      borderRadius: 4,
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

// ---------- Intro: logo + ligging tussen Utrecht en Hilversum ----------
export const IntroScene: React.FC<SceneProps> = ({ scene, outAt }) => {
  const F = useF();
  const frame = useCurrentFrame();
  const t0 = F(scene.start);
  const tDorp = F(wordTime(scene, "maartensdijk"));
  const tCentraal = F(wordTime(scene, "centrale"));
  const tUtr = F(wordTime(scene, "utrecht"));
  const tHil = F(wordTime(scene, "hilversum"));
  const end = F(outAt) - 6;
  const logo = usePop(t0 + 2, { damping: 11, stiffness: 160, mass: 0.9 });
  const reveal = interpolate(frame, [t0 + 2, t0 + 16], [0, 100], { ...clamp, easing: Easing.out(Easing.cubic) });
  // Kaartje: Utrecht linksonder, Hilversum rechtsboven, Maartensdijk ertussen
  const U = { x: 150, y: 330 };
  const H = { x: 790, y: 110 };
  const M = { x: 440, y: 235 };
  const line = interpolate(frame, [tCentraal, tHil + 8], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const pin = usePop(tDorp - 2, { damping: 8, stiffness: 200, mass: 0.8 });
  const uP = usePop(tUtr - 2);
  const hP = usePop(tHil - 2);
  const len = Math.hypot(H.x - U.x, H.y - U.y);
  return (
    <Top top={270} gap={26}>
      <Card at={t0 - 4} outAt={end} bg={colors.ink} hoek style={{ padding: "50px 70px 54px", display: "flex", alignItems: "center", gap: 46 }}>
        <div style={{ clipPath: `inset(0 ${100 - reveal}% 0 0)`, transform: `scale(${0.8 + 0.2 * logo})` }}>
          <Logo width={260} white />
        </div>
        <div style={{ opacity: interpolate(frame, [t0 + 10, t0 + 18], [0, 1], clamp) }}>
          <div style={{ ...caps, fontSize: 40, color: colors.white, fontWeight: 600 }}>Koop je eigen</div>
          <div style={{ ...caps, fontSize: 64, color: colors.white }}>bedrijfspand</div>
        </div>
      </Card>
      <Card at={tDorp - 6} outAt={end} from="left" style={{ width: 940, height: 470 }}>
        <svg width={940} height={470} style={{ position: "absolute", left: 0, top: 0 }}>
          {/* Polderlijnen op de achtergrond */}
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <line key={i} x1={-40 + i * 190} y1={470} x2={160 + i * 190} y2={0} stroke={colors.light} strokeWidth={3} />
          ))}
          <line
            x1={U.x}
            y1={U.y}
            x2={H.x}
            y2={H.y}
            stroke={colors.grey}
            strokeWidth={8}
            strokeDasharray={`${len} ${len}`}
            strokeDashoffset={len * (1 - line)}
            strokeLinecap="round"
          />
          <circle cx={U.x} cy={U.y} r={18 * uP} fill={colors.ink} />
          <circle cx={H.x} cy={H.y} r={18 * hP} fill={colors.ink} />
        </svg>
        <div style={{ position: "absolute", left: U.x - 60, top: U.y + 30, ...caps, fontSize: 40, opacity: uP }}>Utrecht</div>
        <div style={{ position: "absolute", left: H.x - 200, top: H.y - 80, ...caps, fontSize: 40, opacity: hP }}>Hilversum</div>
        <div
          style={{
            position: "absolute",
            left: M.x - 45,
            top: M.y - 105,
            transform: `translateY(${(1 - pin) * -220}px)`,
            opacity: Math.min(1, pin * 2),
          }}
        >
          <div style={{ width: 90, height: 90, borderRadius: 45, background: colors.red, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Pin size={58} color={colors.white} />
          </div>
        </div>
        <div style={{ position: "absolute", left: M.x + 60, top: M.y - 10, opacity: pin }}>
          <Badge at={tDorp + 4} style={{ fontSize: 40 }}>
            Maartensdijk
          </Badge>
        </div>
      </Card>
    </Top>
  );
};

// ---------- Prijs ----------
const fmt = (n: number) => Math.round(n).toLocaleString("nl-NL");

export const PrijsScene: React.FC<SceneProps> = ({ scene, outAt }) => {
  const F = useF();
  const frame = useCurrentFrame();
  const t0 = F(scene.start);
  const tPrijs = F(wordTime(scene, "495"));
  const tVon = F(wordTime(scene, "vrij"));
  const end = F(outAt) - 6;
  const prijs = interpolate(frame, [tPrijs, tPrijs + 22], [350000, 495000], { ...clamp, easing: Easing.out(Easing.cubic) });
  return (
    <Top top={260} gap={22}>
      <Card at={t0 - 4} outAt={end} hoek from="left" style={{ padding: "40px 50px 40px 60px" }}>
        <Kicker>Je eigen bedrijfspand voor</Kicker>
        <div style={{ ...head, fontSize: 136, fontWeight: 900, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap", marginTop: 6 }}>€ {fmt(prijs)}</div>
        <Badge at={tVon}>v.o.n. ex. btw</Badge>
      </Card>
      {has(scene, "huurverhogingen") ? <PrijsHuurder scene={scene} end={end} /> : null}
      {has(scene, "bus") ? <PrijsVakman scene={scene} end={end} /> : null}
      {has(scene, "vermogen") ? <PrijsBelegger scene={scene} end={end} /> : null}
    </Top>
  );
};

const PrijsHuurder: React.FC<{ scene: Scene; end: number }> = ({ scene, end }) => {
  const F = useF();
  const frame = useCurrentFrame();
  const tGeen = F(wordTime(scene, "geen"));
  const tMaar = F(wordTime(scene, "maar"));
  const tJou = F(wordTime(scene, "jou"));
  const tPensioen = F(wordTime(scene, "pensioen"));
  const key = usePop(tJou - 2, { damping: 8, stiffness: 200, mass: 0.8 });
  const turn = interpolate(frame, [tJou + 4, tJou + 16], [0, -90], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  return (
    <>
      <Card at={tGeen - 4} outAt={end} from="right" style={{ padding: "24px 44px 28px" }}>
        <div style={{ position: "relative", ...caps, fontSize: 52, color: colors.mid }}>
          Geen huurverhogingen
          <Strike at={tMaar - 8} angle={-5} />
        </div>
      </Card>
      <Card at={tJou - 8} outAt={end} bg={colors.ink} from="left" style={{ padding: "26px 44px 30px", display: "flex", alignItems: "center", gap: 30 }}>
        <div style={{ transform: `scale(${key}) rotate(${turn}deg)` }}>
          <Key size={100} color={colors.white} />
        </div>
        <div style={{ ...caps, fontSize: 60, color: colors.white }}>
          Helemaal
          <br />
          van jou
        </div>
      </Card>
      <Chip at={tPensioen - 6} outAt={end} dark>
        <ChartUp color={colors.white} /> Bouw aan je pensioen
      </Chip>
    </>
  );
};

const PrijsVakman: React.FC<{ scene: Scene; end: number }> = ({ scene, end }) => {
  const F = useF();
  const tVaste = F(wordTime(scene, "vaste"));
  const tDak = F(wordTime(scene, "allemaal"));
  const items: [string, React.ReactNode, string][] = [
    ["bus", <Van key="v" color={colors.red} />, "Je bus"],
    ["materiaal", <Box key="b" color={colors.red} />, "Je materiaal"],
    ["kantoor", <Briefcase key="k" color={colors.red} />, "Je kantoor"],
  ];
  return (
    <>
      <Card at={tVaste - 4} outAt={end} bg={colors.ink} from="right" style={{ padding: "22px 44px 26px" }}>
        <div style={{ ...caps, fontSize: 56, color: colors.white }}>Eindelijk een vaste plek</div>
      </Card>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 14, maxWidth: 940 }}>
        {items.map(([w, icon, label]) => (
          <Chip key={w} at={F(wordTime(scene, w)) - 2} outAt={end}>
            {icon}
            {label}
          </Chip>
        ))}
      </div>
      <Chip at={tDak - 2} outAt={end} dark>
        Allemaal onder één dak
      </Chip>
    </>
  );
};

const PrijsBelegger: React.FC<{ scene: Scene; end: number }> = ({ scene, end }) => {
  const F = useF();
  const frame = useCurrentFrame();
  const tBouw = F(wordTime(scene, "bouw"));
  const tZonder = F(wordTime(scene, "zonder"));
  const bars = [0.3, 0.45, 0.58, 0.74, 1];
  return (
    <>
      <Card at={tBouw - 4} outAt={end} bg={colors.ink} from="right" style={{ padding: "28px 44px 30px", display: "flex", alignItems: "flex-end", gap: 34 }}>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 10, height: 150 }}>
          {bars.map((h, i) => {
            const g = interpolate(frame, [tBouw + i * 4, tBouw + i * 4 + 12], [0, 1], { ...clamp, easing: Easing.out(Easing.back(1.6)) });
            return <div key={i} style={{ width: 30, height: 150 * h * g, background: i === bars.length - 1 ? colors.red : colors.white }} />;
          })}
        </div>
        <div style={{ ...caps, fontSize: 60, color: colors.white }}>
          Bouw aan je
          <br />
          vermogen
        </div>
      </Card>
      <Chip at={tZonder - 2} outAt={end} dark>
        Zonder dat het stilstaat
      </Chip>
    </>
  );
};

// ---------- Laatste units ----------
const VERKOCHT = [1, 3, 4, 5, 6, 7, 8]; // stand op maartensbusiness.nl
const UnitRij: React.FC<{ at: number }> = ({ at }) => {
  const frame = useCurrentFrame();
  return (
    <div style={{ display: "flex", gap: 8 }}>
      {Array.from({ length: 11 }, (_, i) => {
        const n = i + 1;
        const p = interpolate(frame, [at + i * 1.5, at + i * 1.5 + 8], [0, 1], { ...clamp, easing: Easing.out(Easing.back(2)) });
        const sold = VERKOCHT.includes(n);
        const s = interpolate(frame, [at + 22 + i, at + 28 + i], [0, 1], clamp);
        const glow = sold ? 0 : (Math.sin((frame - at) / 5) + 1) / 2;
        return (
          <div
            key={n}
            style={{
              width: 66,
              height: 120,
              background: sold ? (s > 0.5 ? colors.light : colors.grey) : colors.red,
              color: sold ? colors.mid : colors.white,
              borderRadius: 4,
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "center",
              paddingBottom: 10,
              fontFamily: fonts.sans,
              fontWeight: 800,
              fontSize: 28,
              transform: `translateY(${(1 - p) * 60}px) scale(${sold ? 1 : 1 + glow * 0.05 * s})`,
              opacity: p,
              position: "relative",
              overflow: "hidden",
            }}
          >
            {sold ? <div style={{ position: "absolute", left: -10, right: -10, top: 54, height: 6, background: colors.mid, transform: `rotate(-60deg) scaleX(${s})` }} /> : null}
            {n}
          </div>
        );
      })}
    </div>
  );
};

// Doorsnede van een unit: twee bouwlagen met labels per laag
type Label = [string, number, React.ReactNode];
const Doorsnede: React.FC<{ at: number; boven: Label[]; beneden: Label[]; dakAt?: number }> = ({ at, boven, beneden, dakAt }) => {
  const laag = (i: number) => usePop(at + i * 6, { damping: 10, stiffness: 200, mass: 0.7 });
  const l0 = laag(0);
  const l1 = laag(1);
  const dak = usePop(dakAt ?? at + 14, { damping: 9, stiffness: 220, mass: 0.6 });
  const rij = (p: number, labels: Label[], dark?: boolean) => (
    <div
      style={{
        height: 130,
        background: dark ? colors.grey : colors.light,
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "0 22px",
        transform: `translateY(${(1 - p) * -140}px)`,
        opacity: Math.min(1, p * 2),
      }}
    >
      {labels.map(([text, t, icon], i) => (
        <Chip key={i} at={t} dark={!dark} style={{ fontSize: 34, padding: "12px 20px", boxShadow: "none" }}>
          {icon}
          {text}
        </Chip>
      ))}
    </div>
  );
  return (
    <div style={{ width: 800 }}>
      <div style={{ height: 18, background: colors.red, transform: `scaleX(${dak})`, transformOrigin: "left", marginBottom: 6 }} />
      {rij(l1, boven, true)}
      <div style={{ height: 6 }} />
      {rij(l0, beneden)}
    </div>
  );
};

export const LaatsteScene: React.FC<SceneProps> = ({ scene, outAt }) => {
  const F = useF();
  const t0 = F(scene.start);
  const t300 = F(wordTime(scene, "300"));
  const end = F(outAt) - 6;
  const lagen = has(scene, "bouwlagen");
  const tLagen = lagen ? F(wordTime(scene, "2", 0)) : 0;
  const beneden: Label[] = [];
  const boven: Label[] = [];
  if (has(scene, "beneden")) {
    beneden.push(["Werkplaats", F(wordTime(scene, "werkplaats")) - 2, <Wrench key="w" size={36} color={colors.white} />]);
    beneden.push(["Opslag", F(wordTime(scene, "opslag")) - 2, <Box key="o" size={36} color={colors.white} />]);
    boven.push(["Kantoor", F(wordTime(scene, "kantoor")) - 2, <Briefcase key="k" size={36} color={colors.ink} />]);
  } else if (lagen) {
    beneden.push(["Opslag", F(wordTime(scene, "opslag")) - 2, <Box key="o" size={36} color={colors.white} />]);
    beneden.push(["Werkplaats", F(wordTime(scene, "werkplaats")) - 2, <Wrench key="w" size={36} color={colors.white} />]);
    boven.push(["Kantoor", F(wordTime(scene, "kantoor")) - 2, <Briefcase key="k" size={36} color={colors.ink} />]);
  }
  return (
    <Top top={250} gap={20}>
      <Card at={t0 - 4} outAt={end} hoek style={{ padding: "36px 44px 34px 56px" }}>
        <Kicker>{has(scene, "enkele") ? "Nog enkele units" : "De laatste units"}</Kicker>
        <div style={{ ...caps, fontSize: 56, margin: "6px 0 22px" }}>nog beschikbaar</div>
        <UnitRij at={t0 + 4} />
      </Card>
      <Card at={t300 - 4} outAt={end} bg={colors.ink} from="right" style={{ padding: "22px 44px 26px", display: "flex", alignItems: "baseline", gap: 18 }}>
        <div style={{ ...head, fontSize: 40, color: colors.white, fontWeight: 600 }}>circa</div>
        <div style={{ ...head, fontSize: 120, fontWeight: 900, color: colors.white }}>
          <CountUp at={t300} from={100} to={300} dur={16} />
        </div>
        <div style={{ ...head, fontSize: 64, color: colors.white }}>m²</div>
      </Card>
      {lagen ? (
        <Card at={tLagen - 6} outAt={end} from="left" style={{ padding: "26px 40px 30px" }}>
          <Kicker>2 bouwlagen</Kicker>
          <div style={{ height: 16 }} />
          <Doorsnede at={tLagen} boven={boven} beneden={beneden} dakAt={has(scene, "dak") ? F(wordTime(scene, "dak")) - 2 : undefined} />
        </Card>
      ) : null}
    </Top>
  );
};

// ---------- Indeling (doelgroep 1) ----------
export const IndelingScene: React.FC<SceneProps> = ({ scene, outAt }) => {
  const F = useF();
  const t2 = F(wordTime(scene, "2"));
  const end = F(outAt) - 6;
  return (
    <Top top={260} gap={22}>
      <Card at={t2 - 6} outAt={end} hoek style={{ padding: "36px 40px 36px 56px" }}>
        <Kicker>2 verdiepingen</Kicker>
        <div style={{ ...caps, fontSize: 52, margin: "4px 0 22px" }}>Alles onder één dak</div>
        <Doorsnede
          at={t2}
          dakAt={F(wordTime(scene, "dak")) - 2}
          boven={[["Kantoor", F(wordTime(scene, "kantoor")) - 2, <Briefcase key="k" size={36} color={colors.ink} />]]}
          beneden={[
            ["Opslag", F(wordTime(scene, "opslag")) - 2, <Box key="o" size={36} color={colors.white} />],
            ["Werkplaats", F(wordTime(scene, "werkplaats")) - 2, <Wrench key="w" size={36} color={colors.white} />],
          ]}
        />
      </Card>
      <Chip at={F(wordTime(scene, "duurzame")) - 4} outAt={end} dark>
        <ChartUp color={colors.white} /> Investeer in een duurzame toekomst
      </Chip>
    </Top>
  );
};

// ---------- Kenmerken: deuren, parkeren, achterterrein ----------
const Parkeer: React.FC<{ at: number; n?: number }> = ({ at, n = 2 }) => {
  const frame = useCurrentFrame();
  return (
    <div style={{ display: "flex", gap: 12 }}>
      {Array.from({ length: n }, (_, i) => {
        const p = usePop(at + i * 5, { damping: 8, stiffness: 200, mass: 0.9 });
        const swing = Math.sin((frame - at - i * 5) / 5) * 6 * Math.exp(-Math.max(0, frame - at - i * 5) / 18);
        return (
          <div
            key={i}
            style={{
              width: 110,
              height: 110,
              background: colors.red,
              borderRadius: 8,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              ...head,
              fontSize: 86,
              color: colors.white,
              transform: `scale(${p}) rotate(${swing}deg)`,
            }}
          >
            P
          </div>
        );
      })}
    </div>
  );
};

const DeurenCard: React.FC<{ at: number; voor: number; achter: number; outAt: number; from?: "left" | "right" }> = ({ at, voor, achter, outAt, from = "left" }) => {
  const frame = useCurrentFrame();
  const o1 = interpolate(frame, [voor, voor + 18], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const o2 = interpolate(frame, [achter, achter + 18], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  return (
    <Card at={at} outAt={outAt} from={from} style={{ padding: "22px 40px 26px", display: "flex", alignItems: "center", gap: 22 }}>
      <GarageDoor size={100} color={colors.ink} open={o1} />
      <GarageDoor size={100} color={colors.red} open={o2} />
      <div style={{ marginLeft: 8 }}>
        <Kicker>Overheaddeuren</Kicker>
        <div style={{ ...caps, fontSize: 50 }}>voor én achter</div>
      </div>
    </Card>
  );
};

const TerreinCard: React.FC<{ at: number; t84: number; outAt: number; from?: "left" | "right" }> = ({ at, t84, outAt, from = "right" }) => (
  <Card at={at} outAt={outAt} bg={colors.ink} from={from} style={{ padding: "22px 40px 26px", display: "flex", alignItems: "center", gap: 26 }}>
    <Fence size={96} color={colors.white} />
    <div>
      <div style={{ ...sub, color: colors.light, fontSize: 34 }}>Privé achterterrein</div>
      <div style={{ ...head, fontSize: 84, fontWeight: 900, color: colors.white }}>
        ± <CountUp at={t84} from={20} to={84} dur={14} /> m²
      </div>
    </div>
  </Card>
);

export const KenmerkenScene: React.FC<SceneProps> = ({ scene, outAt }) => {
  const F = useF();
  const tDeur = F(wordTime(scene, "overheaddeuren"));
  const tVoor = F(wordTime(scene, "voor"));
  const tAchter = F(wordTime(scene, "achterkant"));
  const tP = F(wordTime(scene, "parkeerplaatsen"));
  const tTwee = F(wordTime(scene, "twee"));
  const tTerrein = F(wordTime(scene, "achterterrein"));
  const t84 = F(wordTime(scene, "84"));
  const end = F(outAt) - 6;
  const items: [number, React.ReactNode][] = [
    [tDeur, <DeurenCard key="d" at={tDeur - 4} voor={tVoor} achter={tAchter} outAt={end} />],
    [
      tTwee,
      <div key="p" style={{ display: "flex", alignItems: "center", gap: 22 }}>
        <Parkeer at={tTwee - 2} />
        <Card at={tP} outAt={end} from="right" style={{ padding: "20px 32px 24px" }}>
          <div style={{ ...caps, fontSize: 46 }}>2 eigen</div>
          <div style={{ ...sub, fontSize: 34 }}>parkeerplaatsen</div>
        </Card>
      </div>,
    ],
    [tTerrein, <TerreinCard key="t" at={tTerrein - 4} t84={t84} outAt={end} />],
  ];
  items.sort((a, b) => a[0] - b[0]);
  return (
    <Top top={250} gap={22}>
      {items.map(([, el]) => el)}
      {has(scene, "huurders") ? (
        <Chip at={F(wordTime(scene, "huurders")) - 6} outAt={end} dark>
          Precies waar huurders naar zoeken
        </Chip>
      ) : null}
    </Top>
  );
};

// ---------- Achterterrein (doelgroep 2) ----------
export const TerreinScene: React.FC<SceneProps> = ({ scene, outAt }) => {
  const F = useF();
  const frame = useCurrentFrame();
  const tTerrein = F(wordTime(scene, "achterterrein"));
  const t84 = F(wordTime(scene, "84"));
  const tMat = F(wordTime(scene, "materiaal"));
  const end = F(outAt) - 6;
  // Pallets die op het terrein vallen
  const pallets = [
    [60, 150],
    [200, 150],
    [60, 60],
    [340, 150],
    [200, 60],
  ];
  return (
    <Top top={260} gap={22}>
      <TerreinCard at={tTerrein - 6} t84={t84} outAt={end} from="left" />
      <Card at={tMat - 8} outAt={end} hoek style={{ padding: "32px 40px 34px 52px", display: "flex", alignItems: "center", gap: 36 }}>
        <div style={{ position: "relative", width: 480, height: 240, background: colors.light, border: `6px solid ${colors.grey}`, borderTop: "none" }}>
          {pallets.map(([x, y], i) => {
            const p = usePop(tMat + i * 4, { damping: 10, stiffness: 240, mass: 0.6 });
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: x,
                  top: y,
                  width: 120,
                  height: 80,
                  background: i % 2 ? colors.grey : colors.red,
                  borderRadius: 4,
                  transform: `translateY(${(1 - p) * -260}px)`,
                  opacity: frame >= tMat + i * 4 ? 1 : 0,
                }}
              />
            );
          })}
        </div>
        <div style={{ ...caps, fontSize: 48 }}>
          Materiaal
          <br />
          buiten
          <br />
          opslaan
        </div>
      </Card>
    </Top>
  );
};

// ---------- Vloer (doelgroep 2) ----------
export const VloerScene: React.FC<SceneProps> = ({ scene, outAt }) => {
  const F = useF();
  const frame = useCurrentFrame();
  const t1000 = F(wordTime(scene, "1000"));
  const tMach = F(wordTime(scene, "machines"));
  const end = F(outAt) - 6;
  const drop = interpolate(frame, [t1000 - 4, t1000 + 6], [0, 1], { ...clamp, easing: Easing.in(Easing.quad) });
  const impact = frame - (t1000 + 6);
  const shake = impact > 0 ? Math.sin(impact * 2.2) * 10 * Math.exp(-impact / 6) : 0;
  return (
    <Top top={260} gap={22}>
      <Card at={F(scene.start) - 4} outAt={end} hoek style={{ padding: "36px 46px 40px 56px", width: 940 }}>
        <Kicker>Begane grondvloer</Kicker>
        <div style={{ position: "relative", height: 380, marginTop: 10, transform: `translateX(${shake}px)` }}>
          <div
            style={{
              position: "absolute",
              left: 120,
              width: 500,
              top: -200 + drop * 200,
              height: 260,
              background: colors.ink,
              borderRadius: 8,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              opacity: frame >= t1000 - 4 ? 1 : 0,
            }}
          >
            <div style={{ ...head, fontSize: 110, fontWeight: 900, color: colors.white }}>
              <Counter at={t1000} to={1000} /> kg
            </div>
            <div style={{ ...sub, color: colors.light }}>per m²</div>
          </div>
          {/* Betonvloer */}
          <div style={{ position: "absolute", left: 0, right: 0, top: 270, height: 60, background: colors.light, borderTop: `10px solid ${colors.red}` }}>
            {[0, 1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} style={{ position: "absolute", left: 30 + i * 120, top: 20, width: 14, height: 14, borderRadius: 7, background: colors.mid }} />
            ))}
          </div>
        </div>
      </Card>
      <Chip at={tMach - 4} outAt={end} dark>
        <Wrench color={colors.white} /> Zware machines? Geen probleem
      </Chip>
    </Top>
  );
};

// ---------- Parkeren (doelgroep 2) ----------
export const ParkerenScene: React.FC<SceneProps> = ({ scene, outAt }) => {
  const F = useF();
  const frame = useCurrentFrame();
  const tBus = F(wordTime(scene, "bus"));
  const tTwee = F(wordTime(scene, "twee"));
  const tDeur = F(wordTime(scene, "deur"));
  const end = F(outAt) - 6;
  const drive = interpolate(frame, [tBus + 4, tBus + 30], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  return (
    <Top top={260} gap={22}>
      <Card at={tBus - 6} outAt={end} hoek style={{ padding: "36px 46px 40px 56px", width: 940 }}>
        <Kicker>Direct voor de deur</Kicker>
        <div style={{ position: "relative", height: 330, marginTop: 20 }}>
          {/* Gevel */}
          <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 70, background: colors.ink }} />
          {[0, 1].map((i) => (
            <div key={i} style={{ position: "absolute", left: 120 + i * 380, top: 70, width: 300, height: 250, border: `6px dashed ${colors.mid}`, borderTop: "none" }}>
              <div style={{ position: "absolute", bottom: 14, right: 14 }}>
                <Parkeer at={tTwee - 2 + i * 4} n={1} />
              </div>
            </div>
          ))}
          <div style={{ position: "absolute", left: -260 + drive * 395, top: 150, opacity: drive > 0 ? 1 : 0 }}>
            <Van size={150} color={colors.red} />
          </div>
        </div>
      </Card>
      <Chip at={tDeur - 6} outAt={end} dark>
        2 eigen parkeerplaatsen
      </Chip>
    </Top>
  );
};

// ---------- Deuren: rijd dwars door je pand (doelgroep 2) ----------
export const DeurenScene: React.FC<SceneProps> = ({ scene, outAt }) => {
  const F = useF();
  const frame = useCurrentFrame();
  const tVoor = F(wordTime(scene, "voor"));
  const tAchter = F(wordTime(scene, "achterkant"));
  const tDwars = F(wordTime(scene, "dwars"));
  const end = F(outAt) - 6;
  const d1 = interpolate(frame, [tVoor - 2, tVoor + 14], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const d2 = interpolate(frame, [tAchter - 2, tAchter + 14], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const drive = interpolate(frame, [tDwars - 4, tDwars + 34], [0, 1], { ...clamp, easing: Easing.inOut(Easing.quad) });
  const W = 820;
  return (
    <Top top={260} gap={22}>
      <Card at={F(scene.start) - 4} outAt={end} hoek style={{ padding: "36px 40px 40px 56px", width: 940 }}>
        <Kicker>Overheaddeuren voor én achter</Kicker>
        <div style={{ position: "relative", height: 360, marginTop: 16, overflow: "hidden" }}>
          {/* Zijaanzicht van het pand */}
          <div style={{ position: "absolute", left: 120, width: W - 240, top: 40, height: 280, background: colors.light, borderTop: `14px solid ${colors.red}` }} />
          <div style={{ position: "absolute", left: 120, width: W - 240, top: 160, height: 8, background: colors.grey }} />
          {[
            [120, d1],
            [W - 120 - 16, d2],
          ].map(([x, d], i) => (
            <div key={i} style={{ position: "absolute", left: x, top: 40, width: 16, height: 280, background: colors.grey }}>
              <div style={{ position: "absolute", left: -2, width: 20, top: 120, height: 160 * (1 - d), background: colors.ink }} />
            </div>
          ))}
          <div style={{ position: "absolute", left: -200 + drive * (W + 200), top: 175 }}>
            <Van size={140} color={colors.red} />
          </div>
          <div style={{ position: "absolute", left: 0, right: 0, top: 320, height: 8, background: colors.grey }} />
        </div>
      </Card>
      <Card at={tDwars - 2} outAt={end} bg={colors.ink} from="right" style={{ padding: "22px 44px 26px" }}>
        <div style={{ ...caps, fontSize: 54, color: colors.white }}>Rijd dwars door je pand</div>
      </Card>
    </Top>
  );
};

// ---------- Locatie: A27 + zichtbaarheid ----------
const A27: React.FC<{ at: number }> = ({ at }) => {
  const p = usePop(at, { damping: 8, stiffness: 220, mass: 0.7 });
  return (
    <div
      style={{
        background: "#d42020",
        color: colors.white,
        border: `6px solid ${colors.white}`,
        outline: "5px solid #d42020",
        borderRadius: 18,
        fontFamily: fonts.sans,
        fontWeight: 800,
        fontSize: 100,
        padding: "4px 34px",
        transform: `scale(${p}) rotate(${(1 - p) * 12}deg)`,
        boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
      }}
    >
      A27
    </div>
  );
};

const ReisCard: React.FC<{ scene: Scene; outAt: number; from?: "left" | "right" }> = ({ scene, outAt, from = "left" }) => {
  const F = useF();
  const tH = F(wordTime(scene, "hilversum"));
  const tU = F(wordTime(scene, "utrecht"));
  const rows: [string, number, React.ReactNode][] = [
    ["Hilversum", tH, <>7 – 8 min</>],
    ["Utrecht", tU, <>± 10 min</>],
  ];
  return (
    <Card at={tH - 6} outAt={outAt} hoek from={from} style={{ padding: "30px 44px 30px 56px", display: "flex", flexDirection: "column", gap: 14 }}>
      {rows.map(([city, t, time], i) => {
        const p = usePop(t - 2);
        return (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 22, opacity: p, transform: `translateX(${(1 - p) * -40}px)` }}>
            <Clock size={60} color={colors.red} />
            <div style={{ ...caps, fontSize: 50, width: 330 }}>{city}</div>
            <div style={{ ...head, fontSize: 60, fontWeight: 900, color: colors.red }}>{time}</div>
          </div>
        );
      })}
    </Card>
  );
};

export const LocatieScene: React.FC<SceneProps> = ({ scene, outAt }) => {
  const F = useF();
  const tA = F(wordTime(scene, "a27"));
  const t100 = F(wordTime(scene, "100000"));
  const end = F(outAt) - 6;
  const gevel = has(scene, "gevel");
  return (
    <Top top={250} gap={24}>
      {has(scene, "rustig") ? (
        <Chip at={F(wordTime(scene, "rustig")) - 2} outAt={end}>
          Rustig, kleinschalig bedrijventerrein
        </Chip>
      ) : null}
      <div style={{ display: "flex", alignItems: "center", gap: 30, padding: "8px 6px" }}>
        <A27 at={tA - 2} />
        <Chip at={tA + 6} outAt={end} dark>
          {has(scene, "klus") ? "Zo op weg naar je klus" : "Direct langs de snelweg"}
        </Chip>
      </div>
      <Card at={t100 - 8} outAt={end} bg={colors.ink} from="left" style={{ padding: "28px 44px 30px", display: "flex", alignItems: "center", gap: 28 }}>
        <Eye size={96} color={colors.white} />
        <div>
          <div style={{ ...head, fontSize: 104, fontWeight: 900, color: colors.white, fontVariantNumeric: "tabular-nums" }}>
            <Counter at={t100} to={100000} />+
          </div>
          <div style={{ ...sub, color: colors.light }}>{gevel ? "voertuigen zien dagelijks je gevel" : "voertuigen per dag zien je pand"}</div>
        </div>
      </Card>
      {has(scene, "hilversum") ? <ReisCard scene={scene} outAt={end} /> : null}
    </Top>
  );
};

const Counter: React.FC<{ at: number; to: number }> = ({ at, to }) => {
  const frame = useCurrentFrame();
  const v = interpolate(frame, [at, at + 24], [0, to], { ...clamp, easing: Easing.out(Easing.cubic) });
  return <span>{fmt(to >= 10000 ? Math.round(v / 100) * 100 : Math.round(v))}</span>;
};

// ---------- Reistijd (doelgroep 2) ----------
export const ReistijdScene: React.FC<SceneProps> = ({ scene, outAt }) => (
  <Top top={300}>
    <ReisCard scene={scene} outAt={useF()(outAt) - 6} />
  </Top>
);

// ---------- Onderhoud (doelgroep 3) ----------
export const OnderhoudScene: React.FC<SceneProps> = ({ scene, outAt }) => {
  const F = useF();
  const frame = useCurrentFrame();
  const t0 = F(scene.start);
  const tZorgen = F(wordTime(scene, "weinig", 0));
  const tVloer = F(wordTime(scene, "vloeren"));
  const tDak = F(wordTime(scene, "dak"));
  const tWand = F(wordTime(scene, "tussenwanden"));
  const tBeton = F(wordTime(scene, "beton"));
  const tLaag = F(wordTime(scene, "weinig", 1));
  const tKosten = F(wordTime(scene, "kosten"));
  const end = F(outAt) - 6;
  const vraag = usePop(t0 + 4, { damping: 7, stiffness: 200, mass: 0.8 });
  const firstOut = tVloer - 10;
  const part = (at: number) => interpolate(frame, [at - 2, at + 10], [0, 1], { ...clamp, easing: Easing.out(Easing.back(1.5)) });
  const v = part(tVloer);
  const d = part(tDak);
  const w = part(tWand);
  const beton = usePop(tBeton, { damping: 9, stiffness: 200, mass: 0.7 });
  return (
    <>
      <Top top={280} gap={22}>
        <Card at={t0 - 4} outAt={firstOut} hoek style={{ padding: "36px 50px 40px 60px", display: "flex", alignItems: "center", gap: 26 }}>
          <div style={{ ...caps, fontSize: 70 }}>Onderhoud</div>
          <div style={{ ...head, fontSize: 120, fontWeight: 900, color: colors.red, transform: `scale(${vraag}) rotate(${(1 - vraag) * 30}deg)` }}>?</div>
        </Card>
        <Card at={tZorgen - 4} outAt={firstOut} bg={colors.ink} from="right" style={{ padding: "24px 44px 28px", display: "flex", alignItems: "center", gap: 24 }}>
          <Shield size={84} color={colors.white} />
          <div style={{ ...caps, fontSize: 52, color: colors.white }}>Weinig zorgen</div>
        </Card>
      </Top>
      <Top top={260} gap={22}>
        <Card at={tVloer - 6} outAt={end} hoek style={{ padding: "36px 46px 40px 56px", width: 940 }}>
          <Kicker>Vloeren, dak en tussenwanden van</Kicker>
          <div style={{ position: "relative", height: 330, marginTop: 20 }}>
            {/* Dak */}
            <div style={{ position: "absolute", left: 40, right: 260, top: 0, height: 30, background: colors.mid, transform: `translateY(${(1 - d) * -80}px)`, opacity: Math.min(1, d * 2) }} />
            {/* Verdiepingsvloeren */}
            {[130, 270].map((y, i) => (
              <div key={i} style={{ position: "absolute", left: 40, right: 260, top: y, height: 30, background: colors.mid, transform: `scaleX(${v})`, transformOrigin: "left" }} />
            ))}
            {/* Tussenwanden */}
            {[40, 290, 554].map((x, i) => (
              <div key={i} style={{ position: "absolute", left: x, top: 30, width: 24, height: 270, background: colors.grey, transform: `scaleY(${w})`, transformOrigin: "bottom" }} />
            ))}
            <div
              style={{
                position: "absolute",
                right: 0,
                top: 110,
                ...caps,
                fontSize: 74,
                fontWeight: 900,
                color: colors.white,
                background: colors.red,
                padding: "8px 26px",
                borderRadius: 8,
                transform: `scale(${beton}) rotate(${(1 - beton) * -12}deg)`,
              }}
            >
              Beton
            </div>
          </div>
        </Card>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 14 }}>
          <Chip at={tLaag - 2} outAt={end} dark>
            <Concrete color={colors.white} /> Jarenlang weinig onderhoud
          </Chip>
          <Chip at={tKosten - 4} outAt={end}>
            <ChartUp color={colors.red} /> Lage kosten
          </Chip>
        </div>
      </Top>
    </>
  );
};

// ---------- Planning ----------
export const PlanningScene: React.FC<SceneProps> = ({ scene, outAt }) => {
  const F = useF();
  const frame = useCurrentFrame();
  const tStart = F(wordTime(scene, "bouw"));
  const tJuni = F(wordTime(scene, "juni"));
  const tOpl = F(wordTime(scene, "oplevering"));
  const tQ = F(wordTime(scene, "q1"));
  const end = F(outAt) - 6;
  const H = 380;
  const line = interpolate(frame, [tJuni + 6, tOpl + 4], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const dot1 = usePop(tStart, { damping: 9, stiffness: 220, mass: 0.6 });
  const dot2 = usePop(tOpl, { damping: 9, stiffness: 220, mass: 0.6 });
  const v1 = usePop(tJuni);
  const v2 = usePop(tQ - 4);
  const check = interpolate(frame, [tJuni + 8, tJuni + 18], [0, 1], clamp);
  return (
    <Top top={260}>
      <Card at={tStart - 6} outAt={end} hoek style={{ padding: "40px 50px 46px 60px", width: 940 }}>
        <Kicker>Planning</Kicker>
        <div style={{ position: "relative", height: H, marginTop: 30 }}>
          <div style={{ position: "absolute", left: 40, top: 40, bottom: 90, width: 10, background: colors.light }} />
          <div style={{ position: "absolute", left: 40, top: 40, height: `${line * (H - 130)}px`, width: 10, background: colors.red }} />
          {(
            [
              [0, dot1, v1, <Crane key="c" size={64} color={colors.white} />, "Bouw gestart", "Juni 2026", true],
              [H - 130, dot2, v2, <Key key="k" size={64} color={colors.white} />, "Oplevering gepland", "Q1 2027", false],
            ] as [number, number, number, React.ReactNode, string, string, boolean][]
          ).map(([y, d, v, icon, label, val, done], i) => (
            <div key={i} style={{ position: "absolute", left: 0, top: y, display: "flex", alignItems: "center", gap: 34 }}>
              <div
                style={{
                  width: 90,
                  height: 90,
                  borderRadius: 45,
                  background: i === 0 ? colors.red : colors.ink,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transform: `scale(${d})`,
                }}
              >
                {icon}
              </div>
              <div style={{ opacity: v, transform: `translateX(${(1 - v) * 40}px)` }}>
                <div style={{ ...sub, color: colors.mid }}>{label}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                  <div style={{ ...caps, fontSize: 74, fontWeight: 900 }}>{val}</div>
                  {done ? (
                    <svg width={64} height={64} viewBox="0 0 64 64">
                      <circle cx={32} cy={32} r={30} fill={colors.red} opacity={check} />
                      <path d="M18 33l9 9 19-20" stroke={colors.white} strokeWidth={7} fill="none" strokeLinecap="round" strokeLinejoin="round" strokeDasharray={50} strokeDashoffset={50 * (1 - check)} />
                    </svg>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 6, opacity: v1 }}>
          <Calendar size={36} color={colors.mid} />
          <div style={{ fontFamily: fonts.sans, fontWeight: 700, fontSize: 30, color: colors.mid }}>De bouw is al begonnen</div>
        </div>
      </Card>
    </Top>
  );
};

// ---------- Beperkte beschikbaarheid ----------
export const AnimoScene: React.FC<SceneProps> = ({ scene, outAt }) => {
  const F = useF();
  const frame = useCurrentFrame();
  const t0 = F(scene.start);
  const tWacht = F(wordTime(scene, "wacht"));
  const end = F(outAt) - 4;
  const blink = (Math.sin((frame - t0) / 4) + 1) / 2;
  return (
    <Top top={270} gap={24}>
      <Card at={t0 - 4} outAt={end} bg={colors.red} from="left" style={{ padding: "28px 44px 32px", display: "flex", alignItems: "center", gap: 26 }}>
        <div style={{ width: 34, height: 34, borderRadius: 17, background: colors.white, opacity: 0.4 + 0.6 * blink }} />
        <div style={{ ...caps, fontSize: 62, color: colors.white }}>
          Beperkte
          <br />
          beschikbaarheid
        </div>
      </Card>
      <Card at={tWacht - 2} outAt={end} hoek from="right" style={{ padding: "28px 44px 30px 56px" }}>
        <div style={{ ...caps, fontSize: 58 }}>Wacht niet te lang</div>
        <div style={{ ...sub, marginTop: 6 }}>met aanmelden</div>
      </Card>
    </Top>
  );
};

// ---------- Call to action ----------
export const CtaScene: React.FC<SceneProps & { clip: string }> = ({ scene, clip }) => {
  const F = useF();
  const frame = useCurrentFrame();
  const t0 = F(scene.start) - 6;
  const tKlik = F(wordTime(scene, "klik"));
  const tInfo = F(wordTime(scene, "informatie"));
  const panel = interpolate(frame, [t0, t0 + 14], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const frameP = usePop(t0 + 6);
  const btn = usePop(tKlik, { damping: 9, stiffness: 180, mass: 0.8 });
  const pulse = frame > tKlik + 10 ? 1 + Math.sin((frame - tKlik) / 5) * 0.035 : 1;
  const arrow = usePop(tInfo);
  const headP = usePop(t0 + 10);
  return (
    <AbsoluteFill style={{ clipPath: `inset(${(1 - panel) * 100}% 0 0 0)`, background: colors.light }}>
      {/* Beeld in een kader met de rode dakhoek */}
      <div
        style={{
          position: "absolute",
          top: 120,
          left: 70,
          right: 70,
          height: 700,
          overflow: "hidden",
          borderRadius: 8,
          transform: `scale(${0.9 + 0.1 * frameP})`,
          opacity: frameP,
        }}
      >
        <Sequence from={t0}>
          <OffthreadVideo src={staticFile(`clips/${clip}.mp4`)} muted playbackRate={0.6} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </Sequence>
        <Hoek at={t0 + 8} thick={22} />
      </div>
      <div style={{ position: "absolute", top: 880, left: 70, right: 70, display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 30 }}>
        <div style={{ opacity: frameP }}>
          <Logo width={190} />
        </div>
        <div style={{ ...caps, fontSize: 66, opacity: headP, transform: `translateY(${(1 - headP) * 40}px)` }}>Schrijf je in voor jouw eigen bedrijfspand</div>
        <div style={{ display: "flex", alignItems: "center", gap: 30 }}>
          <div
            style={{
              background: colors.red,
              color: colors.white,
              fontFamily: fonts.sans,
              fontWeight: 800,
              fontSize: 52,
              padding: "26px 54px",
              ...rounded(8),
              transform: `scale(${btn * pulse})`,
              transformOrigin: "left center",
            }}
          >
            Klik hieronder →
          </div>
          <svg width={70} height={100} viewBox="0 0 70 100" style={{ opacity: arrow, transform: `translateY(${Math.abs(Math.sin(frame / 7)) * 22}px)` }}>
            <path d="M35 6v80M10 62l25 26 25-26" stroke={colors.ink} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </svg>
        </div>
        <div style={{ fontFamily: fonts.sans, fontWeight: 700, fontSize: 38, color: colors.grey, opacity: arrow }}>Alle informatie op maartensbusiness.nl</div>
      </div>
    </AbsoluteFill>
  );
};
