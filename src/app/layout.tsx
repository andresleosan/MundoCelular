import type { Metadata } from "next";
import { Sora, JetBrains_Mono } from "next/font/google";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { BottomTabBar } from "@/components/layout/BottomTabBar";
import "./globals.css";

const sora = Sora({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-sora-css" });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-jetbrains-mono-css" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: { default: "Mundo Celular | Tecnología en Medellín", template: "%s | Mundo Celular" },
  description: "Celulares, accesorios, consolas y tecnología en Medellín. Compra por WhatsApp. También reparamos celulares.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-CO" className={`${sora.variable} ${jetbrainsMono.variable}`}>
      <body className="pb-20 sm:pb-0">
        <Header />
        <AuthProvider>{children}</AuthProvider>
        <Footer />
        <BottomTabBar />
      </body>
    </html>
  );
}
