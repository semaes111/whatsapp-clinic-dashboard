"use client";

import { useState, useEffect, useCallback } from "react";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { Loader2, TrendingUp, TrendingDown, Users, MessageSquare, AlertTriangle, CheckCircle2 } from "lucide-react";

/* ------------------------------------------------------------------ */
/*  TYPES                                                              */
/* ------------------------------------------------------------------ */

interface DailyData {
  fecha: string;
  confirmados: number;
  cancelaciones: number;
  pendientes: number;
  urgentes: number;
  no_acude: number;
  total_conversaciones: number;
  total_pacientes: number;
  primeras_visitas: number;
  ya_avisaran: number;
  sin_atender: number;
  tareas_pendientes: number;
}

interface Totals {
  total_dias: number;
  total_confirmados: number;
  total_cancelaciones: number;
  total_pendientes: number;
  total_urgentes: number;
  tasa_confirmacion: number;
  tasa_cancelacion: number;
  promedio_conversaciones_dia: number;
}

/* ------------------------------------------------------------------ */
/*  COLORS                                                             */
/* ------------------------------------------------------------------ */

const COLORS = {
  confirmados: "#22c55e",
  cancelaciones: "#ef4444",
  pendientes: "#f59e0b",
  urgentes: "#dc2626",
  no_acude: "#f97316",
  ya_avisaran: "#a855f7",
  sin_atender: "#6b7280",
  primeras_visitas: "#3b82f6",
  conversaciones: "#6366f1",
  pacientes: "#22d3ee",
};

const PIE_COLORS = [COLORS.confirmados, COLORS.cancelaciones, COLORS.pendientes, COLORS.no_acude, COLORS.urgentes];

/* ------------------------------------------------------------------ */
/*  STYLES                                                             */
/* ------------------------------------------------------------------ */

const styles: Record<string, React.CSSProperties> = {
  page: { maxWidth: 1200, margin: "0 auto" },
  title: { fontSize: 26, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 },
  subtitle: { fontSize: 13, color: "var(--text-muted)", marginBottom: 24 },
  filterRow: { display: "flex", alignItems: "center", gap: 12, marginBottom: 24, flexWrap: "wrap" as const },
  dateInput: { backgroundColor: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 12px", color: "var(--text-primary)", fontSize: 13, outline: "none" },
  quickBtn: { padding: "6px 14px", backgroundColor: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 20, fontSize: 12, color: "var(--text-secondary)", cursor: "pointer", transition: "all 0.15s" },
  quickBtnActive: { padding: "6px 14px", backgroundColor: "var(--accent)", border: "1px solid var(--accent)", borderRadius: 20, fontSize: 12, color: "white", cursor: "pointer" },
  kpiRow: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 32 },
  kpiCard: { backgroundColor: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10, padding: "16px 20px" },
  kpiLabel: { fontSize: 12, color: "var(--text-muted)", marginBottom: 4 },
  kpiValue: { fontSize: 28, fontWeight: 700 },
  kpiSub: { fontSize: 11, color: "var(--text-muted)", marginTop: 2 },
  chartCard: { backgroundColor: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 12, padding: 24, marginBottom: 24 },
  chartTitle: { fontSize: 16, fontWeight: 600, color: "var(--text-primary)", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 },
  chartsGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 24 },
  loadingBox: { display: "flex", flexDirection: "column" as const, alignItems: "center", justifyContent: "center", minHeight: 400, gap: 16, color: "var(--text-muted)" },
  emptyBox: { textAlign: "center" as const, padding: 60, color: "var(--text-muted)" },
};

/* ------------------------------------------------------------------ */
/*  COMPONENT                                                          */
/* ------------------------------------------------------------------ */

