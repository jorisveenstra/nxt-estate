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
import {
  Anchor,
  Bed,
  Box,
  Briefcase,
  Flame,
  FloorHeat,
  HeatPump,
  House,
  Leaf,
  Lighthouse,
  Lock,
  NoFlame,
  Sun,
  Tree,
  Waves,
  Window,
} from "./icons";
import { Card, chamfer, Chip, CountUp, Kicker, norm, Scene, usePop, useOut, wordTime } from "./ui";

export type SceneProps = { scene: Scene; outAt: number };

const useF = () => {
  const { fps } = useVideoConfig();
  return (sec: number) => Math.round(sec * fps);
};

const has = (scene: Scene, text: string) => scene.words.some((w) => norm(w.t).startsWith(norm(text)));

const Top: React.FC<{ children: React.ReactNode; gap?: number; top?: number }> = ({ children, gap = 26, top = 250 }) => (
  <AbsoluteFill style={{ padding: `${top}px 70px 0`, display: "flex", flexDirection: "column", gap, alignItems: "flex-start" }}>
    {children}
  </AbsoluteFill>
);

const serifBig: React.CSSProperties = { fontFamily: fonts.serif, fontWeight: 600, color: colors.ink, lineHeight: 1.05 };

// ---------- Hook ----------
export const HookScene: React.FC<SceneProps & { accent: string[] }> = ({ scene, outAt, accent }) => {
  const F = useF();
  const frame = useCurrentFrame();
  const acc = accent.map(norm);
  // Lange samenstellingen als "nieuwbouwappartement" passen niet op één regel: "nieuwbouw" en de rest op aparte regels
  type Deel = { t: string; w: (typeof scene.words)[number]; br?: boolean };
  const delen: Deel[] = scene.words.flatMap((w) => {
    const m = w.t.match(/^(nieuwbouw)(.{8,})$/i);
    return m ? [{ t: m[1], w, br: true }, { t: m[2], w, br: true }] : [{ t: w.t, w }];
  });
  const langste = Math.max(...delen.map((d) => d.t.length));
  const fontSize = Math.min(scene.words.length > 15 ? 70 : 82, Math.floor(830 / (langste * 0.58)));
  return (
    <Top top={280}>
      <Card at={0} outAt={F(outAt) - 6} cut={40} style={{ padding: "44px 54px 52px", maxWidth: 940 }}>
        <div style={{ marginBottom: 22 }}>
          <Kicker>Nieuwbouw in IJmuiden</Kicker>
        </div>
        <div style={{ ...serifBig, fontSize, display: "flex", flexWrap: "wrap", columnGap: "0.24em", rowGap: 6 }}>
          {delen.map(({ t: tekst, w, br }, i) => {
            const at = F(w.s) - 2;
            const p = interpolate(frame, [at, at + 6], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.back(2)) });
            const isAccent = acc.includes(norm(w.t));
            const under = interpolate(frame, [at + 3, at + 11], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
            return (
              <React.Fragment key={i}>
              {br && delen[i - 1]?.w !== w ? <span style={{ flexBasis: "100%", height: 0 }} /> : null}
              <span
                style={{
                  position: "relative",
                  display: "inline-block",
                  color: isAccent ? colors.red : colors.ink,
                  opacity: p,
                  transform: `translateY(${(1 - p) * 40}px) scale(${0.7 + 0.3 * p})`,
                }}
              >
                {tekst}
                {isAccent ? (
                  <span
                    style={{
                      position: "absolute",
                      left: 0,
                      right: 0,
                      bottom: 2,
                      height: 8,
                      background: colors.red,
                      transform: `scaleX(${under})`,
                      transformOrigin: "left",
                      opacity: 0.85,
                    }}
                  />
                ) : null}
              </span>
              {br && delen[i + 1]?.w === w ? <span style={{ flexBasis: "100%", height: 0 }} /> : null}
              </React.Fragment>
            );
          })}
        </div>
      </Card>
    </Top>
  );
};

