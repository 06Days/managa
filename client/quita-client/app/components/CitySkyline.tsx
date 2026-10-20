"use client";

import { useId } from "react";
import { milestoneFor, nextMilestone } from "@/lib/format";

const BASE = 124;
const BUILDINGS = [
  { x: 4, w: 20, min: 8, max: 24, unlock: 0, grow: 3 },
  { x: 28, w: 24, min: 10, max: 32, unlock: 0, grow: 4 },
  { x: 56, w: 18, min: 8, max: 28, unlock: 1, grow: 4 },
  { x: 78, w: 26, min: 12, max: 44, unlock: 2, grow: 6 },
  { x: 108, w: 16, min: 10, max: 36, unlock: 3, grow: 5 },
  { x: 128, w: 24, min: 16, max: 60, unlock: 4, grow: 8, antenna: true },
  { x: 156, w: 18, min: 12, max: 48, unlock: 6, grow: 8 },
  { x: 178, w: 22, min: 20, max: 74, unlock: 7, grow: 10 },
  { x: 204, w: 16, min: 14, max: 54, unlock: 10, grow: 10 },
  { x: 224, w: 26, min: 24, max: 86, unlock: 14, grow: 14, antenna: true },
  { x: 254, w: 18, min: 16, max: 64, unlock: 21, grow: 14 },
  { x: 276, w: 22, min: 20, max: 78, unlock: 30, grow: 18, antenna: true },
  { x: 302, w: 14, min: 14, max: 52, unlock: 45, grow: 20 },
];

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function hash(value: string): number {
  let result = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    result ^= value.charCodeAt(i);
    result = Math.imul(result, 16777619);
  }
  return result >>> 0;
}

function random(seed: number, index: number): number {
  const value = Math.sin(seed * 12.9898 + index * 78.233) * 43758.5453;
  return value - Math.floor(value);
}

export function CitySkyline({
  days,
  seed,
  accent,
  large = false,
  className = "",
}: {
  days: number;
  seed: string;
  accent: string;
  large?: boolean;
  className?: string;
}) {
  const uid = useId().replace(/:/g, "");
  const safeDays = Math.max(0, days);
  const dayNumber = Math.floor(safeDays);
  const current = milestoneFor(safeDays);
  const next = nextMilestone(safeDays);
  const seedNumber = hash(seed);

  return (
    <div
      className={`city-frame${large ? " city-frame-lg" : ""} ${className}`.trim()}
    >
      <svg
        className="city-svg"
        viewBox="0 0 320 140"
        role="img"
        aria-label={`${current.stage} city at day ${dayNumber} since the last relapse`}
      >
        <defs>
          <linearGradient id={`sky-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#dbeafe" />
            <stop offset="0.62" stopColor="#eff7ff" />
            <stop offset="1" stopColor={accent} stopOpacity="0.18" />
          </linearGradient>
          <linearGradient id={`ground-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={accent} stopOpacity="0.42" />
            <stop offset="1" stopColor={accent} stopOpacity="0.85" />
          </linearGradient>
          <linearGradient id={`fade-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0.45" />
            <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
        </defs>

        <rect width="320" height="140" fill={`url(#sky-${uid})`} />

        <circle cx="268" cy="30" r="22" fill="#ffd166" opacity="0.18" />
        <circle cx="268" cy="30" r="12" fill="#ffd166" opacity="0.92" />

        <g fill="#ffffff" opacity="0.65">
          <ellipse cx="70" cy="30" rx="22" ry="6" />
          <ellipse cx="91" cy="27" rx="13" ry="5" />
          <ellipse cx="210" cy="20" rx="17" ry="5" />
        </g>

        <rect y={BASE} width="320" height="16" fill={`url(#ground-${uid})`} />
        <rect y={BASE} width="320" height="1.5" fill="#ffffff" opacity="0.55" />
        <line
          x1="0"
          y1="132"
          x2="320"
          y2="132"
          stroke="#ffffff"
          strokeWidth="1"
          strokeDasharray="8 8"
          opacity="0.3"
        />

        {BUILDINGS.map((building, index) => {
          if (safeDays < building.unlock) {
            return (
              <rect
                key={index}
                x={building.x}
                y={BASE - 2}
                width={building.w}
                height={2}
                rx="1"
                fill={accent}
                opacity="0.18"
              />
            );
          }

          const progress = clamp(
            (safeDays - building.unlock) / building.grow,
            0,
            1,
          );
          const variance = random(seedNumber, index) * 0.18 - 0.09;
          const height = Math.max(
            building.min,
            building.min + (building.max - building.min) * progress,
          );
          const top = BASE - height;
          const opacity = clamp(0.42 + variance + progress * 0.16, 0.3, 0.78);
          const columns = Math.max(1, Math.floor((building.w - 6) / 7));
          const rows = Math.max(0, Math.floor((height - 10) / 8));
          const windows = [];

          for (let row = 0; row < rows; row += 1) {
            for (let column = 0; column < columns; column += 1) {
              const lit =
                random(seedNumber, index * 97 + row * 13 + column + 1) > 0.38;
              if (!lit) continue;
              windows.push(
                <rect
                  key={`${row}-${column}`}
                  x={building.x + 4 + column * 7}
                  y={top + 6 + row * 8}
                  width="2.8"
                  height="3.4"
                  rx="0.6"
                  fill="#ffe39a"
                  opacity="0.92"
                />,
              );
            }
          }

          return (
            <g key={index}>
              <rect
                x={building.x}
                y={top}
                width={building.w}
                height={height}
                rx="2.2"
                fill={accent}
                opacity={opacity}
              />
              <rect
                x={building.x}
                y={top}
                width={building.w}
                height={Math.min(4, height)}
                rx="2"
                fill="#ffffff"
                opacity="0.28"
              />
              {windows}
              {building.antenna && progress > 0.45 ? (
                <>
                  <line
                    x1={building.x + building.w / 2}
                    y1={top}
                    x2={building.x + building.w / 2}
                    y2={top - 9}
                    stroke={accent}
                    strokeWidth="1.5"
                  />
                  <circle
                    cx={building.x + building.w / 2}
                    cy={top - 10}
                    r="1.8"
                    fill="#ffd166"
                  />
                </>
              ) : null}
            </g>
          );
        })}

        <g opacity="0.8">
          <rect x="48" y={BASE - 7} width="2" height="7" rx="1" fill="#8b6b4a" />
          <circle cx="49" cy={BASE - 9} r="4.2" fill="#2fb344" />
          <rect x="148" y={BASE - 6} width="2" height="6" rx="1" fill="#8b6b4a" />
          <circle cx="149" cy={BASE - 8} r="3.6" fill="#2fb344" />
          <rect x="292" y={BASE - 8} width="2" height="8" rx="1" fill="#8b6b4a" />
          <circle cx="293" cy={BASE - 10} r="4.6" fill="#2fb344" />
        </g>

        <rect
          width="320"
          height="70"
          fill={`url(#fade-${uid})`}
          pointerEvents="none"
        />
      </svg>

      <div className="city-label">
        <span className="text-truncate">
          <i className="bi bi-buildings me-1" />
          {current.stage}
        </span>
        <span className="streak-badge text-nowrap">
          Day {dayNumber}
          {next ? ` · ${next.day - dayNumber}d to ${next.stage.toLowerCase()}` : " · maxed"}
        </span>
      </div>
    </div>
  );
}
