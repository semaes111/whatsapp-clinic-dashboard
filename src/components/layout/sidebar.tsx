"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  LayoutDashboard,
  FileText,
  MessageCircle,
  Users,
  CalendarDays,
  LogOut,
} from "lucide-react";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/" },
  { icon: FileText, label: "Informe Diario", href: "/informe" },
  { icon: MessageCircle, label: "Consultar", href: "/chat" },
  { icon: Users, label: "Pacientes", href: "/pacientes" },
  { icon: CalendarDays, label: "Histórico", href: "/historico" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="flex flex-col h-full shrink-0"
      style={{
        width: 260,
        backgroundColor: "var(--bg-card)",
        borderRight: "1px solid var(--border)",
      }}
    >
      {/* Logo */}
      <div
        className="flex items-center gap-3"
        style={{
          padding: "24px 20px",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div
          className="flex items-center justify-center rounded-lg"
          style={{
            width: 36,
            height: 36,
            backgroundColor: "var(--accent)",
          }}
        >
          <Activity size={20} color="var(--white)" />
        </div>
        <span
          className="font-bold text-lg"
          style={{ color: "var(--text-primary)" }}
        >
          Panel Consulta
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1" style={{ padding: "16px 12px" }}>
        <ul className="flex flex-col gap-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="flex items-center gap-3 rounded-lg transition-colors"
                  style={{
                    padding: "10px 12px",
                    backgroundColor: isActive
                      ? "var(--accent)"
                      : "transparent",
                    color: isActive
                      ? "var(--white)"
                      : "var(--text-secondary)",
                    fontWeight: isActive ? 500 : 400,
                    fontSize: 14,
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor =
                        "var(--bg-hover)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }
                  }}
                >
                  <Icon size={20} />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User section */}
      <div
        className="flex items-center justify-between"
        style={{
          padding: "16px 20px",
          borderTop: "1px solid var(--border)",
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="flex items-center justify-center rounded-full font-semibold"
            style={{
              width: 34,
              height: 34,
              backgroundColor: "var(--accent-dark)",
              color: "var(--white)",
              fontSize: 13,
            }}
          >
            N
          </div>
          <div className="flex flex-col">
            <span
              className="font-medium"
              style={{ color: "var(--text-primary)", fontSize: 14 }}
            >
              Noelia
            </span>
            <span style={{ color: "var(--text-muted)", fontSize: 12 }}>
              Auxiliar
            </span>
          </div>
        </div>
        <button
          className="flex items-center justify-center rounded-md cursor-pointer transition-colors"
          style={{
            width: 32,
            height: 32,
            color: "var(--text-muted)",
            backgroundColor: "transparent",
            border: "none",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "var(--bg-hover)";
            e.currentTarget.style.color = "var(--danger)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
            e.currentTarget.style.color = "var(--text-muted)";
          }}
          title="Cerrar sesión"
        >
          <LogOut size={18} />
        </button>
      </div>
    </aside>
  );
}
