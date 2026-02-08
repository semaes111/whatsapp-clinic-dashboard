"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  FileText,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  CheckCircle,
  AlertTriangle,
  Clock,
  Loader2,
} from "lucide-react";

interface DayReport {
  fecha: string;
  total_conversaciones: number;
  total_pacientes: number;
  total_confirmados: number;
  total_cancelaciones: number;
  total_pendientes: number;
  total_urgentes: number;
  generado_at: string;
}

const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const DAY_HEADERS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

function buildCalendar(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();

  let startDow = firstDay.getDay() - 1;
  if (startDow < 0) startDow = 6;

  const cells: (number | null)[] = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  return cells;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
}

export default function HistoricoPage() {
  const router = useRouter();
  const today = new Date();
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [reports, setReports] = useState<DayReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [reportDates, setReportDates] = useState<Set<string>>(new Set());

  const todayStr = today.toISOString().split("T")[0];

  useEffect(() => {
    fetchReports();
  }, []);

  async function fetchReports() {
    try {
      const res = await fetch("/api/reports/list");
      if (res.ok) {
        const data = await res.json();
        setReports(data.reports || []);
        setReportDates(new Set((data.reports || []).map((r: DayReport) => r.fecha)));
      }
    } catch (error) {
      console.error("Error fetching reports:", error);
    } finally {
      setLoading(false);
    }
  }

  const cells = buildCalendar(calYear, calMonth);

  function dateKey(day: number) {
    const m = String(calMonth + 1).padStart(2, "0");
    const d = String(day).padStart(2, "0");
    return `${calYear}-${m}-${d}`;
  }

  function prevMonth() {
    if (calMonth === 0) {
      setCalYear((y) => y - 1);
      setCalMonth(11);
    } else {
      setCalMonth((m) => m - 1);
    }
  }

  function nextMonth() {
    if (calMonth === 11) {
      setCalYear((y) => y + 1);
      setCalMonth(0);
    } else {
      setCalMonth((m) => m + 1);
    }
  }

  function handleDayClick(day: number) {
    const key = dateKey(day);
    router.push(`/informe/${key}`);
  }

  return (
    <div style={{ maxWidth: 860, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <button
          style={{
            background: "none",
            border: "none",
            color: "var(--text-secondary)",
            cursor: "pointer",
            padding: 6,
            borderRadius: 6,
            display: "flex",
            alignItems: "center",
          }}
          onClick={() => router.back()}
        >
          <ArrowLeft size={20} />
        </button>
        <div style={{ fontSize: 22, fontWeight: 700, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 10 }}>
          <FileText size={22} />
          Histórico de Informes
        </div>
      </div>

      {/* Calendar Card */}
      <div style={{ background: "var(--bg-card)", borderRadius: 12, border: "1px solid var(--border)", padding: 20, marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
          <CalendarDays size={15} />
          Calendario
        </div>

        {/* Nav */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <button
            style={{ background: "none", border: "1px solid var(--border)", color: "var(--text-secondary)", cursor: "pointer", padding: 6, borderRadius: 6, display: "flex", alignItems: "center" }}
            onClick={prevMonth}
          >
            <ChevronLeft size={16} />
          </button>
          <span style={{ fontSize: 16, fontWeight: 600, color: "var(--text-primary)" }}>
            {MONTH_NAMES[calMonth]} {calYear}
          </span>
          <button
            style={{ background: "none", border: "1px solid var(--border)", color: "var(--text-secondary)", cursor: "pointer", padding: 6, borderRadius: 6, display: "flex", alignItems: "center" }}
            onClick={nextMonth}
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
          {DAY_HEADERS.map((d) => (
            <div key={d} style={{ textAlign: "center", fontSize: 11, fontWeight: 600, color: "var(--text-muted)", padding: "4px 0 8px", textTransform: "uppercase" }}>
              {d}
            </div>
          ))}
          {cells.map((day, i) => {
            if (day === null) {
              return <div key={`e${i}`} style={{ width: 48, height: 48, margin: "0 auto" }} />;
            }
            const key = dateKey(day);
            const isToday = key === todayStr;
            const hasReport = reportDates.has(key);
            return (
              <div
                key={i}
                style={{
                  width: 48,
                  height: 48,
                  margin: "0 auto",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: isToday ? 700 : 400,
                  color: isToday ? "var(--white)" : hasReport ? "var(--accent-light)" : "var(--text-secondary)",
                  background: isToday ? "var(--accent)" : hasReport ? "rgba(37, 99, 235, 0.1)" : "transparent",
                  border: hasReport && !isToday ? "1px solid var(--accent)" : "1px solid transparent",
                  cursor: "pointer",
                  transition: "background 0.12s",
                }}
                onClick={() => handleDayClick(day)}
              >
                {day}
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent reports */}
      <div style={{ background: "var(--bg-card)", borderRadius: 12, border: "1px solid var(--border)", padding: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
          <FileText size={15} />
          Informes Disponibles
        </div>

        {loading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 40, color: "var(--text-muted)" }}>
            <Loader2 size={24} className="animate-spin" />
            <span style={{ marginLeft: 12 }}>Cargando informes...</span>
          </div>
        ) : reports.length === 0 ? (
          <div style={{ textAlign: "center", padding: 40, color: "var(--text-muted)" }}>
            No hay informes disponibles
          </div>
        ) : (
          reports.slice(0, 10).map((r) => (
            <div
              key={r.fecha}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 14px",
                borderRadius: 8,
                background: "var(--bg-surface)",
                marginBottom: 8,
                cursor: "pointer",
                border: "1px solid var(--border)",
              }}
              onClick={() => router.push(`/informe/${r.fecha}`)}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)", minWidth: 80 }}>
                  {formatDate(r.fecha)}
                </span>
                <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                  {r.total_conversaciones || 0} conv. · {r.total_pacientes || 0} pac.
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 13 }}>
                {(r.total_urgentes || 0) > 0 && (
                  <span style={{ color: "var(--danger)", display: "flex", alignItems: "center", gap: 4 }}>
                    <AlertTriangle size={14} />
                    {r.total_urgentes}
                  </span>
                )}
                {(r.total_pendientes || 0) > 0 && (
                  <span style={{ color: "var(--warning)", display: "flex", alignItems: "center", gap: 4 }}>
                    <Clock size={14} />
                    {r.total_pendientes}
                  </span>
                )}
                {(r.total_confirmados || 0) > 0 && (
                  <span style={{ color: "var(--success)", display: "flex", alignItems: "center", gap: 4 }}>
                    <CheckCircle size={14} />
                    {r.total_confirmados}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
