import React from "react";
import { AbsoluteFill, Easing, interpolate, OffthreadVideo, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { colors, fonts } from "./brand";
import { Calendar, ChartUp, Check, Dumbbell, Key, Lock, Pin, Plane, Racket, Sun, Umbrella, Utensils, Wave } from "./icons";
import { Card, Chip, CountUp, Kader, Kicker, norm, PalmShadow, Scene, usePop, Woordmerk, wordTime } from "./ui";

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

// Koppen: klassieke schreefletter in kapitalen, zoals in de brochure
const head: React.CSSProperties = { fontFamily: fonts.head, fontWeight: 400, color: colors.olive, lineHeight: 1.08, textTransform: "uppercase", letterSpacing: 1 };
const sub: React.CSSProperties = { fontFamily: fonts.sans, fontWeight: 600, fontSize: 36, color: colors.olive };

// ---------- Hook: per zin een eigen kaart ----------
export const HookScene: React.FC<SceneProps & { accent: string[] }> = ({ scene, outAt, accent }) => {
  const F = useF();
  const frame = useCurrentFrame();
  const acc = accent.map(norm);
  // Zinnen splitsen op . ? !
  const zinnen: (typeof scene.words)[] = [];
  let cur: typeof scene.words = [];
  scene.words.forEach((w) => {
    cur.push(w);
    if (/[.?!]$/.test(w.t)) {
      zinnen.push(cur);
      cur = [];
    }
  });
  if (cur.length) zinnen.push(cur);
  return (
    <>
      {zinnen.map((zin, z) => {
        const at = z === 0 ? 0 : F(zin[0].s) - 6;
        const out = z + 1 < zinnen.length ? F(zinnen[z + 1][0].s) - 8 : F(outAt) - 6;
        if (frame > out + 10) return null;
        const fontSize = zin.length > 16 ? 58 : zin.length > 11 ? 64 : 72;
        return (
          <Top key={z} top={280}>
            <Card at={at} outAt={out} kader palm from={z % 2 ? "right" : "up"} style={{ padding: "60px 64px 64px", maxWidth: 940 }}>
              {z === 0 ? (
                <div style={{ marginBottom: 26 }}>
                  <Kicker>Tampah Bay · Lombok</Kicker>
                </div>
              ) : null}
              <div style={{ fontFamily: fonts.head, fontSize, color: colors.ink, lineHeight: 1.16, display: "flex", flexWrap: "wrap", columnGap: "0.26em", rowGap: 6 }}>
                {zin.map((w, i) => {
                  const wa = F(w.s) - 2;
                  const p = interpolate(frame, [wa, wa + 6], [0, 1], { ...clamp, easing: Easing.out(Easing.back(2)) });
                  const isAccent = acc.includes(norm(w.t));
                  const mark = interpolate(frame, [wa + 2, wa + 10], [0, 1], clamp);
                  return (
                    <span
                      key={i}
                      style={{
                        position: "relative",
                        display: "inline-block",
                        opacity: p,
                        transform: `translateY(${(1 - p) * 40}px) scale(${0.7 + 0.3 * p})`,
                        color: isAccent && mark > 0.5 ? colors.cream : colors.ink,
                      }}
                    >
                      {isAccent ? (
                        <span
                          style={{
                            position: "absolute",
                            left: -8,
                            right: -8,
                            top: "4%",
                            bottom: "-4%",
                            background: colors.olive,
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
      })}
    </>
  );
};

// Stempel die neerploft
const Stempel: React.FC<{ at: number; children: React.ReactNode }> = ({ at, children }) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [at, at + 7], [0, 1], { ...clamp, easing: Easing.in(Easing.quad) });
  const shake = frame > at + 7 ? Math.sin((frame - at) * 2) * 4 * Math.exp(-(frame - at - 7) / 5) : 0;
  return (
    <div
      style={{
        display: "inline-block",
        border: `5px solid ${colors.gold}`,
        color: colors.gold,
        padding: "10px 28px",
        fontFamily: fonts.sans,
        fontWeight: 800,
        fontSize: 46,
        letterSpacing: 4,
        textTransform: "uppercase",
        transform: `rotate(${-7 + shake}deg) scale(${2.2 - 1.2 * p})`,
        opacity: p,
      }}
    >
      {children}
    </div>
  );
};

// ---------- Den Haag ----------
export const DenHaagScene: React.FC<SceneProps> = ({ scene, outAt }) => {
  const F = useF();
  const frame = useCurrentFrame();
  const t0 = F(scene.start);
  const tVerm = F(wordTime(scene, "vermogen"));
  const tSteeds = F(wordTime(scene, "steeds"));
  const end = F(outAt) - 6;
  const q = usePop(tVerm, { damping: 6, stiffness: 160, mass: 0.9 });
  const wob = Math.sin(frame / 6) * 6;
  return (
    <Top top={280} gap={30}>
      <Card at={t0 - 4} outAt={end} bg={colors.olive} kader style={{ padding: "54px 60px 60px", width: 940 }}>
        <Kicker color={colors.gold}>Den Haag</Kicker>
        <div style={{ display: "flex", alignItems: "center", gap: 30, marginTop: 16 }}>
          <div style={{ ...head, fontSize: 70, color: colors.cream, flex: 1 }}>
            Hoe wordt je vermogen straks belast?
          </div>
          <div style={{ fontFamily: fonts.head, fontSize: 230, color: colors.gold, lineHeight: 1, transform: `scale(${q}) rotate(${wob * q}deg)` }}>?</div>
        </div>
        <div style={{ marginTop: 30 }}>
          <Stempel at={tSteeds}>Nog steeds onduidelijk</Stempel>
        </div>
      </Card>
    </Top>
  );
};

// ---------- Box 3 (body 1) ----------
const Balk: React.FC<{ at: number; to: number; label: string; dashed?: boolean; tag?: string }> = ({ at, to, label, dashed, tag }) => {
  const frame = useCurrentFrame();
  const g = interpolate(frame, [at, at + 18], [0, to], { ...clamp, easing: Easing.out(Easing.cubic) });
  const t = interpolate(frame, [at + 14, at + 20], [0, 1], clamp);
  return (
    <div>
      <div style={{ ...sub, fontSize: 32, marginBottom: 10 }}>{label}</div>
      <div style={{ position: "relative", height: 70, width: 780, background: colors.sand }}>
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: `${g * 100}%`,
            // "Wat je misschien haalt": gevulde gouden balk (geen lege stippelrand meer)
            background: dashed ? colors.gold : colors.olive,
          }}
        />
        {tag ? (
          <div style={{ position: "absolute", left: `calc(${g * 100}% + 18px)`, top: -6, fontFamily: fonts.head, fontSize: 70, color: colors.olive, opacity: t }}>{tag}</div>
        ) : null}
      </div>
    </div>
  );
};

export const Box3Scene: React.FC<SceneProps> = ({ scene, outAt }) => {
  const F = useF();
  const tBox = F(wordTime(scene, "box"));
  const tHaalt = F(wordTime(scene, "misschien"));
  const tVerh = F(wordTime(scene, "verhuurder"));
  const end = F(outAt) - 6;
  return (
    <Top top={270} gap={24}>
      <Chip at={tVerh - 2} outAt={end} dark>
        Verhuurder in Nederland
      </Chip>
      <Card at={tBox - 6} outAt={end} kader palm style={{ padding: "50px 60px 60px", width: 940 }}>
        <Kicker>Box 3</Kicker>
        <div style={{ ...head, fontSize: 60, margin: "10px 0 30px" }}>Belasting over rendement</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
          <Balk at={tBox + 4} to={1} label="Waar je over betaalt" />
          <Balk at={tHaalt} to={0.45} label="Wat je misschien haalt" dashed tag="?" />
        </div>
      </Card>
    </Top>
  );
};

// ---------- Buitenland: andere regels ----------
export const BuitenlandScene: React.FC<SceneProps> = ({ scene, outAt }) => {
  const F = useF();
  const frame = useCurrentFrame();
  const t0 = F(scene.start);
  const tBuiten = F(wordTime(scene, "buitenland"));
  const tRegels = F(wordTime(scene, "andere"));
  const end = F(outAt) - 6;
  const fly = interpolate(frame, [tBuiten - 10, tBuiten + 26], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  // Boog van Nederland (linksboven) naar Lombok (rechtsonder)
  const A = { x: 130, y: 120 };
  const B = { x: 700, y: 330 };
  const C = { x: 520, y: -40 };
  const pt = (t: number) => ({
    x: (1 - t) ** 2 * A.x + 2 * (1 - t) * t * C.x + t * t * B.x,
    y: (1 - t) ** 2 * A.y + 2 * (1 - t) * t * C.y + t * t * B.y,
  });
  const P = pt(fly);
  const P2 = pt(Math.min(1, fly + 0.01));
  const ang = (Math.atan2(P2.y - P.y, P2.x - P.x) * 180) / Math.PI;
  const len = 900;
  const nl = usePop(t0);
  const lb = usePop(tBuiten + 20);
  const regels = usePop(tRegels - 2, { damping: 9, stiffness: 180, mass: 0.8 });
  return (
    <Top top={270} gap={26}>
      <Card at={t0 - 4} outAt={end} bg={colors.olive} kader style={{ padding: "50px 60px 40px", width: 940 }}>
        <Kicker color={colors.gold}>Vastgoed in het buitenland</Kicker>
        <div style={{ position: "relative", height: 420, marginTop: 20 }}>
          <svg width={820} height={420} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
            <path
              d={`M${A.x},${A.y} Q${C.x},${C.y} ${B.x},${B.y}`}
              stroke={colors.gold}
              strokeWidth={5}
              strokeDasharray="14 12"
              fill="none"
              style={{ clipPath: `inset(0 ${100 - fly * 100}% 0 0)` }}
            />
            <circle cx={A.x} cy={A.y} r={16 * nl} fill={colors.cream} />
            <circle cx={B.x} cy={B.y} r={20 * lb} fill={colors.gold} />
            <circle cx={B.x} cy={B.y} r={20 + 30 * ((frame / 30) % 1) * lb} fill="none" stroke={colors.gold} strokeWidth={3} opacity={(1 - ((frame / 30) % 1)) * lb} />
          </svg>
          <div style={{ position: "absolute", left: P.x - 32, top: P.y - 32, transform: `rotate(${ang + 45}deg)`, opacity: fly > 0 && fly < 1 ? 1 : 0 }}>
            <Plane size={64} color={colors.cream} />
          </div>
          <div style={{ position: "absolute", left: A.x - 60, top: A.y + 30, ...sub, color: colors.cream, opacity: nl }}>Nederland</div>
          <div style={{ position: "absolute", left: B.x - 90, top: B.y + 34, ...sub, color: colors.gold, opacity: lb }}>Lombok</div>
        </div>
      </Card>
      <Card at={tRegels - 4} outAt={end} kader from="left" style={{ padding: "34px 56px 38px" }}>
        <div style={{ ...head, fontSize: 76, transform: `scale(${0.9 + 0.1 * regels})` }}>Andere regels</div>
      </Card>
    </Top>
  );
};

// ---------- Merk ----------
export const MerkScene: React.FC<SceneProps> = ({ scene, outAt }) => {
  const F = useF();
  const t0 = F(scene.start);
  const end = F(outAt) - 6;
  const werken = has(scene, "werken");
  const tLine = F(wordTime(scene, werken ? "laat" : "tweede"));
  return (
    <AbsoluteFill style={{ justifyContent: "flex-start", alignItems: "center", paddingTop: 300 }}>
      <Card at={t0 - 6} outAt={end} bg={colors.olive} kader palm style={{ padding: "80px 70px 76px", width: 940, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <Woordmerk width={560} at={t0} />
        <div style={{ width: 120, height: 2, background: colors.gold, margin: "46px 0 40px" }} />
        <Card at={tLine - 2} bg="transparent" style={{ boxShadow: "none", textAlign: "center" }}>
          <div style={{ ...head, fontSize: 64, color: colors.cream, textAlign: "center" }}>
            {werken ? (
              <>
                Laat je vermogen
                <br />
                <span style={{ color: colors.gold }}>wél werken</span>
              </>
            ) : (
              <>
                Een <span style={{ color: colors.gold }}>tweede inkomstenbron</span>
                <br />
                naast je pensioen
              </>
            )}
          </div>
        </Card>
      </Card>
    </AbsoluteFill>
  );
};

// ---------- Rendement ----------
export const RendementScene: React.FC<SceneProps> = ({ scene, outAt }) => {
  const F = useF();
  const frame = useCurrentFrame();
  const tStrand = F(wordTime(scene, "strand"));
  const tBay = F(wordTime(scene, "tampah"));
  const t10 = F(wordTime(scene, "10"));
  const t13 = F(wordTime(scene, "13"));
  const end = F(outAt) - 6;
  const lo = interpolate(frame, [t10 - 4, t10 + 10], [0, 10], { ...clamp, easing: Easing.out(Easing.cubic) });
  const hi = interpolate(frame, [t13 - 2, t13 + 12], [10, 13], { ...clamp, easing: Easing.out(Easing.cubic) });
  const showHi = frame >= t13 - 2;
  return (
    <Top top={260} gap={22}>
      <Chip at={tStrand - 2} outAt={end}>
        <Wave color={colors.sea} /> Direct aan het strand
      </Chip>
      <Chip at={tBay - 2} outAt={end} dark>
        <Pin color={colors.gold} /> Tampah Bay · Zuid-Lombok
      </Chip>
      <Card at={t10 - 8} outAt={end} kader palm from="left" style={{ padding: "50px 60px 56px", width: 940 }}>
        <Kicker>Verwacht netto rendement</Kicker>
        <div style={{ fontFamily: fonts.head, fontSize: 210, color: colors.olive, lineHeight: 1, marginTop: 14, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
          {Math.round(lo)}
          <span style={{ opacity: showHi ? 1 : 0 }}>–{Math.round(hi)}</span>
          <span style={{ fontSize: 140, color: colors.goldDark }}>%</span>
        </div>
        <div style={{ ...sub, fontSize: 40 }}>per jaar</div>
      </Card>
    </Top>
  );
};

// ---------- Waardestijging (body 1) ----------
export const WaardeScene: React.FC<SceneProps> = ({ scene, outAt }) => {
  const F = useF();
  const frame = useCurrentFrame();
  const t0 = F(scene.start);
  const t25 = F(wordTime(scene, "25"));
  const end = F(outAt) - 6;
  const draw = interpolate(frame, [t0 + 4, t25 + 10], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const pts = [
    [0, 300],
    [120, 280],
    [240, 250],
    [360, 230],
    [480, 170],
    [600, 120],
    [720, 40],
  ];
  const d = pts.map(([x, y], i) => `${i ? "L" : "M"}${x},${y}`).join(" ");
  const len = 900;
  const dot = usePop(t25 + 8, { damping: 8, stiffness: 200, mass: 0.7 });
  return (
    <Top top={270}>
      <Card at={t0 - 4} outAt={end} kader palm style={{ padding: "50px 60px 56px", width: 940 }}>
        <Kicker>Tijdens de bouwfase</Kicker>
        <div style={{ ...head, fontSize: 62, marginTop: 10 }}>Waardestijging tot</div>
        <div style={{ position: "relative", height: 360, marginTop: 30 }}>
          <svg width={800} height={340} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
            <line x1={0} y1={320} x2={780} y2={320} stroke={colors.sand} strokeWidth={4} />
            <path d={`${d} L720,320 L0,320 Z`} fill={colors.gold} opacity={0.25 * draw} />
            <path d={d} stroke={colors.olive} strokeWidth={8} fill="none" strokeLinejoin="round" strokeDasharray={len} strokeDashoffset={len * (1 - draw)} />
            <circle cx={720} cy={40} r={18 * dot} fill={colors.olive} />
          </svg>
          <div style={{ position: "absolute", left: 360, top: -30, fontFamily: fonts.head, fontSize: 150, color: colors.olive, transform: `scale(${dot})`, transformOrigin: "right bottom" }}>
            +<CountUp at={t25} to={25} dur={14} />%
          </div>
        </div>
      </Card>
    </Top>
  );
};

// ---------- Instap + verhuur en beheer ----------
export const InstapScene: React.FC<SceneProps> = ({ scene, outAt }) => {
  const F = useF();
  const t0 = F(scene.start);
  const tBedrag = F(wordTime(scene, "50"));
  const tVerhuur = F(wordTime(scene, "verhuur"));
  const tBeheer = F(wordTime(scene, "beheer"));
  const end = F(outAt) - 6;
  return (
    <Top top={270} gap={26}>
      <Card at={t0 - 4} outAt={end} bg={colors.olive} kader style={{ padding: "50px 64px 56px" }}>
        <Kicker color={colors.gold}>Instappen vanaf</Kicker>
        <div style={{ fontFamily: fonts.head, fontSize: 150, color: colors.cream, lineHeight: 1.05, marginTop: 10, whiteSpace: "nowrap" }}>
          € <CountUp at={tBedrag} from={10000} to={50000} dur={20} />
        </div>
      </Card>
      <Card at={tVerhuur - 8} outAt={end} kader palm from="right" style={{ padding: "40px 56px 44px" }}>
        <Kicker>Wij regelen</Kicker>
        <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 18 }}>
          {(
            [
              [tVerhuur, "Volledige verhuur"],
              [tBeheer, "Het beheer"],
            ] as [number, string][]
          ).map(([t, label]) => {
            const p = usePop(t - 2, { damping: 9, stiffness: 200, mass: 0.7 });
            return (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: 20, opacity: Math.min(1, p * 2), transform: `translateX(${(1 - p) * -50}px)` }}>
                <div style={{ transform: `scale(${p})` }}>
                  <Check size={64} color={colors.olive} />
                </div>
                <div style={{ ...head, fontSize: 56 }}>{label}</div>
              </div>
            );
          })}
        </div>
      </Card>
    </Top>
  );
};

// ---------- Zelf genieten (body 2) ----------
export const GenietenScene: React.FC<SceneProps> = ({ scene, outAt }) => {
  const F = useF();
  const frame = useCurrentFrame();
  const t0 = F(scene.start);
  const tGebruik = F(wordTime(scene, "gebruik"));
  const end = F(outAt) - 6;
  const sun = usePop(t0 + 2, { damping: 10, stiffness: 140, mass: 0.9 });
  const key = usePop(tGebruik + 2, { damping: 8, stiffness: 200, mass: 0.8 });
  const turn = interpolate(frame, [tGebruik + 8, tGebruik + 20], [0, -90], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  return (
    <Top top={270} gap={26}>
      <Card at={t0 - 4} outAt={end} kader palm style={{ padding: "48px 60px 54px", display: "flex", alignItems: "center", gap: 34 }}>
        <div style={{ transform: `scale(${sun}) rotate(${frame * 0.8}deg)` }}>
          <Sun size={130} color={colors.goldDark} />
        </div>
        <div style={{ ...head, fontSize: 82 }}>
          Zelf
          <br />
          genieten?
        </div>
      </Card>
      <Card at={tGebruik - 4} outAt={end} bg={colors.olive} kader from="right" style={{ padding: "40px 56px 46px", display: "flex", alignItems: "center", gap: 30 }}>
        <div style={{ transform: `scale(${key}) rotate(${turn}deg)` }}>
          <Key size={100} color={colors.gold} />
        </div>
        <div style={{ ...head, fontSize: 58, color: colors.cream }}>
          Gebruik je villa
          <br />
          gewoon zelf
        </div>
      </Card>
    </Top>
  );
};

// ---------- Pensioenstelsel (body 2) ----------
export const PensioenScene: React.FC<SceneProps> = ({ scene, outAt }) => {
  const F = useF();
  const frame = useCurrentFrame();
  const t0 = F(scene.start);
  const tInleg = F(wordTime(scene, "inlegt"));
  const tUit = F(wordTime(scene, "krijgt"));
  const end = F(outAt) - 6;
  const r1 = usePop(tInleg - 2);
  const r2 = usePop(tUit - 6);
  const wob = interpolate(frame, [tUit, tUit + 60], [1, 0.2], clamp) * Math.sin(frame / 3.5);
  return (
    <Top top={270}>
      <Card at={t0 - 4} outAt={end} bg={colors.olive} kader style={{ padding: "52px 60px 60px", width: 940 }}>
        <Kicker color={colors.gold}>Het pensioenstelsel verandert</Kicker>
        <div style={{ display: "flex", flexDirection: "column", gap: 34, marginTop: 34 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 28, opacity: r1, transform: `translateX(${(1 - r1) * -60}px)` }}>
            <Lock size={90} color={colors.gold} />
            <div style={{ ...head, fontSize: 60, color: colors.cream, width: 330 }}>Inleg</div>
            <div style={{ fontFamily: fonts.sans, fontWeight: 800, fontSize: 48, color: colors.olive, background: colors.gold, padding: "6px 24px" }}>vast</div>
          </div>
          <div style={{ height: 2, background: colors.gold, opacity: 0.4 }} />
          <div style={{ display: "flex", alignItems: "center", gap: 28, opacity: r2, transform: `translateX(${(1 - r2) * -60}px)` }}>
            <div style={{ width: 90, display: "flex", justifyContent: "center", fontFamily: fonts.head, fontSize: 110, color: colors.gold, lineHeight: 1, transform: `rotate(${wob * 14}deg)` }}>?</div>
            <div style={{ ...head, fontSize: 60, color: colors.cream, width: 330 }}>Uitkering</div>
            <div style={{ fontFamily: fonts.sans, fontWeight: 800, fontSize: 48, color: colors.cream, border: `3px dashed ${colors.gold}`, padding: "4px 22px", transform: `translateX(${wob * 10}px)` }}>
              onzeker
            </div>
          </div>
        </div>
      </Card>
    </Top>
  );
};

// ---------- Masterplan / compleet resort ----------
const Voorziening: React.FC<{ at: number; icon: React.ReactNode; label: string }> = ({ at, icon, label }) => {
  const p = usePop(at, { damping: 9, stiffness: 200, mass: 0.7 });
  return (
    <div
      style={{
        width: 400,
        height: 200,
        background: colors.olive,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 14,
        transform: `scale(${p}) rotate(${(1 - p) * -10}deg)`,
        opacity: Math.min(1, p * 2),
      }}
    >
      {icon}
      <div style={{ fontFamily: fonts.sans, fontWeight: 700, fontSize: 36, color: colors.cream }}>{label}</div>
    </div>
  );
};

export const MasterplanScene: React.FC<SceneProps> = ({ scene, outAt }) => {
  const F = useF();
  const frame = useCurrentFrame();
  const t0 = F(scene.start);
  const end = F(outAt) - 6;
  const resort = has(scene, "compleet");
  const tKop = F(wordTime(scene, resort ? "compleet" : "masterplan"));
  const strike = resort ? interpolate(frame, [F(wordTime(scene, "maar")) - 6, F(wordTime(scene, "maar")) + 4], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) }) : 0;
  const kop = usePop(tKop - 4);
  return (
    <Top top={250} gap={24}>
      <Card at={t0 - 4} outAt={end} kader palm style={{ padding: "44px 60px 50px", width: 940 }}>
        {resort ? (
          <div style={{ position: "relative", display: "inline-block", ...head, fontSize: 52, color: colors.goldDark, marginBottom: 14 }}>
            Geen losse villa
            <div style={{ position: "absolute", left: -8, top: "48%", height: 6, width: `${strike * 104}%`, background: colors.olive }} />
          </div>
        ) : (
          <Kicker>Het project</Kicker>
        )}
        <div style={{ ...head, fontSize: 78, opacity: kop, transform: `translateY(${(1 - kop) * 30}px)`, marginTop: resort ? 0 : 10 }}>
          {resort ? "Een compleet resort" : "Eén volledig masterplan"}
        </div>
      </Card>
      <div style={{ display: "grid", gridTemplateColumns: "400px 400px", gap: 20, marginLeft: 40 }}>
        <Voorziening at={F(wordTime(scene, "beachclub")) - 2} icon={<Umbrella size={80} color={colors.gold} />} label="Beachclub" />
        <Voorziening at={F(wordTime(scene, "restaurant")) - 2} icon={<Utensils size={80} color={colors.gold} />} label="Restaurant" />
        <Voorziening at={F(wordTime(scene, "padelbanen")) - 4} icon={<Racket size={80} color={colors.gold} />} label="2 padelbanen" />
        <Voorziening at={F(wordTime(scene, "jungle")) - 2} icon={<Dumbbell size={80} color={colors.gold} />} label="Jungle gym" />
      </div>
    </Top>
  );
};

// ---------- 75% verkocht + oplevering ----------
export const VerkochtScene: React.FC<SceneProps> = ({ scene, outAt }) => {
  const F = useF();
  const frame = useCurrentFrame();
  const t75 = F(wordTime(scene, "75"));
  const tOpl = F(wordTime(scene, "oplevering"));
  const t2028 = F(wordTime(scene, "2028"));
  const end = F(outAt) - 6;
  const ring = interpolate(frame, [t75 - 4, t75 + 22], [0, 0.75], { ...clamp, easing: Easing.out(Easing.cubic) });
  const R = 110;
  const C = 2 * Math.PI * R;
  const q = usePop(t2028 - 6);
  return (
    <Top top={260} gap={24}>
      <Card at={t75 - 10} outAt={end} bg={colors.olive} kader from="left" style={{ padding: "44px 60px 48px", display: "flex", alignItems: "center", gap: 44, width: 940 }}>
        <div style={{ position: "relative", width: 260, height: 260 }}>
          <svg width={260} height={260} style={{ transform: "rotate(-90deg)" }}>
            <circle cx={130} cy={130} r={R} stroke={colors.oliveDark} strokeWidth={30} fill="none" />
            <circle cx={130} cy={130} r={R} stroke={colors.gold} strokeWidth={30} fill="none" strokeDasharray={C} strokeDashoffset={C * (1 - ring)} />
          </svg>
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: fonts.head, fontSize: 84, color: colors.cream }}>
            {Math.round(ring * 100)}%
          </div>
        </div>
        <div>
          <Kicker color={colors.gold}>Inmiddels al</Kicker>
          <div style={{ ...head, fontSize: 86, color: colors.cream, marginTop: 8 }}>verkocht</div>
        </div>
      </Card>
      <Card at={tOpl - 4} outAt={end} kader palm from="right" style={{ padding: "40px 56px 46px", display: "flex", alignItems: "center", gap: 34 }}>
        <Calendar size={96} color={colors.olive} />
        <div>
          <Kicker>Oplevering gepland</Kicker>
          <div style={{ ...head, fontSize: 92, opacity: q, transform: `translateX(${(1 - q) * 40}px)` }}>Q2 2028</div>
        </div>
      </Card>
      {has(scene, "overdracht") ? (
        <Chip at={F(wordTime(scene, "overdracht")) - 4} outAt={end} dark>
          <Check color={colors.gold} /> Direct in volledig beheer
        </Chip>
      ) : null}
    </Top>
  );
};

// ---------- Slotvraag ----------
export const VraagScene: React.FC<SceneProps> = ({ scene, outAt }) => {
  const F = useF();
  const frame = useCurrentFrame();
  const t0 = F(scene.start);
  const end = F(outAt) - 4;
  const pensioen = has(scene, "pensioen");
  const chart = usePop(t0 + 6);
  const tTerwijl = has(scene, "terwijl") ? F(wordTime(scene, "terwijl")) : 0;
  return (
    <Top top={290} gap={26}>
      <Card at={t0 - 4} outAt={end} kader palm style={{ padding: "60px 64px 66px", width: 940 }}>
        <div style={{ transform: `scale(${chart})`, transformOrigin: "left", marginBottom: 20 }}>
          <ChartUp size={110} color={colors.goldDark} />
        </div>
        <div style={{ ...head, fontSize: 70 }}>
          {pensioen ? (
            <>
              Wat kan deze villa <span style={{ color: colors.goldDark }}>naast je pensioen</span> opleveren?
            </>
          ) : (
            <>
              Wat kan <span style={{ color: colors.goldDark }}>jouw vermogen</span> hier opleveren?
            </>
          )}
        </div>
      </Card>
      {tTerwijl ? (
        <Chip at={tTerwijl - 2} outAt={end} dark>
          Terwijl Den Haag nog vergadert…
        </Chip>
      ) : null}
    </Top>
  );
};

// ---------- Call to action ----------
export const CtaScene: React.FC<SceneProps & { clip: string }> = ({ scene, clip }) => {
  const F = useF();
  const frame = useCurrentFrame();
  const t0 = F(scene.start) - 6;
  const tKlik = F(wordTime(scene, "klik"));
  const tBekijk = F(wordTime(scene, "bekijk"));
  const panel = interpolate(frame, [t0, t0 + 14], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const frameP = usePop(t0 + 6);
  const btn = usePop(tKlik, { damping: 9, stiffness: 180, mass: 0.8 });
  const pulse = frame > tKlik + 10 ? 1 + Math.sin((frame - tKlik) / 5) * 0.035 : 1;
  const arrow = usePop(tBekijk);
  const headP = usePop(tBekijk - 4);
  const overzicht = has(scene, "rendementsoverzicht");
  return (
    <AbsoluteFill style={{ clipPath: `inset(${(1 - panel) * 100}% 0 0 0)`, background: colors.cream }}>
      <PalmShadow opacity={0.16} />
      <div style={{ position: "absolute", top: 110, left: 70, right: 70, height: 700, overflow: "hidden", transform: `scale(${0.9 + 0.1 * frameP})`, opacity: frameP }}>
        <Sequence from={t0}>
          <OffthreadVideo src={staticFile(`clips/${clip}.mp4`)} muted playbackRate={0.6} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </Sequence>
        <Kader at={t0 + 8} inset={22} color={colors.cream} />
      </div>
      <div style={{ position: "absolute", top: 870, left: 70, right: 70, display: "flex", flexDirection: "column", alignItems: "center", gap: 34, textAlign: "center" }}>
        <div style={{ opacity: frameP }}>
          <Woordmerk width={420} color={colors.olive} at={t0 + 4} />
        </div>
        <div style={{ ...head, fontSize: 64, opacity: headP, transform: `translateY(${(1 - headP) * 40}px)` }}>
          {overzicht ? "Bekijk het volledige rendementsoverzicht" : "Bekijk de mogelijkheden"}
        </div>
        <div
          style={{
            background: colors.olive,
            color: colors.cream,
            fontFamily: fonts.sans,
            fontWeight: 700,
            fontSize: 46,
            letterSpacing: 4,
            textTransform: "uppercase",
            padding: "28px 56px",
            transform: `scale(${btn * pulse})`,
          }}
        >
          Klik hieronder
        </div>
        <svg width={70} height={100} viewBox="0 0 70 100" style={{ opacity: arrow, transform: `translateY(${Math.abs(Math.sin(frame / 7)) * 22}px)` }}>
          <path d="M35 6v80M10 62l25 26 25-26" stroke={colors.olive} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
      </div>
    </AbsoluteFill>
  );
};
