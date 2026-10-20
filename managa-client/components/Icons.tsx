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

const classes: Record<IconName, string> = {
  plus: "bi-plus-lg",
  play: "bi-play-fill",
  stop: "bi-stop-fill",
  external: "bi-box-arrow-up-right",
  trash: "bi-trash3",
  terminal: "bi-terminal",
  refresh: "bi-arrow-clockwise",
  github: "bi-github",
  box: "bi-box-seam",
  "arrow-left": "bi-arrow-left",
  check: "bi-check-lg",
  x: "bi-x-lg",
  alert: "bi-exclamation-triangle",
  clock: "bi-clock",
  "chevron-down": "bi-chevron-down",
  sparkles: "bi-stars",
  layers: "bi-stack",
  link: "bi-link-45deg",
  server: "bi-hdd-stack",
  monitor: "bi-display",
  power: "bi-power",
};

interface IconProps {
  name: IconName;
  size?: number;
  className?: string;
  style?: CSSProperties;
}

export function Icon({ name, size = 18, className, style }: IconProps) {
  return (
    <i
      aria-hidden="true"
      className={`bi ${classes[name]} ${className ?? ""}`.trim()}
      style={{ fontSize: `${size}px`, lineHeight: 1, ...style }}
    />
  );
}