// ---------- Aanbod ----------
const Stat: React.FC<{ at: number; outAt: number; big: React.ReactNode; label: string; sub: React.ReactNode; subAt: number; from: "left" | "right" }> = ({
  at,
  outAt,
  big,
  label,
  sub,
  subAt,
  from,
}) => {
  const subP = usePop(subAt);
  return (
    <Card at={at} outAt={outAt} from={from} style={{ padding: "30px 46px 34px", display: "flex", alignItems: "center", gap: 34, minWidth: 700 }}>
      <div style={{ ...serifBig, fontSize: 170, color: colors.olive, lineHeight: 1 }}>{big}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ fontFamily: fonts.sans, fontWeight: 600, fontSize: 52, color: colors.ink }}>{label}</div>
        <div
          style={{
            fontFamily: fonts.sans,
            fontWeight: 700,
            fontSize: 46,
            color: colors.white,
            background: colors.red,
            padding: "6px 18px",
            clipPath: chamfer(12),
            opacity: subP,
            transform: `translateX(${(1 - subP) * -40}px)`,
            alignSelf: "flex-start",
          }}
        >
          {sub}
        </div>
      </div>
    </Card>
  );
};

export const AanbodScene: React.FC<SceneProps> = ({ scene, outAt }) => {
  const F = useF();
  const tVier = F(wordTime(scene, "vier"));
  const t150 = F(wordTime(scene, "150"));
  const t8 = F(wordTime(scene, "8"));
  const t65 = F(wordTime(scene, "65"));
  const t96 = F(wordTime(scene, "96"));
  const end = F(outAt) - 6;
  return (
    <>
      {/* Logo-onthulling */}
      <AbsoluteFill style={{ justifyContent: "flex-start", alignItems: "center", paddingTop: 300 }}>
        <Card at={F(scene.start)} outAt={tVier - 8} bg={colors.olive} cut={44} style={{ padding: "50px 70px" }}>
          <Img src={staticFile("logo-licht.svg")} style={{ width: 560, display: "block", filter: "brightness(0) invert(1)" }} />
        </Card>
      </AbsoluteFill>
      <Top top={270} gap={30}>
        <Stat
          at={tVier}
          outAt={end}
          from="left"
          big={<CountUp at={tVier} to={4} dur={10} />}
          label="woningen"
          subAt={t150}
          sub={
            <>
              ruim <CountUp at={t150} from={100} to={150} dur={16} /> m²
            </>
          }
        />
        <Stat
          at={t8}
          outAt={end}
          from="right"
          big={<CountUp at={t8} to={8} dur={10} />}
          label="appartementen"
          subAt={t65}
          sub={
            <>
              <CountUp at={t65} from={40} to={65} dur={12} /> – <CountUp at={t96} from={65} to={96} dur={12} /> m²
            </>
          }
        />
      </Top>
    </>
  );
};

// ---------- Indeling (body 1) ----------
export const IndelingScene: React.FC<SceneProps> = ({ scene, outAt }) => {
  const F = useF();
  const t3 = F(wordTime(scene, "3"));
  const tMulti = F(wordTime(scene, "multifunctionele"));
  const end = F(outAt) - 6;
  const uses: [string, string][] = [
    ["werkruimte", "Werkruimte"],
    ["kantoor", "Kantoor"],
    ["praktijk", "Praktijk"],
    ["mantelzorgwoning", "Mantelzorgwoning"],
    ["extra", "Extra appartement"],
  ];
  return (
    <Top top={250} gap={24}>
      <Card at={t3 - 4} outAt={end} from="left" style={{ padding: "26px 46px 30px", display: "flex", alignItems: "center", gap: 30 }}>
        <div style={{ ...serifBig, fontSize: 170, color: colors.olive, lineHeight: 1 }}>
          <CountUp at={t3} to={3} dur={10} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <Bed size={64} color={colors.red} />
          <div style={{ fontFamily: fonts.sans, fontWeight: 600, fontSize: 56, color: colors.ink }}>slaapkamers</div>
        </div>
      </Card>
      <Card at={tMulti - 3} outAt={end} bg={colors.olive} from="right" style={{ padding: "26px 44px 30px" }}>
        <Kicker color={colors.sand}>Begane grond</Kicker>
        <div style={{ ...serifBig, color: colors.white, fontSize: 64, marginTop: 8 }}>Multifunctionele ruimte</div>
      </Card>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 16, maxWidth: 940 }}>
        {uses.map(([w, label]) => (
          <Chip key={w} at={F(wordTime(scene, w)) - 2} outAt={end}>
            {label}
          </Chip>
        ))}
      </div>
      {has(scene, "generatiehypotheek") ? (
        <Chip at={F(wordTime(scene, "vraag")) - 2} outAt={end} dark>
          Vraag naar een generatiehypotheek
        </Chip>
      ) : null}
    </Top>
  );
};

