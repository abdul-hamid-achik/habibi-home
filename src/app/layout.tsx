import { StackProvider, StackTheme } from "@stackframe/stack";
import { stackServerApp } from "@/app/stack";
import { Inter } from "next/font/google";
import "./globals.css";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Habibi Home - Floor Planner for New Homeowners",
  description: "Stop guessing, plan perfectly. Test furniture layouts before you buy and create rooms you'll love living in.",
  icons: {
    icon: '/favicon.ico',
  },
};
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
        {children}
      </StackTheme></StackProvider></body>
    </html>
  );
}
