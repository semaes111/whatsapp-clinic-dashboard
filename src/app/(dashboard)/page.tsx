"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Settings,
  AlertTriangle,
  Clock,
  CheckCircle2,
  UserX,
  MessageSquare,
  FileText,
  Circle,
  XCircle,
  HelpCircle,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface DashboardData {
  date: string;
  stats: {
    urgent: number;
    pending: number;
    resolved: number;
    no_show: number;
    total_conversations: number;
    total_patients: number;
  };
  appointments: {
    id: string;
    patient_name: string;
    phone: string;
    time: string;
    type: string;
    status: string;
  }[];
  pending_tasks: {
    id: string;
    description: string;
    detail: string;
    patient_name: string | null;
    phone: string | null;
    priority: string;
    status: string;
  }[];
  urgent_items: {
    id: string;
    patient_name: string | null;
    phone: string | null;
    summary: string;
    action: string | null;
  }[];
  report_summary: string | null;
  key_points: string[];
}

/* ------------------------------------------------------------------ */
/*  Helper components                                                  */
/* ------------------------------------------------------------------ */

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; color: string; bg: string }> = {
    confirmada: { label: "Confirmada", color: "var(--success)", bg: "rgba(34,197,94,0.12)" },
    cancelada: { label: "Cancelada", color: "var(--danger)", bg: "rgba(239,68,68,0.12)" },
    pendiente: { label: "Pendiente", color: "var(--warning)", bg: "rgba(245,158,11,0.12)" },
    completada: { label: "Completada", color: "var(--success)", bg: "rgba(34,197,94,0.12)" },
    no_acude: { label: "No acude", color: "var(--text-muted)", bg: "rgba(100,116,139,0.12)" },
    reagendada: { label: "Reagendada", color: "var(--warning)", bg: "rgba(245,158,11,0.12)" },
  };
  const c = config[status] || { label: status, color: "var(--text-muted)", bg: "rgba(100,116,139,0.12)" };
  return (
    <span
      style={{
        fontSize: "11px",
        fontWeight: 600,
        color: c.color,
        backgroundColor: c.bg,
        padding: "3px 10px",
        borderRadius: "6px",
        whiteSpace: "nowrap",
      }}
    >
      {c.label}
    </span>
  );
}