// ---------- Begane grond vrij in te delen (body 2 en 3) ----------
export const GrondScene: React.FC<SceneProps> = ({ scene, outAt }) => {
  const F = useF();
  const tBg = F(wordTime(scene, "begane"));
  const end = F(outAt) - 6;
  const praktijkAanHuis = scene.words.some((w, i) => norm(w.t) === "praktijk" && norm(scene.words[i + 1]?.t ?? "") === "aan");
  const uses: [string, React.ReactNode, string][] = (
    [
      ["werkruimte", <Briefcase key="w" color={colors.red} />, "Werkruimte"],
      ["kantoor", <Briefcase key="k" color={colors.red} />, "Kantoor"],
      ["praktijk", <House key="p" color={colors.red} />, praktijkAanHuis ? "Praktijk aan huis" : "Praktijk"],
      ["intern", <House key="i" color={colors.red} />, "Intern appartement"],
      ["mantelzorg", <House key="m" color={colors.red} />, "Voor ouders, kinderen of mantelzorg"],
    ] as [string, React.ReactNode, string][]
  ).filter(([w]) => has(scene, w));
  return (
    <Top top={250} gap={24}>
      <Card at={tBg - 4} outAt={end} bg={colors.olive} from="left" style={{ padding: "30px 46px 34px" }}>
        <Kicker color={colors.sand}>Begane grond</Kicker>
        <div style={{ ...serifBig, color: colors.white, fontSize: 84, marginTop: 8 }}>Vrij in te delen</div>
      </Card>
      <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 940 }}>
        {uses.map(([w, icon, label]) => (
          <Chip key={w} at={F(wordTime(scene, w)) - 2} outAt={end}>
            {icon}
            {label}
          </Chip>
        ))}
      </div>
    </Top>
  );
};

// ---------- Huislift (body 2) ----------
export const LiftScene: React.FC<SceneProps> = ({ scene, outAt }) => {
  const F = useF();
  const frame = useCurrentFrame();
  const tLift = F(wordTime(scene, "huislift"));
  const tVerd = F(wordTime(scene, "verdiepingen"));
  const tLater = F(wordTime(scene, "later"));
  const end = F(outAt) - 6;
  const shaft = usePop(tLift - 4);
  const o = useOut(end, 8);
  // Liftcabine rijdt van de begane grond naar boven, en stopt kort per verdieping
  const rise = interpolate(frame, [tVerd, tVerd + 14, tVerd + 22, tVerd + 36], [0, 1, 1, 2], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });
  const H = 560;
  const floorH = H / 3;
  return (
    <Top top={250} gap={24}>
      <div style={{ display: "flex", gap: 28, alignItems: "flex-start" }}>
        <div
          style={{
            width: 220,
            height: H,
            background: colors.olive,
            clipPath: chamfer(28),
            position: "relative",
            opacity: Math.min(1, shaft * 1.6) * (1 - o),
            transform: `translateY(${(1 - shaft) * 160}px) scale(${0.85 + 0.15 * shaft})`,
          }}
        >
          {["2", "1", "BG"].map((lbl, i) => (
            <div
              key={lbl}
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: i * floorH,
                height: floorH,
                borderBottom: i < 2 ? `3px dashed ${colors.sand}` : undefined,
                fontFamily: fonts.sans,
                fontWeight: 700,
                fontSize: 30,
                color: colors.sand,
                padding: "12px 16px",
              }}
            >
              {lbl}
            </div>
          ))}
          <div
            style={{
              position: "absolute",
              left: 80,
              width: 110,
              height: floorH - 30,
              bottom: 15 + rise * floorH,
              background: colors.cream,
              clipPath: chamfer(14),
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div style={{ width: 4, height: "70%", background: colors.sand }} />
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <Card at={tLift - 2} outAt={end} from="right" style={{ padding: "26px 40px 30px" }}>
            <Kicker>Mogelijkheid</Kicker>
            <div style={{ ...serifBig, fontSize: 92, marginTop: 6 }}>Huislift</div>
          </Card>
          <Chip at={tVerd - 2} outAt={end} style={{ fontSize: 40 }}>
            Alle verdiepingen
          </Chip>
          <Chip at={tLater - 2} outAt={end} dark style={{ fontSize: 40 }}>
            Ook later bereikbaar
          </Chip>
        </div>
      </div>
    </Top>
  );
};

