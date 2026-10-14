"use client";

import Image from "next/image";

import { useLook } from "@/components/look-provider";
import { cn } from "@/lib/utils";

type BrandMarkProps = {
  className?: string;
  imageClassName?: string;
};

export function BrandMark({ className, imageClassName }: BrandMarkProps) {
  const look = useLook();
  if (look.logo) {
    return (
      <Image
        src={look.logo}
        alt={look.name}
        width={220}
        height={56}
        priority
        unoptimized={look.logo.startsWith("http")}
        className={imageClassName ?? "h-14 w-auto"}
      />
    );
  }

  return <p className={cn("font-semibold tracking-tight", className)}>{look.name}</p>;
}
