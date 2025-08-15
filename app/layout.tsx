import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Playdoo",
  description: "Protect your business with AI-powered fraud detection and prevention",
  keywords: "fraud detection, AI, security, business protection",
  authors: [{ name: "FraudShield AI Team" }],
  viewport: "width=device-width, initial-scale=1",
  robots: "index, follow",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen`}
        suppressHydrationWarning
      >
        <main className="min-h-screen">
          {children}
        </main>
        <Toaster 
          position="bottom-right"
          toastOptions={{
            duration: 4000,
          }}
        />
      </body>
    </html>
  );
}