// ---------- Drie woonlagen (body 3) ----------
export const LagenScene: React.FC<SceneProps> = ({ scene, outAt }) => {
  const F = useF();
  const tDrie = F(wordTime(scene, "drie"));
  const t150 = has(scene, "150") ? F(wordTime(scene, "150")) : null;
  const tVerd = F(wordTime(scene, "verdiepingen"));
  const tSerre = F(wordTime(scene, "serre"));
  const tTerras = F(wordTime(scene, "terras"));
  const end = F(outAt) - 6;
  const layers: [string, string, number][] = [
    ["2e verdieping", "Wonen", tVerd],
    ["1e verdieping", "Wonen", tVerd],
    ["Begane grond", "Vrij in te delen", tDrie + 14],
  ];
  return (
    <Top top={250} gap={20}>
      {t150 !== null ? (
        <Chip at={t150 - 2} outAt={end} dark style={{ fontSize: 46 }}>
          Ruim <CountUp at={t150} from={50} to={150} dur={14} /> m²
        </Chip>
      ) : null}
      <Card at={tDrie - 6} outAt={end} from="left" style={{ padding: "22px 44px 26px", display: "flex", alignItems: "center", gap: 24 }}>
        <div style={{ ...serifBig, fontSize: 130, color: colors.olive, lineHeight: 1 }}>
          <CountUp at={tDrie} to={3} dur={8} />
        </div>
        <div style={{ ...serifBig, fontSize: 70, whiteSpace: "nowrap" }}>woonlagen</div>
      </Card>
      {/* Doorsnede van de woning: lagen stapelen van onder naar boven */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {layers.map(([lvl, use, at], i) => (
          <Card
            key={lvl}
            at={tDrie + (2 - i) * 5}
            outAt={end}
            from="down"
            bg={i === 2 ? colors.olive : colors.cream}
            cut={18}
            style={{ width: 760, padding: "18px 30px", display: "flex", justifyContent: "space-between", alignItems: "center" }}
          >
            <div style={{ fontFamily: fonts.sans, fontWeight: 700, fontSize: 36, color: i === 2 ? colors.sand : colors.olive }}>{lvl}</div>
            <LayerLabel at={at} text={use} light={i === 2} />
          </Card>
        ))}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 14 }}>
        <Chip at={tSerre - 2} outAt={end} style={{ fontSize: 40 }}>
          <Sun color={colors.red} /> Serre voorzijde
        </Chip>
        <Chip at={tTerras - 2} outAt={end} style={{ fontSize: 40 }}>
          <Flame color={colors.red} /> Terras achterzijde
        </Chip>
      </div>
    </Top>
  );
};

const LayerLabel: React.FC<{ at: number; text: string; light: boolean }> = ({ at, text, light }) => {
  const p = usePop(at);
  return (
    <div style={{ ...serifBig, fontSize: 46, color: light ? colors.white : colors.red, opacity: p, transform: `translateX(${(1 - p) * 40}px)` }}>
      {text}
    </div>
  );
};

// ---------- Serre ----------
const Maatlijn: React.FC<{ at: number; width: number; label: string }> = ({ at, width: W, label }) => {
  const frame = useCurrentFrame();
  const draw = interpolate(frame, [at, at + 16], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) });
  return (
    <svg width={W} height={60} style={{ marginTop: 14, overflow: "visible" }}>
      <line x1={W / 2 - (W / 2) * draw} y1={30} x2={W / 2 + (W / 2) * draw} y2={30} stroke={colors.olive} strokeWidth={5} />
      <line x1={W / 2 - (W / 2) * draw} y1={12} x2={W / 2 - (W / 2) * draw} y2={48} stroke={colors.olive} strokeWidth={5} opacity={draw > 0 ? 1 : 0} />
      <line x1={W / 2 + (W / 2) * draw} y1={12} x2={W / 2 + (W / 2) * draw} y2={48} stroke={colors.olive} strokeWidth={5} opacity={draw > 0 ? 1 : 0} />
      <text x={W / 2} y={20} textAnchor="middle" fontFamily={fonts.sans} fontWeight={700} fontSize={30} fill={colors.red} opacity={draw}>
        {label}
      </text>
    </svg>
  );
};

