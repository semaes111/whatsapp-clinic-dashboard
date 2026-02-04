"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Download,
  Printer,
  ExternalLink,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  MessageSquare,
  ClipboardList,
  Users,
  Phone,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";

/* ------------------------------------------------------------------ */
/*  MOCK DATA                                                          */
/* ------------------------------------------------------------------ */

const urgentes = [
  {
    name: "Elena Aguado",
    phone: "617 XX XX 01",
    summary:
      "Paciente con dolor agudo desde el viernes. Solicita cita urgente. No contesta a llamadas de confirmacion. Ha cancelado 3 veces en los ultimos 2 meses.",
    status: "Sin confirmar",
    statusColor: "var(--danger)",
    action: "Llamar para confirmar o reasignar hueco urgente.",
  },
  {
    name: "Rafael Sanchez",
    phone: "654 XX XX 02",
    summary:
      "Tratamiento de conducto pendiente desde diciembre. Refiere molestias crecientes y sensibilidad al frio. Pregunta si puede tomar ibuprofeno.",
    status: "Necesita atencion",
    statusColor: "var(--danger)",
    action: "Agendar cita prioritaria esta semana. Confirmar pauta analgesica.",
  },
  {
    name: "Maria Francisca Perez",
    phone: "612 XX XX 03",
    summary:
      "Protesis provisional suelta desde ayer. Tiene dificultad para comer. Pide que la atiendan hoy si es posible.",
    status: "Urgente hoy",
    statusColor: "var(--danger)",
    action: "Encajar como urgencia en el hueco de las 12:30.",
  },
  {
    name: "Francisco Javier Criado",
    phone: "678 XX XX 04",
    summary:
      "Dijo 'ya te aviso' hace 2 semanas tras presupuesto de implante. No tiene cita programada. Posible perdida de paciente.",
    status: "Seguimiento",
    statusColor: "var(--warning)",
    action: "Enviar mensaje de seguimiento amable. Ofrecer financiacion.",
  },
];

const pendientes = [
  {
    name: "Carmen Meca",
    phone: "622 XX XX 05",
    summary: "Pendiente de confirmar cita del miercoles 5 feb. No ha respondido al recordatorio automatico.",
    action: "Enviar segundo recordatorio o llamar manana.",
  },
  {
    name: "Mercedes Alcaina",
    phone: "633 XX XX 06",
    summary: "Solicita cambio de hora de su revision. Prefiere por la tarde.",
    action: "Ofrecer hueco jueves 6 feb a las 17:00.",
  },
  {
    name: "Irene Pineda",
    phone: "644 XX XX 07",
    summary: "Pregunta por precio de blanqueamiento. Se le envio presupuesto, pendiente respuesta.",
    action: "Hacer seguimiento en 48h si no responde.",
  },
  {
    name: "Silvia Valdivia",
    phone: "655 XX XX 08",
    summary: "Pide cita para revision anual. Ultima visita hace 14 meses.",
    action: "Agendar revision semana del 10 feb.",
  },
  {
    name: "Eva Maria Madero",
    phone: "666 XX XX 09",
    summary: "Dijo 'ya te aviso' tras recibir presupuesto de ortodoncia. Sin cita puesta. Hace 10 dias.",
    action: "Contactar con mensaje de seguimiento.",
  },
];

const confirmados = [
  { name: "Nadina", detail: "09:00 — Limpieza dental" },
  { name: "Maria Jose", detail: "09:30 — Revision ortodoncia" },
  { name: "Patricia", detail: "10:00 — Empaste molar 36" },
  { name: "Pilar", detail: "11:00 — Control implante" },
  { name: "Samuel", detail: "11:30 — Extraccion cordal" },
  { name: "Sara", detail: "12:00 — Blanqueamiento" },
  { name: "Elida", detail: "13:00 — Revision protesis" },
];

const noAcuden = [
  { name: "Yolanda Rubi", detail: "Reagendada para el 11 de febrero." },
  { name: "Elena Aguado", detail: "Sin nueva cita asignada." },
];

const otrosContactos = [
  "Laboratorio Dental Norte — confirma envio de coronas para jueves.",
  "Mutua Dental Plus — consulta sobre cobertura de paciente.",
  "Farmacia Central — pregunta por receta de Amoxicilina.",
  "Tecnico radiologia — confirma disponibilidad equipo CBCT manana.",
  "Proveedor material — confirma pedido de composite.",
];

