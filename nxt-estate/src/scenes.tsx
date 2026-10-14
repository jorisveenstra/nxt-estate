import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, OffthreadVideo, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { colors, fonts } from "./brand";
import { Calendar, Clock } from "./icons";
import { Card, Chip, clamp, Kicker, Kruis, Mark, norm, Scene, Teller, usePop, useOut, Vinkje, wordTime } from "./ui";

export type SceneProps = { scene: Scene; outAt: number };

const useF = () => {
  const { fps } = useVideoConfig();
  return (sec: number) => Math.round(sec * fps);
};

const has = (scene: Scene, text: string) => scene.words.some((w) => norm(w.t).startsWith(norm(text)));
const T = (scene: Scene, text: string, nth = 0) => wordTime(scene, text, nth);

const Top: React.FC<{ children: React.ReactNode; gap?: number; top?: number }> = ({ children, gap = 24, top = 260 }) => (
  <AbsoluteFill style={{ padding: `${top}px 70px 0`, display: "flex", flexDirection: "column", gap, alignItems: "flex-start" }}>
    {children}
  </AbsoluteFill>
);

const serif: React.CSSProperties = { fontFamily: fonts.serif, fontWeight: 600, color: colors.plum, lineHeight: 1.06, letterSpacing: -1 };
const sans: React.CSSProperties = { fontFamily: fonts.sans, fontWeight: 600, fontSize: 34, color: colors.plumSoft };

const Logo: React.FC<{ width: number; licht?: boolean }> = ({ width, licht }) => (
  <Img src={staticFile(`logo/${licht ? "nxt-estate-licht" : "nxt-estate"}.png`)} style={{ width, display: "block" }} />
);

// Stempel die neerploft
const Stempel: React.FC<{ at: number; children: React.ReactNode; size?: number; rot?: number; dark?: boolean }> = ({ at, children, size = 64, rot = -5, dark }) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [at, at + 7], [0, 1], { ...clamp, easing: Easing.in(Easing.quad) });
  const shake = frame > at + 7 ? Math.sin((frame - at) * 2) * 4 * Math.exp(-(frame - at - 7) / 5) : 0;
  return (
    <div
      style={{
        display: "inline-block",
        padding: "10px 34px 14px",
        borderRadius: 22,
        background: dark ? colors.plum : colors.pink,
        color: dark ? colors.pink : colors.plum,
        fontFamily: fonts.serifItalic,
        fontStyle: "italic",
        fontWeight: 700,
        fontSize: size,
        transform: `rotate(${rot + shake}deg) scale(${2.2 - 1.2 * p})`,
        opacity: p,
        boxShadow: "0 16px 40px rgba(42,26,36,0.35)",
      }}
    >
      {children}
    </div>
  );
};

// Rij met icoon/vinkje die op `at` inschuift
const Regel: React.FC<{ at: number; icon: React.ReactNode; children: React.ReactNode; size?: number }> = ({ at, icon, children, size = 48 }) => {
  const p = usePop(at - 3);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 22, opacity: Math.min(1, p * 2), transform: `translateX(${(1 - p) * -70}px)` }}>
      {icon}
      <div style={{ ...serif, fontSize: size }}>{children}</div>
    </div>
  );
};

