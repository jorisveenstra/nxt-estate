import React from "react";
import {
  Easing,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

// Schaalfactor zodat alles in staand én liggend formaat klopt.
export const useScale = () => {
  const { width, height } = useVideoConfig();
  return Math.min(width, height) / 1080;
};

export const useIsPortrait = () => {
  const { width, height } = useVideoConfig();
  return height > width;
};

// Woorden die één voor één van onderen uit een masker omhoog schuiven.
export const RevealWords: React.FC<{
  text: string;
  start: number;
  stagger?: number;
  exitAt?: number;
  style?: React.CSSProperties;
}> = ({ text, start, stagger = 3, exitAt, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const words = text.split(" ");

  return (
    <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", columnGap: "0.25em", ...style }}>
      {words.map((word, i) => {
        const enter = spring({
          frame: frame - start - i * stagger,
          fps,
          config: { damping: 14, stiffness: 160 },
        });
        const exit =
          exitAt === undefined
            ? 0
            : interpolate(frame, [exitAt + i * 1.5, exitAt + 8 + i * 1.5], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: Easing.in(Easing.cubic),
              });
        const y = (1 - enter) * 110 - exit * 110;
        return (
          <span key={i} style={{ display: "inline-block", overflow: "hidden", padding: "0.04em 0", lineHeight: 1.05 }}>
            <span style={{ display: "inline-block", transform: `translateY(${y}%)` }}>{word}</span>
          </span>
        );
      })}
    </div>
  );
};

export const Logo: React.FC<{ width: number; white?: boolean; style?: React.CSSProperties }> = ({
  width,
  white,
  style,
}) => (
  // Het logobestand van de site bevat twee versies onder elkaar: wit (boven) en rood (onder).
  <div style={{ width, height: (width * 64) / 424, overflow: "hidden", ...style }}>
    <Img
      src={staticFile("pepperminds-logo.png")}
      style={{ width, display: "block", transform: white ? undefined : "translateY(-50%)" }}
    />
  </div>
);

// Stukje plakband, als verwijzing naar de posters.
export const Tape: React.FC<{ style?: React.CSSProperties; scale: number }> = ({ style, scale }) => (
  <div
    style={{
      position: "absolute",
      width: 170 * scale,
      height: 46 * scale,
      background: "rgba(251, 244, 238, 0.75)",
      boxShadow: "0 2px 6px rgba(0,0,0,0.12)",
      ...style,
    }}
  />
);