function SectionHeader({ title, count }: { title: string; count?: number }) {
  return (
    <h2
      style={{
        fontSize: "12px",
        fontWeight: 700,
        color: "var(--text-muted)",
        letterSpacing: "0.5px",
        textTransform: "uppercase",
        margin: 0,
        display: "flex",
        alignItems: "center",
        gap: "8px",
      }}
    >
      {title}
      {count !== undefined && (
        <span
          style={{
            fontSize: "11px",
            fontWeight: 600,
            color: "var(--text-secondary)",
            backgroundColor: "var(--bg-surface)",
            padding: "2px 8px",
            borderRadius: "10px",
          }}
        >
          {count}
        </span>
      )}
    </h2>
  );
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        backgroundColor: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: "12px",
        padding: "16px",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main page                                                          */
/* ------------------------------------------------------------------ */

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((res) => res.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "var(--bg-page)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>Cargando dashboard...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "var(--bg-page)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "var(--danger)", fontSize: "14px" }}>Error: {error || "No se pudo cargar"}</p>
      </div>
    );
  }

  const today = new Date().toISOString().split("T")[0];
  const formattedDate = new Date().toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const kpis = [
    { label: "Urgente", value: data.stats.urgent, color: "var(--danger)", icon: AlertTriangle },
    { label: "Pendiente", value: data.stats.pending, color: "var(--warning)", icon: Clock },
    { label: "Confirmado", value: data.stats.resolved, color: "var(--success)", icon: CheckCircle2 },
    { label: "No acude", value: data.stats.no_show, color: "var(--text-muted)", icon: UserX },
  ];

  const confirmedAppts = data.appointments.filter((a) => a.status === "confirmada");
  const cancelledAppts = data.appointments.filter((a) => a.status === "cancelada" || a.status === "no_acude");
  const urgentTasks = data.pending_tasks.filter((t) => t.priority === "urgente");
  const otherTasks = data.pending_tasks.filter((t) => t.priority !== "urgente");

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "var(--bg-page)",
        padding: "24px",
      }}
    >
      <div style={{ maxWidth: "960px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "24px" }}>
        {/* ---- Header ---- */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <h1 style={{ fontSize: "22px", fontWeight: 700, color: "var(--text-primary)", margin: 0, letterSpacing: "-0.4px" }}>
              Panel Consulta
            </h1>
            <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: "4px 0 0", textTransform: "capitalize" }}>
              {formattedDate}
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <button style={{ width: "38px", height: "38px", borderRadius: "10px", border: "1px solid var(--border)", backgroundColor: "var(--bg-card)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
              <Search size={16} color="var(--text-secondary)" />
            </button>
            <button style={{ width: "38px", height: "38px", borderRadius: "10px", border: "1px solid var(--border)", backgroundColor: "var(--bg-card)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
              <Settings size={16} color="var(--text-secondary)" />
            </button>
          </div>
        </div>

        {/* ---- KPI row ---- */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
          {kpis.map((kpi) => (
            <Card key={kpi.label} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "14px 16px" }}>
              <div style={{ width: "40px", height: "40px", borderRadius: "10px", backgroundColor: `color-mix(in srgb, ${kpi.color} 14%, transparent)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <kpi.icon size={18} color={kpi.color} />
              </div>
              <div>
                <p style={{ fontSize: "22px", fontWeight: 700, color: kpi.color, margin: 0, lineHeight: 1 }}>{kpi.value}</p>
                <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: "2px 0 0" }}>{kpi.label}</p>
              </div>
            </Card>
          ))}
        </div>

        {/* ---- Citas de hoy ---- */}
        {data.appointments.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <SectionHeader title="Citas de hoy" count={data.appointments.length} />
            <Card style={{ padding: 0, overflow: "hidden" }}>
              {data.appointments.map((apt, i) => (
                <div
                  key={apt.id || i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "14px",
                    padding: "14px 16px",
                    borderBottom: i < data.appointments.length - 1 ? "1px solid var(--border)" : "none",
                  }}
                >
                  <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-muted)", minWidth: "44px", fontVariantNumeric: "tabular-nums" }}>
                    {apt.time}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: "14px", fontWeight: 500, color: "var(--text-primary)", margin: 0 }}>
                      {apt.patient_name}
                    </p>
                    <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: "2px 0 0" }}>{apt.type}</p>
                  </div>
                  <StatusBadge status={apt.status} />
                </div>
              ))}
            </Card>
          </div>
        )}

        {/* ---- Confirmados ---- */}
        {confirmedAppts.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <SectionHeader title="Confirmados" count={confirmedAppts.length} />
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {confirmedAppts.map((apt) => (
                <span
                  key={apt.id}
                  style={{
                    fontSize: "13px",
                    fontWeight: 500,
                    color: "var(--success)",
                    backgroundColor: "rgba(34,197,94,0.1)",
                    border: "1px solid rgba(34,197,94,0.2)",
                    padding: "6px 14px",
                    borderRadius: "20px",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <CheckCircle2 size={13} />
                  {apt.patient_name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ---- Cancelados ---- */}
        {cancelledAppts.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <SectionHeader title="Cancelados / No acude" count={cancelledAppts.length} />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "12px" }}>
              {cancelledAppts.map((apt) => (
                <Card key={apt.id} style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <XCircle size={16} color="var(--danger)" />
                    <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>{apt.patient_name}</span>
                  </div>
                  <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: 0 }}>{apt.type}</p>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* ---- Casos urgentes ---- */}
        {data.urgent_items.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <SectionHeader title="Casos urgentes" count={data.urgent_items.length} />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "12px" }}>
              {data.urgent_items.map((item) => (
                <Card key={item.id} style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <AlertTriangle size={16} color="var(--danger)" />
                    <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>{item.patient_name}</span>
                  </div>
                  <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: 0 }}>{item.summary}</p>
                  {item.action && (
                    <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--warning)", backgroundColor: "rgba(245,158,11,0.1)", padding: "3px 10px", borderRadius: "6px", alignSelf: "flex-start" }}>
                      {item.action}
                    </span>
                  )}
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* ---- Pendientes Noelia ---- */}
        {data.pending_tasks.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <SectionHeader title="Pendientes Noelia" count={data.pending_tasks.length} />
            <Card style={{ padding: 0, overflow: "hidden" }}>
              {data.pending_tasks.map((task, i) => (
                <div
                  key={task.id || i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "12px 16px",
                    borderBottom: i < data.pending_tasks.length - 1 ? "1px solid var(--border)" : "none",
                  }}
                >
                  <Circle
                    size={8}
                    fill={task.priority === "urgente" ? "var(--danger)" : "var(--warning)"}
                    color={task.priority === "urgente" ? "var(--danger)" : "var(--warning)"}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: "14px", color: "var(--text-primary)" }}>{task.description}</span>
                    {task.patient_name && (
                      <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: "2px 0 0" }}>{task.patient_name}</p>
                    )}
                  </div>
                  <span
                    style={{
                      fontSize: "10px",
                      fontWeight: 700,
                      color: task.priority === "urgente" ? "var(--danger)" : "var(--warning)",
                      backgroundColor: task.priority === "urgente" ? "rgba(239,68,68,0.12)" : "rgba(245,158,11,0.12)",
                      padding: "3px 8px",
                      borderRadius: "5px",
                      textTransform: "uppercase",
                      letterSpacing: "0.4px",
                    }}
                  >
                    {task.priority}
                  </span>
                </div>
              ))}
            </Card>
          </div>
        )}

        {/* ---- Resumen ejecutivo ---- */}
        {data.report_summary && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <SectionHeader title="Resumen del día" />
            <Card>
              <p style={{ fontSize: "14px", color: "var(--text-secondary)", margin: 0, lineHeight: 1.6 }}>
                {data.report_summary}
              </p>
              {data.key_points.length > 0 && (
                <ul style={{ margin: "12px 0 0", paddingLeft: "18px", display: "flex", flexDirection: "column", gap: "6px" }}>
                  {data.key_points.map((point, i) => (
                    <li key={i} style={{ fontSize: "13px", color: "var(--text-secondary)" }}>{point}</li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        )}

        {/* ---- Bottom action buttons ---- */}
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <a
            href="/chat"
            style={{
              flex: 1, minWidth: "200px", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
              padding: "14px 24px", backgroundColor: "var(--accent)", color: "white", borderRadius: "12px",
              fontSize: "14px", fontWeight: 600, textDecoration: "none", cursor: "pointer", border: "none",
            }}
          >
            <MessageSquare size={18} />
            Interrogar informe
          </a>
          <a
            href={`/informe/${today}`}
            style={{
              flex: 1, minWidth: "200px", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
              padding: "14px 24px", backgroundColor: "var(--bg-card)", color: "var(--text-primary)", borderRadius: "12px",
              fontSize: "14px", fontWeight: 600, textDecoration: "none", cursor: "pointer", border: "1px solid var(--border)",
            }}
          >
            <FileText size={18} />
            Ver informe completo
          </a>
        </div>
      </div>
    </div>
  );
}
