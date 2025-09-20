'use client';

import { StackProvider, StackTheme } from "@stackframe/stack";
import { stackServerApp } from "@/app/stack";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}><StackProvider app={stackServerApp}><StackTheme>
        <Providers>{children}</Providers>
      </StackTheme></StackProvider></body>
    </html>
  );
}
