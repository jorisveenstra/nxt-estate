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
import { Briefcase, Calendar, Concrete, Crane, GarageDoor, Key, Sun } from "./icons";
import { Card, Chip, CountUp, Kicker, norm, rounded, Scene, usePop, useOut, wordTime } from "./ui";

export type SceneProps = { scene: Scene; outAt: number };

const useF = () => {
  const { fps } = useVideoConfig();
  return (sec: number) => Math.round(sec * fps);
};

const has = (scene: Scene, text: string) => scene.words.some((w) => norm(w.t).startsWith(norm(text)));

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
          <Kicker>Dok Zoetermeer 3</Kicker>
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

// ---------- Koop: logo + prijs ----------
const fmt = (n: number) => Math.round(n).toLocaleString("nl-NL");

export const KoopScene: React.FC<SceneProps> = ({ scene, outAt }) => {
  const F = useF();
  const frame = useCurrentFrame();
  const tVanaf = F(wordTime(scene, "vanaf"));
  const tPrijs = F(wordTime(scene, "222"));
  const end = F(outAt) - 6;
  const prijs = interpolate(frame, [tPrijs, tPrijs + 22], [150000, 222500], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const kop = has(scene, "ruil") ? "Ruil je huurpand in voor" : has(scene, "beleg") ? "Beleg in je" : "Koop je";
  return (
    <>
      {/* Logo-onthulling met het beeldmerk */}
      <AbsoluteFill style={{ justifyContent: "flex-start", alignItems: "center", paddingTop: 290 }}>
        <Card at={F(scene.start)} outAt={tVanaf - 8} bg={colors.white} cut={48} style={{ padding: "50px 64px", display: "flex", alignItems: "flex-end", gap: 40 }}>
          <Beeldmerk at={F(scene.start) + 4} size={56} />
          <div>
            <DokLogo width={330} />
            <div style={{ fontFamily: fonts.sans, fontWeight: 700, fontSize: 44, color: colors.khakiDark, marginTop: 12 }}>Zoetermeer 3</div>
          </div>
        </Card>
      </AbsoluteFill>
      <Top top={270} gap={22}>
        <Card at={tVanaf - 2} outAt={end} from="left" style={{ padding: "30px 46px 34px" }}>
          <Kicker>{kop} eigen bedrijfspand</Kicker>
          <div style={{ ...head, fontSize: 52, marginTop: 10 }}>vanaf</div>
          <div style={{ ...head, fontSize: 132, color: colors.khaki, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>€ {fmt(prijs)}</div>
          <div
            style={{
              display: "inline-block",
              marginTop: 10,
              padding: "6px 18px",
              background: colors.green,
              fontFamily: fonts.sans,
              fontWeight: 800,
              fontSize: 36,
              color: colors.ink,
              ...rounded(12),
              opacity: interpolate(frame, [tPrijs + 16, tPrijs + 22], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
            }}
          >
            ex. btw
          </div>
        </Card>
      </Top>
    </>
  );
};

// ---------- Eigen pand ----------
export const EigenScene: React.FC<SceneProps> = ({ scene, outAt }) => {
  const F = useF();
  const frame = useCurrentFrame();
  const tGeen = F(scene.start);
  const tMaar = F(wordTime(scene, "maar"));
  const tJou = F(wordTime(scene, "jou"));
  const end = F(outAt) - 6;
  const papier = has(scene, "papieren");
  const strike = interpolate(frame, [tMaar - 8, tMaar + 4], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) });
  const key = usePop(tJou - 2, { damping: 8, stiffness: 200, mass: 0.8 });
  const turn = interpolate(frame, [tJou + 4, tJou + 16], [0, -90], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) });
  return (
    <Top top={280} gap={28}>
      <Card at={tGeen - 4} outAt={end} from="left" style={{ padding: "28px 46px 32px" }}>
        <div style={{ position: "relative", ...head, fontSize: 78, color: colors.khakiDark }}>
          {papier ? (
            <>
              Geen papieren
              <br />
              belegging
            </>
          ) : (
            <>
              Geen huurbaas
              <br />
              meer
            </>
          )}
          <div
            style={{
              position: "absolute",
              left: -14,
              top: "46%",
              height: 14,
              width: `${strike * 108}%`,
              background: colors.orange,
              transform: "rotate(-11deg)",
              transformOrigin: "left center",
            }}
          />
        </div>
      </Card>
      <Card at={tMaar} outAt={end} bg={colors.green} from="right" style={{ padding: "30px 46px 34px", display: "flex", alignItems: "center", gap: 30 }}>
        <div style={{ transform: `scale(${key}) rotate(${turn}deg)` }}>
          <Key size={110} color={colors.ink} />
        </div>
        <div style={{ ...head, fontSize: 70 }}>
          {papier ? "Echt" : "Helemaal"}
          <br />
          van jou
        </div>
      </Card>
    </Top>
  );
};

