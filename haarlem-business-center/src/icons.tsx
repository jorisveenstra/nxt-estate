import React from "react";

// Eenvoudige lijn-iconen (viewBox 64), stroke = currentColor
const S: React.FC<{ size: number; children: React.ReactNode }> = ({ size, children }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round">
    {children}
  </svg>
);

export type IconName =
  | "door" | "glass" | "office" | "hall" | "coffee" | "pin" | "calendar" | "car" | "plug" | "camera" | "heat" | "window" | "sun" | "check"
  | "road" | "plane" | "people" | "star" | "leaf" | "key" | "building" | "lift" | "truck" | "layers" | "view" | "chat" | "bolt";

export const Icon: React.FC<{ name: IconName; size?: number }> = ({ name, size = 72 }) => {
  switch (name) {
    case "door":
      return <S size={size}><rect x="8" y="10" width="48" height="46" rx="3" /><path d="M8 24h48M8 34h48M8 44h48" /></S>;
    case "glass":
      return <S size={size}><rect x="8" y="8" width="48" height="48" rx="3" /><path d="M32 8v48M8 32h48M16 20l8-6M40 46l8-6" /></S>;
    case "office":
      return <S size={size}><rect x="8" y="14" width="48" height="26" rx="3" /><path d="M24 52h16M32 40v12" /></S>;
    case "hall":
      return <S size={size}><path d="M6 54V26L32 10l26 16v28" /><rect x="18" y="32" width="28" height="22" /><path d="M18 40h28M18 47h28" /></S>;
    case "coffee":
      return <S size={size}><path d="M10 22h34v16a14 14 0 0 1-14 14h-6a14 14 0 0 1-14-14z" /><path d="M44 26h6a6 6 0 0 1 0 12h-6M20 8v6M30 8v6" /></S>;
    case "pin":
      return <S size={size}><path d="M32 58S12 38 12 26a20 20 0 0 1 40 0c0 12-20 32-20 32z" /><circle cx="32" cy="26" r="7" /></S>;
    case "calendar":
      return <S size={size}><rect x="8" y="12" width="48" height="44" rx="4" /><path d="M8 26h48M20 6v10M44 6v10" /><path d="M20 38h6M32 38h6M44 38h4M20 46h6M32 46h6" /></S>;
    case "car":
      return <S size={size}><path d="M8 40v-8l6-14h36l6 14v8z" /><path d="M8 32h48" /><circle cx="19" cy="44" r="5" /><circle cx="45" cy="44" r="5" /></S>;
    case "plug":
      return <S size={size}><path d="M22 6v14M42 6v14M14 20h36v10a18 18 0 0 1-36 0zM32 48v10" /></S>;
    case "camera":
      return <S size={size}><rect x="6" y="18" width="40" height="28" rx="4" /><path d="M46 28l12-7v22l-12-7" /></S>;
    case "heat":
      return <S size={size}><path d="M32 8s-14 14-14 26a14 14 0 0 0 28 0C46 22 32 8 32 8z" /><path d="M26 38a6 6 0 0 0 6 6" /></S>;
    case "window":
      return <S size={size}><rect x="10" y="6" width="44" height="52" rx="3" /><path d="M32 6v52M10 28h44" /></S>;
    case "sun":
      return <S size={size}><circle cx="32" cy="32" r="11" /><path d="M32 6v8M32 50v8M6 32h8M50 32h8M13 13l6 6M45 45l6 6M13 51l6-6M45 19l6-6" /></S>;
    case "check":
      return <S size={size}><circle cx="32" cy="32" r="26" /><path d="M20 33l9 9 16-19" /></S>;
    case "road":
      return <S size={size}><path d="M22 6L10 58M42 6l12 52M32 10v8M32 26v8M32 42v8" /></S>;
    case "plane":
      return <S size={size}><path d="M58 8L6 30l18 6 6 18 8-12 14 8z" /><path d="M24 36l34-28" /></S>;
    case "people":
      return <S size={size}><circle cx="22" cy="20" r="9" /><circle cx="44" cy="24" r="7" /><path d="M6 54a16 16 0 0 1 32 0M38 54a12 12 0 0 1 22-6" /></S>;
    case "star":
      return <S size={size}><path d="M32 6l7.5 17 18.5 1.5-14 12 4.5 18L32 45 15.5 54.5 20 36.5 6 24.5 24.5 23z" /></S>;
    case "leaf":
      return <S size={size}><path d="M10 54C10 26 26 10 56 8c0 30-16 46-40 44z" /><path d="M10 54L36 28" /></S>;
    case "key":
      return <S size={size}><circle cx="20" cy="32" r="12" /><path d="M32 32h26M48 32v10M56 32v8" /></S>;
    case "building":
      return <S size={size}><rect x="12" y="6" width="40" height="52" rx="2" /><path d="M22 18h6M36 18h6M22 28h6M36 28h6M22 38h6M36 38h6M28 58V48h8v10" /></S>;
    case "lift":
      return <S size={size}><rect x="10" y="6" width="44" height="52" rx="3" /><path d="M32 6v52M22 26l-4-6-4 6zM42 38l4 6 4-6z" /></S>;
    case "truck":
      return <S size={size}><path d="M6 14h32v28H6zM38 24h12l8 10v8H38z" /><circle cx="18" cy="46" r="5" /><circle cx="48" cy="46" r="5" /></S>;
    case "layers":
      return <S size={size}><path d="M32 8L6 22l26 14 26-14z" /><path d="M6 34l26 14 26-14M6 46l26 14 26-14" /></S>;
    case "view":
      return <S size={size}><path d="M4 32S16 14 32 14s28 18 28 18-12 18-28 18S4 32 4 32z" /><circle cx="32" cy="32" r="8" /></S>;
    case "chat":
      return <S size={size}><path d="M8 10h48v32H30l-12 12V42H8z" /><path d="M20 22h24M20 31h16" /></S>;
    case "bolt":
      return <S size={size}><path d="M36 4L12 36h18l-4 24 26-34H32z" /></S>;
  }
};
