import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AnimatedGridPattern } from "@/components/magicui/animated-grid-pattern";
import { Header } from "@/components/ui/header";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Graphite Ecosystem",
  description: "Next-gen Web3 platform with dynamic NFT avatars, sybil-resistant airdrops, and tiered trust scores",
};

import { Web3Provider } from "@/components/web3/rainbow-kit-provider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-black text-white min-h-screen relative`}
      >
        {/* Global animated grid pattern */}
        <div className="fixed inset-0 z-0 pointer-events-none opacity-20">
          <AnimatedGridPattern
            className="stroke-white/20 fill-white/10"
            numSquares={800}
            maxOpacity={0.3}
            duration={5}
          />
        </div>
        
        <Web3Provider>
          <Header />
          <main className="pt-20">
            {children}
          </main>
        </Web3Provider>
      </body>
    </html>
  );
}
