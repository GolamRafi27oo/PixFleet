import type { Metadata } from "next";
import Script from "next/script";
import { THEME_INIT_SCRIPT } from "@/lib/theme";
import "./globals.css";
export const metadata: Metadata = {
  title: "PixFleet — ready for the web",
  description: "Your local image preparation workspace.",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-theme="system" suppressHydrationWarning>
      <head>
        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: Static trusted theme bootstrap prevents a flash before hydration. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body>
        {children}
        <Script
          src="https://www.supportkori.com/widget.js"
          data-id="golam"
          data-message="Support pixFleet dev"
          data-color="#FFDD00"
          data-position="left"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
