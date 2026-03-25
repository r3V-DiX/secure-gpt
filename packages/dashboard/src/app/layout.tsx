// src/app/layout.tsx
import type { Metadata } from "next";
import { DM_Sans, DM_Mono } from "next/font/google";
import { AuthProvider } from "@/contexts/auth-context";
import { ToastProvider } from "@/contexts/toast-context";
import { ThemeProvider } from "@/contexts/theme-context";
import { ModalProvider } from "@/components/ui/modal/modal";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  weight: ["300", "400", "500", "600", "700"],
});
const dmMono = DM_Mono({
  subsets: ["latin"],
  variable: "--font-dm-mono",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "SecureGPT",
  description: "Data Loss Prevention Dashboard",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${dmSans.variable} ${dmMono.variable}`} suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <AuthProvider>
            <ToastProvider>
              <ModalProvider>
                {children}
              </ModalProvider>
            </ToastProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}