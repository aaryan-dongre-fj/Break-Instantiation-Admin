import Image from "next/image";

import { instance } from "@/lib/instance";
import { cn } from "@/lib/utils";

type BrandMarkProps = {
  className?: string;
  imageClassName?: string;
};

export function BrandMark({ className, imageClassName }: BrandMarkProps) {
  if (instance.logo) {
    return (
      <Image
        src={instance.logo}
        alt={instance.productName}
        width={220}
        height={56}
        priority
        className={imageClassName ?? "h-14 w-auto"}
      />
    );
  }

  return (
    <p className={cn("font-semibold tracking-tight", className)}>{instance.productName}</p>
  );
}
