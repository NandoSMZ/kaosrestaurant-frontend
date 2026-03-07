import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "Kaos To Go - Menú Digital",
  description: "Menú Digital de Kaos To Go - El sabor de Kaos en tu hogar",
  icons: {
    icon: [
      { url: '/images/Logos/favicon.ico', sizes: 'any' },
      { url: '/images/Logos/favicon-16x16.png', sizes: '16x16' },
      { url: '/images/Logos/favicon-32x32.png', sizes: '32x32' },
    ],
    apple: { url: '/images/Logos/apple-touch-icon.png', sizes: '180x180' }
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