export default function EstadisticasPage() {
  const today = new Date().toISOString().split("T")[0];
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split("T")[0];
  });
  const [toDate, setToDate] = useState(today);
  const [daily, setDaily] = useState<DailyData[]>([]);
  const [totals, setTotals] = useState<Totals | null>(null);
  const [loading, setLoading] = useState(true);
  const [quickRange, setQuickRange] = useState(30);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/stats?from=${fromDate}&to=${toDate}`);
      if (res.ok) {
        const data = await res.json();
        setDaily(data.daily || []);
        setTotals(data.totals || null);
      }
    } catch (e) {
      console.error("Stats fetch error:", e);
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate]);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const setRange = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() - days);
    setFromDate(d.toISOString().split("T")[0]);
    setToDate(today);
    setQuickRange(days);
  };

  // Pie chart data
  const pieData = totals ? [
    { name: "Confirmados", value: totals.total_confirmados },
    { name: "Cancelaciones", value: totals.total_cancelaciones },
    { name: "Pendientes", value: totals.total_pendientes },
    { name: "No acude", value: daily.reduce((a, d) => a + d.no_acude, 0) },
    { name: "Urgentes", value: totals.total_urgentes },
  ].filter(d => d.value > 0) : [];

  // Tareas by priority
  const tareasByPriority = daily.reduce((acc, d) => {
    acc.total += d.tareas_pendientes;
    return acc;
  }, { total: 0 });

  // Short date format for charts
  const formatDate = (fecha: string) => {
    const d = new Date(fecha + "T00:00:00");
    return d.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
  };

  const chartDaily = daily.map(d => ({ ...d, label: formatDate(d.fecha) }));

  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.loadingBox}>
          <Loader2 size={32} style={{ animation: "spin 1s linear infinite" }} />
          <p>Cargando estadísticas...</p>
        </div>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>📊 Estadísticas</h1>
      <p style={styles.subtitle}>Análisis de actividad de la consulta</p>

      {/* FILTROS */}
      <div style={styles.filterRow}>
        <span style={{ fontSize: 13, color: "var(--text-muted)" }}>Desde:</span>
        <input type="date" value={fromDate} onChange={(e) => { setFromDate(e.target.value); setQuickRange(0); }} style={styles.dateInput} />
        <span style={{ fontSize: 13, color: "var(--text-muted)" }}>Hasta:</span>
        <input type="date" value={toDate} onChange={(e) => { setToDate(e.target.value); setQuickRange(0); }} style={styles.dateInput} />
        {[7, 30, 90].map(d => (
          <button key={d} style={quickRange === d ? styles.quickBtnActive : styles.quickBtn} onClick={() => setRange(d)}>
            {d} días
          </button>
        ))}
      </div>

      {daily.length === 0 ? (
        <div style={styles.emptyBox}>
          <p style={{ fontSize: 18, marginBottom: 8 }}>No hay datos para este período</p>
          <p>Genera informes diarios para ver estadísticas aquí.</p>
        </div>
      ) : (
        <>
          {/* KPI CARDS */}
          <div style={styles.kpiRow}>
            <div style={styles.kpiCard}>
              <div style={styles.kpiLabel}><CheckCircle2 size={12} style={{ marginRight: 4 }} />Confirmados</div>
              <div style={{ ...styles.kpiValue, color: COLORS.confirmados }}>{totals?.total_confirmados || 0}</div>
              <div style={styles.kpiSub}>{totals?.tasa_confirmacion}% tasa</div>
            </div>
            <div style={styles.kpiCard}>
              <div style={styles.kpiLabel}><TrendingDown size={12} style={{ marginRight: 4 }} />Cancelaciones</div>
              <div style={{ ...styles.kpiValue, color: COLORS.cancelaciones }}>{totals?.total_cancelaciones || 0}</div>
              <div style={styles.kpiSub}>{totals?.tasa_cancelacion}% tasa</div>
            </div>
            <div style={styles.kpiCard}>
              <div style={styles.kpiLabel}>Pendientes</div>
              <div style={{ ...styles.kpiValue, color: COLORS.pendientes }}>{totals?.total_pendientes || 0}</div>
              <div style={styles.kpiSub}>acumulado</div>
            </div>
            <div style={styles.kpiCard}>
              <div style={styles.kpiLabel}><AlertTriangle size={12} style={{ marginRight: 4 }} />Urgentes</div>
              <div style={{ ...styles.kpiValue, color: COLORS.urgentes }}>{totals?.total_urgentes || 0}</div>
              <div style={styles.kpiSub}>requieren acción</div>
            </div>
            <div style={styles.kpiCard}>
              <div style={styles.kpiLabel}><TrendingUp size={12} style={{ marginRight: 4 }} />Tasa confirmación</div>
              <div style={{ ...styles.kpiValue, color: COLORS.confirmados }}>{totals?.tasa_confirmacion || 0}%</div>
              <div style={styles.kpiSub}>del total</div>
            </div>
            <div style={styles.kpiCard}>
              <div style={styles.kpiLabel}><MessageSquare size={12} style={{ marginRight: 4 }} />Conv./día</div>
              <div style={{ ...styles.kpiValue, color: COLORS.conversaciones }}>{totals?.promedio_conversaciones_dia || 0}</div>
              <div style={styles.kpiSub}>promedio</div>
            </div>
          </div>

          {/* GRÁFICA 1: Evolución diaria */}
          <div style={styles.chartCard}>
            <div style={styles.chartTitle}><TrendingUp size={18} />Evolución diaria</div>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={chartDaily}>
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                <XAxis dataKey="label" tick={{ fill: "#888", fontSize: 11 }} />
                <YAxis tick={{ fill: "#888", fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #333", borderRadius: 8, fontSize: 13 }} />
                <Legend />
                <Line type="monotone" dataKey="confirmados" stroke={COLORS.confirmados} strokeWidth={2} dot={{ r: 3 }} name="Confirmados" />
                <Line type="monotone" dataKey="cancelaciones" stroke={COLORS.cancelaciones} strokeWidth={2} dot={{ r: 3 }} name="Cancelaciones" />
                <Line type="monotone" dataKey="pendientes" stroke={COLORS.pendientes} strokeWidth={2} dot={{ r: 3 }} name="Pendientes" />
                <Line type="monotone" dataKey="ya_avisaran" stroke={COLORS.ya_avisaran} strokeWidth={2} dot={{ r: 3 }} name="Ya avisarán" />
                <Line type="monotone" dataKey="sin_atender" stroke={COLORS.sin_atender} strokeWidth={2} dot={{ r: 3 }} name="Sin atender" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div style={styles.chartsGrid}>
            {/* GRÁFICA 2: Primeras visitas */}
            <div style={styles.chartCard}>
              <div style={styles.chartTitle}><Users size={18} />Primeras visitas</div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={chartDaily}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                  <XAxis dataKey="label" tick={{ fill: "#888", fontSize: 10 }} />
                  <YAxis tick={{ fill: "#888", fontSize: 11 }} />
                  <Tooltip contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #333", borderRadius: 8, fontSize: 13 }} />
                  <Bar dataKey="primeras_visitas" fill={COLORS.primeras_visitas} radius={[4, 4, 0, 0]} name="Primeras visitas" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* GRÁFICA 3: Distribución */}
            <div style={styles.chartCard}>
              <div style={styles.chartTitle}>Distribución del período</div>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #333", borderRadius: 8, fontSize: 13 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* GRÁFICA 4: Conversaciones y pacientes */}
          <div style={styles.chartCard}>
            <div style={styles.chartTitle}><MessageSquare size={18} />Conversaciones y pacientes por día</div>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartDaily}>
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                <XAxis dataKey="label" tick={{ fill: "#888", fontSize: 11 }} />
                <YAxis tick={{ fill: "#888", fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #333", borderRadius: 8, fontSize: 13 }} />
                <Legend />
                <Area type="monotone" dataKey="total_conversaciones" stroke={COLORS.conversaciones} fill={COLORS.conversaciones} fillOpacity={0.15} strokeWidth={2} name="Conversaciones" />
                <Area type="monotone" dataKey="total_pacientes" stroke={COLORS.pacientes} fill={COLORS.pacientes} fillOpacity={0.15} strokeWidth={2} name="Pacientes" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* GRÁFICA 5: Tareas Noelia */}
          <div style={styles.chartCard}>
            <div style={styles.chartTitle}>📋 Tareas pendientes Noelia por día</div>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartDaily}>
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                <XAxis dataKey="label" tick={{ fill: "#888", fontSize: 10 }} />
                <YAxis tick={{ fill: "#888", fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #333", borderRadius: 8, fontSize: 13 }} />
                <Bar dataKey="tareas_pendientes" fill="#6366f1" radius={[4, 4, 0, 0]} name="Tareas" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
