"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  Phone,
  Calendar,
  Star,
  AlertTriangle,
  MessageCircle,
  ChevronDown,
  ChevronUp,
  StickyNote,
  Send,
  User,
  Stethoscope,
  Clock,
  XCircle,
  CheckCircle,
  Activity,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface PatientDetail {
  nombre: string;
  telefono: string;
  tipo: string;
  doctor: string;
  primeraVisita: string;
  citasTotales: number;
  cancelaciones: number;
  ultimaCita: string;
  proxCita: string;
  fiabilidad: number; // 0-100
  historial: { fecha: string; evento: string; tipo: "cancel" | "acude" | "primera" }[];
  conversaciones: { fecha: string; resumen: string; detalle: string }[];
  notas: { texto: string; autor: string; fecha: string }[];
}

/* ------------------------------------------------------------------ */
/*  Mock data                                                          */
/* ------------------------------------------------------------------ */

const MOCK_DATA: Record<string, PatientDetail> = {
  "667490504": {
    nombre: "Elena Aguado Gutiérrez",
    telefono: "667490504",
    tipo: "Dieta",
    doctor: "Dr. Sergio",
    primeraVisita: "15 oct 2025",
    citasTotales: 4,
    cancelaciones: 2,
    ultimaCita: "13 ene 2026",
    proxCita: "Pendiente reagendar",
    fiabilidad: 50,
    historial: [
      { fecha: "3 feb 2026", evento: "Cancelación de cita (motivo: personal)", tipo: "cancel" },
      { fecha: "13 ene 2026", evento: "Acude a cita de seguimiento", tipo: "acude" },
      { fecha: "15 dic 2025", evento: "Cancelación de cita (sin motivo)", tipo: "cancel" },
      { fecha: "20 nov 2025", evento: "Acude a cita de control", tipo: "acude" },
      { fecha: "15 oct 2025", evento: "Primera visita - consulta inicial dieta", tipo: "primera" },
    ],
    conversaciones: [
      {
        fecha: "3 feb 2026",
        resumen: "La paciente cancela su cita del día siguiente alegando motivos personales. Se le indica que debe reagendar lo antes posible.",
        detalle:
          "WhatsApp entrante 09:14 — Elena: \"Buenos días, no voy a poder ir mañana a la cita, lo siento mucho. ¿Podemos cambiarla?\"\nRespuesta automática 09:15 — \"Hola Elena, entendido. Lamentamos que no puedas asistir. Te recomendamos reagendar lo antes posible para no perder el seguimiento de tu plan. ¿Qué día te vendría bien?\"\nWhatsApp entrante 09:20 — Elena: \"La semana que viene a ver si puedo, ya os digo.\"\nRespuesta automática 09:21 — \"Perfecto, quedo a la espera. ¡Que tengas buen día!\"",
      },
      {
        fecha: "13 ene 2026",
        resumen: "Confirmación de cita y seguimiento post-visita. La paciente confirma asistencia y se le envía recordatorio.",
        detalle:
          "Recordatorio automático 18:00 (12 ene) — \"Hola Elena, te recordamos tu cita mañana a las 10:00 con el Dr. Sergio. ¿Confirmas asistencia?\"\nWhatsApp entrante 18:30 — Elena: \"Sí, ahí estaré. Gracias.\"\nRespuesta automática 18:31 — \"¡Genial! Te esperamos mañana. Recuerda traer tu diario de alimentación.\"",
      },
    ],
    notas: [
      { texto: "Tiene tendencia a cancelar a última hora", autor: "Dr. Sergio", fecha: "3 feb 2026" },
    ],
  },
};

/* Fallback patient for unknown phones */
function getFallbackPatient(phone: string): PatientDetail {
  return {
    nombre: `Paciente ${phone}`,
    telefono: phone,
    tipo: "Dieta",
    doctor: "—",
    primeraVisita: "—",
    citasTotales: 0,
    cancelaciones: 0,
    ultimaCita: "—",
    proxCita: "—",
    fiabilidad: 0,
    historial: [],
    conversaciones: [],
    notas: [],
  };
}

/* ------------------------------------------------------------------ */
/*  Styles                                                             */
/* ------------------------------------------------------------------ */

