"use client";

import { useState } from "react";
import {
  Search,
  Settings,
  AlertTriangle,
  Clock,
  CheckCircle2,
  UserX,
  Calendar,
  ChevronRight,
  MessageSquare,
  FileText,
  Circle,
  Phone,
  XCircle,
  HelpCircle,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Appointment {
  time: string;
  name: string;
  status: "confirmada" | "cancelada" | "sin_confirmar";
  note?: string;
  newDate?: string;
}

interface PendingTask {
  priority: "urgente" | "medio";
  text: string;
}

/* ------------------------------------------------------------------ */
/*  Mock data                                                          */
/* ------------------------------------------------------------------ */

const kpis = [
  { label: "Urgente", value: 4, color: "var(--danger)", icon: AlertTriangle },
  { label: "Pendiente", value: 5, color: "var(--warning)", icon: Clock },
  { label: "Resuelto", value: 7, color: "var(--success)", icon: CheckCircle2 },
  { label: "No acude", value: 2, color: "var(--text-muted)", icon: UserX },
];

const appointments: Appointment[] = [
  { time: "09:00", name: "Maria Jose Casas", status: "confirmada" },
  { time: "09:30", name: "Sara Martinez", status: "confirmada", note: "Llega un poco tarde, avisa por WhatsApp" },
  { time: "10:00", name: "Yolanda Rubi", status: "cancelada", newDate: "11 feb" },
  { time: "10:30", name: "Pilar Gomez", status: "confirmada" },
  { time: "11:00", name: "Patricia Barco", status: "confirmada" },
  { time: "11:30", name: "Samuel Bedmar", status: "confirmada" },
  { time: "12:00", name: "Elena Aguado", status: "cancelada" },
  { time: "12:30", name: "Maria Francisca Perez", status: "sin_confirmar" },
];

const confirmedNames = [
  "Maria Jose Casas",
  "Sara Martinez",
  "Pilar Gomez",
  "Patricia Barco",
  "Samuel Bedmar",
  "Yolanda Rubi",
];

const cancelledNoReschedule = [
  {
    name: "Elena Aguado",
    reason: "Motivos personales",
    detail: "Sin nueva fecha asignada",
  },
  {
    name: "Yolanda Rubi",
    reason: "Cambio de horario",
    detail: "Reagendada al 11 feb",
  },
];

const unconfirmedChange = [
  {
    name: "Maria Francisca Perez",
    detail: "Cambio de cita solicitado",
    tag: "SIN RESPUESTA DE CONSULTA",
  },
  {
    name: "Fco. Javier Lopez",
    detail: "Solicita cita por la tarde",
    tag: "SIN RESPUESTA DE CONSULTA",
  },
  {
    name: "Irene Pineda",
    detail: "Pendiente confirmacion",
    tag: "SIN RESPUESTA DE CONSULTA",
  },
];

const pendingTasksNoelia: PendingTask[] = [
  { priority: "urgente", text: "Dar cita a Rafael Sanchez" },
  { priority: "urgente", text: "Reagendar Elena Aguado" },
  { priority: "urgente", text: "Responder a Maria Francisca" },
  { priority: "urgente", text: "Responder a Fco. Javier con cita tarde" },
  { priority: "medio", text: "Buscar cita tarde Carmen Meca" },
  { priority: "medio", text: "Foto Mercedes → ensenar a Sergio" },
  { priority: "medio", text: "Esperar respuesta Irene Pineda" },
  { priority: "medio", text: "Confirmar Silvia: Mounjaro" },
];

/* ------------------------------------------------------------------ */
/*  Helper components                                                  */
/* ------------------------------------------------------------------ */

function StatusBadge({ status }: { status: Appointment["status"] }) {
  const config = {
    confirmada: { label: "Confirmada", color: "var(--success)", bg: "rgba(34,197,94,0.12)" },
    cancelada: { label: "Cancelada", color: "var(--danger)", bg: "rgba(239,68,68,0.12)" },
    sin_confirmar: { label: "Sin confirmar", color: "var(--warning)", bg: "rgba(245,158,11,0.12)" },
  };
  const c = config[status];
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
  const [selectedDate] = useState("2026-02-03");

  const formattedDate = new Date(selectedDate).toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

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
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <div>
            <h1
              style={{
                fontSize: "22px",
                fontWeight: 700,
                color: "var(--text-primary)",
                margin: 0,
                letterSpacing: "-0.4px",
              }}
            >
              Panel Consulta
            </h1>
            <p
              style={{
                fontSize: "13px",
                color: "var(--text-muted)",
                margin: "4px 0 0",
                textTransform: "capitalize",
              }}
            >
              {formattedDate}
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <button
              style={{
                width: "38px",
                height: "38px",
                borderRadius: "10px",
                border: "1px solid var(--border)",
                backgroundColor: "var(--bg-card)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
            >
              <Search size={16} color="var(--text-secondary)" />
            </button>
            <button
              style={{
                width: "38px",
                height: "38px",
                borderRadius: "10px",
                border: "1px solid var(--border)",
                backgroundColor: "var(--bg-card)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
            >
              <Settings size={16} color="var(--text-secondary)" />
            </button>
          </div>
        </div>

        {/* ---- KPI row ---- */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "12px",
          }}
        >
          {kpis.map((kpi) => (
            <Card key={kpi.label} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "14px 16px" }}>
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "10px",
                  backgroundColor: `color-mix(in srgb, ${kpi.color} 14%, transparent)`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <kpi.icon size={18} color={kpi.color} />
              </div>
              <div>
                <p style={{ fontSize: "22px", fontWeight: 700, color: kpi.color, margin: 0, lineHeight: 1 }}>
                  {kpi.value}
                </p>
                <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: "2px 0 0" }}>{kpi.label}</p>
              </div>
            </Card>
          ))}
        </div>

        {/* ---- Citas manana ---- */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <SectionHeader title="Citas manana 4 feb" count={8} />
          <Card style={{ padding: 0, overflow: "hidden" }}>
            {appointments.map((apt, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "14px",
                  padding: "14px 16px",
                  borderBottom: i < appointments.length - 1 ? "1px solid var(--border)" : "none",
                }}
              >
                <span
                  style={{
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "var(--text-muted)",
                    minWidth: "44px",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {apt.time}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: "14px", fontWeight: 500, color: "var(--text-primary)", margin: 0 }}>
                    {apt.name}
                  </p>
                  {apt.note && (
                    <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: "2px 0 0" }}>{apt.note}</p>
                  )}
                  {apt.newDate && (
                    <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: "2px 0 0" }}>
                      Reagendada → {apt.newDate}
                    </p>
                  )}
                </div>
                <StatusBadge status={apt.status} />
              </div>
            ))}
          </Card>
        </div>

        {/* ---- Confirmados con OK ---- */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <SectionHeader title="Confirmados con OK" count={6} />
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {confirmedNames.map((name) => (
              <span
                key={name}
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
                {name}
              </span>
            ))}
          </div>
        </div>

        {/* ---- Cancelados sin proxima cita ---- */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <SectionHeader title="Cancelados sin proxima cita" count={2} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "12px" }}>
            {cancelledNoReschedule.map((item) => (
              <Card key={item.name} style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <XCircle size={16} color="var(--danger)" />
                  <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>{item.name}</span>
                </div>
                <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: 0 }}>{item.reason}</p>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 600,
                    color: "var(--warning)",
                    backgroundColor: "rgba(245,158,11,0.1)",
                    padding: "3px 10px",
                    borderRadius: "6px",
                    alignSelf: "flex-start",
                  }}
                >
                  {item.detail}
                </span>
              </Card>
            ))}
          </div>
        </div>

        {/* ---- Sin confirmar cambio de cita ---- */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <SectionHeader title="Sin confirmar cambio de cita" count={3} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "12px" }}>
            {unconfirmedChange.map((item) => (
              <Card key={item.name} style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <HelpCircle size={16} color="var(--warning)" />
                  <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>{item.name}</span>
                </div>
                <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: 0 }}>{item.detail}</p>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 600,
                    color: "var(--danger)",
                    backgroundColor: "rgba(239,68,68,0.1)",
                    padding: "3px 10px",
                    borderRadius: "6px",
                    alignSelf: "flex-start",
                    letterSpacing: "0.3px",
                  }}
                >
                  {item.tag}
                </span>
              </Card>
            ))}
          </div>
        </div>

        {/* ---- Pendientes Noelia ---- */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <SectionHeader title="Pendientes Noelia" count={8} />
          <Card style={{ padding: 0, overflow: "hidden" }}>
            {pendingTasksNoelia.map((task, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "12px 16px",
                  borderBottom: i < pendingTasksNoelia.length - 1 ? "1px solid var(--border)" : "none",
                }}
              >
                <Circle
                  size={8}
                  fill={task.priority === "urgente" ? "var(--danger)" : "var(--warning)"}
                  color={task.priority === "urgente" ? "var(--danger)" : "var(--warning)"}
                />
                <span style={{ flex: 1, fontSize: "14px", color: "var(--text-primary)" }}>{task.text}</span>
                <span
                  style={{
                    fontSize: "10px",
                    fontWeight: 700,
                    color: task.priority === "urgente" ? "var(--danger)" : "var(--warning)",
                    backgroundColor:
                      task.priority === "urgente" ? "rgba(239,68,68,0.12)" : "rgba(245,158,11,0.12)",
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

        {/* ---- Bottom action buttons ---- */}
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <a
            href="/chat"
            style={{
              flex: 1,
              minWidth: "200px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
              padding: "14px 24px",
              backgroundColor: "var(--accent)",
              color: "var(--white)",
              borderRadius: "12px",
              fontSize: "14px",
              fontWeight: 600,
              textDecoration: "none",
              cursor: "pointer",
              border: "none",
              transition: "background-color 0.2s",
            }}
          >
            <MessageSquare size={18} />
            Interrogar informe
          </a>
          <a
            href="/informe/2026-02-03"
            style={{
              flex: 1,
              minWidth: "200px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
              padding: "14px 24px",
              backgroundColor: "var(--bg-card)",
              color: "var(--text-primary)",
              borderRadius: "12px",
              fontSize: "14px",
              fontWeight: 600,
              textDecoration: "none",
              cursor: "pointer",
              border: "1px solid var(--border)",
              transition: "background-color 0.2s",
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