export const SerreScene: React.FC<SceneProps> = ({ scene, outAt }) => {
  const F = useF();
  const tSerre = F(wordTime(scene, "serre"));
  const tBreed = F(wordTime(scene, "breedte"));
  const end = F(outAt) - 6;
  const items: [string, React.ReactNode, string][] = [
    ["licht", <Sun key="s" color={colors.red} />, "Volop licht"],
    ["uitzicht", <Anchor key="a" color={colors.red} />, has(scene, "uitmonding") ? "Uitzicht op haven & uitmonding" : has(scene, "havenuitmonding") ? "Uitzicht op haven & havenmond" : "Uitzicht over de haven"],
  ];
  return (
    <Top top={250} gap={22}>
      <Card at={tSerre - 4} outAt={end} from="left" style={{ padding: "30px 46px 34px" }}>
        <Kicker>De serre</Kicker>
        <div style={{ ...serifBig, fontSize: 72, marginTop: 6 }}>Over de gehele breedte</div>
        <Maatlijn at={tBreed} width={780} label="hele woningbreedte" />
      </Card>
      {items.map(([w, icon, label]) => (
        <Chip key={w} at={F(wordTime(scene, w)) - 2} outAt={end}>
          {icon}
          {label}
        </Chip>
      ))}
    </Top>
  );
};

// ---------- Achterdek ----------
export const AchterdekScene: React.FC<SceneProps> = ({ scene, outAt }) => {
  const F = useF();
  const tDek = F(wordTime(scene, "achterdek"));
  const t3 = F(wordTime(scene, "3"));
  const end = F(outAt) - 6;
  return (
    <Top top={250} gap={22}>
      <Card at={tDek - 4} outAt={end} from="left" style={{ padding: "30px 46px 34px" }}>
        <Kicker>Het achterdek</Kicker>
        <div style={{ ...serifBig, fontSize: 96, marginTop: 6 }}>
          <CountUp at={t3} to={3} dur={10} /> meter diep
        </div>
        <Maatlijn at={t3} width={760} label="3 m" />
      </Card>
      <Chip at={F(wordTime(scene, "ochtendzon")) - 2} outAt={end}>
        <Sun color={colors.red} /> Genieten van de ochtendzon
      </Chip>
      {has(scene, "barbecue") ? (
        <Chip at={F(wordTime(scene, "barbecue")) - 2} outAt={end} dark>
          <Flame color={colors.sand} /> Gezellige barbecue-avonden
        </Chip>
      ) : (
        <Chip at={F(wordTime(scene, "verkoeling")) - 2} outAt={end} dark>
          <Tree color={colors.sand} /> Verkoeling in de schaduw
        </Chip>
      )}
    </Top>
  );
};

// ---------- Buitenruimte appartementen (body 4) ----------
export const BuitenScene: React.FC<SceneProps> = ({ scene, outAt }) => {
  const F = useF();
  const tTuin = F(wordTime(scene, "tuin"));
  const tBalkon = F(wordTime(scene, "balkon"));
  const tGlas = F(wordTime(scene, "balkonbeglazing"));
  const end = F(outAt) - 6;
  return (
    <Top top={250} gap={22}>
      <Card at={tTuin - 6} outAt={end} from="left" style={{ padding: "28px 44px 32px" }}>
        <Kicker>Buitenruimte</Kicker>
        <div style={{ ...serifBig, fontSize: 84, marginTop: 6 }}>
          Tuin <span style={{ color: colors.red }}>of</span> balkon
        </div>
      </Card>
      <Chip at={tTuin - 2} outAt={end}>
        <Tree color={colors.red} /> Eigen tuin
      </Chip>
      <Chip at={tBalkon - 2} outAt={end}>
        <Sun color={colors.red} /> Zonnig inpandig balkon
      </Chip>
      <Chip at={tGlas - 2} outAt={end} dark>
        <Window color={colors.sand} /> Optie: balkonbeglazing
      </Chip>
    </Top>
  );
};

