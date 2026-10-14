import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, OffthreadVideo, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { colors, fonts } from "./brand";
import { Box, Calendar, Shield } from "./icons";
import { Card, Chip, clamp, Huisje, Kicker, norm, Scene, Streep, usePop, useOut, Vinkje, wordTime } from "./ui";

export type SceneProps = { scene: Scene; outAt: number };

const useF = () => {
  const { fps } = useVideoConfig();
  return (sec: number) => Math.round(sec * fps);
};

const has = (scene: Scene, text: string) => scene.words.some((w) => norm(w.t).startsWith(norm(text)));

const Top: React.FC<{ children: React.ReactNode; gap?: number; top?: number }> = ({ children, gap = 24, top = 260 }) => (
  <AbsoluteFill style={{ padding: `${top}px 70px 0`, display: "flex", flexDirection: "column", gap, alignItems: "flex-start" }}>
    {children}
  </AbsoluteFill>
);

const head: React.CSSProperties = { fontFamily: fonts.head, fontWeight: 800, color: colors.navy, lineHeight: 1.08, letterSpacing: -1 };
const body: React.CSSProperties = { fontFamily: fonts.sans, fontWeight: 600, fontSize: 36, color: colors.blue };

const Logo: React.FC<{ width: number; dark?: boolean }> = ({ width, dark }) => (
  <Img src={staticFile(`logo/${dark ? "huisunie-donker" : "huisunie"}.svg`)} style={{ width, display: "block" }} />
);

// Stempel die neerploft
const Stempel: React.FC<{ at: number; children: React.ReactNode; color?: string; size?: number; rot?: number }> = ({ at, children, color = colors.sky, size = 64, rot = -6 }) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [at, at + 7], [0, 1], { ...clamp, easing: Easing.in(Easing.quad) });
  const shake = frame > at + 7 ? Math.sin((frame - at) * 2) * 4 * Math.exp(-(frame - at - 7) / 5) : 0;
  return (
    <div
      style={{
        display: "inline-block",
        border: `6px solid ${color}`,
        borderRadius: 20,
        color,
        padding: "8px 28px",
        fontFamily: fonts.head,
        fontWeight: 900,
        fontSize: size,
        textTransform: "uppercase",
        transform: `rotate(${rot + shake}deg) scale(${2.2 - 1.2 * p})`,
        opacity: p,
        background: "rgba(255,255,255,0.92)",
      }}
    >
      {children}
    </div>
  );
};

