import React from "react";
import { interpolate } from "remotion";
import { colors, fonts } from "./brand";
import {
  Big, Counter, ease, IcBoxes, IcBolt, IcBuilding, IcCalendar, IcCamera, IcCar, IcCheck, IcCrane, IcCup, IcDesk, IcDoor, IcDrink, IcGlass, IcHall,
  IcHeat, IcLeaf, IcLift, IcLunch, IcPeople, IcPin, IcPlane, IcSolarPanel, IcSun, IcWindowSun, Kicker, Label, Logo, Panel, useCue, usePop, useRamp, useT, useScene,
} from "./ui";

const P = 50; // binnenmarge paneel
const Wrap: React.FC<{ kicker: string; children: React.ReactNode }> = ({ kicker, children }) => {
  const pop = usePop();
  return (
    <Panel>
      <div style={{ position: "absolute", left: P, top: 44, opacity: ease(pop(0.05)), transform: `translateX(${(1 - ease(pop(0.05))) * -40}px)` }}>
        <Kicker>{kicker}</Kicker>
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 120, bottom: 0 }}>{children}</div>
    </Panel>
  );
};

/** Kaart met pop-in en oranje accent zodra `on` waar is. */
const Card: React.FC<{ at: number; on: boolean; icon: React.ReactNode; title: string; sub?: string; style?: React.CSSProperties }> = ({ at, on, icon, title, sub, style }) => {
  const pop = usePop();
  const t = useT();
  const k = ease(pop(at));
  const pulse = on ? 1 + 0.025 * Math.sin((t - at) * 9) : 1;
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 30, padding: "0 36px", borderRadius: 30,
      background: on ? "rgba(255,132,11,0.20)" : "rgba(255,255,255,0.07)", border: `3px solid ${on ? colors.orange : "rgba(255,255,255,0.14)"}`,
      opacity: k, transform: `translateY(${(1 - k) * 60}px) scale(${pulse})`, ...style,
    }}>
      <div style={{ flex: "none" }}>{icon}</div>
      <div>
        <Label size={56}>{title}</Label>
        {sub && <Label size={36} color={colors.gold} style={{ marginTop: 8, fontWeight: 300 }}>{sub}</Label>}
      </div>
    </div>
  );
};

/** Is het gekoppelde woord al uitgesproken? */
const useOn = () => {
  const t = useT();
  const cue = useCue();
  return (re: RegExp, fb = 99) => t >= cue(re, fb);
};

// =============================================================== BODY 1

export const AfstandCentrum: React.FC = () => {
  const pop = usePop(), ramp = useRamp(), cue = useCue(), t = useT();
  const c = cue(/kilometer|één/i, 3);
  const line = ease(ramp(0.4, 2.2));
  return (
    <Wrap kicker="Ligging">
      <svg width="980" height="880" viewBox="0 0 980 880" style={{ position: "absolute", left: 0, top: 0 }}>
        {[0, 1, 2].map((i) => (
          <path key={i} d={`M0 ${640 + i * 60} q 60 -30 120 0 t 120 0 t 120 0 t 120 0 t 120 0 t 120 0 t 120 0 t 120 0 t 120 0`} fill="none" stroke={colors.copper} strokeWidth="5" opacity={0.7 - i * 0.2}
            transform={`translate(${-((t * 60 * (1 + i * 0.4)) % 240)} 0)`} />
        ))}
        <path d="M150 400 L830 400" stroke={colors.white} strokeWidth="8" strokeDasharray="22 18" strokeLinecap="round" strokeDashoffset={0} pathLength={1}
          style={{ strokeDasharray: `${line * 680} 700` }} />
        <circle cx={150 + line * 680} cy={400} r="14" fill={colors.orange} />
      </svg>
      <div style={{ position: "absolute", left: 60, top: 230, transform: `scale(${ease(pop(0.2))})`, transformOrigin: "bottom center", textAlign: "center", width: 200 }}>
        <IcPin size={150} color={colors.orange} />
        <Label size={34} style={{ marginTop: 6 }}>HBC</Label>
      </div>
      <div style={{ position: "absolute", right: 60, top: 230, transform: `scale(${ease(pop(1.8))})`, transformOrigin: "bottom center", textAlign: "center", width: 240 }}>
        <IcPin size={150} color={colors.white} />
        <Label size={34} style={{ marginTop: 6 }}>Centrum Haarlem</Label>
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 430, textAlign: "center", opacity: ease(pop(c)), transform: `scale(${0.7 + 0.3 * ease(pop(c))})` }}>
        <Big size={300} color={colors.orange}><Counter to={1} from={0} at={c} dur={0.4} /> km</Big>
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 740, textAlign: "center", opacity: ease(pop(0.8)) }}>
        <Label size={54} color={colors.gold}>aan Het Spaarne</Label>
      </div>
    </Wrap>
  );
};

