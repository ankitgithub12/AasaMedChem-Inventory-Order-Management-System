import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Toaster } from "sonner";
import { Inter } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "AasaMedChem Inventory & Order Management System",
  description: "Comprehensive portal for product catalog, inventory tracking, orders, and quote requests.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} antialiased bg-slate-950 text-slate-100 min-h-screen font-sans`}
      >
        <Providers>
          {children}
          <Toaster theme="dark" position="top-right" closeButton richColors />
        </Providers>
      </body>
    </html>
  );
}