// ---------- Hook: per zin een eigen kaart ----------
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
        const fontSize = zin.length > 15 ? 62 : zin.length > 10 ? 70 : 80;
        return (
          <Top key={z} top={290}>
            <Card at={at} outAt={out} from={z % 2 ? "right" : "up"} style={{ padding: "52px 56px 58px", maxWidth: 940 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 22 }}>
                <Huisje size={34} />
                <Kicker>{z === 0 ? "Huis verkopen?" : "Herkenbaar?"}</Kicker>
              </div>
              <div style={{ ...head, fontSize, display: "flex", flexWrap: "wrap", columnGap: "0.25em", rowGap: 8 }}>
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
                        color: isAccent && mark > 0.5 ? colors.white : colors.navy,
                      }}
                    >
                      {isAccent ? (
                        <span
                          style={{
                            position: "absolute",
                            left: -10,
                            right: -10,
                            top: "2%",
                            bottom: "-4%",
                            borderRadius: 14,
                            background: colors.sky,
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

// ---------- Wij kopen uw huis zoals het is ----------
export const ZoalsScene: React.FC<SceneProps> = ({ scene, outAt }) => {
  const F = useF();
  const t0 = F(scene.start);
  const tZoals = F(wordTime(scene, "zoals"));
  const end = F(outAt) - 6;
  const huis = usePop(t0 + 2, { damping: 8, stiffness: 160, mass: 0.9 });
  const voorU = has(scene, "dan");
  return (
    <Top top={270} gap={26}>
      {voorU ? (
        <Chip at={t0} outAt={end} dark>
          Dan is Huisunie er voor u
        </Chip>
      ) : null}
      <Card at={voorU ? tZoals - 14 : t0 - 4} outAt={end} style={{ padding: "48px 56px 54px", width: 940 }}>
        <Logo width={300} dark />
        <div style={{ display: "flex", alignItems: "center", gap: 30, marginTop: 34 }}>
          <div style={{ transform: `scale(${huis}) rotate(${(1 - huis) * -20}deg)` }}>
            <Huisje size={150} />
          </div>
          <div>
            <div style={{ ...head, fontSize: 58 }}>koopt uw huis</div>
            <div style={{ position: "relative", display: "inline-block", marginTop: 8 }}>
              <Stempel at={tZoals} size={70}>
                Zoals het is
              </Stempel>
            </div>
          </div>
        </div>
      </Card>
    </Top>
  );
};

// ---------- Niets opknappen, opruimen, schoonmaken ----------
export const NietsScene: React.FC<SceneProps> = ({ scene, outAt }) => {
  const F = useF();
  const end = F(outAt) - 6;
  const rijen: [string, string][] = (
    [
      ["knappen", "Opknappen"],
      ["ruimen", "Opruimen"],
      ["schoon", "Schoonmaken"],
    ] as [string, string][]
  ).filter(([w]) => has(scene, w));
  const t0 = F(wordTime(scene, "niets"));
  return (
    <Top top={270}>
      <Card at={t0 - 6} outAt={end} style={{ padding: "44px 56px 50px", width: 940 }}>
        <Kicker>U hoeft niets</Kicker>
        <div style={{ display: "flex", flexDirection: "column", gap: 26, marginTop: 26 }}>
          {rijen.map(([w, label]) => {
            const t = F(wordTime(scene, w)) - 2;
            return <Rij key={w} at={t} label={label} />;
          })}
        </div>
      </Card>
    </Top>
  );
};

const Rij: React.FC<{ at: number; label: string; tag?: string }> = ({ at, label, tag = "Niet nodig" }) => {
  const p = usePop(at - 4);
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20, opacity: p, transform: `translateX(${(1 - p) * -60}px)` }}>
      <div style={{ position: "relative", ...head, fontSize: 60, color: colors.blue }}>
        {label}
        <Streep at={at + 4} />
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ fontFamily: fonts.head, fontWeight: 800, fontSize: 30, color: colors.green, opacity: interpolate(useCurrentFrame(), [at + 8, at + 14], [0, 1], clamp) }}>{tag}</div>
        <Vinkje at={at + 8} size={60} />
      </div>
    </div>
  );
};

// ---------- Spullen mogen blijven staan ----------
export const SpullenScene: React.FC<SceneProps> = ({ scene, outAt }) => {
  const F = useF();
  const t0 = F(wordTime(scene, "spullen"));
  const tLaten = F(wordTime(scene, has(scene, "laten") ? "laten" : "blijven"));
  const end = F(outAt) - 6;
  return (
    <Top top={270} gap={26}>
      <Card at={t0 - 6} outAt={end} style={{ padding: "44px 56px 50px", width: 940 }}>
        <Kicker>Spullen die u niet meeneemt?</Kicker>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 18, height: 220, marginTop: 20 }}>
          {[0, 1, 2, 3].map((i) => (
            <Doos key={i} at={t0 + 2 + i * 4} size={i % 2 ? 130 : 170} />
          ))}
        </div>
      </Card>
      <Card at={tLaten - 4} outAt={end} bg={colors.navy} from="right" style={{ padding: "30px 48px 34px", display: "flex", alignItems: "center", gap: 24 }}>
        <Vinkje at={tLaten + 2} size={70} />
        <div style={{ ...head, fontSize: 58, color: colors.white }}>Gewoon laten staan</div>
      </Card>
    </Top>
  );
};

