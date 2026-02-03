import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-primary",
});

export const metadata: Metadata = {
  title: "Panel Consulta - WhatsApp Clinic Dashboard",
  description:
    "Dashboard de gestión clínica con integración WhatsApp para consultas médicas, informes diarios y seguimiento de pacientes.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="h-full">
      <body
        className={`${inter.variable} h-full`}
        style={{
          fontFamily: "var(--font-primary)",
          backgroundColor: "var(--bg-page)",
          color: "var(--text-primary)",
        }}
      >
        {children}
      </body>
    </html>
  );
}