// ---------- Duurzaam (body 4) ----------
export const DuurzaamScene: React.FC<SceneProps> = ({ scene, outAt }) => {
  const F = useF();
  const frame = useCurrentFrame();
  const tZuinig = F(wordTime(scene, "energiezuinig"));
  const tGas = F(wordTime(scene, "gasloos"));
  const tVloer = F(wordTime(scene, "vloerverwarming"));
  const lucht = has(scene, "lucht");
  const tPomp = F(wordTime(scene, lucht ? "lucht" : "warmtepomp"));
  const end = F(outAt) - 6;
  // "Gasloos" valt groot in met een stempel-effect
  const stamp = interpolate(frame, [tGas - 3, tGas + 5], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.in(Easing.quad) });
  const shake = frame > tGas + 5 && frame < tGas + 13 ? Math.sin(frame * 2.5) * (tGas + 13 - frame) * 1.2 : 0;
  const o = useOut(end, 8);
  return (
    <Top top={250} gap={22}>
      <Chip at={tZuinig - 2} outAt={end}>
        <Leaf color={colors.red} /> Energiezuinig
      </Chip>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 24,
          padding: "24px 48px 30px",
          background: colors.olive,
          clipPath: chamfer(30),
          transform: `translateX(${shake}px) rotate(-3deg) scale(${interpolate(stamp, [0, 1], [2.4, 1])})`,
          opacity: stamp * (1 - o),
          transformOrigin: "left center",
        }}
      >
        <NoFlame size={110} color={colors.white} />
        <div style={{ ...serifBig, fontWeight: 700, fontSize: 120, color: colors.white }}>Gasloos</div>
      </div>
      <Chip at={tVloer - 2} outAt={end}>
        <FloorHeat color={colors.red} /> Vloerverwarming
      </Chip>
      <Chip at={tPomp - 2} outAt={end}>
        <HeatPump color={colors.red} /> {lucht ? "Lucht-waterwarmtepomp" : "Eigen warmtepomp"}
      </Chip>
    </Top>
  );
};

// ---------- Parkeren ----------
export const ParkerenScene: React.FC<SceneProps> = ({ scene, outAt }) => {
  const F = useF();
  const frame = useCurrentFrame();
  const tBerging = F(wordTime(scene, "berging"));
  const tP = F(wordTime(scene, "parkeerplaats"));
  const tAfg = F(wordTime(scene, "afgesloten"));
  const tGelijk = F(wordTime(scene, "gelijktijdig"));
  const end = F(outAt) - 6;
  const p = usePop(tP, { damping: 8, stiffness: 200, mass: 0.9 });
  const o = useOut(end, 8);
  const swing = Math.sin((frame - tP) / 5) * 6 * Math.exp(-Math.max(0, frame - tP) / 18);
  return (
    <Top top={250} gap={22}>
      <div style={{ display: "flex", alignItems: "center", gap: 30 }}>
        <div
          style={{
            width: 230,
            height: 230,
            background: colors.olive,
            clipPath: chamfer(30),
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            ...serifBig,
            fontWeight: 700,
            fontSize: 190,
            color: colors.white,
            transform: `scale(${p * (1 - o)}) rotate(${swing}deg)`,
          }}
        >
          P
        </div>
        <Card at={tP + 4} outAt={end} from="right" style={{ padding: "24px 36px 28px" }}>
          <div style={{ ...serifBig, fontSize: 64 }}>Eigen</div>
          <div style={{ ...serifBig, fontSize: 64, color: colors.red }}>parkeerplaats</div>
        </Card>
      </div>
      <Chip at={tBerging - 2} outAt={end}>
        <Box color={colors.red} /> Eigen berging
      </Chip>
      <Chip at={tAfg - 2} outAt={end}>
        <Lock color={colors.red} /> Afgesloten binnenterrein
      </Chip>
      <Chip at={tGelijk - 2} outAt={end} dark style={{ fontSize: 38 }}>
        Gelijktijdig aan te kopen
      </Chip>
    </Top>
  );
};