// ---------- Units ----------
export const UnitsScene: React.FC<SceneProps> = ({ scene, outAt }) => {
  const F = useF();
  const t40 = F(wordTime(scene, "40"));
  const t94 = F(wordTime(scene, "94"));
  const t265 = F(wordTime(scene, "265"));
  const tLagen = F(wordTime(scene, "bouwlagen"));
  const end = F(outAt) - 6;
  const chips: [string, React.ReactNode, string][] = (
    [
      ["werkruimte", <Briefcase key="w" color={colors.khaki} />, "Werkruimte"],
      ["kantoor", <Briefcase key="k" color={colors.khaki} />, "Kantoor"],
      ["dakterras", <Sun key="d" color={colors.khaki} />, "Eigen dakterras"],
      ["zelf", <Key key="z" color={colors.khaki} />, "Zelf gebruiken"],
      ["verhuren", <Briefcase key="v" color={colors.khaki} />, "Verhuren"],
      ["combinatie", <Concrete key="c" color={colors.khaki} />, "Of een combinatie"],
    ] as [string, React.ReactNode, string][]
  ).filter(([w]) => has(scene, w));
  return (
    <Top top={250} gap={20}>
      <Card at={t40 - 4} outAt={end} from="left" style={{ padding: "24px 44px 28px", display: "flex", alignItems: "center", gap: 28 }}>
        <div style={{ ...head, fontSize: 160, color: colors.khaki, lineHeight: 1 }}>
          <CountUp at={t40} to={40} dur={16} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ ...head, fontSize: 54 }}>bedrijfsunits</div>
          <M2Label at={t94} at2={t265} />
        </div>
      </Card>
      <Card at={tLagen - 4} outAt={end} bg={colors.khaki} from="right" style={{ padding: "22px 40px 26px", display: "flex", alignItems: "flex-end", gap: 28 }}>
        {/* 3 bouwlagen die op elkaar stapelen */}
        <div style={{ display: "flex", flexDirection: "column-reverse", gap: 6 }}>
          {[0, 1, 2].map((i) => (
            <Layer key={i} at={tLagen + i * 4} light={i === 2} />
          ))}
        </div>
        <div style={{ ...head, fontSize: 60, color: colors.white }}>
          2 of 3
          <br />
          bouwlagen
        </div>
      </Card>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 14, maxWidth: 940 }}>
        {chips.map(([w, icon, label]) => (
          <Chip key={w} at={F(wordTime(scene, w)) - 2} outAt={end}>
            {icon}
            {label}
          </Chip>
        ))}
      </div>
    </Top>
  );
};

const M2Label: React.FC<{ at: number; at2: number }> = ({ at, at2 }) => {
  const p = usePop(at);
  return (
    <div
      style={{
        fontFamily: fonts.sans,
        fontWeight: 800,
        fontSize: 42,
        background: colors.green,
        padding: "6px 18px",
        ...rounded(12),
        opacity: p,
        transform: `translateX(${(1 - p) * -40}px)`,
        alignSelf: "flex-start",
        whiteSpace: "nowrap",
      }}
    >
      <CountUp at={at} from={40} to={94} dur={12} /> – <CountUp at={at2} from={94} to={265} dur={14} /> m²
    </div>
  );
};

const Layer: React.FC<{ at: number; light: boolean }> = ({ at, light }) => {
  const p = usePop(at, { damping: 9, stiffness: 220, mass: 0.6 });
  return (
    <div
      style={{
        width: 150,
        height: 38,
        background: light ? colors.blue : colors.cream,
        opacity: light ? 0.85 * p : p,
        border: light ? `3px dashed ${colors.paper}` : undefined,
        transform: `translateY(${(1 - p) * -90}px)`,
      }}
    />
  );
};

