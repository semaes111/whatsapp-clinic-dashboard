"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  FileText,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  CalendarDays,
  CheckCircle,
  XCircle,
  UserPlus,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface DayReport {
  fecha: string; // YYYY-MM-DD
  label: string; // display label
  conversaciones: number;
  rojo: number;
  amarillo: number;
  verde: number;
  negro: number;
  confirmados: number;
}

interface WeekTrend {
  semana: number;
  asistencia: number;
  cancelaciones: number;
  nuevos: number;
}

/* ------------------------------------------------------------------ */
/*  Mock data                                                          */
/* ------------------------------------------------------------------ */

const REPORTS: DayReport[] = [
  { fecha: "2026-02-03", label: "3 feb", conversaciones: 18, rojo: 4, amarillo: 5, verde: 7, negro: 2, confirmados: 6 },
  { fecha: "2026-01-31", label: "31 ene", conversaciones: 12, rojo: 2, amarillo: 3, verde: 6, negro: 1, confirmados: 8 },
  { fecha: "2026-01-30", label: "30 ene", conversaciones: 9, rojo: 1, amarillo: 2, verde: 5, negro: 1, confirmados: 7 },
  { fecha: "2026-01-29", label: "29 ene", conversaciones: 15, rojo: 3, amarillo: 4, verde: 6, negro: 2, confirmados: 5 },
];

const REPORT_DATES = new Set(REPORTS.map((r) => r.fecha));

const TRENDS: WeekTrend[] = [
  { semana: 5, asistencia: 85, cancelaciones: 3, nuevos: 2 },
  { semana: 4, asistencia: 90, cancelaciones: 2, nuevos: 1 },
  { semana: 3, asistencia: 78, cancelaciones: 5, nuevos: 3 },
];

/* ------------------------------------------------------------------ */
/*  Calendar helper — Feb 2026                                        */
/* ------------------------------------------------------------------ */

function buildCalendar(year: number, month: number) {
  // month is 0-indexed (0=Jan, 1=Feb ...)
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();

  // Monday=0 ... Sunday=6
  let startDow = firstDay.getDay() - 1;
  if (startDow < 0) startDow = 6;

  const cells: (number | null)[] = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  return cells;
}

const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const DAY_HEADERS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

/* ------------------------------------------------------------------ */
/*  Styles                                                             */
/* ------------------------------------------------------------------ */

