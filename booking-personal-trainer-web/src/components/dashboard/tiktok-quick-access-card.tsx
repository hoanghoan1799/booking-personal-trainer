"use client";

import type React from "react";
import { TIKTOK_PROFILE_URL } from "@/lib/social.constants";

type TikTokQuickAccessCardProps = {
  readonly profileUrl?: string;
  readonly className?: string;
};

const ExternalArrowIcon = (): React.ReactNode => {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className="block h-[20px] w-[20px]"
    >
      <path
        d="M7 17L17 7"
        stroke="#111827"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10 7H17V14"
        stroke="#111827"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

const TikTokLogoMark = (): React.ReactNode => {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className="block"
    >
      <path
        d="M14.5 3c.48 3.06 2.34 4.93 5.4 5.4v3.1c-1.86 0-3.5-.6-4.9-1.6V15.3c0 3.08-2.52 5.6-5.6 5.6S4 18.38 4 15.3s2.52-5.6 5.6-5.6c.42 0 .82.04 1.22.13v3.33a2.7 2.7 0 0 0-1.22-.29c-1.5 0-2.7 1.22-2.7 2.73 0 1.5 1.2 2.72 2.7 2.72s2.7-1.22 2.7-2.72V3h2.2Z"
        fill="rgba(34, 211, 238, 0.22)"
        transform="translate(-0.6,0.4)"
      />
      <path
        d="M14.5 3c.48 3.06 2.34 4.93 5.4 5.4v3.1c-1.86 0-3.5-.6-4.9-1.6V15.3c0 3.08-2.52 5.6-5.6 5.6S4 18.38 4 15.3s2.52-5.6 5.6-5.6c.42 0 .82.04 1.22.13v3.33a2.7 2.7 0 0 0-1.22-.29c-1.5 0-2.7 1.22-2.7 2.73 0 1.5 1.2 2.72 2.7 2.72s2.7-1.22 2.7-2.72V3h2.2Z"
        fill="rgba(244, 114, 182, 0.22)"
        transform="translate(0.5,-0.3)"
      />
      <path
        d="M14.5 3c.48 3.06 2.34 4.93 5.4 5.4v3.1c-1.86 0-3.5-.6-4.9-1.6V15.3c0 3.08-2.52 5.6-5.6 5.6S4 18.38 4 15.3s2.52-5.6 5.6-5.6c.42 0 .82.04 1.22.13v3.33a2.7 2.7 0 0 0-1.22-.29c-1.5 0-2.7 1.22-2.7 2.73 0 1.5 1.2 2.72 2.7 2.72s2.7-1.22 2.7-2.72V3h2.2Z"
        fill="rgba(255, 255, 255, 0.92)"
      />
    </svg>
  );
};

export const TikTokQuickAccessCard = (props: TikTokQuickAccessCardProps): React.ReactNode => {
  const { profileUrl = TIKTOK_PROFILE_URL, className } = props;
  return (
    <a
      href={profileUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Open TikTok account page"
      className={[
        "relative block h-full min-h-[72px] w-full rounded-[18px] px-[14px] py-[12px] bg-white border border-[#F1F3F5] dark:bg-white/[0.03] dark:border-gray-800",
        "animate-tiktok-card-enter",
        "shadow-[0_10px_30px_rgba(15,23,42,0.06)]",
        "transition-all duration-[250ms] ease-out hover:-translate-y-[2px] hover:shadow-[0_14px_40px_rgba(15,23,42,0.08)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#111827]/20 focus-visible:ring-offset-2 focus-visible:ring-offset-[#F8FAFC]",
        className ?? "",
      ].join(" ")}
    >
      <div aria-hidden className="pointer-events-none absolute -inset-2 -z-10">
        <div className="absolute -left-6 top-2 h-16 w-28 rounded-full bg-[rgba(34,211,238,0.12)] blur-2xl" />
        <div className="absolute left-20 -top-4 h-16 w-28 rounded-full bg-[rgba(244,114,182,0.12)] blur-2xl" />
        <div className="absolute -bottom-6 -left-8 h-24 w-24 rounded-full bg-[rgba(34,211,238,0.18)] blur-3xl opacity-80" />
        <div className="absolute -bottom-6 -right-8 h-24 w-24 rounded-full bg-[rgba(244,114,182,0.18)] blur-3xl opacity-80" />
      </div>
      <div
        aria-hidden
        className="pointer-events-none absolute -top-2 left-12 h-[7px] w-[7px] rounded-full bg-[#EF4444] shadow-[0_6px_18px_rgba(239,68,68,0.25)]"
      />
      <div className="absolute right-[12px] top-[12px]">
        <ExternalArrowIcon />
      </div>
      <div className="flex h-full items-center gap-3">
        <div className="flex h-[40px] w-[40px] items-center justify-center rounded-[12px] bg-[#0F0F0F]">
          <TikTokLogoMark />
        </div>
        <div className="min-w-0">
          <div className="text-[18px] font-[700] leading-[1.15] text-[#111827] dark:text-white/90">
            Follow Us
          </div>
          <div className="mt-[2px] text-[12px] font-[500] leading-[1.2] text-[#6B7280] dark:text-gray-400">
            Unlock Discounts
          </div>
        </div>
      </div>
    </a>
  );
};

