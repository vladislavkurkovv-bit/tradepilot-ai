import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Sidebar, MobileNav } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TradePilot AI — Smart Crypto Trading Bot",
  description:
    "AI-powered crypto trading bot with Binance & Bybit support, paper trading, and live trading.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} dark h-full`}>
      <body className="min-h-full font-sans antialiased">
        <TooltipProvider>
          <div className="relative min-h-screen bg-[#0a0a0f]">
            <div className="fixed inset-0 bg-gradient-to-br from-blue-950/40 via-[#0a0a0f] to-violet-950/40 pointer-events-none" />
            <div className="fixed top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="fixed bottom-0 right-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />

            <Sidebar />
            <div className="lg:pl-64 flex flex-col min-h-screen relative">
              <Header />
              <main className="flex-1 p-4 lg:p-6 pb-20 lg:pb-6">
                {children}
              </main>
            </div>
            <MobileNav />
          </div>
        </TooltipProvider>
      </body>
    </html>
  );
}