// ---------- Kenmerken ----------
export const KenmerkenScene: React.FC<SceneProps> = ({ scene, outAt }) => {
  const F = useF();
  const frame = useCurrentFrame();
  const tLicht = F(wordTime(scene, "daglicht"));
  const tDeur = F(wordTime(scene, "overheaddeur"));
  const tP = F(wordTime(scene, "parkeerplaatsen"));
  const end = F(outAt) - 6;
  const open = interpolate(frame, [tDeur + 6, tDeur + 30], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) });
  const p = usePop(tP, { damping: 8, stiffness: 200, mass: 0.9 });
  const o = useOut(end, 8);
  const swing = Math.sin((frame - tP) / 5) * 6 * Math.exp(-Math.max(0, frame - tP) / 18);
  return (
    <Top top={250} gap={20}>
      {has(scene, "betonbouw") ? (
        <Chip at={F(wordTime(scene, "solide")) - 2} outAt={end} dark>
          <Concrete color={colors.white} /> Solide betonbouw
        </Chip>
      ) : null}
      <Chip at={tLicht - 2} outAt={end}>
        <Sun color={colors.orange} /> Veel daglicht
      </Chip>
      <Card at={tDeur - 3} outAt={end} from="left" style={{ padding: "24px 40px 28px", display: "flex", alignItems: "center", gap: 26 }}>
        <GarageDoor size={110} color={colors.ink} open={open} />
        <div>
          <Kicker>Elektrische</Kicker>
          <div style={{ ...head, fontSize: 62 }}>overheaddeur</div>
        </div>
      </Card>
      <div style={{ display: "flex", alignItems: "center", gap: 26 }}>
        <div
          style={{
            width: 200,
            height: 200,
            background: colors.khaki,
            ...rounded(30),
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            ...head,
            fontSize: 160,
            color: colors.white,
            transform: `scale(${p * (1 - o)}) rotate(${swing}deg)`,
          }}
        >
          P
        </div>
        <Card at={tP + 4} outAt={end} from="right" style={{ padding: "22px 34px 26px" }}>
          <div style={{ ...head, fontSize: 52 }}>Eigen parkeerplaatsen</div>
          <div style={{ fontFamily: fonts.sans, fontWeight: 700, fontSize: 36, color: colors.khaki, marginTop: 6 }}>direct voor de deur</div>
        </Card>
      </div>
    </Top>
  );
};

// ---------- Locatie ----------
const RoadSign: React.FC<{ at: number; text: string; bg: string; fg: string }> = ({ at, text, bg, fg }) => {
  const p = usePop(at, { damping: 8, stiffness: 220, mass: 0.7 });
  return (
    <div
      style={{
        background: bg,
        color: fg,
        border: `6px solid ${fg}`,
        outline: `5px solid ${bg}`,
        borderRadius: 18,
        fontFamily: fonts.sans,
        fontWeight: 800,
        fontSize: 96,
        padding: "6px 34px",
        transform: `scale(${p}) rotate(${(1 - p) * 12}deg)`,
        boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
      }}
    >
      {text}
    </div>
  );
};

export const LocatieScene: React.FC<SceneProps> = ({ scene, outAt }) => {
  const F = useF();
  const tStart = F(wordTime(scene, "startklaar"));
  const tN = F(wordTime(scene, "n470"));
  const tA = F(wordTime(scene, "a12"));
  const end = F(outAt) - 6;
  const extra: [string, string, boolean][] = (
    [
      ["vestiging", "Ideaal als eigen vestiging", false],
      ["bepalen", "Zelf bepalen wat er met je pand gebeurt", false],
      ["den", "Den Haag", true],
      ["rotterdam", "Rotterdam", true],
      ["utrecht", "Utrecht", true],
    ] as [string, string, boolean][]
  ).filter(([w]) => has(scene, w));
  return (
    <Top top={250} gap={22}>
      <Card at={tStart - 4} outAt={end} bg={colors.green} from="left" style={{ padding: "24px 44px 28px" }}>
        <div style={{ ...head, fontSize: 76 }}>Startklaar</div>
        {has(scene, "zichtlocatie") ? (
          <div style={{ fontFamily: fonts.sans, fontWeight: 700, fontSize: 40, marginTop: 4 }}>op een zichtlocatie</div>
        ) : null}
      </Card>
      <div style={{ display: "flex", gap: 36, alignItems: "center", padding: "10px 6px" }}>
        {/* Wegnummers zoals op de Nederlandse borden */}
        <RoadSign at={tN - 2} text="N470" bg="#f7d117" fg={colors.ink} />
        <RoadSign at={tA - 2} text="A12" bg="#d42020" fg={colors.white} />
      </div>
      {extra.some(([, , city]) => city) ? (
        <Chip at={F(wordTime(scene, "bereikbaar")) - 2} outAt={end} dark>
          Goed bereikbaar vanuit
        </Chip>
      ) : null}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 14, maxWidth: 940 }}>
        {extra.map(([w, label]) => (
          <Chip key={w} at={F(wordTime(scene, w)) - 2} outAt={end}>
            {label}
          </Chip>
        ))}
      </div>
    </Top>
  );
};