const tareasNoelia = [
  { priority: "red", text: "Llamar a Elena Aguado para confirmar o reasignar." },
  { priority: "red", text: "Encajar a Maria Francisca Perez como urgencia a las 12:30." },
  { priority: "red", text: "Llamar a Rafael Sanchez para agendar esta semana." },
  { priority: "yellow", text: "Enviar segundo recordatorio a Carmen Meca." },
  { priority: "yellow", text: "Ofrecer hueco tarde a Mercedes Alcaina." },
  { priority: "yellow", text: "Seguimiento a Irene Pineda si no responde en 48h." },
  { priority: "yellow", text: "Contactar a Eva Maria Madero y Fco. Javier Criado (seguimiento presupuesto)." },
  { priority: "yellow", text: "Agendar revision de Silvia Valdivia semana del 10 feb." },
];

/* ------------------------------------------------------------------ */
/*  STYLES                                                             */
/* ------------------------------------------------------------------ */

const styles: Record<string, React.CSSProperties> = {
  page: {
    maxWidth: 900,
    margin: "0 auto",
  },
  headerRow: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginBottom: 4,
  },
  backBtn: {
    background: "none",
    border: "none",
    color: "var(--text-secondary)",
    cursor: "pointer",
    padding: 6,
    borderRadius: 6,
    display: "flex",
    alignItems: "center",
  },
  title: {
    fontSize: 26,
    fontWeight: 700,
    color: "var(--text-primary)",
    flex: 1,
  },
  iconBtn: {
    background: "none",
    border: "1px solid var(--border)",
    color: "var(--text-secondary)",
    cursor: "pointer",
    padding: "6px 10px",
    borderRadius: 8,
    display: "flex",
    alignItems: "center",
    gap: 6,
    fontSize: 13,
    transition: "background 0.15s",
  },
  subline: {
    fontSize: 13,
    color: "var(--text-muted)",
    marginBottom: 28,
    paddingLeft: 42,
  },
  sectionHeader: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "10px 16px",
    borderRadius: "8px 8px 0 0",
    fontSize: 14,
    fontWeight: 700,
    letterSpacing: 0.5,
    marginTop: 28,
  },
  card: {
    backgroundColor: "var(--bg-card)",
    border: "1px solid var(--border)",
    borderRadius: 10,
    padding: "16px 20px",
    marginBottom: 10,
  },
  cardName: {
    fontSize: 15,
    fontWeight: 600,
    color: "var(--text-primary)",
    marginBottom: 2,
  },
  cardPhone: {
    fontSize: 12,
    color: "var(--text-muted)",
    marginBottom: 8,
  },
  summaryBox: {
    backgroundColor: "var(--bg-surface)",
    border: "1px solid var(--border-light)",
    borderRadius: 8,
    padding: "10px 14px",
    fontSize: 13,
    color: "var(--text-secondary)",
    lineHeight: 1.6,
    marginBottom: 10,
  },
  badge: {
    display: "inline-block",
    padding: "3px 10px",
    borderRadius: 20,
    fontSize: 11,
    fontWeight: 600,
    marginRight: 8,
  },
  actionText: {
    fontSize: 13,
    color: "var(--warning)",
    marginTop: 6,
    marginBottom: 8,
  },
  linkRow: {
    display: "flex",
    gap: 16,
    marginTop: 4,
  },
  link: {
    fontSize: 12,
    color: "var(--accent-light)",
    textDecoration: "none",
    display: "flex",
    alignItems: "center",
    gap: 4,
    cursor: "pointer",
  },
  confirmLine: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "8px 16px",
    fontSize: 14,
    color: "var(--text-secondary)",
    borderBottom: "1px solid var(--border)",
  },
  bulletList: {
    listStyle: "none",
    padding: 0,
    margin: 0,
  },
  bulletItem: {
    padding: "8px 16px",
    fontSize: 14,
    color: "var(--text-secondary)",
    lineHeight: 1.6,
    borderBottom: "1px solid var(--border)",
    display: "flex",
    alignItems: "flex-start",
    gap: 8,
  },
  bottomBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 36,
    marginBottom: 40,
    padding: "14px 28px",
    backgroundColor: "var(--accent)",
    color: "var(--white)",
    border: "none",
    borderRadius: 10,
    fontSize: 15,
    fontWeight: 600,
    cursor: "pointer",
    width: "100%",
    transition: "background 0.15s",
  },
};

/* ------------------------------------------------------------------ */
/*  HELPERS                                                            */
/* ------------------------------------------------------------------ */