const Doos: React.FC<{ at: number; size: number }> = ({ at, size }) => {
  const p = usePop(at, { damping: 9, stiffness: 240, mass: 0.6 });
  const frame = useCurrentFrame();
  return (
    <div style={{ transform: `translateY(${(1 - p) * -300}px) rotate(${(1 - p) * 20}deg)`, opacity: frame >= at ? 1 : 0 }}>
      <div style={{ width: size, height: size * 0.8, background: "#c9965f", borderRadius: 12, position: "relative", boxShadow: "inset 0 -10px 0 rgba(0,0,0,0.12)" }}>
        <div style={{ position: "absolute", left: "44%", width: "12%", top: 0, bottom: 0, background: "#e3b984" }} />
        <div style={{ position: "absolute", left: "50%", top: "40%", transform: "translate(-50%, -50%)" }}>
          <Box size={size * 0.35} color="#7a5530" />
        </div>
      </div>
    </div>
  );
};

// ---------- Zonder voorbehoud ----------
export const VoorbehoudScene: React.FC<SceneProps> = ({ scene, outAt }) => {
  const F = useF();
  const end = F(outAt) - 6;
  const tFin = F(wordTime(scene, "financieringsvoorbehoud"));
  const tBouw = F(wordTime(scene, "bouwkundige"));
  return (
    <Top top={270}>
      <Card at={F(scene.start) - 6} outAt={end} style={{ padding: "44px 56px 50px", width: 940 }}>
        <Kicker>Wij kopen zonder</Kicker>
        <div style={{ display: "flex", flexDirection: "column", gap: 30, marginTop: 26 }}>
          <Voorbehoud at={tFin} label="Financierings&shy;voorbehoud" />
          <Voorbehoud at={tBouw} label="Bouwkundige keuring" />
        </div>
      </Card>
    </Top>
  );
};

const Voorbehoud: React.FC<{ at: number; label: string }> = ({ at, label }) => {
  const p = usePop(at - 6);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 24, opacity: p, transform: `translateX(${(1 - p) * -60}px)` }}>
      <Vinkje at={at + 6} size={70} />
      <div style={{ position: "relative", ...head, fontSize: 52, color: colors.blue }}>
        <span dangerouslySetInnerHTML={{ __html: label }} />
        <Streep at={at + 2} />
      </div>
    </div>
  );
};

// ---------- Verkocht is echt verkocht ----------
export const ZekerheidScene: React.FC<SceneProps> = ({ scene, outAt }) => {
  const F = useF();
  const frame = useCurrentFrame();
  const end = F(outAt) - 6;
  const tVerkocht = F(wordTime(scene, "verkocht"));
  const tEcht = F(wordTime(scene, "echt"));
  const bord = usePop(tVerkocht - 4, { damping: 6, stiffness: 140, mass: 1 });
  const swing = Math.sin((frame - tVerkocht) / 6) * 8 * Math.exp(-Math.max(0, frame - tVerkocht) / 20);
  const o = useOut(end);
  return (
    <Top top={260} gap={26}>
      {has(scene, "zekerheid") ? (
        <Chip at={F(wordTime(scene, "zekerheid")) - 2} outAt={end} dark>
          Direct zekerheid over de verkoop
        </Chip>
      ) : null}
      {/* Verkoopbord dat aan zijn kettingen inzwaait */}
      <div style={{ marginLeft: 60, transformOrigin: "50% 0", transform: `translateY(${(1 - bord) * -1400}px) rotate(${swing}deg)`, opacity: frame < tVerkocht - 4 ? 0 : 1 - o }}>
        <div style={{ display: "flex", justifyContent: "space-between", width: 760, padding: "0 90px" }}>
          <div style={{ width: 6, height: 70, background: colors.grey }} />
          <div style={{ width: 6, height: 70, background: colors.grey }} />
        </div>
        <div style={{ width: 760, background: colors.navy, borderRadius: 28, padding: "40px 0 46px", textAlign: "center", boxShadow: "0 24px 60px rgba(0,24,60,0.4)", border: `8px solid ${colors.white}` }}>
          <div style={{ fontFamily: fonts.head, fontWeight: 900, fontSize: 120, color: colors.white, letterSpacing: 4 }}>VERKOCHT</div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 18, marginTop: 8, opacity: interpolate(frame, [tEcht - 2, tEcht + 6], [0, 1], clamp) }}>
            <Vinkje at={tEcht} size={60} />
            <div style={{ ...head, fontSize: 52, color: colors.sky }}>is echt verkocht</div>
          </div>
        </div>
      </div>
    </Top>
  );
};