// ---------- Planning ----------
export const PlanningScene: React.FC<SceneProps> = ({ scene, outAt }) => {
  const F = useF();
  const frame = useCurrentFrame();
  const tStart = F(wordTime(scene, "start"));
  const tMedio = F(wordTime(scene, "medio"));
  const tOpl = F(wordTime(scene, "oplevering"));
  const tKw = F(wordTime(scene, "2028"));
  const end = F(outAt) - 6;
  const line = interpolate(frame, [tMedio + 6, tOpl + 4], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) });
  const dot1 = usePop(tStart, { damping: 9, stiffness: 220, mass: 0.6 });
  const dot2 = usePop(tOpl, { damping: 9, stiffness: 220, mass: 0.6 });
  const v1 = usePop(tMedio);
  const v2 = usePop(tKw - 6);
  return (
    <Top top={260}>
      <Card at={tStart - 6} outAt={end} cut={48} style={{ padding: "40px 50px 46px", width: 940 }}>
        <Kicker>Planning</Kicker>
        <div style={{ position: "relative", height: 380, marginTop: 30 }}>
          {/* tijdlijn */}
          <div style={{ position: "absolute", left: 40, top: 40, bottom: 90, width: 10, background: colors.cream }} />
          <div style={{ position: "absolute", left: 40, top: 40, height: `${line * (380 - 130)}px`, width: 10, background: colors.green }} />
          {[
            [0, dot1, v1, <Crane key="c" size={70} color={colors.ink} />, "Start bouw", "Medio 2027"],
            [380 - 130, dot2, v2, <Key key="k" size={70} color={colors.ink} />, "Oplevering", "Q1 2028"],
          ].map(([y, d, v, icon, label, val], i) => (
            <div key={i} style={{ position: "absolute", left: 0, top: (y as number) + 0, display: "flex", alignItems: "center", gap: 34 }}>
              <div
                style={{
                  width: 90,
                  height: 90,
                  borderRadius: 45,
                  background: i === 0 ? colors.orange : colors.green,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transform: `scale(${d as number})`,
                }}
              >
                {icon as React.ReactNode}
              </div>
              <div style={{ opacity: v as number, transform: `translateX(${(1 - (v as number)) * 40}px)` }}>
                <div style={{ fontFamily: fonts.sans, fontWeight: 700, fontSize: 38, color: colors.khaki }}>{label as string}</div>
                <div style={{ ...head, fontSize: 76 }}>{val as string}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 6, opacity: v1 }}>
          <Calendar size={36} color={colors.khaki} />
          <div style={{ fontFamily: fonts.sans, fontWeight: 600, fontSize: 30, color: colors.khaki }}>naar verwachting</div>
        </div>
      </Card>
    </Top>
  );
};

// ---------- Animo ----------
export const AnimoScene: React.FC<SceneProps> = ({ scene, outAt }) => {
  const F = useF();
  const tAnimo = F(wordTime(scene, "animo"));
  const tWacht = F(wordTime(scene, "wacht"));
  const end = F(outAt) - 4;
  const midden: [string, string] | null = has(scene, "opties") ? ["opties", "Er lopen al meerdere opties"] : has(scene, "snel") ? ["snel", "De units gaan snel"] : null;
  return (
    <Top top={260} gap={24}>
      <Card at={tAnimo - 4} outAt={end} bg={colors.orange} from="left" style={{ padding: "26px 44px 30px" }}>
        <div style={{ ...head, fontSize: 76, color: colors.white }}>De animo is groot</div>
      </Card>
      {midden ? (
        <Card at={F(wordTime(scene, midden[0])) - 6} outAt={end} from="right" style={{ padding: "22px 40px 26px" }}>
          <div style={{ ...head, fontSize: 56 }}>{midden[1]}</div>
        </Card>
      ) : null}
      <Card at={tWacht - 2} outAt={end} bg={colors.green} from="left" style={{ padding: "22px 40px 26px" }}>
        <div style={{ ...head, fontSize: 56 }}>Wacht niet te lang</div>
        <div style={{ fontFamily: fonts.sans, fontWeight: 700, fontSize: 36, marginTop: 6 }}>met aanmelden</div>
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
  const panel = interpolate(frame, [t0, t0 + 14], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const frameP = usePop(t0 + 6);
  const btn = usePop(tKlik, { damping: 9, stiffness: 180, mass: 0.8 });
  const pulse = frame > tKlik + 10 ? 1 + Math.sin((frame - tKlik) / 5) * 0.035 : 1;
  const arrow = usePop(tInfo);
  const headP = usePop(t0 + 10);
  const inschrijven = has(scene, "schrijf");
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
          <div style={{ fontFamily: fonts.sans, fontWeight: 700, fontSize: 40, color: colors.ink, marginBottom: 4 }}>Zoetermeer 3</div>
        </div>
        <div style={{ ...head, fontSize: 70, opacity: headP, transform: `translateY(${(1 - headP) * 40}px)` }}>
          {inschrijven ? "Schrijf je in voor jouw eigen Dok-bedrijfspand" : "Plan een afspraak met onze makelaar"}
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
        <div style={{ fontFamily: fonts.sans, fontWeight: 600, fontSize: 38, color: colors.khaki, opacity: arrow }}>Alle informatie op doknederland.nl</div>
      </div>
    </AbsoluteFill>
  );
};
