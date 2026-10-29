import React from "react";
import { Composition } from "remotion";
import { Video } from "./Video";
import plans from "./plans.json";

export const Root: React.FC = () => (
  <>
    {Object.keys(plans).map((k) => {
      const id = `Body${k[1]}-Hook${k[3]}`;
      return (
        <Composition
          key={k}
          id={id}
          component={Video}
          durationInFrames={(plans as any)[k].frames}
          fps={30}
          width={1080}
          height={1920}
          defaultProps={{ planKey: k }}
        />
      );
    })}
  </>
);