// ---------- Verborgen gebreken ----------
export const GebrekenScene: React.FC<SceneProps> = ({ scene, outAt }) => {
  const F = useF();
  const frame = useCurrentFrame();
  const end = F(outAt) - 6;
  const tGebreken = F(wordTime(scene, "gebreken"));
  const tRisico = F(wordTime(scene, "risico"));
  const crack = interpolate(frame, [tGebreken - 4, tGebreken + 10], [0, 1], clamp);
  const sh = usePop(tRisico - 4, { damping: 8, stiffness: 180, mass: 0.8 });
  return (
    <Top top={270} gap={26}>
      <Card at={F(scene.start) - 6} outAt={end} style={{ padding: "44px 56px 50px", width: 940, display: "flex", alignItems: "center", gap: 36 }}>
        {/* Scheur die zich over het muurtje trekt */}
        <svg width={170} height={200} viewBox="0 0 170 200">
          <rect x={10} y={10} width={150} height={180} rx={16} fill={colors.light} stroke={colors.grey} strokeWidth={4} />
          <path d="M90 14 L74 62 L98 92 L70 136 L88 186" stroke={colors.navy} strokeWidth={7} fill="none" strokeLinejoin="round" strokeDasharray={220} strokeDashoffset={220 * (1 - crack)} />
        </svg>
        <div>
          <Kicker>Eventuele</Kicker>
          <div style={{ ...head, fontSize: 64, marginTop: 6 }}>verborgen gebreken?</div>
        </div>
      </Card>
      <Card at={tRisico - 6} outAt={end} bg={colors.navy} from="right" style={{ padding: "30px 48px 34px", display: "flex", alignItems: "center", gap: 26 }}>
        <div style={{ transform: `scale(${sh})` }}>
          <Shield size={90} color={colors.sky} />
        </div>
        <div style={{ ...head, fontSize: 62, color: colors.white }}>Ons risico</div>
      </Card>
    </Top>
  );
};

