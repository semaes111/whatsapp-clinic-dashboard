"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Download,
  RefreshCw,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  MessageSquare,
  ClipboardList,
  Phone,
  ChevronRight,
  Loader2,
  Trash2,
  Check,
  RotateCcw,
} from "lucide-react";
import Link from "next/link";

/* ------------------------------------------------------------------ */
/*  TYPES                                                              */
/* ------------------------------------------------------------------ */

interface PatientItem {
  patient_name: string;
  phone?: string;
  descripcion?: string;
  accion_requerida?: string;
  estado?: string;
  hora_cita?: string;
  motivo_cancelacion?: string;
}

interface TaskItem {
  id: number;
  titulo: string;
  prioridad: string;
}

interface TareaEstado {
  tarea_index: number;
  completada: boolean;
  eliminada: boolean;
}

interface ReportData {
  date: string;
  resumen_ejecutivo: string;
  puntos_clave: string[];
  stats: {
    total_conversaciones: number;
    total_pacientes: number;
    total_confirmados: number;
    total_cancelaciones: number;
    total_pendientes: number;
    total_urgentes: number;
  };
  categorias: {
    urgente: PatientItem[];
    pendiente: PatientItem[];
    confirmado: PatientItem[];
    no_acude: PatientItem[];
  };
  tareas: TaskItem[];
  otros_contactos: string[];
  generated_at: string;
}

/* ------------------------------------------------------------------ */
/*  STYLES                                                             */
/* ------------------------------------------------------------------ */