// ---------- Casco+ ----------
export const CascoScene: React.FC<SceneProps> = ({ scene, outAt }) => {
  const F = useF();
  const frame = useCurrentFrame();
  const tCasco = F(wordTime(scene, "casco"));
  const tSmaak = F(wordTime(scene, "smaak"));
  const end = F(outAt) - 6;
  // Stempel: valt groot in en "slaat" neer
  const stamp = interpolate(frame, [tCasco - 3, tCasco + 5], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.in(Easing.quad) });
  const shake = frame > tCasco + 5 && frame < tCasco + 13 ? Math.sin(frame * 2.5) * (tCasco + 13 - frame) * 1.2 : 0;
  const o = useOut(end, 8);
  const swatches = [colors.sand, colors.olive, colors.red, colors.ink, colors.cream, "#a8946f"];
  return (
    <Top top={260} gap={36}>
      <div
        style={{
          padding: "18px 44px 26px",
          border: `10px solid ${colors.red}`,
          color: colors.red,
          background: "rgba(242,238,232,0.92)",
          ...serifBig,
          fontWeight: 700,
          fontSize: 150,
          transform: `translateX(${shake}px) rotate(-6deg) scale(${interpolate(stamp, [0, 1], [2.6, 1])})`,
          opacity: stamp * (1 - o),
          transformOrigin: "left center",
        }}
      >
        Casco+
      </div>
      <Card at={tSmaak - 6} outAt={end} from="left" style={{ padding: "28px 42px 32px" }}>
        <div style={{ ...serifBig, fontSize: 60 }}>Afwerken naar</div>
        <div style={{ ...serifBig, fontSize: 60, color: colors.red }}>eigen smaak & visie</div>
        <div style={{ display: "flex", gap: 18, marginTop: 22 }}>
          {swatches.map((c, i) => {
            const d = usePop(tSmaak + 4 + i * 3, { damping: 9, stiffness: 240, mass: 0.6 });
            return (
              <div
                key={c}
                style={{
                  width: 84,
                  height: 84,
                  background: c,
                  clipPath: chamfer(14),
                  border: c === colors.cream ? `3px solid ${colors.sand}` : undefined,
                  transform: `translateY(${(1 - d) * -120}px) scale(${d})`,
                }}
              />
            );
          })}
        </div>
      </Card>
    </Top>
  );
};

// ---------- Gezin (body 1) ----------
export const GezinScene: React.FC<SceneProps> = ({ scene, outAt }) => {
  const F = useF();
  const frame = useCurrentFrame();
  const tGezin = F(wordTime(scene, "ruimte"));
  const tVis = F(wordTime(scene, "visserskarakter"));
  const end = F(outAt) - 4;
  const lh = usePop(tVis - 2);
  return (
    <Top top={250} gap={26}>
      <Card at={tGezin - 4} outAt={end} from="left" style={{ padding: "30px 46px 34px" }}>
        <div style={{ ...serifBig, fontSize: 76 }}>Ruimte voor</div>
        <div style={{ ...serifBig, fontSize: 76, color: colors.red }}>het hele gezin</div>
      </Card>
      <Card at={tVis - 2} outAt={end} bg={colors.olive} from="right" style={{ padding: "28px 44px 26px", display: "flex", alignItems: "center", gap: 30 }}>
        <div style={{ transform: `translateY(${(1 - lh) * 60}px)` }}>
          <Lighthouse size={90} color={colors.white} light={0.5 + 0.5 * Math.abs(Math.sin(frame / 10))} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ ...serifBig, color: colors.white, fontSize: 58 }}>Echt visserskarakter</div>
          <Kicker color={colors.sand}>IJmuiden om de hoek</Kicker>
          <Waves width={420} color={colors.sand} phase={frame / 6} />
        </div>
      </Card>
    </Top>
  );
};

