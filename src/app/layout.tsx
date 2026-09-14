import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

export const metadata: Metadata = {
  title: "AGROWNUTS — Plateforme de gestion",
  description:
    "Gestion du stock, du séchage, de la production et de l'administratif pour AGROWNUTS.",
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#211d18",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
