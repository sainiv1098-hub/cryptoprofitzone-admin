import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import MaintenanceProvider from "@/components/MaintenanceProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Crypto Profit Zone Admin",
  description: "Crypto Profit Zone Admin Panel",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <MaintenanceProvider>{children}</MaintenanceProvider>
      </body>
    </html>
  );
}