const st = {
  page: { maxWidth: 860, margin: "0 auto" } as React.CSSProperties,

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

  title: {
    fontSize: 22,
    fontWeight: 700,
    color: "var(--text-primary)",
    display: "flex",
    alignItems: "center",
    gap: 10,
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

  /* Calendar */
  calNavRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  } as React.CSSProperties,

  calNavBtn: {
    background: "none",
    border: "1px solid var(--border)",
    color: "var(--text-secondary)",
    cursor: "pointer",
    padding: 6,
    borderRadius: 6,
    display: "flex",
    alignItems: "center",
  } as React.CSSProperties,

  calMonthLabel: {
    fontSize: 16,
    fontWeight: 600,
    color: "var(--text-primary)",
  } as React.CSSProperties,

  calGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(7, 1fr)",
    gap: 4,
  } as React.CSSProperties,

  calDayHeader: {
    textAlign: "center" as const,
    fontSize: 11,
    fontWeight: 600,
    color: "var(--text-muted)",
    padding: "4px 0 8px",
    textTransform: "uppercase" as const,
  } as React.CSSProperties,

  calCell: (
    isToday: boolean,
    hasReport: boolean,
    isEmpty: boolean
  ) =>
    ({
      width: 48,
      height: 48,
      margin: "0 auto",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 8,
      fontSize: 14,
      fontWeight: isToday ? 700 : 400,
      color: isEmpty
        ? "transparent"
        : isToday
          ? "var(--white)"
          : hasReport
            ? "var(--accent-light)"
            : "var(--text-secondary)",
      background: isEmpty
        ? "transparent"
        : isToday
          ? "var(--accent)"
          : hasReport
            ? "rgba(37, 99, 235, 0.1)"
            : "transparent",
      border: hasReport && !isToday ? "1px solid var(--accent)" : "1px solid transparent",
      cursor: hasReport || isToday ? "pointer" : "default",
      transition: "background 0.12s",
    }) as React.CSSProperties,

  /* Report rows */
  reportRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "12px 14px",
    borderRadius: 8,
    background: "var(--bg-surface)",
    marginBottom: 8,
    cursor: "pointer",
    border: "1px solid var(--border)",
    transition: "background 0.12s",
  } as React.CSSProperties,

  reportLeft: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  } as React.CSSProperties,

  reportDate: {
    fontSize: 15,
    fontWeight: 600,
    color: "var(--text-primary)",
    minWidth: 60,
  } as React.CSSProperties,

  reportConv: {
    fontSize: 13,
    color: "var(--text-secondary)",
  } as React.CSSProperties,

  reportDots: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: 13,
  } as React.CSSProperties,

  dot: (color: string) =>
    ({
      display: "inline-flex",
      alignItems: "center",
      gap: 2,
      color,
      fontWeight: 500,
    }) as React.CSSProperties,

  reportConfirmed: {
    fontSize: 13,
    color: "var(--success)",
    fontWeight: 500,
    display: "flex",
    alignItems: "center",
    gap: 4,
  } as React.CSSProperties,

  /* Trends */
  trendRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "12px 0",
    borderBottom: "1px solid var(--border)",
  } as React.CSSProperties,

  trendLabel: {
    fontSize: 14,
    fontWeight: 600,
    color: "var(--text-primary)",
    minWidth: 70,
  } as React.CSSProperties,

  trendStats: {
    display: "flex",
    alignItems: "center",
    gap: 20,
    fontSize: 13,
    color: "var(--text-secondary)",
  } as React.CSSProperties,

  trendStat: (color: string) =>
    ({
      display: "flex",
      alignItems: "center",
      gap: 4,
      color,
    }) as React.CSSProperties,

  asistBar: (pct: number) =>
    ({
      width: 120,
      height: 6,
      borderRadius: 3,
      background: "var(--bg-surface)",
      overflow: "hidden",
      position: "relative" as const,
    }) as React.CSSProperties,

  asistFill: (pct: number) =>
    ({
      width: `${pct}%`,
      height: "100%",
      borderRadius: 3,
      background:
        pct >= 85
          ? "var(--success)"
          : pct >= 75
            ? "var(--warning)"
            : "var(--danger)",
    }) as React.CSSProperties,
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function HistoricoPage() {
  const router = useRouter();
  const [calYear, setCalYear] = useState(2026);
  const [calMonth, setCalMonth] = useState(1); // February (0-indexed)

  const cells = buildCalendar(calYear, calMonth);
  const todayStr = "2026-02-03";
  const todayDay = 3;

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
    if (REPORT_DATES.has(key) || key === todayStr) {
      router.push(`/informe/${key}`);
    }
  }

  return (
    <div style={st.page}>
      {/* Header */}
      <div style={st.headerRow}>
        <button style={st.backBtn} onClick={() => router.back()}>
          <ArrowLeft size={20} />
        </button>
        <div style={st.title}>
          <FileText size={22} />
          Histórico de Informes
        </div>
      </div>

      {/* Calendar Card */}
      <div style={st.card}>
        <div style={st.cardTitle}>
          <CalendarDays size={15} />
          Calendario
        </div>

        {/* Nav */}
        <div style={st.calNavRow}>
          <button style={st.calNavBtn} onClick={prevMonth}>
            <ChevronLeft size={16} />
          </button>
          <span style={st.calMonthLabel}>
            {MONTH_NAMES[calMonth]} {calYear}
          </span>
          <button style={st.calNavBtn} onClick={nextMonth}>
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Grid */}
        <div style={st.calGrid}>
          {DAY_HEADERS.map((d) => (
            <div key={d} style={st.calDayHeader}>
              {d}
            </div>
          ))}
          {cells.map((day, i) => {
            if (day === null) {
              return <div key={`e${i}`} style={st.calCell(false, false, true)} />;
            }
            const key = dateKey(day);
            const isToday = key === todayStr;
            const hasReport = REPORT_DATES.has(key);
            return (
              <div
                key={i}
                style={st.calCell(isToday, hasReport, false)}
                onClick={() => handleDayClick(day)}
                onMouseEnter={(e) => {
                  if (hasReport || isToday)
                    (e.currentTarget as HTMLDivElement).style.background =
                      "var(--bg-hover)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.background = isToday
                    ? "var(--accent)"
                    : hasReport
                      ? "rgba(37, 99, 235, 0.1)"
                      : "transparent";
                }}
              >
                {day}
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent reports */}
      <div style={st.card}>
        <div style={st.cardTitle}>
          <FileText size={15} />
          Informes Recientes
        </div>

        {REPORTS.map((r) => (
          <div
            key={r.fecha}
            style={st.reportRow}
            onClick={() => router.push(`/informe/${r.fecha}`)}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLDivElement).style.background =
                "var(--bg-hover)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLDivElement).style.background =
                "var(--bg-surface)";
            }}
          >
            <div style={st.reportLeft}>
              <span style={st.reportDate}>{r.label}</span>
              <span style={st.reportConv}>{r.conversaciones} conv.</span>
            </div>
            <div style={st.reportDots}>
              <span style={st.dot("var(--danger)")}>{r.rojo}<span style={{ fontSize: 11 }}>&#128308;</span></span>
              <span style={st.dot("var(--warning)")}>{r.amarillo}<span style={{ fontSize: 11 }}>&#128993;</span></span>
              <span style={st.dot("var(--success)")}>{r.verde}<span style={{ fontSize: 11 }}>&#128994;</span></span>
              <span style={st.dot("var(--text-muted)")}>{r.negro}<span style={{ fontSize: 11 }}>&#9899;</span></span>
            </div>
            <div style={st.reportConfirmed}>
              <CheckCircle size={14} />
              {r.confirmados} confirmados
            </div>
          </div>
        ))}
      </div>

      {/* Weekly Trends */}
      <div style={st.card}>
        <div style={st.cardTitle}>
          <TrendingUp size={15} />
          Tendencias Semanales
        </div>

        {TRENDS.map((t) => (
          <div key={t.semana} style={st.trendRow}>
            <span style={st.trendLabel}>Sem {t.semana}</span>

            <div style={st.trendStats}>
              {/* Asistencia bar */}
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={st.asistBar(t.asistencia)}>
                  <div style={st.asistFill(t.asistencia)} />
                </div>
                <span
                  style={{
                    fontWeight: 600,
                    fontSize: 13,
                    color:
                      t.asistencia >= 85
                        ? "var(--success)"
                        : t.asistencia >= 75
                          ? "var(--warning)"
                          : "var(--danger)",
                  }}
                >
                  {t.asistencia}%
                </span>
              </div>

              <span style={st.trendStat("var(--danger)")}>
                <XCircle size={14} />
                {t.cancelaciones} cancel.
              </span>

              <span style={st.trendStat("var(--accent-light)")}>
                <UserPlus size={14} />
                {t.nuevos} {t.nuevos === 1 ? "nuevo" : "nuevos"}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