export const OptiesStapel: React.FC = () => {
  const on = useOn(), cue = useCue(), pop = usePop();
  const items = [
    { re: /overhead/i, icon: <IcDoor size={110} color={colors.white} />, title: "Unit met overheaddeur", sub: "± 120 m² over twee lagen" },
    { re: /glazen/i, icon: <IcGlass size={110} color={colors.white} />, title: "Unit met glazen gevel", sub: "± 120 m² over twee lagen" },
    { re: /kantoorunits/i, icon: <IcDesk size={110} color={colors.white} />, title: "Kantoorunit", sub: "4e verdieping" },
    { re: /hallen/i, icon: <IcHall size={110} color={colors.white} />, title: "3 grote hallen", sub: "zwaar belastbare vloer" },
  ];
  const act = items.map((x) => on(x.re)).lastIndexOf(true);
  return (
    <Wrap kicker="Jouw keuze">
      <div style={{ position: "absolute", left: P, right: P, top: 0, display: "flex", flexDirection: "column", gap: 22 }}>
        {items.map((x, i) => (
          <Card key={i} at={cue(x.re, 1 + i)} on={act === i} icon={x.icon} title={x.title} sub={x.sub} style={{ height: 190 }} />
        ))}
      </div>
      <div style={{ position: "absolute", right: 70, top: 862, opacity: ease(pop(cue(/120/, 2))) }} />
    </Wrap>
  );
};

export const TweeLagen: React.FC = () => {
  const on = useOn(), cue = useCue(), pop = usePop(), t = useT();
  const up = ease(pop(cue(/boven/i, 3)));
  const dn = ease(pop(cue(/beneden/i, 1)));
  return (
    <Wrap kicker="Unit met overheaddeur">
      <div style={{ position: "absolute", left: 110, right: 110, top: 10, height: 760 }}>
        <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 360, borderRadius: 26, border: `4px solid ${on(/boven/i) ? colors.orange : "rgba(255,255,255,0.3)"}`,
          background: "rgba(255,255,255,0.06)", opacity: up, transform: `translateY(${(1 - up) * -80}px)`, display: "flex", alignItems: "center", justifyContent: "center", gap: 36 }}>
          <IcDesk size={150} color={colors.white} />
          <div><Kicker>Boven</Kicker><Label size={48}>Kantoor of kantine</Label></div>
        </div>
        <div style={{ position: "absolute", left: 0, right: 0, top: 390, height: 360, borderRadius: 26, border: `4px solid ${on(/beneden/i) ? colors.orange : "rgba(255,255,255,0.3)"}`,
          background: "rgba(255,255,255,0.06)", opacity: dn, transform: `translateY(${(1 - dn) * 80}px)`, display: "flex", alignItems: "center", justifyContent: "center", gap: 36 }}>
          <IcDoor size={150} color={colors.white} />
          <div><Kicker>Beneden</Kicker><Label size={48}>Werkplaats of opslag</Label></div>
        </div>
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 790, textAlign: "center", opacity: ease(pop(cue(/precies/i, 4))), transform: `scale(${0.8 + 0.2 * ease(pop(cue(/precies/i, 4)))})` }}>
        <span style={{ fontFamily: fonts.head, fontSize: 52, color: colors.slate, background: colors.orange, padding: "14px 36px", borderRadius: 60, textTransform: "uppercase" }}>Zoals jij het wilt</span>
      </div>
    </Wrap>
  );
};

export const Helling: React.FC = () => {
  const pop = usePop(), cue = useCue(), t = useT(), ramp = useRamp();
  const h0 = cue(/hellingbaan/i, 0.3), l0 = cue(/goederenlift/i, 2.5);
  const run = ramp(h0 + 0.2, h0 + 2.4);
  const lift = ramp(l0, l0 + 1.6);
  const bx = 90 + run * 460, by = 640 - run * 230;
  return (
    <Wrap kicker="Eenvoudig laden en lossen">
      <svg width="980" height="880" viewBox="0 0 980 880" style={{ position: "absolute", left: 0, top: 0 }}>
        <path d="M40 700 H110 L560 410 H940" stroke={colors.white} strokeWidth="10" fill="none" strokeLinejoin="round" />
        <path d="M40 700 H110 L560 410 V700 Z" fill="rgba(255,255,255,0.06)" />
        {[0, 1, 2].map((i) => {
          const o = ((t * 0.9 + i / 3) % 1);
          return <path key={i} d={`M${230 + i * 110} ${600 - i * 66} q 14 -26 0 -52 t 0 -52`} stroke={colors.orange} strokeWidth="8" fill="none" strokeLinecap="round" opacity={ease(pop(h0)) * (1 - o)} transform={`translate(0 ${-o * 50})`} />;
        })}
        <rect x={bx - 20} y={by - 90} width="120" height="90" rx="10" fill={colors.copper} opacity={ease(pop(0.2))} transform={`rotate(${-27 * (run < 1 ? 1 : 0)} ${bx + 40} ${by})`} />
        <rect x="770" y="190" width="150" height="500" rx="10" fill="rgba(255,255,255,0.08)" stroke={colors.white} strokeWidth="6" opacity={ease(pop(l0 - 0.3))} />
        <rect x="790" y={560 - lift * 330} width="110" height="100" rx="10" fill={colors.orange} opacity={ease(pop(l0 - 0.2))} />
        <path d="M845 160 l-26 34 h52z" fill={colors.orange} opacity={ease(pop(l0))} />
      </svg>
      <div style={{ position: "absolute", left: P, top: 40, opacity: ease(pop(h0)) }}>
        <Big size={68}>Verwarmde<br />hellingbaan</Big>
      </div>
      <div style={{ position: "absolute", right: P, top: 40, textAlign: "right", opacity: ease(pop(l0)) }} />
      <div style={{ position: "absolute", left: P, right: P, top: 760, display: "flex", justifyContent: "space-between", opacity: ease(pop(l0)) }}>
        <Label size={44} color={colors.gold}>Goederenlift</Label><Label size={44} color={colors.gold}>→ dekniveau</Label>
      </div>
    </Wrap>
  );
};