// ---------- Animo / schaarste (body 2, 3 en 4) ----------
export const AnimoScene: React.FC<SceneProps> = ({ scene, outAt }) => {
  const F = useF();
  const frame = useCurrentFrame();
  const tAnimo = F(wordTime(scene, "animo"));
  const tVier = F(wordTime(scene, "vier"));
  const exclusief = has(scene, "havenwoningen");
  const tBeschikbaar = F(wordTime(scene, exclusief ? "exclusieve" : "beschikbaar"));
  const tHaven = F(wordTime(scene, has(scene, "kop") ? "kop" : "haven"));
  const end = F(outAt) - 4;
  return (
    <Top top={250} gap={24}>
      <Card at={tAnimo - 4} outAt={end} bg={colors.red} from="left" style={{ padding: "22px 40px 26px" }}>
        <div style={{ ...serifBig, color: colors.white, fontSize: 70 }}>De animo is groot</div>
      </Card>
      <Card at={tVier - 4} outAt={end} from="right" style={{ padding: "26px 44px 30px", display: "flex", alignItems: "center", gap: 30 }}>
        <div style={{ ...serifBig, fontSize: 170, color: colors.olive, lineHeight: 1 }}>
          <CountUp at={tVier} to={4} dur={10} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", gap: 10 }}>
            {[0, 1, 2, 3].map((i) => (
              <HouseDrop key={i} at={tVier + i * 4} />
            ))}
          </div>
          <BeschikbaarLabel at={tBeschikbaar} text={exclusief ? "exclusieve havenwoningen" : has(scene, "acht") ? "van de 8 nog beschikbaar" : "nog beschikbaar"} />
        </div>
      </Card>
      <Card at={tHaven - 2} outAt={end} bg={colors.olive} from="left" style={{ padding: "22px 40px 24px", display: "flex", alignItems: "center", gap: 24 }}>
        <Lighthouse size={64} color={colors.white} light={0.5 + 0.5 * Math.abs(Math.sin(frame / 10))} />
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ ...serifBig, color: colors.white, fontSize: 50 }}>{has(scene, "kop") ? "Bij de kop van de haven" : "Aan de haven van"}</div>
          <Kicker color={colors.sand}>{has(scene, "oud") ? "Oud-IJmuiden" : "IJmuiden"}</Kicker>
        </div>
      </Card>
      {has(scene, "uitmonding") ? (
        <Chip at={F(wordTime(scene, "uitzicht")) - 2} outAt={end}>
          <Anchor color={colors.red} /> Uitzicht op haven én uitmonding
        </Chip>
      ) : null}
    </Top>
  );
};

const HouseDrop: React.FC<{ at: number }> = ({ at }) => {
  const d = usePop(at, { damping: 9, stiffness: 240, mass: 0.6 });
  return (
    <div style={{ transform: `translateY(${(1 - d) * -80}px) scale(${d})` }}>
      <House size={64} color={colors.red} />
    </div>
  );
};

const BeschikbaarLabel: React.FC<{ at: number; text: string }> = ({ at, text }) => {
  const p = usePop(at);
  return (
    <div
      style={{
        fontFamily: fonts.sans,
        fontWeight: 700,
        fontSize: 44,
        color: colors.white,
        background: colors.red,
        padding: "6px 18px",
        clipPath: chamfer(12),
        opacity: p,
        transform: `translateX(${(1 - p) * -40}px)`,
        alignSelf: "flex-start",
      }}
    >
      {text}
    </div>
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
  const head = usePop(t0 + 10);
  return (
    <AbsoluteFill style={{ clipPath: `inset(${(1 - panel) * 100}% 0 0 0)`, background: colors.olive }}>
      {/* Beeld in een kader met schuine hoeken */}
      <div
        style={{
          position: "absolute",
          top: 120,
          left: 70,
          right: 70,
          height: 720,
          clipPath: chamfer(70),
          overflow: "hidden",
          transform: `scale(${0.9 + 0.1 * frameP})`,
          opacity: frameP,
        }}
      >
        <Sequence from={t0}>
          <OffthreadVideo src={staticFile(`clips/${clip}.mp4`)} muted playbackRate={0.6} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </Sequence>
      </div>
      <div style={{ position: "absolute", top: 890, left: 70, right: 70, display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 34 }}>
        <Img src={staticFile("logo-licht.svg")} style={{ width: 380, opacity: frameP, filter: "brightness(0) invert(1)" }} />
        <div style={{ ...serifBig, color: colors.white, fontSize: 76, opacity: head, transform: `translateY(${(1 - head) * 40}px)` }}>
          Plan een afspraak met onze makelaar
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 30 }}>
          <div
            style={{
              background: colors.red,
              color: colors.white,
              fontFamily: fonts.sans,
              fontWeight: 700,
              fontSize: 54,
              padding: "28px 56px",
              clipPath: chamfer(20),
              transform: `scale(${btn * pulse})`,
              transformOrigin: "left center",
            }}
          >
            Klik hieronder
          </div>
          <svg width={70} height={100} viewBox="0 0 70 100" style={{ opacity: arrow, transform: `translateY(${Math.abs(Math.sin(frame / 7)) * 22}px)` }}>
            <path d="M35 6v80M10 62l25 26 25-26" stroke={colors.white} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </svg>
        </div>
        <div style={{ fontFamily: fonts.sans, fontWeight: 500, fontSize: 40, color: colors.sand, opacity: arrow }}>
          Alle informatie op visscherij-ijmuiden.nl
        </div>
      </div>
    </AbsoluteFill>
  );
};
