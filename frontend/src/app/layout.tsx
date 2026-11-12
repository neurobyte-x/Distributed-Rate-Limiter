import type { Metadata } from "next";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import type { ReactNode } from "react";
import { AppShell } from "@/components/app-shell";
import { Providers } from "@/providers/providers";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Throttle · Rate Limiter Console",
    template: "%s · Throttle",
  },
  description:
    "A control plane for distributed rate limiting: manage policies, simulate traffic, and inspect the health of your Spring Boot + Redis limiter.",
  applicationName: "Throttle",
};

const themeScript = `
(function () {
  try {
    var stored = localStorage.getItem("throttle-theme");
    var dark = stored !== "light";
    document.documentElement.classList.toggle("dark", dark);
  } catch (error) {
    document.documentElement.classList.add("dark");
  }
})();
`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
