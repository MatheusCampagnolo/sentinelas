import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import "leaflet/dist/leaflet.css";
import "maplibre-gl/dist/maplibre-gl.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sentinelas | Monitoramento urbano",
  description: "Painel de monitoramento de bueiros e lixeiras.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-[#0b1725] text-[#f1f5f9] antialiased">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
