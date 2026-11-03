import { staticFile } from "remotion";
// Huisstijl mark3.nl: donkerblauw #112337, accentblauw #204ce5 / #527eff, wit; witte woordlogo (Logo-Mark3-wit.png)
export const colors = { navy: "#112337", blue: "#204ce5", sky: "#527eff", white: "#ffffff", grey: "#f5f5f5" };
export const FPS = 30, WIDTH = 1080, HEIGHT = 1920;
export const FONT = "'InterLocal', 'Inter', sans-serif";
export const fontFaces = [["600", "Inter-SemiBold.otf"], ["700", "Inter-Bold.otf"], ["800", "Inter-ExtraBold.otf"], ["900", "Inter-Black.otf"]]
  .map(([w, f]) => `@font-face{font-family:'InterLocal';font-weight:${w};src:url(${staticFile("fonts/" + f)}) format('opentype');}`).join("\n");
