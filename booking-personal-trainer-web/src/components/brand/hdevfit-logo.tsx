"use client";

import React from "react";
import { Poppins } from "next/font/google";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["700", "800", "900"],
});

type HDevFitLogoVariant =
  | "full"
  | "icon"
  | "navbar"
  | "sidebar"
  | "square";

type HDevFitLogoSize = "sm" | "md" | "lg";

type HDevFitLogoProps = {
  variant?: HDevFitLogoVariant;
  size?: HDevFitLogoSize;
  className?: string;
  iconClassName?: string;
  wordmarkClassName?: string;
  ariaLabel?: string;
  /**
   * Optional tagline rendered under the wordmark for large full logo.
   * Pass `false` to force-hide.
   */
  tagline?: string | false;
};

type SizeTokens = {
  readonly icon: string;
  readonly wordmark: string;
  readonly gap: string;
  readonly tagline: string;
};

const SIZE_TOKENS: Record<HDevFitLogoSize, SizeTokens> = {
  sm: {
    icon: "h-5 w-5",
    wordmark: "text-base",
    gap: "gap-2",
    tagline: "text-[10px]",
  },
  md: {
    icon: "h-7 w-7",
    wordmark: "text-xl",
    gap: "gap-2.5",
    tagline: "text-xs",
  },
  lg: {
    icon: "h-10 w-10",
    wordmark: "text-3xl",
    gap: "gap-3",
    tagline: "text-xs",
  },
};

const mergeClassName = (...values: Array<string | undefined | false>): string =>
  values.filter(Boolean).join(" ");

const getIconViewBox = (): string => "0 0 64 64";

type IconShape = {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
  readonly r: number;
};

const ICON_SHAPES: readonly IconShape[] = [
  // Left dumbbell plates (2) for a cleaner silhouette
  // Positioned close to the H stem (similar spacing to right plates)
  { x: 10, y: 22, w: 6, h: 20, r: 3 },
  { x: 18, y: 16, w: 6, h: 32, r: 3 },
  // H left stem (strong geometric)
  { x: 27, y: 15, w: 7, h: 34, r: 3.5 },
  // H connector (clean and centered)
  { x: 28, y: 29, w: 18, h: 6, r: 3 },
  // H right stem
  { x: 40, y: 15, w: 7, h: 34, r: 3.5 },
  // Right dumbbell plates (2–3). Using 2 for a cleaner silhouette.
  { x: 50, y: 16, w: 6, h: 32, r: 3 },
  { x: 57, y: 22, w: 6, h: 20, r: 3 },
] as const;

const HDevFitIcon = ({
  title,
  className,
}: {
  title: string;
  className?: string;
}) => {
  const gradientId: string = React.useId();
  const glowId: string = React.useId();
  return (
    <svg
      viewBox={getIconViewBox()}
      role="img"
      aria-label={title}
      className={mergeClassName("shrink-0", className)}
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>{title}</title>
      <defs>
        <linearGradient
          id={gradientId}
          x1="10"
          y1="32"
          x2="54"
          y2="32"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#8B5CF6" />
          <stop offset="1" stopColor="#22D3EE" />
        </linearGradient>
        <filter
          id={glowId}
          x="-40%"
          y="-40%"
          width="180%"
          height="180%"
          colorInterpolationFilters="sRGB"
        >
          <feGaussianBlur stdDeviation="2.1" result="blur" />
          <feColorMatrix
            in="blur"
            type="matrix"
            values="
              1 0 0 0 0
              0 1 0 0 0
              0 0 1 0 0
              0 0 0 0.18 0
            "
            result="colored"
          />
          <feMerge>
            <feMergeNode in="colored" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* subtle glow only in dark mode */}
      <g className="opacity-0 dark:opacity-100" filter={`url(#${glowId})`}>
        {ICON_SHAPES.map((shape: IconShape) => (
          <rect
            key={`${shape.x}-${shape.y}-${shape.w}-${shape.h}`}
            x={shape.x}
            y={shape.y}
            width={shape.w}
            height={shape.h}
            rx={shape.r}
            fill={`url(#${gradientId})`}
          />
        ))}
      </g>

      {ICON_SHAPES.map((shape: IconShape) => (
        <rect
          key={`${shape.x}-${shape.y}-${shape.w}-${shape.h}-base`}
          x={shape.x}
          y={shape.y}
          width={shape.w}
          height={shape.h}
          rx={shape.r}
          fill={`url(#${gradientId})`}
        />
      ))}
    </svg>
  );
};

export default function HDevFitLogo({
  variant = "full",
  size = "md",
  className,
  iconClassName,
  wordmarkClassName,
  ariaLabel = "HDevFit logo",
  tagline = false,
}: HDevFitLogoProps) {
  const tokens: SizeTokens = SIZE_TOKENS[size];
  const showWordmark: boolean = variant !== "icon";
  const showTagline: boolean =
    Boolean(tagline) && variant === "full" && size === "lg";

  if (variant === "square") {
    return (
      <div
        className={mergeClassName(
          "inline-flex items-center justify-center rounded-2xl bg-[#0B1120]",
          "shadow-[0_18px_40px_rgba(2,6,23,0.45)]",
          className,
        )}
        aria-label={ariaLabel}
      >
        <HDevFitIcon
          title={ariaLabel}
          className={mergeClassName("h-10 w-10", iconClassName)}
        />
      </div>
    );
  }

  const wordmark = showWordmark ? (
    <span
      className={mergeClassName(
        poppins.className,
        "inline-flex items-baseline",
        tokens.wordmark,
        "font-black italic tracking-[-0.035em]",
        wordmarkClassName,
      )}
      aria-hidden={variant === "icon"}
    >
      <span className="text-slate-900 dark:text-white">HDev</span>
      <span
        className={mergeClassName(
          "ml-1 bg-gradient-to-r from-[#8B5CF6] to-[#22D3EE] bg-clip-text text-transparent",
          "dark:drop-shadow-[0_0_10px_rgba(34,211,238,0.12)]",
        )}
      >
        Fit
      </span>
    </span>
  ) : null;

  const content = (
    <span
      className={mergeClassName(
        "inline-flex items-center",
        tokens.gap,
        className,
      )}
      aria-label={ariaLabel}
    >
      <HDevFitIcon
        title={ariaLabel}
        className={mergeClassName(tokens.icon, iconClassName)}
      />
      {variant === "navbar" ? (
        <span className="leading-none">{wordmark}</span>
      ) : (
        <span className="flex flex-col leading-none">
          <span className="leading-none">{wordmark}</span>
          {showTagline ? (
            <span
              className={mergeClassName(
                poppins.className,
                tokens.tagline,
                "mt-2 font-semibold not-italic tracking-[0.22em]",
                "text-slate-500 dark:text-slate-400",
              )}
            >
              {typeof tagline === "string"
                ? tagline
                : "STRONG BODY. STRONG MIND. STRONGER YOU."}
            </span>
          ) : null}
        </span>
      )}
    </span>
  );

  if (variant === "sidebar") {
    return (
      <span className={mergeClassName("inline-flex items-center", className)}>
        {content}
      </span>
    );
  }

  return content;
}

