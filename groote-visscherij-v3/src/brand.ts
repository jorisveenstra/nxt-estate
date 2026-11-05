// Kleuren/typografie van visscherij-ijmuiden.nl (Gelasio koppen, Instrument Sans tekst). Fonts lokaal in public/fonts.
export const colors = { olive: "#6b7a5b", oliveDark: "#4f5b43", cream: "#f2eee8", sand: "#dcd0be", red: "#b3292e", ink: "#282828", white: "#fafafa" };
export const fonts = { serif: "GelasioLocal, Georgia, serif", sans: "InstrumentLocal, Inter, sans-serif" };
export const FPS = 30, WIDTH = 1080, HEIGHT = 1920;
export const chamfer = (c: number) => `polygon(${c}px 0, 100% 0, 100% calc(100% - ${c}px), calc(100% - ${c}px) 100%, 0 100%, 0 ${c}px)`;
