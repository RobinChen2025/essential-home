import { GoogleAnalytics } from "@next/third-parties/google";
import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import Favicon from "@/components/favicon";
import { cn } from "@/lib/utils";

const geistMono = localFont({
  src: "../../public/fonts/geistmono.ttf",
  variable: "--font-geist-mono",
});

const ntype82 = localFont({
  src: "../../public/fonts/NType82-Regular.otf",
  variable: "--font-ntype82",
});

const ndot = localFont({
  src: "../../public/fonts/Ndot-55.otf",
  variable: "--font-ndot",
});

export const metadata: Metadata = {
  title: "Essential - A new kind of operating system",
  description: "The first step towards an AI operating system.",
  icons: {
    icon: "/favicons/favicon-01.png",
  },
  metadataBase: new URL("https://essential.com"),
  openGraph: {
    url:
      process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL ||
      "https://essential.com",
    images: {
      url: "/og.jpg",
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={cn(
          `${geistMono.variable} ${geistMono.className} ${ndot.variable} ${ntype82.variable} min-h-svh w-full overflow-auto overflow-x-hidden text-sm antialiased`,
          "scroll-smooth [text-rendering:optimizeLegibility]",
        )}
      >
        {children}
        <Favicon />
      </body>
      {process.env.NODE_ENV === "production" && (
        <GoogleAnalytics gaId="G-KB972C3ZQ9" />
      )}
    </html>
  );
}
