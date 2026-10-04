import type { Metadata } from "next";
import { Bricolage_Grotesque } from "next/font/google";
import "./globals.css";

const font = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font" });

export const metadata: Metadata = {
  title: "SplitSave",
  description: "Split a large UPI payment into smaller QR codes.",
};

const themeScript = `try{var t=localStorage.getItem("splitsave-theme");if(!t&&matchMedia("(prefers-color-scheme: dark)").matches)t="dark";document.documentElement.dataset.theme=t||"light"}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: themeScript }} /></head>
      <body className={font.variable}>{children}</body>
    </html>
  );
}
