import type { Metadata, Viewport } from "next";
import "./globals.css";
import { jakartaSans, sora } from "@/utils/fonts";

export const metadata: Metadata = {
  title: { default: "Raffle Angel", template: "%s · Raffle Angel" },
  description: "Run fair, transparent raffles for your school, church or NGO.",
};

export const viewport: Viewport = { themeColor: "#0f1f47" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${jakartaSans.className} ${sora.className}`}>
      <body className="min-h-screen bg-white font-sans text-navy-900 antialiased">
        {children}
      </body>
    </html>
  );
}