// ---------- Hook: per zin een kaart, accentwoorden cursief met roze markering ----------
export const HookScene: React.FC<SceneProps & { accent: string[] }> = ({ scene, outAt, accent }) => {
  const F = useF();
  const frame = useCurrentFrame();
  const acc = accent.map(norm);
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
        const fontSize = zin.length > 15 ? 64 : zin.length > 10 ? 72 : 84;
        return (
          <Top key={z} top={300}>
            <Card at={at} outAt={out} from={z % 2 ? "right" : "up"} style={{ padding: "54px 58px 60px", maxWidth: 940 }}>
              <div style={{ marginBottom: 24 }}>
                <Kicker>Voor vastgoedontwikkelaars</Kicker>
              </div>
              <div style={{ ...serif, fontSize, display: "flex", flexWrap: "wrap", columnGap: "0.24em", rowGap: 6 }}>
                {zin.map((w, i) => {
                  const wa = F(w.s) - 2;
                  const p = interpolate(frame, [wa, wa + 6], [0, 1], { ...clamp, easing: Easing.out(Easing.back(2)) });
                  const isAccent = acc.includes(norm(w.t));
                  return (
                    <span key={i} style={{ display: "inline-block", opacity: p, transform: `translateY(${(1 - p) * 40}px) scale(${0.7 + 0.3 * p})` }}>
                      {isAccent ? <Mark at={wa + 2}>{w.t}</Mark> : w.t}
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

// ---------- Belofte: kopers met budget aan tafel ----------
const Tafel: React.FC<{ at: number }> = ({ at }) => {
  const plekken = [
    [-210, -40],
    [-70, -95],
    [70, -95],
    [210, -40],
    [-140, 95],
    [140, 95],
  ];
  return (
    <div style={{ position: "relative", width: 800, height: 300 }}>
      <div style={{ position: "absolute", left: 220, top: 100, width: 360, height: 110, borderRadius: 60, background: colors.sand, border: `6px solid ${colors.plum}` }} />
      {plekken.map(([x, y], i) => {
        const p = usePop(at + i * 4, { damping: 8, stiffness: 220, mass: 0.6 });
        return (
          <div key={i} style={{ position: "absolute", left: 400 + x - 38, top: 155 + y - 38, transform: `scale(${p}) translateY(${(1 - p) * -60}px)` }}>
            <svg width={76} height={76} viewBox="0 0 76 76">
              <circle cx={38} cy={24} r={16} fill={i % 2 ? colors.plum : colors.pinkDeep} />
              <path d="M10 72c0-16 12-28 28-28s28 12 28 28z" fill={i % 2 ? colors.plum : colors.pinkDeep} />
            </svg>
          </div>
        );
      })}
    </div>
  );
};

export const BelofteScene: React.FC<SceneProps> = ({ scene, outAt }) => {
  const F = useF();
  const frame = useCurrentFrame();
  const end = F(outAt) - 6;
  const t0 = F(scene.start);
  if (has(scene, "systeem")) {
    // Body 4: één systeem van meer leads naar afspraken met kopers met budget
    const stappen: [string, number][] = [
      ["Meer leads", F(T(scene, "leads"))],
      ["Afspraken", F(T(scene, "afspraken"))],
      ["Kopers met budget", F(T(scene, "kopers"))],
    ];
    return (
      <Top top={270} gap={26}>
        <Card at={t0 - 4} outAt={end} style={{ padding: "48px 56px 54px", width: 940 }}>
          <Kicker>Eén systeem</Kicker>
          <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 26 }}>
            {stappen.map(([label, at], i) => {
              const p = usePop(at - 3);
              const lijn = interpolate(frame, [at + 4, at + 14], [0, 1], clamp);
              return (
                <div key={label}>
                  <div style={{ display: "flex", alignItems: "center", gap: 24, opacity: p, transform: `translateX(${(1 - p) * -60}px)` }}>
                    <div style={{ width: 84, height: 84, borderRadius: 42, background: i === 2 ? colors.plum : colors.pink, color: i === 2 ? colors.pink : colors.plum, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: fonts.sans, fontWeight: 800, fontSize: 40 }}>
                      {i + 1}
                    </div>
                    <div style={{ ...serif, fontSize: 60 }}>{i === 2 ? <Mark at={at + 2}>{label}</Mark> : label}</div>
                  </div>
                  {i < 2 ? <div style={{ marginLeft: 39, width: 6, height: 40 * lijn, background: colors.plum, borderRadius: 3, marginTop: 8 }} /> : null}
                </div>
              );
            })}
          </div>
        </Card>
      </Top>
    );
  }
  const tKopers = F(T(scene, "kopers"));
  const tTafel = F(T(scene, "tafel"));
  return (
    <Top top={260} gap={22}>
      {has(scene, "verder") ? (
        <Chip at={t0} outAt={end} dark>
          Wij gaan verder dan de lead
        </Chip>
      ) : null}
      <Card at={F(T(scene, "maandelijks")) - 6} outAt={end} style={{ padding: "44px 56px 30px", width: 940 }}>
        <Kicker>Elke maand</Kicker>
        <div style={{ ...serif, fontSize: 72, marginTop: 14 }}>
          Tientallen kopers met budget <Mark at={tTafel}>aan tafel</Mark>
        </div>
        <Tafel at={tKopers} />
      </Card>
      <Chip at={F(T(scene, "verkoopteam")) - 4} outAt={end} pink>
        bij jouw verkoopteam
      </Chip>
    </Top>
  );
};

// ---------- Losse eilandjes (body 2) ----------
const Eiland: React.FC<{ at: number; x: number; y: number; titel: string; sub: string; los: number }> = ({ at, x, y, titel, sub, los }) => {
  const frame = useCurrentFrame();
  const p = usePop(at, { damping: 9, stiffness: 200, mass: 0.7 });
  const bob = Math.sin((frame + x) / 14) * 8;
  return (
    <div
      style={{
        position: "absolute",
        left: x + los * (x - 330) * 0.25,
        top: y + bob + los * 30,
        width: 300,
        padding: "26px 28px",
        borderRadius: 30,
        background: colors.cream,
        boxShadow: "0 18px 50px rgba(42,26,36,0.35)",
        transform: `scale(${p}) rotate(${(x - 330) * 0.02 * los}deg)`,
        opacity: Math.min(1, p * 2),
      }}
    >
      <div style={{ ...serif, fontSize: 50 }}>{titel}</div>
      <div style={{ ...sans, fontSize: 28, marginTop: 6 }}>{sub}</div>
    </div>
  );
};

export const EilandjesScene: React.FC<SceneProps> = ({ scene, outAt }) => {
  const F = useF();
  const frame = useCurrentFrame();
  const end = F(outAt) - 6;
  const tLos = F(T(scene, "eilandjes"));
  const los = interpolate(frame, [tLos - 4, tLos + 12], [0, 1], { ...clamp, easing: Easing.out(Easing.back(1.5)) });
  const o = useOut(end);
  return (
    <AbsoluteFill style={{ opacity: 1 - o }}>
      <div style={{ position: "absolute", left: 70, top: 260, width: 940, height: 760 }}>
        <Eiland at={F(T(scene, "bureau")) - 3} x={0} y={60} titel="Bureau" sub="voor de leads" los={los} />
        <Eiland at={F(T(scene, "makelaar")) - 3} x={620} y={60} titel="Makelaar" sub="voor de verkoop" los={los} />
        <Eiland at={F(T(scene, "crm")) - 3} x={320} y={440} titel="CRM" sub="waar niemand in kijkt" los={los} />
      </div>
      <AbsoluteFill style={{ justifyContent: "flex-start", alignItems: "center", paddingTop: 1080 }}>
        <Stempel at={tLos} size={76}>
          Losse eilandjes
        </Stempel>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ---------- Tussen wal en schip (body 2) ----------
export const SchipScene: React.FC<SceneProps> = ({ scene, outAt }) => {
  const F = useF();
  const frame = useCurrentFrame();
  const end = F(outAt) - 4;
  const t0 = F(scene.start);
  const o = useOut(end);
  return (
    <AbsoluteFill style={{ opacity: 1 - o }}>
      {/* Leads (roze bolletjes) die door het gat vallen */}
      {Array.from({ length: 9 }, (_, i) => {
        const a = t0 + i * 3;
        const y = interpolate(frame, [a, a + 26], [180, 1500], { ...clamp, easing: Easing.in(Easing.quad) });
        return (
          <div key={i} style={{ position: "absolute", left: 470 + ((i * 53) % 140) - 70, top: y, width: 50, height: 50, borderRadius: 25, background: colors.pink, border: `5px solid ${colors.plum}`, opacity: frame >= a ? 1 : 0 }} />
        );
      })}
      <Top top={300} gap={24}>
        <Card at={t0 - 4} outAt={end} style={{ padding: "40px 52px 46px" }}>
          <div style={{ ...serif, fontSize: 70 }}>
            Leads vallen tussen
            <br />
            <Mark at={F(T(scene, "wal"))}>wal en schip</Mark>
          </div>
        </Card>
      </Top>
      <AbsoluteFill style={{ justifyContent: "flex-start", alignItems: "flex-end", padding: "760px 70px 0" }}>
        <Chip at={F(T(scene, "niemand")) - 2} outAt={end} dark>
          Niemand weet wat werkt
        </Chip>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ---------- Eén partner, van advertentie tot afspraak (body 2) ----------
export const PartnerScene: React.FC<SceneProps> = ({ scene, outAt }) => {
  const F = useF();
  const end = F(outAt) - 6;
  const t0 = F(scene.start);
  const stappen: [string, string][] = [
    ["advertentie", "Eerste advertentie"],
    ["bellen", "Alle leads bellen"],
    ["afspraak", "Afspraak maken"],
  ];
  return (
    <Top top={260} gap={24}>
      <Card at={t0 - 4} outAt={end} bg={colors.plum} style={{ padding: "40px 52px 44px", display: "flex", alignItems: "center", gap: 30 }}>
        <Logo width={300} licht />
        <div style={{ ...serif, fontSize: 56, color: colors.cream }}>
          = <Mark at={F(T(scene, "partner")) + 2}>
            <span style={{ color: colors.plum }}>één partner</span>
          </Mark>
        </div>
      </Card>
      <Card at={F(T(scene, "advertentie")) - 8} outAt={end} style={{ padding: "40px 52px 46px", width: 940 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {stappen.map(([w, label]) => {
            const at = F(T(scene, w));
            return <Regel key={w} at={at} icon={<Vinkje at={at + 4} size={66} />} size={54}>{label}</Regel>;
          })}
        </div>
      </Card>
    </Top>
  );
};

// ---------- Geen lead verloren + grip (body 2 en 3) ----------
export const GripScene: React.FC<SceneProps> = ({ scene, outAt }) => {
  const F = useF();
  const frame = useCurrentFrame();
  const end = F(outAt) - 6;
  const tGeen = F(T(scene, "geen"));
  const grip = has(scene, "grip");
  const tGrip = grip ? F(T(scene, "grip")) : 0;
  const balk = interpolate(frame, [tGrip, tGrip + 18], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  return (
    <Top top={270} gap={26}>
      <Card at={tGeen - 6} outAt={end} style={{ padding: "44px 56px 50px", width: 940, display: "flex", alignItems: "center", gap: 40 }}>
        <div style={{ ...serif, fontSize: 200, lineHeight: 0.9 }}>
          <Teller at={tGeen} from={48} to={0} dur={22} />
        </div>
        <div>
          <Kicker>Leads verloren</Kicker>
          <div style={{ ...serif, fontSize: 58, marginTop: 10 }}>
            <Mark at={tGeen + 14}>Geen enkele</Mark> meer
          </div>
        </div>
      </Card>
      {grip ? (
        <Card at={tGrip - 6} outAt={end} bg={colors.plum} from="right" style={{ padding: "36px 48px 42px", width: 940 }}>
          <div style={{ ...serif, fontSize: 56, color: colors.cream }}>Eindelijk grip op je verkoop</div>
          <div style={{ marginTop: 22, height: 26, borderRadius: 13, background: colors.plumSoft }}>
            <div style={{ height: 26, borderRadius: 13, width: `${balk * 100}%`, background: colors.pink }} />
          </div>
        </Card>
      ) : null}
    </Top>
  );
};

// ---------- Partners: logo's van ontwikkelaars (body 2) ----------
const LOGOS = ["dok.png", "maartens.png", "visscherij.png", "loods.png", "stock.png", "topvast.png", "fresch.jpg"];
export const PartnersScene: React.FC<SceneProps> = ({ scene, outAt }) => {
  const F = useF();
  const end = F(outAt) - 6;
  const t0 = F(T(scene, "partner"));
  // Logo's maar kort in beeld: weg zodra het over sneller uitverkopen gaat
  const logosUit = Math.min(end, F(T(scene, "verkopen")) - 2);
  return (
    <Top top={250} gap={26}>
      <Card at={F(scene.start) - 4} outAt={logosUit} style={{ padding: "40px 46px 46px", width: 940 }}>
        <Kicker>Partner van o.a.</Kicker>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 18, marginTop: 24 }}>
          {LOGOS.map((l, i) => {
            const p = usePop(t0 + i * 2, { damping: 9, stiffness: 220, mass: 0.6 });
            return (
              <div
                key={l}
                style={{
                  height: 150,
                  borderRadius: 24,
                  background: colors.white,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                  transform: `scale(${p}) rotate(${(1 - p) * (i % 2 ? 8 : -8)}deg)`,
                  boxShadow: "0 8px 22px rgba(42,26,36,0.12)",
                  gridColumn: i === LOGOS.length - 1 ? "1 / span 2" : undefined,
                }}
              >
                <Img src={staticFile(`partners/${l}`)} style={{ maxWidth: l === "dok.png" ? "46%" : "86%", maxHeight: l === "dok.png" ? 70 : 128, objectFit: "contain" }} />
              </div>
            );
          })}
        </div>
      </Card>
      <div style={{ position: "absolute", top: 420, left: 70 }}>
        <Chip at={logosUit + 4} outAt={end} dark style={{ fontSize: 46, padding: "24px 40px" }}>
          Keer op keer sneller uitverkocht
        </Chip>
      </div>
    </Top>
  );
};

// ---------- Bureaus stoppen bij de lead (body 3) ----------
export const StoppenScene: React.FC<SceneProps> = ({ scene, outAt }) => {
  const F = useF();
  const frame = useCurrentFrame();
  const end = F(outAt) - 6;
  const tStop = F(T(scene, "stoppen"));
  const tLijst = F(T(scene, "lijst"));
  const tOp = F(T(scene, "houdt"));
  const slagboom = interpolate(frame, [tStop, tStop + 10], [-80, 0], { ...clamp, easing: Easing.out(Easing.back(2)) });
  const namen = ["J. de Vries", "M. Jansen", "S. Bakker", "R. Visser", "L. Smit"];
  return (
    <Top top={260} gap={26}>
      <Card at={F(scene.start) - 4} outAt={end} style={{ padding: "40px 52px 46px", width: 940 }}>
        <Kicker>De meeste marketingbureaus</Kicker>
        <div style={{ display: "flex", alignItems: "center", gap: 26, marginTop: 20 }}>
          <div style={{ ...serif, fontSize: 64 }}>stoppen bij de lead</div>
          <div style={{ width: 150, height: 26, borderRadius: 13, background: `repeating-linear-gradient(45deg, ${colors.red} 0 22px, ${colors.white} 22px 44px)`, transform: `rotate(${slagboom}deg)`, transformOrigin: "left center", border: `3px solid ${colors.plum}` }} />
        </div>
      </Card>
      <Card at={tLijst - 6} outAt={end} from="right" bg={colors.white} style={{ padding: "30px 40px 34px", width: 700, marginLeft: 120 }}>
        <div style={{ ...sans, fontWeight: 800, fontSize: 28, color: colors.plum, marginBottom: 14 }}>leads_export.csv</div>
        {namen.map((n, i) => {
          const p = usePop(tLijst + i * 3);
          return (
            <div key={n} style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderTop: `2px solid ${colors.sand}`, opacity: p, transform: `translateX(${(1 - p) * 40}px)` }}>
              <div style={{ ...sans, fontSize: 30, color: colors.plum }}>{n}</div>
              <div style={{ ...sans, fontSize: 28, color: "#9a8a94" }}>06-•••••••</div>
            </div>
          );
        })}
      </Card>
      <div style={{ marginLeft: 60 }}>
        <Stempel at={tOp} size={62} dark>
          …en daar houdt het op.
        </Stempel>
      </div>
    </Top>
  );
};

// ---------- Wie belt ze? Meestal niemand (body 3) ----------
export const VragenScene: React.FC<SceneProps> = ({ scene, outAt }) => {
  const F = useF();
  const end = F(outAt) - 6;
  const vragen: [string, string][] = [
    ["belt", "Wie belt ze?"],
    ["checkt", "Wie checkt het budget?"],
    ["zorgt", "Wie zorgt voor een afspraak?"],
  ];
  const tNiemand = F(T(scene, "meestal"));
  return (
    <Top top={270} gap={22}>
      {vragen.map(([w, label], i) => (
        <Chip key={w} at={F(T(scene, w)) - 4} outAt={end} style={{ fontFamily: fonts.serif, fontWeight: 600, fontSize: 56, padding: "22px 40px", marginLeft: i * 40 }}>
          {label}
        </Chip>
      ))}
      <div style={{ marginTop: 30, marginLeft: 80 }}>
        <Stempel at={tNiemand} size={92} dark>
          Meestal niemand.
        </Stempel>
      </div>
    </Top>
  );
};

// ---------- Leads en budget verloren (body 3) ----------
export const VerlorenScene: React.FC<SceneProps> = ({ scene, outAt }) => {
  const F = useF();
  const frame = useCurrentFrame();
  const end = F(outAt) - 4;
  const t0 = F(scene.start);
  const leeg = interpolate(frame, [t0 + 4, F(outAt) - 4], [1, 0.08], { ...clamp, easing: Easing.in(Easing.quad) });
  return (
    <Top top={290}>
      <Card at={t0 - 4} outAt={end} style={{ padding: "44px 56px 50px", width: 940 }}>
        <div style={{ ...serif, fontSize: 64 }}>
          Leads én <Mark at={F(T(scene, "marketingbudget"))}>marketingbudget</Mark> verloren
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 20, marginTop: 30 }}>
          <div style={{ ...sans, fontWeight: 800, fontSize: 40, color: colors.plum }}>€</div>
          <div style={{ flex: 1, height: 44, borderRadius: 22, background: colors.sand, overflow: "hidden" }}>
            <div style={{ height: 44, width: `${leeg * 100}%`, background: leeg < 0.3 ? colors.red : colors.pinkDeep, borderRadius: 22 }} />
          </div>
        </div>
      </Card>
    </Top>
  );
};

// ---------- Verantwoordelijk tot de afspraak in de agenda (body 3) ----------
const Agenda: React.FC<{ at: number; vol?: boolean; leeg?: boolean }> = ({ at, vol, leeg }) => {
  const dagen = ["ma", "di", "wo", "do", "vr"];
  const blokken = vol ? [[0, 0], [0, 2], [1, 1], [2, 0], [2, 2], [3, 1], [4, 0], [4, 2], [1, 3], [3, 3]] : leeg ? [] : [[2, 1]];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10, marginTop: 20 }}>
      {dagen.map((d) => (
        <div key={d} style={{ ...sans, fontWeight: 800, fontSize: 26, textAlign: "center", color: colors.plum }}>{d}</div>
      ))}
      {Array.from({ length: 20 }, (_, i) => {
        const c = i % 5;
        const r = Math.floor(i / 5);
        const k = blokken.findIndex(([bc, br]) => bc === c && br === r);
        const p = usePop(at + Math.max(0, k) * 3, { damping: 9, stiffness: 220, mass: 0.6 });
        return (
          <div key={i} style={{ height: 66, borderRadius: 14, background: colors.sand, position: "relative" }}>
            {k >= 0 ? <div style={{ position: "absolute", inset: 4, borderRadius: 11, background: k % 2 ? colors.plum : colors.pinkDeep, transform: `scale(${p})` }} /> : null}
          </div>
        );
      })}
    </div>
  );
};

export const AgendaScene: React.FC<SceneProps> = ({ scene, outAt }) => {
  const F = useF();
  const end = F(outAt) - 6;
  const tAfspraak = F(T(scene, "afspraak"));
  return (
    <Top top={270} gap={24}>
      <Card at={F(scene.start) - 4} outAt={end} style={{ padding: "44px 52px 48px", width: 940 }}>
        <Kicker>Wij nemen verantwoordelijkheid</Kicker>
        <div style={{ ...serif, fontSize: 64, marginTop: 10 }}>
          tot de <Mark at={tAfspraak}>afspraak in de agenda</Mark>
        </div>
        <Agenda at={tAfspraak + 4} />
      </Card>
    </Top>
  );
};

// ---------- Eigen belteam (body 3) ----------
export const BelteamScene: React.FC<SceneProps> = ({ scene, outAt }) => {
  const F = useF();
  const frame = useCurrentFrame();
  const end = F(outAt) - 6;
  const tBelt = F(T(scene, "belt"));
  const ring = Math.sin(frame * 1.6) * 10 * (frame > tBelt && frame < tBelt + 30 ? 1 : 0);
  const regels: [string, string][] = [
    ["uur", "Elke lead binnen een uur gebeld"],
    ["checkt", "Budget gecheckt"],
    ["plant", "Alleen serieuze kopers ingepland"],
  ];
  return (
    <Top top={260} gap={24}>
      <Card at={F(scene.start) - 4} outAt={end} bg={colors.plum} style={{ padding: "36px 48px 40px", display: "flex", alignItems: "center", gap: 30 }}>
        <svg width={110} height={110} viewBox="0 0 48 48" style={{ transform: `rotate(${ring}deg)` }}>
          <path d="M14 6l6 10-4 4c2 5 6 9 12 12l4-4 10 6-3 7c-1 2-3 3-5 2C21 39 9 27 6 14c-1-2 0-4 2-5z" fill={colors.pink} />
        </svg>
        <div>
          <div style={{ ...serif, fontSize: 58, color: colors.cream }}>Ons eigen belteam</div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 8 }}>
            <Clock size={44} color={colors.pink} />
            <div style={{ ...sans, color: colors.pink, fontWeight: 700 }}>binnen 1 uur aan de lijn</div>
          </div>
        </div>
      </Card>
      <Card at={F(T(scene, "uur")) - 8} outAt={end} style={{ padding: "40px 48px 44px", width: 940 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          {regels.map(([w, label]) => {
            const at = F(T(scene, w));
            return <Regel key={w} at={at} icon={<Vinkje at={at + 4} size={60} />} size={46}>{label}</Regel>;
          })}
        </div>
      </Card>
    </Top>
  );
};

// ---------- Cases: Beverwijk en Dordrecht (body 3 en 4) ----------
export const CasesScene: React.FC<SceneProps> = ({ scene, outAt }) => {
  const F = useF();
  const end = F(outAt) - 6;
  const tB = F(T(scene, "beverwijk"));
  const t5 = F(T(scene, "5"));
  const tD = F(T(scene, "dordrecht"));
  const t10 = F(T(scene, "10"));
  const Case: React.FC<{ at: number; nAt: number; n: number; plaats: string; wat: string; wanneer: string; from: "left" | "right"; dark?: boolean }> = ({ at, nAt, n, plaats, wat, wanneer, from, dark }) => (
    <Card at={at} outAt={end} from={from} bg={dark ? colors.plum : colors.cream} style={{ padding: "36px 48px 40px", width: 940, display: "flex", alignItems: "center", gap: 36 }}>
      <div style={{ ...serif, fontSize: 190, lineHeight: 0.9, color: dark ? colors.pink : colors.plum, minWidth: 200, textAlign: "center" }}>
        <Teller at={nAt} to={n} dur={16} />
      </div>
      <div>
        <Kicker color={dark ? colors.pink : colors.plum}>Project {plaats}</Kicker>
        <div style={{ ...serif, fontSize: 56, color: dark ? colors.cream : colors.plum, marginTop: 8 }}>{wat}</div>
        <div style={{ ...sans, color: dark ? colors.sand : colors.plumSoft, marginTop: 4 }}>{wanneer}</div>
      </div>
    </Card>
  );
  return (
    <Top top={270} gap={26}>
      <Case at={tB - 6} nAt={t5} n={5} plaats="Beverwijk" wat="units verkocht" wanneer="in de eerste maand" from="left" />
      <Case at={tD - 6} nAt={t10} n={10} plaats="Dordrecht" wat="verkopen" wanneer="in 3 maanden" from="right" dark />
    </Top>
  );
};

// ---------- De helft van het probleem (body 4) ----------
export const HelftScene: React.FC<SceneProps> = ({ scene, outAt }) => {
  const F = useF();
  const end = F(outAt) - 6;
  const tHelft = F(T(scene, "helft"));
  const tOpvolg = F(T(scene, "opgevolgd"));
  const links = usePop(F(T(scene, "weinig")) - 2);
  const rechts = usePop(tOpvolg - 4);
  return (
    <Top top={270} gap={26}>
      <Card at={F(scene.start) - 4} outAt={end} style={{ padding: "44px 52px 50px", width: 940 }}>
        <div style={{ ...serif, fontSize: 60 }}>
          Te weinig leads is maar <Mark at={tHelft}>de helft</Mark> van het probleem
        </div>
        <div style={{ display: "flex", gap: 16, marginTop: 34 }}>
          <div style={{ flex: 1, height: 220, borderRadius: "110px 20px 20px 110px", background: colors.pink, display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${links})`, padding: 20 }}>
            <div style={{ ...serif, fontSize: 40, textAlign: "center" }}>Te weinig leads</div>
          </div>
          <div style={{ flex: 1, height: 220, borderRadius: "20px 110px 110px 20px", background: colors.plum, display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${rechts})`, padding: 20 }}>
            <div style={{ ...serif, fontSize: 40, textAlign: "center", color: colors.cream }}>Slechte opvolging</div>
          </div>
        </div>
      </Card>
    </Top>
  );
};

// ---------- Lege agenda, units langer te koop (body 4) ----------
export const LeegScene: React.FC<SceneProps> = ({ scene, outAt }) => {
  const F = useF();
  const frame = useCurrentFrame();
  const end = F(outAt) - 6;
  const tKoop = F(T(scene, "koop"));
  const swing = Math.sin((frame - tKoop) / 6) * 7 * Math.exp(-Math.max(0, frame - tKoop) / 22);
  const bord = usePop(tKoop - 4, { damping: 7, stiffness: 150, mass: 1 });
  const uit = useOut(end);
  return (
    <Top top={270} gap={26}>
      <Card at={F(scene.start) - 4} outAt={end} style={{ padding: "40px 52px 46px", width: 940 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <Calendar size={60} color={colors.plum} />
          <div style={{ ...serif, fontSize: 60 }}>
            Je agenda blijft <Mark at={F(T(scene, "leeg"))}>leeg</Mark>
          </div>
        </div>
        <Agenda at={0} leeg />
      </Card>
      <div style={{ marginLeft: 200, transformOrigin: "50% 0", transform: `translateY(${(1 - bord) * -900}px) rotate(${swing}deg)`, opacity: frame < tKoop - 4 ? 0 : 1 - uit }}>
        <div style={{ display: "flex", justifyContent: "space-between", width: 560, padding: "0 70px" }}>
          <div style={{ width: 6, height: 60, background: colors.sand }} />
          <div style={{ width: 6, height: 60, background: colors.sand }} />
        </div>
        <div style={{ width: 560, borderRadius: 26, background: colors.plum, border: `8px solid ${colors.cream}`, padding: "26px 0 32px", textAlign: "center" }}>
          <div style={{ ...serif, fontSize: 92, color: colors.pink }}>Te koop</div>
          <div style={{ ...sans, color: colors.cream }}>langer dan nodig</div>
        </div>
      </div>
    </Top>
  );
};

// ---------- Ons systeem lost allebei op (body 4) ----------
export const SysteemScene: React.FC<SceneProps> = ({ scene, outAt }) => {
  const F = useF();
  const end = F(outAt) - 6;
  const tJuiste = F(T(scene, "juiste"));
  const tAanvraag = F(T(scene, "aanvraag"));
  return (
    <Top top={260} gap={26}>
      <Card at={F(scene.start) - 4} outAt={end} bg={colors.plum} style={{ padding: "36px 48px 40px" }}>
        <div style={{ ...serif, fontSize: 64, color: colors.cream }}>
          Ons systeem lost <span style={{ fontFamily: fonts.serifItalic, fontStyle: "italic", color: colors.pink }}>allebei</span> op
        </div>
      </Card>
      <Card at={tJuiste - 8} outAt={end} style={{ padding: "40px 48px 46px", width: 940 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
          <Regel at={tJuiste} icon={<Vinkje at={tJuiste + 4} size={64} />} size={50}>
            De juiste kopers vinden je project
          </Regel>
          <Regel at={tAanvraag} icon={<Vinkje at={tAanvraag + 4} size={64} />} size={50}>
            Elke aanvraag wordt een gesprek
          </Regel>
        </div>
      </Card>
    </Top>
  );
};

// ---------- Volle agenda (body 4) ----------
export const VolScene: React.FC<SceneProps> = ({ scene, outAt }) => {
  const F = useF();
  const end = F(outAt) - 6;
  const tVol = F(T(scene, "volle"));
  return (
    <Top top={260} gap={24}>
      <Card at={F(scene.start) - 4} outAt={end} style={{ padding: "44px 52px 48px", width: 940 }}>
        <Kicker>Je verkoopteam krijgt</Kicker>
        <div style={{ ...serif, fontSize: 66, marginTop: 10 }}>
          een <Mark at={tVol}>volle agenda</Mark>
        </div>
        <Agenda at={tVol + 2} vol />
      </Card>
      <div style={{ display: "flex", gap: 16 }}>
        <Chip at={F(T(scene, "serieus")) - 2} outAt={end} dark>
          Serieuze kopers
        </Chip>
        <Chip at={F(T(scene, "budget")) - 2} outAt={end} pink>
          Mét budget
        </Chip>
      </div>
    </Top>
  );
};

// ---------- Meer leads, meer afspraken, sneller uitverkocht (body 4) ----------
export const MeerScene: React.FC<SceneProps> = ({ scene, outAt }) => {
  const F = useF();
  const frame = useCurrentFrame();
  const end = F(outAt) - 6;
  const items: [string, string, number][] = [
    ["leads", "Meer leads", 0.55],
    ["afspraken", "Meer afspraken", 0.75],
    ["sneller", "Sneller uitverkocht", 1],
  ];
  return (
    <Top top={270}>
      <Card at={F(scene.start) - 4} outAt={end} style={{ padding: "44px 52px 40px", width: 940 }}>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 26, height: 560 }}>
          {items.map(([w, label, h], i) => {
            const at = F(T(scene, w));
            const g = interpolate(frame, [at - 2, at + 14], [0, 1], { ...clamp, easing: Easing.out(Easing.back(1.4)) });
            return (
              <div key={w} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
                <div style={{ ...serif, fontSize: 40, textAlign: "center", opacity: g, minHeight: 100, display: "flex", alignItems: "flex-end" }}>{label}</div>
                <div style={{ width: "100%", height: 400 * h * g, borderRadius: "24px 24px 8px 8px", background: i === 2 ? colors.plum : colors.pink }} />
              </div>
            );
          })}
        </div>
      </Card>
    </Top>
  );
};

// ---------- Call to action ----------
export const CtaScene: React.FC<SceneProps & { clip: string }> = ({ scene, clip }) => {
  const F = useF();
  const frame = useCurrentFrame();
  const t0 = F(scene.start) - 6;
  const tKlik = F(T(scene, "klik"));
  const tPlan = F(T(scene, "plan"));
  const panel = interpolate(frame, [t0, t0 + 14], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const frameP = usePop(t0 + 6);
  const btn = usePop(tKlik, { damping: 9, stiffness: 180, mass: 0.8 });
  const pulse = frame > tKlik + 10 ? 1 + Math.sin((frame - tKlik) / 5) * 0.035 : 1;
  const arrow = usePop(tPlan);
  const headP = usePop(t0 + 10);
  const kop = has(scene, "losse")
    ? ["Van losse partijen naar ", "één systeem"]
    : has(scene, "partner")
      ? ["Een partner die verder gaat ", "dan de lead"]
      : ["Start je binnenkort met ", "een nieuw project?"];
  return (
    <AbsoluteFill style={{ clipPath: `inset(${(1 - panel) * 100}% 0 0 0)`, background: colors.cream }}>
      <div style={{ position: "absolute", top: 110, left: 70, right: 70, height: 680, overflow: "hidden", borderRadius: 40, transform: `scale(${0.9 + 0.1 * frameP})`, opacity: frameP }}>
        <Sequence from={t0}>
          <OffthreadVideo src={staticFile(`clips/${clip}.mp4`)} muted playbackRate={0.7} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </Sequence>
      </div>
      <div style={{ position: "absolute", top: 860, left: 70, right: 70, display: "flex", flexDirection: "column", alignItems: "center", gap: 34, textAlign: "center" }}>
        <div style={{ opacity: frameP }}>
          <Logo width={420} />
        </div>
        <div style={{ ...serif, fontSize: 70, opacity: headP, transform: `translateY(${(1 - headP) * 40}px)` }}>
          {kop[0]}
          <Mark at={t0 + 18}>{kop[1]}</Mark>
        </div>
        <div
          style={{
            background: colors.plum,
            color: colors.cream,
            fontFamily: fonts.sans,
            fontWeight: 700,
            fontSize: 44,
            padding: "28px 54px",
            borderRadius: 999,
            transform: `scale(${btn * pulse})`,
            boxShadow: "0 16px 40px rgba(42,26,36,0.3)",
          }}
        >
          Plan een kennismaking →
        </div>
        <svg width={70} height={100} viewBox="0 0 70 100" style={{ opacity: arrow, transform: `translateY(${Math.abs(Math.sin(frame / 7)) * 22}px)` }}>
          <path d="M35 6v80M10 62l25 26 25-26" stroke={colors.plum} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
        <div style={{ ...sans, fontSize: 32, opacity: arrow }}>nxt-estate.com</div>
      </div>
    </AbsoluteFill>
  );
};