function formatFecha(fecha: string): string {
  try {
    const d = new Date(fecha + "T00:00:00");
    return d.toLocaleDateString("es-ES", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return fecha;
  }
}

function SectionHeader({
  emoji,
  label,
  bg,
  color,
}: {
  emoji: string;
  label: string;
  bg: string;
  color: string;
}) {
  return (
    <div style={{ ...styles.sectionHeader, backgroundColor: bg, color }}>
      <span style={{ fontSize: 18 }}>{emoji}</span>
      {label}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  COMPONENT                                                          */
/* ------------------------------------------------------------------ */

export default function InformeFechaPage() {
  const params = useParams();
  const router = useRouter();
  const fecha = (params?.fecha as string) || "2026-02-03";

  return (
    <div style={styles.page}>
      {/* ---- HEADER ---- */}
      <div style={styles.headerRow}>
        <button
          style={styles.backBtn}
          onClick={() => router.back()}
          title="Volver"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 style={styles.title}>
          Informe &mdash; {formatFecha(fecha)}
        </h1>
        <button
          style={styles.iconBtn}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = "var(--bg-hover)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = "none")
          }
          title="Exportar"
        >
          <Download size={16} />
          Exportar
        </button>
        <button
          style={styles.iconBtn}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = "var(--bg-hover)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = "none")
          }
          title="Imprimir"
        >
          <Printer size={16} />
          Imprimir
        </button>
      </div>
      <p style={styles.subline}>
        Generado: 15:00 &nbsp;|&nbsp; Conversaciones: 18 &nbsp;|&nbsp;
        Pacientes: 18
      </p>

      {/* ---- RESUMEN EJECUTIVO ---- */}
      <SectionHeader
        emoji="📊"
        label="RESUMEN EJECUTIVO"
        bg="var(--bg-surface)"
        color="var(--text-primary)"
      />
      <div
        style={{
          backgroundColor: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: "0 0 10px 10px",
          padding: "16px 20px",
          marginBottom: 4,
        }}
      >
        <ul
          style={{
            listStyle: "disc",
            paddingLeft: 20,
            margin: 0,
            lineHeight: 2,
            fontSize: 14,
            color: "var(--text-secondary)",
          }}
        >
          <li>
            <strong style={{ color: "var(--text-primary)" }}>18 conversaciones</strong> gestionadas hoy por WhatsApp.
          </li>
          <li>
            <strong style={{ color: "var(--danger)" }}>4 casos urgentes</strong> que requieren accion inmediata.
          </li>
          <li>
            <strong style={{ color: "var(--warning)" }}>5 pacientes pendientes</strong> de confirmacion o respuesta.
          </li>
          <li>
            <strong style={{ color: "var(--success)" }}>7 citas confirmadas</strong> para manana sin incidencias.
          </li>
          <li>
            <strong style={{ color: "var(--text-primary)" }}>2 pacientes no acuden:</strong> 1 reagendada, 1 sin nueva cita.
          </li>
          <li>
            5 contactos menores (laboratorio, mutua, farmacia, tecnico, proveedor).
          </li>
          <li>
            <strong style={{ color: "var(--danger)" }}>3 tareas prioritarias</strong> y 5 tareas de seguimiento para Noelia.
          </li>
        </ul>
      </div>

      {/* ---- URGENTE ---- */}
      <SectionHeader
        emoji="🚨"
        label={`URGENTE (${urgentes.length})`}
        bg="rgba(239, 68, 68, 0.12)"
        color="var(--danger)"
      />
      <div
        style={{
          backgroundColor: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: "0 0 10px 10px",
          padding: 16,
        }}
      >
        {urgentes.map((p, i) => (
          <div
            key={i}
            style={{
              ...styles.card,
              marginBottom: i < urgentes.length - 1 ? 14 : 0,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <AlertTriangle
                size={16}
                style={{ color: "var(--danger)", flexShrink: 0 }}
              />
              <span style={styles.cardName}>{p.name}</span>
            </div>
            <div style={styles.cardPhone}>
              <Phone size={11} style={{ marginRight: 4, verticalAlign: "middle" }} />
              {p.phone}
            </div>
            <div style={styles.summaryBox}>{p.summary}</div>
            <div>
              <span
                style={{
                  ...styles.badge,
                  backgroundColor: p.statusColor,
                  color: "var(--white)",
                }}
              >
                {p.status}
              </span>
            </div>
            <div style={styles.actionText}>
              <ClipboardList
                size={13}
                style={{ marginRight: 4, verticalAlign: "middle" }}
              />
              {p.action}
            </div>
            <div style={styles.linkRow}>
              <Link href={`/conversacion/${fecha}/${i}`} style={styles.link}>
                <ExternalLink size={12} />
                Ver conversacion
              </Link>
              <Link href={`/pacientes/${encodeURIComponent(p.name)}`} style={styles.link}>
                <ExternalLink size={12} />
                Ficha paciente
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* ---- PENDIENTE ---- */}
      <SectionHeader
        emoji="⏳"
        label={`PENDIENTE (${pendientes.length})`}
        bg="rgba(245, 158, 11, 0.12)"
        color="var(--warning)"
      />
      <div
        style={{
          backgroundColor: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: "0 0 10px 10px",
          padding: 16,
        }}
      >
        {pendientes.map((p, i) => (
          <div
            key={i}
            style={{
              ...styles.card,
              marginBottom: i < pendientes.length - 1 ? 14 : 0,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Clock
                size={16}
                style={{ color: "var(--warning)", flexShrink: 0 }}
              />
              <span style={styles.cardName}>{p.name}</span>
            </div>
            <div style={styles.cardPhone}>
              <Phone size={11} style={{ marginRight: 4, verticalAlign: "middle" }} />
              {p.phone}
            </div>
            <div style={styles.summaryBox}>{p.summary}</div>
            <div style={styles.actionText}>
              <ClipboardList
                size={13}
                style={{ marginRight: 4, verticalAlign: "middle" }}
              />
              {p.action}
            </div>
          </div>
        ))}
      </div>

      {/* ---- CONFIRMADOS ---- */}
      <SectionHeader
        emoji="✅"
        label={`CONFIRMADOS (${confirmados.length})`}
        bg="rgba(34, 197, 94, 0.12)"
        color="var(--success)"
      />
      <div
        style={{
          backgroundColor: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: "0 0 10px 10px",
          overflow: "hidden",
        }}
      >
        {confirmados.map((c, i) => (
          <div key={i} style={styles.confirmLine}>
            <CheckCircle2
              size={16}
              style={{ color: "var(--success)", flexShrink: 0 }}
            />
            <strong style={{ color: "var(--text-primary)", minWidth: 100 }}>
              {c.name}
            </strong>
            <span>{c.detail}</span>
          </div>
        ))}
      </div>

      {/* ---- NO ACUDEN ---- */}
      <SectionHeader
        emoji="❌"
        label={`NO ACUDEN (${noAcuden.length})`}
        bg="rgba(239, 68, 68, 0.08)"
        color="var(--danger)"
      />
      <div
        style={{
          backgroundColor: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: "0 0 10px 10px",
          overflow: "hidden",
        }}
      >
        {noAcuden.map((n, i) => (
          <div key={i} style={styles.confirmLine}>
            <XCircle
              size={16}
              style={{ color: "var(--danger)", flexShrink: 0 }}
            />
            <strong style={{ color: "var(--text-primary)", minWidth: 130 }}>
              {n.name}
            </strong>
            <span>{n.detail}</span>
          </div>
        ))}
      </div>

      {/* ---- OTROS CONTACTOS ---- */}
      <SectionHeader
        emoji="📞"
        label="OTROS CONTACTOS HOY"
        bg="var(--bg-surface)"
        color="var(--text-primary)"
      />
      <div
        style={{
          backgroundColor: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: "0 0 10px 10px",
          overflow: "hidden",
        }}
      >
        {otrosContactos.map((t, i) => (
          <div key={i} style={styles.bulletItem}>
            <ChevronRight
              size={14}
              style={{ color: "var(--text-muted)", marginTop: 3, flexShrink: 0 }}
            />
            {t}
          </div>
        ))}
      </div>

      {/* ---- TAREAS NOELIA ---- */}
      <SectionHeader
        emoji="📋"
        label="TAREAS PENDIENTES NOELIA"
        bg="rgba(37, 99, 235, 0.10)"
        color="var(--accent-light)"
      />
      <div
        style={{
          backgroundColor: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: "0 0 10px 10px",
          overflow: "hidden",
        }}
      >
        {tareasNoelia.map((t, i) => (
          <div key={i} style={styles.bulletItem}>
            <span style={{ fontWeight: 700, color: "var(--text-muted)", minWidth: 22 }}>
              {i + 1}.
            </span>
            <span style={{ fontSize: 16, marginRight: 4 }}>
              {t.priority === "red" ? "\uD83D\uDD34" : "\uD83D\uDFE1"}
            </span>
            {t.text}
          </div>
        ))}
      </div>

      {/* ---- BOTTOM CTA ---- */}
      <Link
        href={`/chat?report=${fecha}`}
        style={{ textDecoration: "none" }}
      >
        <button
          style={styles.bottomBtn}
          onMouseEnter={(e) =>
            (e.currentTarget.style.backgroundColor = "var(--accent-light)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.backgroundColor = "var(--accent)")
          }
        >
          <MessageSquare size={18} />
          Preguntar sobre este informe
        </button>
      </Link>
    </div>
  );
}