// ---------- Niet meteen verhuizen ----------
export const BlijvenScene: React.FC<SceneProps> = ({ scene, outAt }) => {
  const F = useF();
  const frame = useCurrentFrame();
  const end = F(outAt) - 6;
  const t0 = F(scene.start);
  const datKan = has(scene, "dat");
  const tHoeft = F(wordTime(scene, "hoeft"));
  const tJaar = F(wordTime(scene, "jaar"));
  const tRust = F(wordTime(scene, has(scene, "rustig") ? "rustig" : "rust"));
  const maanden = ["jan", "feb", "mrt", "apr", "mei", "jun", "jul", "aug", "sep", "okt", "nov", "dec"];
  const datOut = tHoeft - 6;
  return (
    <>
      {datKan ? (
        <AbsoluteFill style={{ justifyContent: "flex-start", alignItems: "center", paddingTop: 420, opacity: 1 - interpolate(frame, [datOut, datOut + 6], [0, 1], clamp) }}>
          <Stempel at={t0} size={130} color={colors.white} rot={-4}>
            <span style={{ color: colors.navy }}>Dat kan.</span>
          </Stempel>
        </AbsoluteFill>
      ) : null}
      <Top top={270} gap={26}>
        <Card at={tHoeft - 6} outAt={end} style={{ padding: "44px 52px 48px", width: 940 }}>
          <Kicker>Na de verkoop</Kicker>
          <div style={{ ...head, fontSize: 64, marginTop: 6 }}>Niet meteen verhuizen</div>
          {/* Kalender die maand voor maand volloopt */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 12, marginTop: 30 }}>
            {maanden.map((m, i) => {
              const a = tJaar - 6 + i * 2;
              const on = interpolate(frame, [a, a + 4], [0, 1], clamp);
              return (
                <div
                  key={m}
                  style={{
                    height: 76,
                    borderRadius: 16,
                    background: on > 0.5 ? colors.sky : colors.light,
                    color: on > 0.5 ? colors.white : colors.blue,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: fonts.head,
                    fontWeight: 800,
                    fontSize: 28,
                    transform: `scale(${1 + 0.12 * Math.sin(on * Math.PI)})`,
                  }}
                >
                  {m}
                </div>
              );
            })}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 24, opacity: interpolate(frame, [tJaar + 16, tJaar + 24], [0, 1], clamp) }}>
            <Calendar size={44} color={colors.sky} />
            <div style={{ ...body, fontSize: 38, fontWeight: 700 }}>Bijvoorbeeld nog een jaar blijven wonen</div>
          </div>
        </Card>
        <Chip at={tRust - 2} outAt={end} dark>
          <Huisje size={36} /> In alle rust een nieuwe plek zoeken
        </Chip>
      </Top>
    </>
  );
};

// ---------- Geen kosten ----------
export const KostenScene: React.FC<SceneProps> = ({ scene, outAt }) => {
  const F = useF();
  const end = F(outAt) - 6;
  const tMak = F(wordTime(scene, "makelaarskosten"));
  const tNot = F(wordTime(scene, "notariskosten"));
  const tBetalen = F(wordTime(scene, "betalen"));
  return (
    <Top top={270}>
      <Card at={F(scene.start) - 6} outAt={end} style={{ padding: "44px 56px 52px", width: 940 }}>
        <Kicker>Kosten</Kicker>
        <div style={{ display: "flex", flexDirection: "column", gap: 30, marginTop: 26 }}>
          <KostRij at={tMak} label="Makelaarskosten" value="€ 0" />
          <KostRij at={tNot} label="Notariskosten" value="Betalen wij" valueAt={tBetalen} />
        </div>
      </Card>
    </Top>
  );
};

const KostRij: React.FC<{ at: number; label: string; value: string; valueAt?: number }> = ({ at, label, value, valueAt }) => {
  const p = usePop(at - 4);
  const v = usePop(valueAt ?? at + 6, { damping: 7, stiffness: 200, mass: 0.7 });
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", opacity: p, transform: `translateX(${(1 - p) * -60}px)` }}>
      <div style={{ ...head, fontSize: 52, color: colors.blue }}>{label}</div>
      <div
        style={{
          fontFamily: fonts.head,
          fontWeight: 900,
          fontSize: 54,
          color: colors.white,
          background: colors.sky,
          borderRadius: 999,
          padding: "8px 30px",
          transform: `scale(${v}) rotate(${(1 - v) * 12}deg)`,
          whiteSpace: "nowrap",
        }}
      >
        {value}
      </div>
    </div>
  );
};

