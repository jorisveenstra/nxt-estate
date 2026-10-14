import React from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { BEAT, colors, fonts } from "./brand";
import { RevealWords, Tape, useIsPortrait, useScale } from "./components";

export type IntroProps = {
  // Elke regel verschijnt op een tel van de muziek; de laatste regel wordt rood.
  lines: string[];
  // Lengte van één tel in frames (tempo van de muziek)
  beatFrames?: number;
};

// Eerste downbeat van de muziek valt op frame 2.
const FIRST_BEAT = 2;
const beatAt = (beatFrames: number, n: number) => Math.round(FIRST_BEAT + n * beatFrames);
// De knip naar de video valt op de downbeat van maat 3.
export const getIntroDuration = (beatFrames: number = BEAT) => beatAt(beatFrames, 8);

export const Intro: React.FC<IntroProps> = ({ lines, beatFrames = BEAT }) => {
  const beat = (n: number) => beatAt(beatFrames, n);
  const INTRO_DURATION = getIntroDuration(beatFrames);
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = useScale();
  const portrait = useIsPortrait();

  const exitAt = beat(7);

  // Mintgroene cirkel die op elke tel een klein beetje "klopt"
  const circleIn = spring({ frame, fps, config: { damping: 20, stiffness: 70 } });
  const sinceBeat = (frame - FIRST_BEAT) % beatFrames;
  const thump = frame >= FIRST_BEAT ? Math.exp(-sinceBeat / 3) * 0.035 : 0;

  // De poster wordt op de eerste downbeat opgeplakt
  const slap = spring({ frame: frame - FIRST_BEAT, fps, config: { damping: 11, stiffness: 160, mass: 0.7 } });
  const out = interpolate(frame, [exitAt + 3, INTRO_DURATION], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.in(Easing.cubic),
  });
  const posterScale = interpolate(slap, [0, 1], [1.4, 1]) + thump * 0.5;
  const posterRotate = interpolate(slap, [0, 1], [-10, -2.5]) + out * 10;

  // Rode handgetekende onderstreping onder de laatste regel
  const underline = interpolate(frame, [beat(5), beat(5) + 9], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  const posterWidth = (portrait ? 780 : 620) * s;
  const fontSize = (portrait ? 112 : 92) * s;

  return (
    <AbsoluteFill style={{ backgroundColor: colors.red, justifyContent: "center", alignItems: "center", overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          width: 1150 * s,
          height: 1150 * s,
          borderRadius: "50%",
          background: colors.mint,
          transform: `scale(${circleIn * (1 + thump) * (1 - out * 0.4)})`,
        }}
      />

      {/* A4-poster in de stijl van de campagne */}
      <div
        style={{
          position: "relative",
          width: posterWidth,
          height: posterWidth * 1.414,
          background: colors.white,
          boxShadow: `0 ${24 * s}px ${50 * s}px rgba(0,0,0,0.28)`,
          transform: `translateY(${out * 130}%) scale(${posterScale}) rotate(${posterRotate}deg)`,
          opacity: interpolate(slap, [0, 0.15], [0, 1], { extrapolateRight: "clamp" }),
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          gap: 8 * s,
          fontFamily: fonts.poster,
          color: colors.black,
          textAlign: "center",
        }}
      >
        <Tape scale={s} style={{ top: -20 * s, left: -45 * s, transform: "rotate(-35deg)" }} />
        <Tape scale={s} style={{ top: -20 * s, right: -45 * s, transform: "rotate(35deg)" }} />

        <Img
          src={staticFile("pepperminds-icon.png")}
          style={{ position: "absolute", top: 40 * s, right: 40 * s, width: 70 * s }}
        />

        {lines.map((line, i) => {
          const last = i === lines.length - 1;
          return (
            <div key={i} style={{ position: "relative" }}>
              <RevealWords
                text={line}
                start={beat(i + 1)}
                stagger={2}
                exitAt={exitAt}
                style={{ fontSize: last ? fontSize * 1.1 : fontSize, color: last ? colors.red : colors.black }}
              />
              {last ? (
                <svg
                  viewBox="0 0 300 20"
                  preserveAspectRatio="none"
                  style={{
                    position: "absolute",
                    left: "-4%",
                    bottom: -14 * s,
                    width: "108%",
                    height: 24 * s,
                    overflow: "visible",
                    clipPath: `inset(-50% ${100 - underline * 100}% -50% 0)`,
                    opacity: interpolate(frame, [exitAt, exitAt + 5], [1, 0], {
                      extrapolateLeft: "clamp",
                      extrapolateRight: "clamp",
                    }),
                  }}
                >
                  <path
                    d="M4 14 C 80 4, 200 4, 296 10"
                    stroke={colors.red}
                    strokeWidth={9 * s}
                    strokeLinecap="round"
                    fill="none"
                    vectorEffect="non-scaling-stroke"
                  />
                </svg>
              ) : null}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
