import GridShape from "@/components/common/GridShape";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import React from "react";
import { utcCurrentYear } from "@/lib/date-time/utc-date-time.helper";

export const metadata: Metadata = {
  title: "Page Not Found | Booking Personal Trainer",
  description: "The page you are looking for could not be found",
};

export default function Error404Page() {
  return (
    <div className="relative z-1 flex min-h-screen flex-col items-center justify-center overflow-hidden p-6">
      <GridShape />
      <div className="mx-auto w-full max-w-[242px] text-center sm:max-w-[472px]">
        <h1 className="text-title-md mb-8 font-bold text-gray-800 dark:text-white/90 xl:text-title-2xl">
          ERROR
        </h1>

        <Image
          src="/images/error/404.svg"
          alt="404"
          className="dark:hidden"
          width={472}
          height={152}
        />
        <Image
          src="/images/error/404-dark.svg"
          alt="404"
          className="hidden dark:block"
          width={472}
          height={152}
        />

        <p className="mb-6 mt-10 text-base text-gray-700 dark:text-gray-400 sm:text-lg">
          We can&apos;t seem to find the page you are looking for!
        </p>

        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-5 py-3.5 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
        >
          Back to Home Page
        </Link>
      </div>

      <p className="absolute bottom-6 left-1/2 -translate-x-1/2 text-center text-sm text-gray-500 dark:text-gray-400">
        &copy; {utcCurrentYear()} - Booking Personal Trainer
      </p>
    </div>
  );
}