const s = {
  page: { maxWidth: 800, margin: "0 auto" } as React.CSSProperties,

  headerRow: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginBottom: 24,
  } as React.CSSProperties,

  backBtn: {
    background: "none",
    border: "none",
    color: "var(--text-secondary)",
    cursor: "pointer",
    padding: 6,
    borderRadius: 6,
    display: "flex",
    alignItems: "center",
  } as React.CSSProperties,

  headerInfo: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 2,
  } as React.CSSProperties,

  name: {
    fontSize: 22,
    fontWeight: 700,
    color: "var(--text-primary)",
  } as React.CSSProperties,

  phoneSub: {
    fontSize: 14,
    color: "var(--text-muted)",
    display: "flex",
    alignItems: "center",
    gap: 6,
  } as React.CSSProperties,

  card: {
    background: "var(--bg-card)",
    borderRadius: 12,
    border: "1px solid var(--border)",
    padding: 20,
    marginBottom: 20,
  } as React.CSSProperties,

  cardTitle: {
    fontSize: 13,
    fontWeight: 700,
    color: "var(--text-muted)",
    textTransform: "uppercase" as const,
    letterSpacing: 0.8,
    marginBottom: 16,
    display: "flex",
    alignItems: "center",
    gap: 8,
  } as React.CSSProperties,

  dataGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 14,
  } as React.CSSProperties,

  dataItem: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 2,
  } as React.CSSProperties,

  dataLabel: {
    fontSize: 12,
    color: "var(--text-muted)",
    display: "flex",
    alignItems: "center",
    gap: 4,
  } as React.CSSProperties,

  dataValue: {
    fontSize: 15,
    fontWeight: 500,
    color: "var(--text-primary)",
  } as React.CSSProperties,

  warningValue: {
    fontSize: 15,
    fontWeight: 600,
    color: "var(--danger)",
    display: "flex",
    alignItems: "center",
    gap: 4,
  } as React.CSSProperties,

  starsRow: {
    display: "flex",
    alignItems: "center",
    gap: 2,
    marginTop: 2,
  } as React.CSSProperties,

  timelineItem: (tipo: string) =>
    ({
      display: "flex",
      alignItems: "flex-start",
      gap: 12,
      padding: "10px 0",
      borderBottom: "1px solid var(--border)",
    }) as React.CSSProperties,

  timelineDot: (tipo: string) =>
    ({
      width: 10,
      height: 10,
      borderRadius: "50%",
      marginTop: 5,
      flexShrink: 0,
      background:
        tipo === "cancel"
          ? "var(--danger)"
          : tipo === "primera"
            ? "var(--accent)"
            : "var(--success)",
    }) as React.CSSProperties,

  timelineDate: {
    fontSize: 12,
    color: "var(--text-muted)",
    minWidth: 90,
  } as React.CSSProperties,

  timelineEvento: {
    fontSize: 14,
    color: "var(--text-primary)",
  } as React.CSSProperties,

  convItem: {
    borderBottom: "1px solid var(--border)",
    padding: "12px 0",
  } as React.CSSProperties,

  convHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    cursor: "pointer",
  } as React.CSSProperties,

  convDate: {
    fontSize: 13,
    fontWeight: 600,
    color: "var(--text-secondary)",
  } as React.CSSProperties,

  convSummary: {
    fontSize: 14,
    color: "var(--text-secondary)",
    marginTop: 6,
    lineHeight: 1.5,
  } as React.CSSProperties,

  convDetail: {
    fontSize: 13,
    color: "var(--text-muted)",
    marginTop: 10,
    padding: 12,
    background: "var(--bg-surface)",
    borderRadius: 8,
    whiteSpace: "pre-wrap" as const,
    lineHeight: 1.6,
  } as React.CSSProperties,

  expandBtn: {
    background: "none",
    border: "1px solid var(--border)",
    color: "var(--accent-light)",
    cursor: "pointer",
    padding: "4px 10px",
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 500,
    display: "flex",
    alignItems: "center",
    gap: 4,
  } as React.CSSProperties,

  noteItem: {
    padding: "10px 0",
    borderBottom: "1px solid var(--border)",
  } as React.CSSProperties,

  noteText: {
    fontSize: 14,
    color: "var(--text-primary)",
    lineHeight: 1.5,
  } as React.CSSProperties,

  noteMeta: {
    fontSize: 12,
    color: "var(--text-muted)",
    marginTop: 4,
  } as React.CSSProperties,

  noteInputRow: {
    display: "flex",
    gap: 8,
    marginTop: 12,
  } as React.CSSProperties,

  noteInput: {
    flex: 1,
    padding: "10px 12px",
    borderRadius: 8,
    border: "1px solid var(--border)",
    background: "var(--bg-surface)",
    color: "var(--text-primary)",
    fontSize: 14,
    outline: "none",
  } as React.CSSProperties,

  sendBtn: {
    padding: "10px 14px",
    borderRadius: 8,
    border: "none",
    background: "var(--accent)",
    color: "var(--white)",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: 6,
    fontSize: 13,
    fontWeight: 500,
  } as React.CSSProperties,

  bottomBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    width: "100%",
    padding: "14px 0",
    borderRadius: 10,
    border: "1px solid var(--accent)",
    background: "transparent",
    color: "var(--accent-light)",
    fontSize: 15,
    fontWeight: 600,
    cursor: "pointer",
    marginTop: 8,
    transition: "background 0.15s",
  } as React.CSSProperties,
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function PacienteDetailPage() {
  const router = useRouter();
  const params = useParams();
  const phone = params.phone as string;

  const patient = MOCK_DATA[phone] ?? getFallbackPatient(phone);

  const [expandedConv, setExpandedConv] = useState<number | null>(null);
  const [newNote, setNewNote] = useState("");
  const [localNotes, setLocalNotes] = useState(patient.notas);

  const cancelPct = patient.citasTotales
    ? Math.round((patient.cancelaciones / patient.citasTotales) * 100)
    : 0;

  const starCount = 4;
  const filledStars = Math.round((patient.fiabilidad / 100) * starCount);

  const handleAddNote = () => {
    if (!newNote.trim()) return;
    setLocalNotes((prev) => [
      { texto: newNote.trim(), autor: "Tú", fecha: "Ahora" },
      ...prev,
    ]);
    setNewNote("");
  };

  return (
    <div style={s.page}>
      {/* Header */}
      <div style={s.headerRow}>
        <button style={s.backBtn} onClick={() => router.back()}>
          <ArrowLeft size={20} />
        </button>
        <div style={s.headerInfo}>
          <span style={s.name}>{patient.nombre}</span>
          <span style={s.phoneSub}>
            <Phone size={13} />
            {patient.telefono}
          </span>
        </div>
      </div>

      {/* DATOS */}
      <div style={s.card}>
        <div style={s.cardTitle}>
          <User size={15} />
          Datos
        </div>
        <div style={s.dataGrid}>
          <div style={s.dataItem}>
            <span style={s.dataLabel}>
              <Phone size={12} /> Teléfono
            </span>
            <span style={{ ...s.dataValue, fontFamily: "monospace" }}>
              {patient.telefono}
            </span>
          </div>
          <div style={s.dataItem}>
            <span style={s.dataLabel}>
              <Calendar size={12} /> Primera visita
            </span>
            <span style={s.dataValue}>{patient.primeraVisita}</span>
          </div>
          <div style={s.dataItem}>
            <span style={s.dataLabel}>Tipo</span>
            <span
              style={{
                ...s.dataValue,
                color: "var(--success)",
              }}
            >
              {patient.tipo}
            </span>
          </div>
          <div style={s.dataItem}>
            <span style={s.dataLabel}>
              <Stethoscope size={12} /> Doctor
            </span>
            <span style={s.dataValue}>{patient.doctor}</span>
          </div>
          <div style={s.dataItem}>
            <span style={s.dataLabel}>Citas totales</span>
            <span style={s.dataValue}>{patient.citasTotales}</span>
          </div>
          <div style={s.dataItem}>
            <span style={s.dataLabel}>
              <XCircle size={12} /> Cancelaciones
            </span>
            <span style={cancelPct >= 40 ? s.warningValue : s.dataValue}>
              {cancelPct >= 40 && <AlertTriangle size={14} />}
              {patient.cancelaciones} ({cancelPct}%)
            </span>
          </div>
          <div style={s.dataItem}>
            <span style={s.dataLabel}>
              <Clock size={12} /> Última cita
            </span>
            <span style={s.dataValue}>{patient.ultimaCita}</span>
          </div>
          <div style={s.dataItem}>
            <span style={s.dataLabel}>
              <Calendar size={12} /> Próxima cita
            </span>
            <span
              style={{
                ...s.dataValue,
                color: patient.proxCita.toLowerCase().includes("pendiente")
                  ? "var(--danger)"
                  : "var(--text-primary)",
              }}
            >
              {patient.proxCita}
            </span>
          </div>
          <div style={{ ...s.dataItem, gridColumn: "1 / -1" }}>
            <span style={s.dataLabel}>
              <Activity size={12} /> Fiabilidad
            </span>
            <div style={s.starsRow}>
              {Array.from({ length: starCount }).map((_, i) => (
                <Star
                  key={i}
                  size={18}
                  fill={i < filledStars ? "var(--warning)" : "none"}
                  color={i < filledStars ? "var(--warning)" : "var(--border-light)"}
                />
              ))}
              <span
                style={{
                  marginLeft: 8,
                  fontSize: 13,
                  color: "var(--text-muted)",
                }}
              >
                {patient.fiabilidad}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* HISTORIAL DE INTERACCIONES */}
      <div style={s.card}>
        <div style={s.cardTitle}>
          <Clock size={15} />
          Historial de Interacciones
        </div>
        {patient.historial.length === 0 ? (
          <div style={{ color: "var(--text-muted)", fontSize: 14 }}>
            Sin historial.
          </div>
        ) : (
          patient.historial.map((h, i) => (
            <div key={i} style={s.timelineItem(h.tipo)}>
              <div style={s.timelineDot(h.tipo)} />
              <span style={s.timelineDate}>{h.fecha}</span>
              <span style={s.timelineEvento}>
                {h.tipo === "cancel" && (
                  <XCircle
                    size={14}
                    style={{
                      color: "var(--danger)",
                      marginRight: 6,
                      verticalAlign: -2,
                    }}
                  />
                )}
                {h.tipo === "acude" && (
                  <CheckCircle
                    size={14}
                    style={{
                      color: "var(--success)",
                      marginRight: 6,
                      verticalAlign: -2,
                    }}
                  />
                )}
                {h.evento}
              </span>
            </div>
          ))
        )}
      </div>

      {/* CONVERSACIONES */}
      <div style={s.card}>
        <div style={s.cardTitle}>
          <MessageCircle size={15} />
          Conversaciones
        </div>
        {patient.conversaciones.length === 0 ? (
          <div style={{ color: "var(--text-muted)", fontSize: 14 }}>
            Sin conversaciones.
          </div>
        ) : (
          patient.conversaciones.map((c, i) => (
            <div key={i} style={s.convItem}>
              <div
                style={s.convHeader}
                onClick={() =>
                  setExpandedConv(expandedConv === i ? null : i)
                }
              >
                <div>
                  <span style={s.convDate}>{c.fecha}</span>
                  <div style={s.convSummary}>{c.resumen}</div>
                </div>
                <button style={s.expandBtn}>
                  {expandedConv === i ? (
                    <>
                      Cerrar <ChevronUp size={14} />
                    </>
                  ) : (
                    <>
                      Expandir <ChevronDown size={14} />
                    </>
                  )}
                </button>
              </div>
              {expandedConv === i && (
                <div style={s.convDetail}>{c.detalle}</div>
              )}
            </div>
          ))
        )}
      </div>

      {/* NOTAS INTERNAS */}
      <div style={s.card}>
        <div style={s.cardTitle}>
          <StickyNote size={15} />
          Notas Internas
        </div>
        {localNotes.length === 0 && (
          <div style={{ color: "var(--text-muted)", fontSize: 14 }}>
            Sin notas.
          </div>
        )}
        {localNotes.map((n, i) => (
          <div key={i} style={s.noteItem}>
            <div style={s.noteText}>{n.texto}</div>
            <div style={s.noteMeta}>
              {n.autor} &middot; {n.fecha}
            </div>
          </div>
        ))}
        <div style={s.noteInputRow}>
          <input
            type="text"
            placeholder="Añadir nota..."
            style={s.noteInput}
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAddNote();
            }}
          />
          <button style={s.sendBtn} onClick={handleAddNote}>
            <Send size={14} />
            Añadir
          </button>
        </div>
      </div>

      {/* Bottom CTA */}
      <button
        style={s.bottomBtn}
        onClick={() => router.push(`/chat?patient=${phone}`)}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background =
            "rgba(37, 99, 235, 0.1)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background =
            "transparent";
        }}
      >
        <MessageCircle size={18} />
        Preguntar sobre esta paciente
      </button>
    </div>
  );
}
