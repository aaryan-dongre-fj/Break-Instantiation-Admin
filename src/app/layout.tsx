import type { Metadata } from "next";

import { Providers } from "@/components/providers";
import { instance } from "@/lib/instance";

import "./globals.css";

export const metadata: Metadata = {
  title: instance.title,
  description: instance.description,
  icons: {
    icon: instance.favicon,
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className="h-full"
      style={
        {
          "--primary": instance.colors.primary,
          "--primary-foreground": instance.colors.primaryForeground,
          "--ring": instance.colors.primary,
          "--brand-hover": instance.colors.primaryHover,
        } as React.CSSProperties
      }
    >
      <body className="min-h-full bg-white text-foreground">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
