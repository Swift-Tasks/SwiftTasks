import type { Metadata } from "next";
import { Geist, Geist_Mono, Lexend } from "next/font/google";
import "@/styles/globals.css";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/components/auth-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { SettingsProvider } from "@/components/settings-provider";
import { ConditionalNavbar } from "@/components/conditional-navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Lexend font - designed for improved readability (good for dyslexia)
const lexend = Lexend({
  variable: "--font-dyslexic",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SwiftTasks",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${lexend.variable} bg-(--dark-bg-global) text-gray-900 dark:text-white antialiased`}
      >
        <ThemeProvider>
          <AuthProvider>
            <SettingsProvider>
              <ConditionalNavbar />
              {children}
              <Toaster />
            </SettingsProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