// ---------- Binnen 24 uur een bod (body 3) ----------
export const BodScene: React.FC<SceneProps> = ({ scene, outAt }) => {
  const F = useF();
  const frame = useCurrentFrame();
  const end = F(outAt) - 6;
  const t24 = F(wordTime(scene, "24"));
  const tBod = F(wordTime(scene, "vrijblijvend"));
  const ring = interpolate(frame, [t24 - 4, t24 + 22], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const R = 110;
  const C = 2 * Math.PI * R;
  return (
    <Top top={270} gap={26}>
      <Card at={F(scene.start) - 6} outAt={end} style={{ padding: "44px 56px 50px", width: 940, display: "flex", alignItems: "center", gap: 44 }}>
        <div style={{ position: "relative", width: 260, height: 260 }}>
          <svg width={260} height={260} style={{ transform: "rotate(-90deg)" }}>
            <circle cx={130} cy={130} r={R} stroke={colors.light} strokeWidth={26} fill="none" />
            <circle cx={130} cy={130} r={R} stroke={colors.sky} strokeWidth={26} fill="none" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - ring)} />
          </svg>
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <div style={{ ...head, fontSize: 96, lineHeight: 1 }}>{Math.round(ring * 24)}</div>
            <div style={{ ...body, fontSize: 30, fontWeight: 700 }}>uur</div>
          </div>
        </div>
        <div>
          <Kicker>Binnen 24 uur</Kicker>
          <div style={{ ...head, fontSize: 60, marginTop: 6 }}>een vrijblijvend bod</div>
        </div>
      </Card>
      <Chip at={tBod - 2} outAt={end} dark>
        <Vinkje at={tBod + 2} size={44} /> U zit nergens aan vast
      </Chip>
    </Top>
  );
};

// ---------- Call to action ----------
export const CtaScene: React.FC<SceneProps & { clip: string }> = ({ scene, clip }) => {
  const F = useF();
  const frame = useCurrentFrame();
  const t0 = F(scene.start) - 6;
  const tKlik = F(wordTime(scene, has(scene, "klik") ? "klik" : "vraag"));
  const tBod = F(wordTime(scene, "bod"));
  const panel = interpolate(frame, [t0, t0 + 14], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const frameP = usePop(t0 + 6);
  const btn = usePop(tKlik, { damping: 9, stiffness: 180, mass: 0.8 });
  const pulse = frame > tKlik + 10 ? 1 + Math.sin((frame - tKlik) / 5) * 0.035 : 1;
  const arrow = usePop(tBod);
  const headP = usePop(t0 + 10);
  const vraag = has(scene, "benieuwd");
  return (
    <AbsoluteFill style={{ clipPath: `inset(${(1 - panel) * 100}% 0 0 0)`, background: colors.navy }}>
      <div style={{ position: "absolute", top: 110, left: 70, right: 70, height: 700, overflow: "hidden", borderRadius: 40, transform: `scale(${0.9 + 0.1 * frameP})`, opacity: frameP }}>
        <Sequence from={t0}>
          <OffthreadVideo src={staticFile(`clips/${clip}.mp4`)} muted playbackRate={0.7} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </Sequence>
      </div>
      <div style={{ position: "absolute", top: 870, left: 70, right: 70, display: "flex", flexDirection: "column", alignItems: "center", gap: 34, textAlign: "center" }}>
        <div style={{ opacity: frameP }}>
          <Logo width={380} />
        </div>
        <div style={{ ...head, fontSize: 64, color: colors.white, opacity: headP, transform: `translateY(${(1 - headP) * 40}px)` }}>
          {vraag ? "Benieuwd wat uw huis oplevert?" : "Vraag gratis en vrijblijvend een bod aan"}
        </div>
        <div
          style={{
            background: colors.white,
            color: colors.navy,
            fontFamily: fonts.head,
            fontWeight: 800,
            fontSize: 46,
            padding: "28px 56px",
            borderRadius: 999,
            transform: `scale(${btn * pulse})`,
            boxShadow: "0 16px 40px rgba(0,0,0,0.3)",
          }}
        >
          Vrijblijvend bod ontvangen
        </div>
        <svg width={70} height={100} viewBox="0 0 70 100" style={{ opacity: arrow, transform: `translateY(${Math.abs(Math.sin(frame / 7)) * 22}px)` }}>
          <path d="M35 6v80M10 62l25 26 25-26" stroke={colors.sky} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
        <div style={{ fontFamily: fonts.sans, fontWeight: 600, fontSize: 32, color: colors.grey, opacity: arrow }}>huisunie.nl · ★ Beoordeeld met een 9,5</div>
      </div>
    </AbsoluteFill>
  );
};
