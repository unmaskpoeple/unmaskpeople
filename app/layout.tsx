import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { AuthProvider } from "@/components/providers/auth-provider";
import { ToastProvider } from "@/components/ui/toast";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#030712",
};

export const metadata: Metadata = {
  title: "NumVerge OTP - Instant Virtual Phone Numbers & SMS Verification",
  description: "Receive OTP and SMS verification online with real virtual numbers across 150+ countries and 1,320+ services. Instant delivery with 100% automated refund guarantee.",
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" style={{ colorScheme: "dark" }} suppressHydrationWarning>
      <body className="min-h-screen w-full overflow-x-hidden bg-[#030712] text-slate-100 antialiased selection:bg-cyan-500/30 selection:text-cyan-200">
        <ThemeProvider>
          <AuthProvider>
            <ToastProvider>
              {children}
            </ToastProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