const styles: Record<string, React.CSSProperties> = {
  page: { maxWidth: 900, margin: "0 auto" },
  headerRow: { display: "flex", alignItems: "center", gap: 12, marginBottom: 4 },
  backBtn: { background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer", padding: 6, borderRadius: 6, display: "flex", alignItems: "center" },
  title: { fontSize: 26, fontWeight: 700, color: "var(--text-primary)", flex: 1 },
  iconBtn: { background: "none", border: "1px solid var(--border)", color: "var(--text-secondary)", cursor: "pointer", padding: "6px 10px", borderRadius: 8, display: "flex", alignItems: "center", gap: 6, fontSize: 13, transition: "background 0.15s" },
  subline: { fontSize: 13, color: "var(--text-muted)", marginBottom: 28, paddingLeft: 42 },
  sectionHeader: { display: "flex", alignItems: "center", gap: 8, padding: "10px 16px", borderRadius: "8px 8px 0 0", fontSize: 14, fontWeight: 700, letterSpacing: 0.5, marginTop: 28 },
  card: { backgroundColor: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10, padding: "16px 20px", marginBottom: 10 },
  cardName: { fontSize: 15, fontWeight: 600, color: "var(--text-primary)", marginBottom: 2 },
  cardPhone: { fontSize: 12, color: "var(--text-muted)", marginBottom: 8 },
  summaryBox: { backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-light)", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 10 },
  badge: { display: "inline-block", padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, marginRight: 8 },
  actionText: { fontSize: 13, color: "var(--warning)", marginTop: 6, marginBottom: 8 },
  confirmLine: { display: "flex", alignItems: "center", gap: 10, padding: "8px 16px", fontSize: 14, color: "var(--text-secondary)", borderBottom: "1px solid var(--border)" },
  bulletItem: { padding: "8px 16px", fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.6, borderBottom: "1px solid var(--border)", display: "flex", alignItems: "flex-start", gap: 8 },
  bottomBtn: { display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 36, marginBottom: 40, padding: "14px 28px", backgroundColor: "var(--accent)", color: "var(--white)", border: "none", borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: "pointer", width: "100%", transition: "background 0.15s" },
  loadingBox: { display: "flex", flexDirection: "column" as const, alignItems: "center", justifyContent: "center", minHeight: 400, gap: 16, color: "var(--text-muted)" },
  taskRow: { padding: "12px 16px", fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.6, borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 10 },
  taskText: { flex: 1 },
  taskBtn: { background: "none", border: "none", cursor: "pointer", padding: 6, borderRadius: 6, display: "flex", alignItems: "center", transition: "background 0.15s" },
};

/* ------------------------------------------------------------------ */
/*  HELPERS                                                            */
/* ------------------------------------------------------------------ */

function formatFecha(fecha: string): string {
  try {
    const d = new Date(fecha + "T00:00:00");
    return d.toLocaleDateString("es-ES", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  } catch { return fecha; }
}

function SectionHeader({ emoji, label, bg, color }: { emoji: string; label: string; bg: string; color: string }) {
  return <div style={{ ...styles.sectionHeader, backgroundColor: bg, color }}><span style={{ fontSize: 18 }}>{emoji}</span>{label}</div>;
}

/* ------------------------------------------------------------------ */
/*  COMPONENT                                                          */
/* ------------------------------------------------------------------ */

export default function InformeFechaPage() {
  const params = useParams();
  const router = useRouter();
  const fecha = (params?.fecha as string) || "2026-02-04";
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tareasEstado, setTareasEstado] = useState<Record<number, TareaEstado>>({});

  const fetchReport = useCallback(async () => {
    try {
      const res = await fetch(`/api/reports/${fecha}`);
      if (res.ok) {
        const data = await res.json();
        setReport(data);
        setError(null);
      } else if (res.status === 404) {
        setReport(null);
        setError("No hay informe para esta fecha. Pulsa Actualizar para generarlo.");
      }
    } catch {
      setError("Error al cargar el informe");
    } finally {
      setLoading(false);
    }
  }, [fecha]);

  const fetchTareasEstado = useCallback(async () => {
    try {
      const res = await fetch(`/api/tareas?fecha=${fecha}`);
      if (res.ok) {
        const data = await res.json();
        const estado: Record<number, TareaEstado> = {};
        (data.tareas || []).forEach((t: TareaEstado) => {
          estado[t.tarea_index] = t;
        });
        setTareasEstado(estado);
      }
    } catch { /* ignore */ }
  }, [fecha]);

  useEffect(() => { fetchReport(); fetchTareasEstado(); }, [fetchReport, fetchTareasEstado]);

  const handleRefresh = async () => {
    setRefreshing(true);
    setError(null);
    try {
      const res = await fetch("/api/reports/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: fecha }),
      });
      if (res.ok) {
        await fetchReport();
      } else {
        setError("Error al generar el informe");
      }
    } catch {
      setError("Error de conexión");
    } finally {
      setRefreshing(false);
    }
  };

  const handleTareaAction = async (index: number, texto: string, accion: "completar" | "eliminar" | "restaurar") => {
    try {
      const res = await fetch("/api/tareas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fecha,
          tarea_index: index,
          tarea_texto: texto,
          accion,
          completada_por: "Noelia",
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setTareasEstado(prev => ({
          ...prev,
          [index]: data.tarea,
        }));
      }
    } catch { /* ignore */ }
  };

  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.loadingBox}>
          <Loader2 size={32} style={{ animation: "spin 1s linear infinite" }} />
          <p>Cargando informe...</p>
        </div>
      </div>
    );
  }

  const urgentes = report?.categorias?.urgente || [];
  const pendientes = report?.categorias?.pendiente || [];
  const confirmados = report?.categorias?.confirmado || [];
  const noAcuden = report?.categorias?.no_acude || [];
  const tareas = report?.tareas || [];
  const otrosContactos = report?.otros_contactos || [];

  return (
    <div style={styles.page}>
      {/* HEADER */}
      <div style={styles.headerRow}>
        <button style={styles.backBtn} onClick={() => router.back()} title="Volver"><ArrowLeft size={20} /></button>
        <h1 style={styles.title}>Informe — {formatFecha(fecha)}</h1>
        <button style={styles.iconBtn} title="Exportar"><Download size={16} />Exportar</button>
        <button
          style={{ ...styles.iconBtn, opacity: refreshing ? 0.6 : 1, cursor: refreshing ? "wait" : "pointer" }}
          onClick={handleRefresh}
          disabled={refreshing}
          title="Actualizar informe"
        >
          <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
          {refreshing ? "Generando..." : "Actualizar"}
        </button>
      </div>

      {report && (
        <p style={styles.subline}>
          Generado: {report.generated_at ? new Date(report.generated_at).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Madrid" }) : "—"}
          &nbsp;|&nbsp; Conversaciones: {report.stats.total_conversaciones}
          &nbsp;|&nbsp; Pacientes: {report.stats.total_pacientes}
        </p>
      )}

      {error && !report && (
        <div style={{ textAlign: "center", padding: 60, color: "var(--text-muted)" }}>
          <p style={{ fontSize: 16, marginBottom: 20 }}>{error}</p>
          <button style={{ ...styles.iconBtn, margin: "0 auto" }} onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw size={16} />
            {refreshing ? "Generando..." : "Generar informe"}
          </button>
        </div>
      )}

      {report && (
        <>
          {/* RESUMEN EJECUTIVO */}
          <SectionHeader emoji="📊" label="RESUMEN EJECUTIVO" bg="var(--bg-surface)" color="var(--text-primary)" />
          <div style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "0 0 10px 10px", padding: "16px 20px", marginBottom: 4 }}>
            <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.8, margin: 0 }}>{report.resumen_ejecutivo}</p>
            {report.puntos_clave.length > 0 && (
              <ul style={{ listStyle: "disc", paddingLeft: 20, margin: "12px 0 0", lineHeight: 2, fontSize: 14, color: "var(--text-secondary)" }}>
                {report.puntos_clave.map((p, i) => <li key={i}>{p}</li>)}
              </ul>
            )}
          </div>

          {/* URGENTE */}
          {urgentes.length > 0 && (
            <>
              <SectionHeader emoji="🚨" label={`URGENTE (${urgentes.length})`} bg="rgba(239, 68, 68, 0.12)" color="var(--danger)" />
              <div style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "0 0 10px 10px", padding: 16 }}>
                {urgentes.map((p, i) => (
                  <div key={i} style={{ ...styles.card, marginBottom: i < urgentes.length - 1 ? 14 : 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <AlertTriangle size={16} style={{ color: "var(--danger)", flexShrink: 0 }} />
                      <span style={styles.cardName}>{p.patient_name}</span>
                    </div>
                    {p.phone && <div style={styles.cardPhone}><Phone size={11} style={{ marginRight: 4, verticalAlign: "middle" }} />{p.phone}</div>}
                    {p.descripcion && <div style={styles.summaryBox}>{p.descripcion}</div>}
                    {p.estado && <span style={{ ...styles.badge, backgroundColor: "var(--danger)", color: "var(--white)" }}>{p.estado}</span>}
                    {p.accion_requerida && <div style={styles.actionText}><ClipboardList size={13} style={{ marginRight: 4, verticalAlign: "middle" }} />{p.accion_requerida}</div>}
                  </div>
                ))}
              </div>
            </>
          )}

          {/* PENDIENTE */}
          {pendientes.length > 0 && (
            <>
              <SectionHeader emoji="⏳" label={`PENDIENTE (${pendientes.length})`} bg="rgba(245, 158, 11, 0.12)" color="var(--warning)" />
              <div style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "0 0 10px 10px", padding: 16 }}>
                {pendientes.map((p, i) => (
                  <div key={i} style={{ ...styles.card, marginBottom: i < pendientes.length - 1 ? 14 : 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <Clock size={16} style={{ color: "var(--warning)", flexShrink: 0 }} />
                      <span style={styles.cardName}>{p.patient_name}</span>
                    </div>
                    {p.phone && <div style={styles.cardPhone}><Phone size={11} style={{ marginRight: 4, verticalAlign: "middle" }} />{p.phone}</div>}
                    {p.descripcion && <div style={styles.summaryBox}>{p.descripcion}</div>}
                    {p.accion_requerida && <div style={styles.actionText}><ClipboardList size={13} style={{ marginRight: 4, verticalAlign: "middle" }} />{p.accion_requerida}</div>}
                  </div>
                ))}
              </div>
            </>
          )}

          {/* CONFIRMADOS */}
          {confirmados.length > 0 && (
            <>
              <SectionHeader emoji="✅" label={`CONFIRMADOS (${confirmados.length})`} bg="rgba(34, 197, 94, 0.12)" color="var(--success)" />
              <div style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "0 0 10px 10px", overflow: "hidden" }}>
                {confirmados.map((c, i) => (
                  <div key={i} style={styles.confirmLine}>
                    <CheckCircle2 size={16} style={{ color: "var(--success)", flexShrink: 0 }} />
                    <strong style={{ color: "var(--text-primary)", minWidth: 100 }}>{c.patient_name}</strong>
                    <span>{c.hora_cita && `${c.hora_cita} — `}{c.descripcion}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* NO ACUDEN */}
          {noAcuden.length > 0 && (
            <>
              <SectionHeader emoji="❌" label={`NO ACUDEN (${noAcuden.length})`} bg="rgba(239, 68, 68, 0.08)" color="var(--danger)" />
              <div style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "0 0 10px 10px", overflow: "hidden" }}>
                {noAcuden.map((n, i) => (
                  <div key={i} style={styles.confirmLine}>
                    <XCircle size={16} style={{ color: "var(--danger)", flexShrink: 0 }} />
                    <strong style={{ color: "var(--text-primary)", minWidth: 130 }}>{n.patient_name}</strong>
                    <span>{n.motivo_cancelacion || n.descripcion}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* OTROS CONTACTOS */}
          {otrosContactos.length > 0 && (
            <>
              <SectionHeader emoji="📞" label="OTROS CONTACTOS" bg="var(--bg-surface)" color="var(--text-primary)" />
              <div style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "0 0 10px 10px", overflow: "hidden" }}>
                {otrosContactos.map((t, i) => (
                  <div key={i} style={styles.bulletItem}><ChevronRight size={14} style={{ color: "var(--text-muted)", marginTop: 3, flexShrink: 0 }} />{t}</div>
                ))}
              </div>
            </>
          )}

          {/* TAREAS NOELIA - CON BOTONES */}
          {tareas.length > 0 && (
            <>
              <SectionHeader emoji="📋" label="TAREAS PENDIENTES NOELIA" bg="rgba(37, 99, 235, 0.10)" color="var(--accent-light)" />
              <div style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "0 0 10px 10px", overflow: "hidden" }}>
                {tareas.map((t, i) => {
                  const estado = tareasEstado[i];
                  const isCompletada = estado?.completada;
                  const isEliminada = estado?.eliminada;

                  if (isEliminada) {
                    return (
                      <div key={i} style={{ ...styles.taskRow, opacity: 0.4, backgroundColor: "rgba(239, 68, 68, 0.05)" }}>
                        <span style={{ fontWeight: 700, color: "var(--text-muted)", minWidth: 22 }}>{i + 1}.</span>
                        <span style={{ ...styles.taskText, textDecoration: "line-through" }}>{t.titulo}</span>
                        <button
                          style={{ ...styles.taskBtn, color: "var(--text-muted)" }}
                          onClick={() => handleTareaAction(i, t.titulo, "restaurar")}
                          title="Restaurar tarea"
                        >
                          <RotateCcw size={16} />
                        </button>
                      </div>
                    );
                  }

                  return (
                    <div key={i} style={{ ...styles.taskRow, opacity: isCompletada ? 0.5 : 1, backgroundColor: isCompletada ? "rgba(34, 197, 94, 0.05)" : "transparent" }}>
                      <span style={{ fontWeight: 700, color: "var(--text-muted)", minWidth: 22 }}>{i + 1}.</span>
                      <span style={{ fontSize: 16, marginRight: 4 }}>
                        {t.prioridad === "urgente" ? "🔴" : t.prioridad === "alta" ? "🟠" : "🟡"}
                      </span>
                      <span style={{ ...styles.taskText, textDecoration: isCompletada ? "line-through" : "none" }}>
                        {t.titulo}
                      </span>
                      {isCompletada ? (
                        <button
                          style={{ ...styles.taskBtn, color: "var(--text-muted)" }}
                          onClick={() => handleTareaAction(i, t.titulo, "restaurar")}
                          title="Restaurar tarea"
                        >
                          <RotateCcw size={16} />
                        </button>
                      ) : (
                        <>
                          <button
                            style={{ ...styles.taskBtn, color: "var(--success)" }}
                            onClick={() => handleTareaAction(i, t.titulo, "completar")}
                            title="Marcar como hecha"
                          >
                            <Check size={18} />
                          </button>
                          <button
                            style={{ ...styles.taskBtn, color: "var(--danger)" }}
                            onClick={() => handleTareaAction(i, t.titulo, "eliminar")}
                            title="Eliminar tarea"
                          >
                            <Trash2 size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* BOTTOM CTA */}
          <Link href={`/chat?report=${fecha}`} style={{ textDecoration: "none" }}>
            <button style={styles.bottomBtn}>
              <MessageSquare size={18} />
              Preguntar sobre este informe
            </button>
          </Link>
        </>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
