import type { Metadata, Viewport } from "next";
import { Inter, Instrument_Serif, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const serif = Instrument_Serif({
  variable: "--font-instrument",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
});
const mono = JetBrains_Mono({ variable: "--font-jetbrains", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Lumen — find the blind spots in your decisions",
  description:
    "An AI flashlight for your reasoning. Lumen maps what you're weighing, reveals the assumptions and blind spots hiding in the dark, and never decides for you.",
};

export const viewport: Viewport = {
  themeColor: "#04050a",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} ${serif.variable} ${mono.variable} h-full antialiased`}>
      <body className="grain min-h-full">{children}</body>
    </html>
  );
}
