import React from "react";
import { AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { BEAT, colors, fonts } from "./brand";
import { Logo, RevealWords, useIsPortrait, useScale } from "./components";

export type OutroProps = {
  question1: string;
  question2: string;
  button: string;
  subline: string;
  url: string;
  // Tempo en timing van de muziek die vanuit de video doorloopt (in frames)
  beatFrames?: number;
  firstBeat?: number;
  finalHit?: number;
};

// Waar de tellen vallen als de muziek vanuit de video doorloopt.
export const OUTRO_DURATION = 150;

export const Outro: React.FC<OutroProps> = ({
  question1,
  question2,
  button,
  subline,
  url,
  beatFrames = BEAT,
  firstBeat = 10.6,
  finalHit = Math.round(firstBeat + 9 * beatFrames),
}) => {
  const beat = (n: number) => Math.round(firstBeat + n * beatFrames);
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = useScale();
  const portrait = useIsPortrait();

  // Alles valt op de tellen van de muziek, die vanuit de video doorloopt.
  const wipe = interpolate(frame, [0, beat(0)], [100, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  // Mintgroene markeerstift achter "nieuwe collega?"
  const highlight = interpolate(frame, [beat(2), beat(2) + 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });

  const btn = spring({ frame: frame - beat(3), fps, config: { damping: 10, stiffness: 150 } });
  // De knop "klopt" mee op elke tel zodat hij blijft opvallen
  const sinceBeat = (frame - firstBeat) % beatFrames;
  const beatPulse = frame > beat(4) ? 1 + Math.exp(-sinceBeat / 3) * 0.05 : 1;
  // Extra knal op de laatste downbeat, vlak voordat de muziek uitfadet
  const sinceHit = frame - finalHit;
  const punch = sinceHit >= 0 ? 1 + 0.12 * Math.exp(-sinceHit / 5) : 1;
  const pulse = beatPulse * punch;
  const ring = interpolate(sinceHit, [0, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  const sub = spring({ frame: frame - beat(4), fps, config: { damping: 12 } });
  const arrowIn = spring({ frame: frame - beat(5), fps, config: { damping: 14 } });
  const arrowBounce = Math.sin((sinceBeat / beatFrames) * Math.PI) * 26 * s;

  const footer = spring({ frame: frame - beat(6), fps, config: { damping: 16 } });

  const fontSize = portrait ? 118 * s : 110 * s;

  return (
    <AbsoluteFill style={{ backgroundColor: colors.red }}>
      <AbsoluteFill
        style={{
          backgroundColor: colors.cream,
          clipPath: `inset(${wipe}% 0 0 0)`,
          justifyContent: "center",
          alignItems: "center",
          fontFamily: fonts.heading,
          textAlign: "center",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: portrait ? -120 * s : -60 * s }}>
          <RevealWords
            text={question1}
            start={beat(0)}
            style={{ fontSize, fontWeight: 800, color: colors.black }}
          />
          <div style={{ position: "relative", marginTop: 4 * s }}>
            <div
              style={{
                position: "absolute",
                left: -20 * s,
                right: -20 * s,
                bottom: 8 * s,
                height: "45%",
                background: colors.mint,
                transform: `scaleX(${highlight}) rotate(-1.5deg)`,
                transformOrigin: "left center",
                borderRadius: 8 * s,
              }}
            />
            <RevealWords
              text={question2}
              start={beat(1)}
              style={{ fontSize, fontWeight: 800, color: colors.red, position: "relative" }}
            />
          </div>

          <div style={{ position: "relative", marginTop: (portrait ? 90 : 60) * s }}>
            {/* Mintgroene schokgolf op de slotklap */}
            {sinceHit >= 0 && ring < 1 ? (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: 999,
                  border: `${18 * s * (1 - ring * 0.7)}px solid ${colors.mint}`,
                  transform: `scale(${1 + ring * 0.9}, ${1 + ring * 2.2})`,
                  opacity: Math.sqrt(1 - ring),
                }}
              />
            ) : null}
            <div
              style={{
                padding: `${30 * s}px ${70 * s}px`,
                borderRadius: 999,
                background: colors.red,
                color: colors.white,
                fontSize: 64 * s,
                fontWeight: 800,
                boxShadow: `0 ${12 * s}px 0 ${colors.black}`,
                transform: `scale(${btn * pulse})`,
              }}
            >
              {button}
            </div>
          </div>

          <div
            style={{
              marginTop: 40 * s,
              fontFamily: fonts.hand,
              fontSize: 64 * s,
              color: colors.black,
              transform: `rotate(-3deg) translateY(${(1 - sub) * 30}px)`,
              opacity: sub,
            }}
          >
            {subline}
          </div>

          <svg
            width={90 * s}
            height={120 * s}
            viewBox="0 0 90 120"
            style={{
              marginTop: 30 * s,
              opacity: arrowIn,
              transform: `translateY(${arrowBounce}px)`,
            }}
          >
            <path
              d="M45 8 L45 100 M12 70 L45 104 L78 70"
              stroke={colors.red}
              strokeWidth={14}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </svg>
        </div>

        <div
          style={{
            position: "absolute",
            bottom: (portrait ? 110 : 60) * s,
            // Liggend: logo rechtsonder, zodat de pijl er niet overheen valt
            right: portrait ? undefined : 80 * s,
            display: "flex",
            flexDirection: "column",
            alignItems: portrait ? "center" : "flex-end",
            gap: 12 * s,
            opacity: footer,
            transform: `translateY(${(1 - footer) * 40}px)`,
          }}
        >
          <Logo width={340 * s} />
          <div style={{ fontSize: 34 * s, fontWeight: 600, color: colors.black, letterSpacing: 1 }}>{url}</div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