const DotGrid: React.FC<{ n: number; cols: number; size: number; gap: number; start: number; dur: number; hi?: (i: number) => boolean; hiAt?: number; color?: (i: number) => string }> = ({ n, cols, size, gap, start, dur, hi, hiAt = 0, color }) => {
  const t = useT();
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, ${size}px)`, gap }}>
      {Array.from({ length: n }, (_, i) => {
        const at = start + (i / n) * dur;
        const k = ease(interpolate(t, [at, at + 0.25], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
        const h = hi?.(i) && t >= hiAt;
        return <div key={i} style={{ width: size, height: size, borderRadius: size * 0.22, opacity: k, transform: `scale(${0.4 + 0.6 * k})`, background: h ? colors.orange : color ? color(i) : "rgba(255,255,255,0.75)" }} />;
      })}
    </div>
  );
};

export const Parkeren: React.FC = () => {
  const cue = useCue(), pop = usePop();
  const c148 = cue(/148/, 0.3), c16 = cue(/^16|laadpunt/i, 3);
  return (
    <Wrap kicker="Parkeren">
      <div style={{ position: "absolute", left: P, top: 0, display: "flex", alignItems: "baseline", gap: 24 }}>
        <Big size={200} color={colors.white}><Counter to={148} at={c148} dur={1.6} /></Big>
        <Label size={44} color={colors.gold}>parkeerplaatsen</Label>
      </div>
      <div style={{ position: "absolute", left: P + 6, top: 250 }}>
        <DotGrid n={148} cols={16} size={40} gap={12} start={c148} dur={1.6} hi={(i) => i >= 16 && i < 32} hiAt={c16} />
      </div>
      <div style={{ position: "absolute", left: P, right: P, top: 700, display: "flex", alignItems: "center", gap: 24, opacity: ease(pop(c16)), transform: `translateY(${(1 - ease(pop(c16))) * 40}px)` }}>
        <IcBolt size={110} color={colors.orange} />
        <Big size={150} color={colors.orange}><Counter to={16} at={c16} dur={0.6} /></Big>
        <Label size={50}>met laadpunt</Label>
      </div>
    </Wrap>
  );
};

export const Snelwegen: React.FC = () => {
  const cue = useCue(), pop = usePop(), t = useT();
  const roads = [
    { re: /A9/, x: 100, y: 120, n: "A9" }, { re: /A5/, x: 700, y: 120, n: "A5" },
    { re: /A2/, x: 100, y: 620, n: "A2" }, { re: /A10|ring/i, x: 700, y: 620, n: "A10" },
  ];
  const cx = 490, cy = 480;
  return (
    <Wrap kicker="Snel bij je klanten">
      <svg width="980" height="880" viewBox="0 0 980 880" style={{ position: "absolute", left: 0, top: 0 }}>
        {roads.map((r, i) => {
          const at = cue(r.re, 0.5 + i), k = ease(pop(at));
          const rx = r.x + 90, ry = r.y + 60;
          const m = (t * 0.7 + i * 0.25) % 1;
          return (
            <g key={i}>
              <line x1={cx} y1={cy} x2={rx} y2={ry} stroke="rgba(255,255,255,0.35)" strokeWidth="10" strokeLinecap="round" strokeDasharray={`${k * 520} 600`} />
              <circle cx={cx + (rx - cx) * m} cy={cy + (ry - cy) * m} r="12" fill={colors.orange} opacity={k} />
            </g>
          );
        })}
      </svg>
      {roads.map((r, i) => {
        const k = ease(pop(cue(r.re, 0.5 + i)));
        return (
          <div key={i} style={{ position: "absolute", left: r.x, top: r.y, width: 180, height: 120, borderRadius: 18, background: "#d7192d", border: "5px solid white",
            display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${k})`, boxShadow: "0 10px 30px rgba(0,0,0,0.4)" }}>
            <span style={{ fontFamily: fonts.sans, fontWeight: 700, fontSize: 84, color: "white" }}>{r.n}</span>
          </div>
        );
      })}
      <div style={{ position: "absolute", left: cx - 150, top: cy - 105, width: 300, height: 210, borderRadius: 30, background: colors.slate, border: `4px solid ${colors.orange}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", transform: `scale(${ease(pop(0.1))})` }}>
        <Logo w={170} />
      </div>
    </Wrap>
  );
};

export const Oplevering: React.FC<{ items?: string[] }> = ({ items }) => {
  const cue = useCue(), pop = usePop(), ramp = useRamp(), t = useT();
  const c = cue(/november/i, 1);
  const k = ease(pop(c - 0.2));
  const bar = ease(ramp(c, c + 2.5));
  return (
    <Wrap kicker="Oplevering">
      <div style={{ position: "absolute", left: 150, right: 150, top: 0, height: 470, borderRadius: 40, background: colors.white, transform: `scale(${0.7 + 0.3 * k}) rotate(${(1 - k) * -6}deg)`, opacity: k, overflow: "hidden", boxShadow: "0 24px 60px rgba(0,0,0,0.5)" }}>
        <div style={{ height: 150, background: colors.orange, display: "flex", alignItems: "center", justifyContent: "center" }}><IcCalendar size={100} color={colors.slate} /></div>
        <div style={{ textAlign: "center", paddingTop: 20 }}>
          <Big size={140} color={colors.slate}>Nov</Big>
          <Big size={140} color={colors.orange}>2026</Big>
        </div>
      </div>
      <div style={{ position: "absolute", left: P + 40, right: P + 40, top: 540 }}>
        {items ? items.map((s, i) => {
          const a = ease(pop(c + 0.5 + i * 0.7));
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 24, marginBottom: 20, opacity: a, transform: `translateX(${(1 - a) * 80}px)` }}>
              <div style={{ width: 70, height: 70, borderRadius: 35, background: colors.orange, display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}><IcCheck size={44} color={colors.slate} /></div>
              <Label size={52}>{s}</Label>
            </div>
          );
        }) : (
          <>
            <div style={{ height: 38, borderRadius: 19, background: "rgba(255,255,255,0.15)", overflow: "hidden" }}>
              <div style={{ width: `${bar * 100}%`, height: "100%", background: `linear-gradient(90deg, ${colors.copper}, ${colors.orange})` }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 18 }}>
              <Label size={40} color={colors.gold}>Bouw</Label><Label size={40} color={colors.gold}>Oplevering</Label>
            </div>
          </>
        )}
      </div>
      <div style={{ position: "absolute", right: 70, top: 20, opacity: 1 - bar }}><IcCrane size={120} color={colors.gold} /></div>
    </Wrap>
  );
};

// =============================================================== BODY 2

export const Bedrijven: React.FC = () => {
  const cue = useCue(), pop = usePop();
  const c = cue(/126/, 0.3);
  const pal = [colors.orange, colors.copper, colors.gold, colors.white, colors.green, "#7fb6d9"];
  return (
    <Wrap kicker="Community">
      <div style={{ position: "absolute", left: P, top: 0, display: "flex", alignItems: "baseline", gap: 24 }}>
        <Big size={240}><Counter to={126} at={c} dur={1.8} /></Big>
        <Label size={56} color={colors.gold}>bedrijven</Label>
      </div>
      <div style={{ position: "absolute", left: P + 8, top: 270 }}>
        <DotGrid n={126} cols={14} size={52} gap={13} start={c} dur={1.8} color={(i) => pal[(i * 7 + (i >> 2)) % pal.length]} />
      </div>
      {[{ re: /stucadoor/i, t: "Stucadoor", l: P, y: 780 }, { re: /kunstenaar/i, t: "Kunstenaar", l: 560, y: 780 }].map((x, i) => {
        const k = ease(pop(cue(x.re, 3 + i)));
        return <div key={i} style={{ position: "absolute", left: x.l, top: x.y, opacity: k, transform: `translateY(${(1 - k) * 50}px)`, fontFamily: fonts.head, fontSize: 54, color: colors.slate, background: i ? colors.gold : colors.orange, padding: "14px 34px", borderRadius: 60, textTransform: "uppercase" }}>{x.t}</div>;
      })}
    </Wrap>
  );
};

export const Netwerk: React.FC = () => {
  const cue = useCue(), pop = usePop(), t = useT();
  const nodes = [[490, 380], [140, 140], [840, 140], [100, 500], [880, 500], [300, 680], [690, 680]];
  const edges = [[0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [0, 6], [1, 2], [3, 5], [4, 6], [5, 6], [1, 3], [2, 4]];
  const tags = [{ re: /versterken/i, t: "Versterken elkaar", y: 840 }, { re: /ervaringen/i, t: "Delen ervaringen", y: 840 }, { re: /zaken/i, t: "Samen zaken doen", y: 840 }];
  const act = tags.map((x) => t >= cue(x.re, 99)).lastIndexOf(true);
  return (
    <Wrap kicker="Samen sterker">
      <svg width="980" height="880" viewBox="0 0 980 880" style={{ position: "absolute", left: 0, top: 0 }}>
        {edges.map(([a, b], i) => {
          const k = ease(pop(0.2 + i * 0.12));
          const m = (t * 0.6 + i * 0.37) % 1;
          return (
            <g key={i}>
              <line x1={nodes[a][0]} y1={nodes[a][1]} x2={nodes[b][0]} y2={nodes[b][1]} stroke={colors.white} strokeOpacity={0.35 * k} strokeWidth="5" />
              <circle cx={nodes[a][0] + (nodes[b][0] - nodes[a][0]) * m} cy={nodes[a][1] + (nodes[b][1] - nodes[a][1]) * m} r="9" fill={colors.orange} opacity={k} />
            </g>
          );
        })}
        {nodes.map(([x, y], i) => <circle key={i} cx={x} cy={y} r={i === 0 ? 70 : 46} fill={i === 0 ? colors.orange : colors.slateLight} stroke={colors.white} strokeWidth="5" transform={`translate(${x} ${y}) scale(${ease(pop(0.1 + i * 0.1))}) translate(${-x} ${-y})`} />)}
      </svg>
      {nodes.map(([x, y], i) => <div key={i} style={{ position: "absolute", left: x - 30, top: y - 30, transform: `scale(${ease(pop(0.2 + i * 0.1))})` }}>{i === 0 ? <div style={{ position: "relative", left: -10, top: -10 }}><IcPeople size={80} color={colors.slate} /></div> : <IcPeople size={60} color={colors.white} />}</div>)}
      <div style={{ position: "absolute", left: 0, right: 0, top: 780, textAlign: "center" }}>
        {act >= 0 && <span key={act} style={{ fontFamily: fonts.head, fontSize: 64, color: colors.slate, background: colors.orange, padding: "14px 40px", borderRadius: 60, textTransform: "uppercase" }}>{tags[act].t}</span>}
      </div>
    </Wrap>
  );
};

export const Dakterras: React.FC = () => {
  const cue = useCue(), pop = usePop(), t = useT();
  const c = cue(/bovenste/i, 0.2), c2 = cue(/dakterras|uitzicht/i, 2.5);
  const floors = ["Begane grond", "1e verdieping", "2e verdieping", "3e verdieping", "4e verdieping"];
  return (
    <Wrap kicker="Bovenste verdieping">
      <div style={{ position: "absolute", left: 170, right: 170, top: 10, display: "flex", flexDirection: "column", gap: 14 }}>
        {floors.map((f, i) => {
          const top = i === 4;
          const k = ease(pop(0.15 + (4 - i) * 0.12));
          return (
            <div key={i} style={{ order: 4 - i, height: 120, borderRadius: 18, opacity: k, transform: `translateX(${(1 - k) * (i % 2 ? 120 : -120)}px)`,
              background: top ? "rgba(255,132,11,0.25)" : "rgba(255,255,255,0.08)", border: `3px solid ${top && t >= c ? colors.orange : "rgba(255,255,255,0.18)"}`,
              display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 34px" }}>
              <Label size={42} color={top ? colors.white : colors.grey}>{f}</Label>
              {top && <div style={{ display: "flex", gap: 20 }}><IcCup size={70} color={colors.orange} /><IcLunch size={70} color={colors.orange} /></div>}
            </div>
          );
        })}
      </div>
      <div style={{ position: "absolute", left: P, right: P, top: 700, display: "flex", gap: 24, opacity: ease(pop(c2)), transform: `translateY(${(1 - ease(pop(c2))) * 50}px)` }}>
        <div style={{ flex: 1, borderRadius: 26, background: colors.orange, padding: "28px 32px" }}><Label size={50} color={colors.slate}>Lunchroom</Label><Label size={38} color={colors.slate} style={{ fontWeight: 300 }}>met dakterras</Label></div>
        <div style={{ flex: 1, borderRadius: 26, background: colors.white, padding: "28px 32px" }}><Label size={50} color={colors.slate}>Uitzicht</Label><Label size={38} color={colors.slate} style={{ fontWeight: 300 }}>over Het Spaarne</Label></div>
      </div>
    </Wrap>
  );
};

export const Momenten: React.FC = () => {
  const on = useOn(), cue = useCue();
  const items = [
    { re: /koffie/i, icon: IcCup, t: "Koffie" }, { re: /lunch/i, icon: IcLunch, t: "Lunch met klant" }, { re: /borrel/i, icon: IcDrink, t: "Borrel" },
  ];
  const act = items.map((x) => on(x.re)).lastIndexOf(true);
  return (
    <Wrap kicker="Jouw werkweek">
      <div style={{ position: "absolute", left: P, right: P, top: 0, display: "flex", flexDirection: "column", gap: 28 }}>
        {items.map((x, i) => <Card key={i} at={cue(x.re, i * 1.2)} on={act === i} icon={<x.icon size={140} color={colors.white} />} title={x.t} style={{ height: 250 }} />)}
      </div>
    </Wrap>
  );
};

export const Entree: React.FC = () => {
  const on = useOn(), cue = useCue(), pop = usePop(), t = useT();
  const items = [
    { re: /entree|lift/i, icon: IcLift, t: "Statige entree", s: "met personenlift" },
    { re: /groen/i, icon: IcLeaf, t: "Veel groen", s: "" },
    { re: /camera/i, icon: IcCamera, t: "Camerabewaking", s: "dag en nacht" },
  ];
  const act = items.map((x) => on(x.re)).lastIndexOf(true);
  const c3 = cue(/camera/i, 3);
  return (
    <Wrap kicker="Veilig & verzorgd">
      <div style={{ position: "absolute", left: P, right: P, top: 0, display: "flex", flexDirection: "column", gap: 28 }}>
        {items.map((x, i) => <Card key={i} at={cue(x.re, i * 1.2)} on={act === i} icon={<x.icon size={130} color={colors.white} />} title={x.t} sub={x.s} style={{ height: 250 }} />)}
      </div>
      <div style={{ position: "absolute", right: 90, top: 540, display: "flex", alignItems: "center", gap: 12, opacity: ease(pop(c3)) }}>
        <div style={{ width: 24, height: 24, borderRadius: 12, background: "#e0262b", opacity: Math.sin(t * 8) > 0 ? 1 : 0.25 }} />
        <span style={{ fontFamily: fonts.head, fontSize: 44, color: colors.white }}>24/7</span>
      </div>
    </Wrap>
  );
};

export const Energie: React.FC = () => {
  const cue = useCue(), pop = usePop(), t = useT();
  const a = cue(/warmtepomp/i, 0.3), b = cue(/zonnepanelen/i, 2.5);
  const ka = ease(pop(a)), kb = ease(pop(b));
  return (
    <Wrap kicker="Duurzaam">
      <div style={{ position: "absolute", left: P, right: P, top: 0, display: "flex", flexDirection: "column", gap: 40 }}>
        <div style={{ height: 380, borderRadius: 34, background: "rgba(255,255,255,0.08)", border: `3px solid ${colors.orange}`, opacity: ka, transform: `translateY(${(1 - ka) * 60}px)`, display: "flex", alignItems: "center", gap: 36, padding: "0 40px" }}>
          <div style={{ transform: `rotate(${t * 180}deg)`, flex: "none" }}><IcHeat size={190} color={colors.white} /></div>
          <div><Kicker>Standaard</Kicker><Label size={70}>Warmtepomp</Label></div>
        </div>
        <div style={{ height: 380, borderRadius: 34, background: "rgba(255,255,255,0.08)", border: "3px solid rgba(255,255,255,0.25)", opacity: kb, transform: `translateY(${(1 - kb) * 60}px)`, display: "flex", alignItems: "center", gap: 36, padding: "0 40px" }}>
          <div style={{ position: "relative", width: 190, height: 190, flex: "none" }}>
            <div style={{ position: "absolute", left: -10, top: -20, transform: `rotate(${t * 40}deg)` }}><IcSun size={110} color={colors.yellow} /></div>
            <div style={{ position: "absolute", left: 50, top: 50 }}><IcSolarPanel size={140} color={colors.white} /></div>
          </div>
          <div><Kicker color={colors.gold}>Optioneel</Kicker><Label size={70}>Zonnepanelen</Label></div>
        </div>
      </div>
    </Wrap>
  );
};

export const Verhuurd: React.FC = () => {
  const cue = useCue(), pop = usePop();
  const c41 = cue(/41/, 0.3), c10 = cue(/^10$|verhuurd/i, 2.5);
  return (
    <Wrap kicker="Al in beweging">
      <div style={{ position: "absolute", left: P, top: 0, display: "flex", alignItems: "baseline", gap: 20 }}>
        <Big size={230} color={colors.orange}><Counter to={10} at={c10} dur={0.9} /></Big>
        <Big size={120} color={colors.grey}>/ 41</Big>
      </div>
      <div style={{ position: "absolute", left: P + 6, top: 270 }}>
        <DotGrid n={41} cols={7} size={104} gap={18} start={c41} dur={1.2} hi={(i) => i < 10} hiAt={c10} />
      </div>
      <div style={{ position: "absolute", left: P, right: P, top: 790, opacity: ease(pop(c10)) }}>
        <Label size={60}>huurunits al <span style={{ color: colors.orange }}>verhuurd</span></Label>
      </div>
    </Wrap>
  );
};

// =============================================================== BODY 3

export const Waarderweg: React.FC = () => {
  const pop = usePop(), cue = useCue(), t = useT();
  const k = ease(pop(0.2)), k2 = ease(pop(cue(/Spaarne/i, 2)));
  const rise = ease(useRamp()(cue(/verrijst|pand/i, 3), cue(/verrijst|pand/i, 3) + 1.8));
  return (
    <Wrap kicker="Nieuw in Haarlem">
      <div style={{ position: "absolute", left: 100, right: 100, top: 0, height: 210, borderRadius: 20, background: "#0a4f9c", border: "10px solid white", display: "flex", alignItems: "center", justifyContent: "center", transform: `translateY(${(1 - k) * -120}px)`, opacity: k }}>
        <span style={{ fontFamily: fonts.sans, fontWeight: 700, fontSize: 100, color: "white" }}>Waarderweg</span>
      </div>
      <svg width="980" height="880" viewBox="0 0 980 880" style={{ position: "absolute", left: 0, top: 0 }}>
        <rect x="0" y="660" width="980" height="220" fill={colors.slateLight} opacity="0.6" />
        {[0, 1, 2].map((i) => <path key={i} d={`M0 ${700 + i * 50} q 60 -30 120 0 t 120 0 t 120 0 t 120 0 t 120 0 t 120 0 t 120 0 t 120 0 t 120 0`} fill="none" stroke={colors.copper} strokeWidth="6" opacity={k2 * (0.9 - i * 0.25)} transform={`translate(${-((t * 50 * (1 + i * 0.5)) % 240)} 0)`} />)}
        {[0, 1, 2, 3, 4].map((i) => (
          <g key={i}>
            <rect x={150 + i * 140} y={650 - rise * (300 + (i % 2) * 40)} width="124" height={rise * (300 + (i % 2) * 40)} fill={colors.copper} />
            {[0, 1, 2].map((j) => <rect key={j} x={166 + i * 140} y={650 - rise * (300 + (i % 2) * 40) + 30 + j * 80} width="92" height="46" fill={colors.slate} opacity={rise} />)}
          </g>
        ))}
      </svg>
      <div style={{ position: "absolute", left: 0, right: 0, top: 790, textAlign: "center", opacity: k2 }}><Label size={52} color={colors.gold}>direct aan Het Spaarne</Label></div>
    </Wrap>
  );
};

export const Ramen: React.FC = () => {
  const cue = useCue(), pop = usePop(), t = useT(), on = useOn();
  const words = [{ re: /licht/i, t: "Licht" }, { re: /uitzicht/i, t: "Uitzicht" }, { re: /uitstraling/i, t: "Uitstraling" }];
  return (
    <Wrap kicker="Veel raampartijen">
      <div style={{ position: "absolute", left: 130, right: 130, top: 0, height: 560, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gridTemplateRows: "repeat(3, 1fr)", gap: 14, padding: 14, background: "#0f171a", borderRadius: 16 }}>
        {Array.from({ length: 9 }, (_, i) => {
          const at = 0.2 + i * 0.18, k = ease(pop(at));
          const glow = 0.5 + 0.5 * Math.sin(t * 2 + i);
          return <div key={i} style={{ background: `linear-gradient(135deg, rgba(255,214,120,${0.55 + 0.25 * glow}), rgba(135,185,225,${0.55 + 0.2 * glow}))`, opacity: k, transform: `scale(${0.6 + 0.4 * k})` }} />;
        })}
      </div>
      <div style={{ position: "absolute", left: 40, right: 40, top: 620, display: "flex", flexDirection: "column", alignItems: "center", gap: 22 }}>
        {words.map((w, i) => {
          const o = on(w.re), k = ease(pop(cue(w.re, 1 + i)));
          return <span key={i} style={{ fontFamily: fonts.head, fontSize: 80, padding: "6px 44px", borderRadius: 60, textTransform: "uppercase", opacity: k, transform: `scale(${0.8 + 0.2 * k})`, color: o ? colors.slate : colors.white, background: o ? colors.orange : "rgba(255,255,255,0.1)" }}>{w.t}</span>;
        })}
      </div>
    </Wrap>
  );
};

export const OptiesRaster: React.FC = () => {
  const on = useOn(), cue = useCue();
  const items = [
    { re: /overheaddeur/i, icon: IcDoor, t: "Overheaddeur" }, { re: /glazen/i, icon: IcGlass, t: "Glazen gevel" },
    { re: /kantoorunit/i, icon: IcDesk, t: "Kantoorunit 4e" }, { re: /hallen/i, icon: IcHall, t: "3 grote hallen" },
  ];
  const act = items.map((x) => on(x.re)).lastIndexOf(true);
  return (
    <Wrap kicker="Je huurt">
      <div style={{ position: "absolute", left: P, right: P, top: 0, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 26 }}>
        {items.map((x, i) => (
          <div key={i}>
            <Card at={cue(x.re, 1 + i)} on={act === i} icon={<x.icon size={100} color={colors.white} />} title="" style={{ height: 360, flexDirection: "column", justifyContent: "center", padding: 0, gap: 14 }} />
            <Label size={44} style={{ textAlign: "center", marginTop: -90, position: "relative", opacity: on(x.re) ? 1 : 0.6 }}>{x.t}</Label>
          </div>
        ))}
      </div>
    </Wrap>
  );
};

export const Specs: React.FC = () => {
  const cue = useCue(), pop = usePop(), on = useOn();
  const rows = [
    { re: /bouwbesluit/i, t: "Laatste bouwbesluit" }, { re: /HR|ha-er/i, t: "HR++ glas" },
    { re: /warmtepomp/i, t: "Warmtepomp" }, { re: /ventilatiebox/i, t: "Ventilatiebox" },
  ];
  return (
    <Wrap kicker="Opgeleverd met">
      <div style={{ position: "absolute", left: P, right: P, top: 0, display: "flex", flexDirection: "column", gap: 28 }}>
        {rows.map((r, i) => {
          const k = ease(pop(cue(r.re, 1 + i))), o = on(r.re);
          return (
            <div key={i} style={{ height: 190, borderRadius: 30, display: "flex", alignItems: "center", gap: 32, padding: "0 40px", opacity: k, transform: `translateX(${(1 - k) * 120}px)`,
              background: o ? "rgba(255,132,11,0.2)" : "rgba(255,255,255,0.07)", border: `3px solid ${o ? colors.orange : "rgba(255,255,255,0.14)"}` }}>
              <div style={{ width: 104, height: 104, borderRadius: 52, background: colors.orange, display: "flex", alignItems: "center", justifyContent: "center", flex: "none", transform: `scale(${ease(pop(cue(r.re, 1 + i) + 0.15))})` }}><IcCheck size={64} color={colors.slate} /></div>
              <Label size={64}>{r.t}</Label>
            </div>
          );
        })}
      </div>
    </Wrap>
  );
};

export const Zonnepanelen: React.FC = () => {
  const cue = useCue(), pop = usePop(), ramp = useRamp(), t = useT();
  const c = cue(/zonnepanelen/i, 0.3), c2 = cue(/energielasten/i, 3);
  const drop = ease(ramp(c2, c2 + 1.5));
  return (
    <Wrap kicker="Optioneel op het dak">
      <div style={{ position: "absolute", right: 100, top: 0, transform: `rotate(${t * 40}deg) scale(${ease(pop(0.1))})` }}><IcSun size={230} color={colors.yellow} /></div>
      <div style={{ position: "absolute", left: 60, top: 150, transform: `scale(${ease(pop(c))})`, transformOrigin: "left bottom" }}><IcSolarPanel size={420} color={colors.white} /></div>
      <div style={{ position: "absolute", left: P, right: P, top: 600, opacity: ease(pop(c2 - 0.3)) }}>
        <Label size={52} color={colors.gold}>Energielasten</Label>
        <div style={{ marginTop: 20, height: 70, borderRadius: 35, background: "rgba(255,255,255,0.12)", overflow: "hidden" }}>
          <div style={{ width: `${100 - drop * 62}%`, height: "100%", background: `linear-gradient(90deg, ${colors.orange}, #e0262b)`, borderRadius: 35 }} />
        </div>
        <div style={{ marginTop: 14, display: "flex", justifyContent: "flex-end", opacity: drop }}><Big size={80} color={colors.green}>▼ lager</Big></div>
      </div>
    </Wrap>
  );
};

export const Afstanden: React.FC = () => {
  const cue = useCue(), pop = usePop(), ramp = useRamp();
  const a = cue(/Schiphol/i, 0.3), b = cue(/Amsterdam/i, 2.5);
  const ba = ease(ramp(a, a + 1.5)), bb = ease(ramp(b, b + 1.5));
  return (
    <Wrap kicker="Vanaf Haarlem">
      <div style={{ position: "absolute", left: P, right: P, top: 0 }}>
        {[{ n: "Schiphol", km: 15, k: ba, at: a, icon: <IcPlane size={100} color={colors.white} /> }, { n: "Centrum Amsterdam", km: 20, k: bb, at: b, icon: <IcBuilding size={100} color={colors.white} /> }].map((r, i) => (
          <div key={i} style={{ marginBottom: 90, opacity: ease(pop(r.at - 0.1)) }}>
            <div style={{ display: "flex", alignItems: "center", gap: 24 }}>{r.icon}<Label size={60}>{r.n}</Label></div>
            <div style={{ marginTop: 26, height: 100, borderRadius: 50, background: "rgba(255,255,255,0.12)", position: "relative", overflow: "hidden" }}>
              <div style={{ width: `${r.k * (r.km / 20) * 100}%`, height: "100%", background: `linear-gradient(90deg, ${colors.copper}, ${colors.orange})`, borderRadius: 50 }} />
              <div style={{ position: "absolute", right: 36, top: 0, bottom: 0, display: "flex", alignItems: "center" }}><Big size={72}><Counter to={r.km} at={r.at} dur={1.4} /> km</Big></div>
            </div>
          </div>
        ))}
      </div>
    </Wrap>
  );
};

// =============================================================== CTA

export const CtaKaart: React.FC<{ vraag: string; knop: string; onder: string }> = ({ vraag, knop, onder }) => {
  const pop = usePop(), t = useT();
  const k = ease(pop(0.15)), kb = ease(pop(0.9, 11, 170));
  return (
    <Panel style={{ top: 230, height: 1020, background: "rgba(27,38,43,0.94)" }}>
      <div style={{ position: "absolute", left: 0, right: 0, top: 50, display: "flex", justifyContent: "center", opacity: k, transform: `scale(${0.8 + 0.2 * k})` }}><Logo w={300} /></div>
      <div style={{ position: "absolute", left: 60, right: 60, top: 400, textAlign: "center", opacity: ease(pop(0.5)), transform: `translateY(${(1 - ease(pop(0.5))) * 40}px)` }}>
        <Big size={62} style={{ lineHeight: 1.1 }}>{vraag}</Big>
      </div>
      <div style={{ position: "absolute", left: 70, right: 70, top: 790, height: 140, borderRadius: 75, background: colors.orange, display: "flex", alignItems: "center", justifyContent: "center", gap: 20,
        transform: `scale(${(0.6 + 0.4 * kb) * (1 + 0.025 * Math.sin(t * 6))})`, opacity: kb, boxShadow: `0 0 ${30 + 20 * Math.sin(t * 6)}px rgba(255,132,11,0.65)` }}>
        <span style={{ fontFamily: fonts.head, fontSize: 52, whiteSpace: "nowrap", color: colors.slate, textTransform: "uppercase" }}>{knop}</span>
        <span style={{ fontSize: 60, color: colors.slate }}>›</span>
      </div>
      <div style={{ position: "absolute", left: 60, right: 60, top: 950, textAlign: "center", opacity: ease(pop(1.3)) }}><Label size={38} color={colors.gold}>{onder}</Label></div>
    </Panel>
  );
};
