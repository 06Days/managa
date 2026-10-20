import type { CSSProperties } from "react";

export type IconName =
  | "plus"
  | "play"
  | "stop"
  | "external"
  | "trash"
  | "terminal"
  | "refresh"
  | "github"
  | "box"
  | "arrow-left"
  | "check"
  | "x"
  | "alert"
  | "clock"
  | "chevron-down"
  | "sparkles"
  | "layers"
  | "link"
  | "server"
  | "monitor"
  | "power";

const paths: Record<IconName, string[]> = {
  plus: ["M12 5v14", "M5 12h14"],
  play: ["M8 5.5v13l10-6.5-10-6.5Z"],
  stop: ["M7 7h10v10H7z"],
  external: ["M14 4h6v6", "M20 4 10 14", "M20 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h5"],
  trash: ["M4 7h16", "M9 7V5h6v2", "M6 7l1 13h10l1-13", "M10 11v6", "M14 11v6"],
  terminal: ["M5 7l4 5-4 5", "M12 17h7"],
  refresh: ["M20 11a8 8 0 1 0-2.3 5.7", "M20 5v6h-6"],
  github: [
    "M9 19c-4.3 1.3-4.3-2.5-6-3m12 5v-3.5c0-1 .1-1.4-.5-2 2.8-.3 5.5-1.4 5.5-6a4.7 4.7 0 0 0-1.3-3.2 4.4 4.4 0 0 0-.1-3.3s-1-.3-3.4 1.3a11.6 11.6 0 0 0-6 0C6.8 2.7 5.8 3 5.8 3a4.4 4.4 0 0 0-.1 3.3A4.7 4.7 0 0 0 4.4 9.5c0 4.6 2.7 5.7 5.5 6-.4.4-.6.9-.5 1.5V21",
  ],
  box: ["M21 8l-9-5-9 5v8l9 5 9-5V8Z", "M3 8l9 5 9-5", "M12 13v8"],
  "arrow-left": ["M19 12H5", "M11 6l-6 6 6 6"],
  check: ["M5 12.5l4.5 4.5L19 7"],
  x: ["M6 6l12 12", "M18 6 6 18"],
  alert: ["M12 3 2.5 20h19L12 3Z", "M12 9v5", "M12 17.5v.1"],
  clock: ["M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z", "M12 7v5l3 2"],
  "chevron-down": ["M6 9l6 6 6-6"],
  sparkles: ["M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6L12 3Z", "M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15Z"],
  layers: ["M12 3 3 8l9 5 9-5-9-5Z", "M3 12l9 5 9-5", "M3 16l9 5 9-5"],
  link: ["M10 13a5 5 0 0 0 7.5.5l2-2a5 5 0 0 0-7-7l-1.1 1.1", "M14 11a5 5 0 0 0-7.5-.5l-2 2a5 5 0 0 0 7 7l1.1-1.1"],
  server: ["M4 4h16v6H4z", "M4 14h16v6H4z", "M8 7h.1", "M8 17h.1"],
  monitor: ["M3 5h18v11H3z", "M8 21h8", "M12 16v5"],
  power: ["M12 3v9", "M6.5 6.5a8 8 0 1 0 11 0"],
};

interface IconProps {
  name: IconName;
  size?: number;
  className?: string;
  style?: CSSProperties;
}

export function Icon({ name, size = 18, className, style }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
      style={style}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.8}
    >
      {paths[name].map((d, index) => (
        <path key={index} d={d} />
      ))}
    </svg>
  );
}
