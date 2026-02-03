import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Panel Consulta — Clínica Dr. Sergio",
  description: "Dashboard clínico para gestión de pacientes vía WhatsApp con IA",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
