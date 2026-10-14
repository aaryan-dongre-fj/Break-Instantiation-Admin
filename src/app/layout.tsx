import type { Metadata } from "next";

import { LookProvider } from "@/components/look-provider";
import { Providers } from "@/components/providers";
import { loadLook } from "@/lib/look";

import "./globals.css";

// Branding comes from the request host, so the document waits for that request.
export const instant = false;

export async function generateMetadata(): Promise<Metadata> {
  const look = await loadLook();
  return {
    title: look.title,
    description: look.description,
    icons: {
      icon: look.favicon,
    },
  };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const look = await loadLook();
  return (
    <html
      lang="en"
      className="h-full"
      style={
        {
          "--primary": look.colors.primary,
          "--primary-foreground": look.colors.primaryForeground,
          "--ring": look.colors.primary,
          "--brand-hover": look.colors.primaryHover,
        } as React.CSSProperties
      }
    >
      <body className="min-h-full bg-white text-foreground">
        <LookProvider look={look}>
          <Providers>{children}</Providers>
        </LookProvider>
      </body>
    </html>
  );
}
