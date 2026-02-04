"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Search,
  Users,
  AlertTriangle,
  Calendar,
  X,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Patient {
  nombre: string;
  telefono: string;
  tipo: "Dieta" | "Estét.";
  proxCita: string;
  cancelaciones: number;
}

/* ------------------------------------------------------------------ */
/*  Mock data                                                          */
/* ------------------------------------------------------------------ */

const PATIENTS: Patient[] = [
  { nombre: "Aguado, Elena", telefono: "667490504", tipo: "Dieta", proxCita: "❌ Pendiente", cancelaciones: 2 },
  { nombre: "Alcaina, Mercedes", telefono: "685518181", tipo: "Estét.", proxCita: "—", cancelaciones: 0 },
  { nombre: "Barco, Patricia", telefono: "665278525", tipo: "Dieta", proxCita: "4 feb 11:00", cancelaciones: 0 },
  { nombre: "Bedmar, Samuel", telefono: "650892700", tipo: "Dieta", proxCita: "4 feb", cancelaciones: 0 },
  { nombre: "Casas, María José", telefono: "661245686", tipo: "Dieta", proxCita: "4 feb 09:00", cancelaciones: 0 },
  { nombre: "Criado, Fco. Javier", telefono: "618906617", tipo: "Dieta", proxCita: "❌ Pendiente", cancelaciones: 0 },
  { nombre: "Gomez, Pilar", telefono: "633859904", tipo: "Dieta", proxCita: "4 feb 10:30", cancelaciones: 0 },
  { nombre: "Lusffi, Elida", telefono: "686490431", tipo: "Dieta", proxCita: "—", cancelaciones: 0 },
  { nombre: "Madero, Eva Mª", telefono: "645906518", tipo: "Dieta", proxCita: "❌ Espera", cancelaciones: 0 },
  { nombre: "Martínez, Sara", telefono: "645745681", tipo: "Dieta", proxCita: "4 feb", cancelaciones: 0 },
  { nombre: "Meca, Carmen", telefono: "645975355", tipo: "Dieta", proxCita: "❌ Pendiente", cancelaciones: 0 },
  { nombre: "Pérez, M. Francisca", telefono: "637447135", tipo: "Dieta", proxCita: "4 feb", cancelaciones: 0 },
  { nombre: "Pineda, Irene", telefono: "695264499", tipo: "Dieta", proxCita: "25 feb 17:00", cancelaciones: 0 },
  { nombre: "Rodriguez, Nadina", telefono: "687823194", tipo: "Dieta", proxCita: "Sem. próxima", cancelaciones: 0 },
  { nombre: "Rubi, Yolanda", telefono: "676986628", tipo: "Dieta", proxCita: "11 feb 10:00", cancelaciones: 0 },
  { nombre: "Sánchez, Rafael", telefono: "649492628", tipo: "Dieta", proxCita: "❌ Pendiente", cancelaciones: 0 },
  { nombre: "Valdivia, Silvia", telefono: "643787019", tipo: "Dieta", proxCita: "4 feb", cancelaciones: 0 },
  { nombre: "Torres, Lucía", telefono: "612345678", tipo: "Estét.", proxCita: "6 feb 09:30", cancelaciones: 1 },
];

type FilterType = "Todos" | "Dieta" | "Estét." | "Activo" | "Con cita";

/* ------------------------------------------------------------------ */
/*  Styles                                                             */
/* ------------------------------------------------------------------ */

const styles = {
  page: {
    maxWidth: 960,
    margin: "0 auto",
  } as React.CSSProperties,

  headerRow: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginBottom: 20,
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

  countBadge: {
    fontSize: 14,
    fontWeight: 500,
    color: "var(--text-muted)",
  } as React.CSSProperties,

  searchWrap: {
    position: "relative" as const,
    marginBottom: 16,
  } as React.CSSProperties,

  searchIcon: {
    position: "absolute" as const,
    left: 12,
    top: "50%",
    transform: "translateY(-50%)",
    color: "var(--text-muted)",
    pointerEvents: "none" as const,
  } as React.CSSProperties,

  searchInput: {
    width: "100%",
    padding: "10px 12px 10px 40px",
    borderRadius: 8,
    border: "1px solid var(--border)",
    background: "var(--bg-surface)",
    color: "var(--text-primary)",
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box" as const,
  } as React.CSSProperties,

  filtersRow: {
    display: "flex",
    gap: 8,
    marginBottom: 20,
    flexWrap: "wrap" as const,
  } as React.CSSProperties,

  chip: (active: boolean) =>
    ({
      padding: "6px 14px",
      borderRadius: 20,
      fontSize: 13,
      fontWeight: 500,
      cursor: "pointer",
      border: active ? "1px solid var(--accent)" : "1px solid var(--border)",
      background: active ? "var(--accent)" : "var(--bg-surface)",
      color: active ? "var(--white)" : "var(--text-secondary)",
      transition: "all 0.15s ease",
    }) as React.CSSProperties,

  tableCard: {
    background: "var(--bg-card)",
    borderRadius: 12,
    border: "1px solid var(--border)",
    overflow: "hidden",
  } as React.CSSProperties,

  tableHeader: {
    display: "grid",
    gridTemplateColumns: "2fr 1.2fr 0.7fr 1.3fr 0.5fr",
    padding: "10px 16px",
    fontSize: 12,
    fontWeight: 600,
    color: "var(--text-muted)",
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
    borderBottom: "1px solid var(--border)",
    background: "var(--bg-surface)",
  } as React.CSSProperties,

  row: (index: number, highlighted: boolean) =>
    ({
      display: "grid",
      gridTemplateColumns: "2fr 1.2fr 0.7fr 1.3fr 0.5fr",
      padding: "12px 16px",
      fontSize: 14,
      cursor: "pointer",
      borderBottom: "1px solid var(--border)",
      background: highlighted
        ? "rgba(239, 68, 68, 0.06)"
        : index % 2 === 0
          ? "var(--bg-card)"
          : "var(--bg-surface)",
      transition: "background 0.12s ease",
      alignItems: "center",
    }) as React.CSSProperties,

  nombre: {
    color: "var(--text-primary)",
    fontWeight: 500,
  } as React.CSSProperties,

  telefono: {
    color: "var(--text-secondary)",
    fontFamily: "monospace",
    fontSize: 13,
  } as React.CSSProperties,

  tipoBadge: (tipo: string) =>
    ({
      display: "inline-block",
      padding: "2px 8px",
      borderRadius: 6,
      fontSize: 12,
      fontWeight: 500,
      background:
        tipo === "Dieta"
          ? "rgba(34, 197, 94, 0.12)"
          : "rgba(168, 85, 247, 0.12)",
      color: tipo === "Dieta" ? "var(--success)" : "#a855f7",
    }) as React.CSSProperties,

  citaText: (cita: string) =>
    ({
      fontSize: 13,
      color: cita.includes("❌")
        ? "var(--danger)"
        : cita === "—"
          ? "var(--text-muted)"
          : "var(--text-primary)",
      fontWeight: cita.includes("❌") ? 500 : 400,
    }) as React.CSSProperties,

  cancelBadge: (count: number) =>
    ({
      fontSize: 13,
      fontWeight: 600,
      color: count > 0 ? "var(--danger)" : "var(--text-muted)",
    }) as React.CSSProperties,

  empty: {
    padding: 40,
    textAlign: "center" as const,
    color: "var(--text-muted)",
    fontSize: 14,
  } as React.CSSProperties,
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function PacientesPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterType>("Todos");

  const filtered = useMemo(() => {
    let list = [...PATIENTS];

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.nombre.toLowerCase().includes(q) || p.telefono.includes(q)
      );
    }

    // Filter
    switch (filter) {
      case "Dieta":
        list = list.filter((p) => p.tipo === "Dieta");
        break;
      case "Estét.":
        list = list.filter((p) => p.tipo === "Estét.");
        break;
      case "Activo":
        list = list.filter(
          (p) => p.proxCita !== "—" && !p.proxCita.includes("❌")
        );
        break;
      case "Con cita":
        list = list.filter(
          (p) =>
            p.proxCita !== "—" &&
            !p.proxCita.includes("❌") &&
            p.proxCita !== "Sem. próxima"
        );
        break;
    }

    // Sort by name
    list.sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));

    return list;
  }, [search, filter]);

  const isHighlighted = (p: Patient) =>
    p.cancelaciones > 0 || p.proxCita.includes("❌");

  const FILTERS: FilterType[] = [
    "Todos",
    "Dieta",
    "Estét.",
    "Activo",
    "Con cita",
  ];

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.headerRow}>
        <button style={styles.backBtn} onClick={() => router.back()}>
          <ArrowLeft size={20} />
        </button>
        <div style={styles.title}>
          <Users size={22} />
          Pacientes{" "}
          <span style={styles.countBadge}>({filtered.length})</span>
        </div>
      </div>

      {/* Search */}
      <div style={styles.searchWrap}>
        <Search size={16} style={styles.searchIcon} />
        <input
          type="text"
          placeholder="Buscar por nombre o teléfono..."
          style={styles.searchInput}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <button
            style={{
              position: "absolute",
              right: 10,
              top: "50%",
              transform: "translateY(-50%)",
              background: "none",
              border: "none",
              color: "var(--text-muted)",
              cursor: "pointer",
              padding: 4,
            }}
            onClick={() => setSearch("")}
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Filters */}
      <div style={styles.filtersRow}>
        {FILTERS.map((f) => (
          <button
            key={f}
            style={styles.chip(filter === f)}
            onClick={() => setFilter(f)}
          >
            {f === "Dieta" ? "Dieta | Estética" : f}
            {f === "Dieta" && filter === "Dieta" ? " (Dieta)" : ""}
            {f === "Estét." && filter === "Estét." ? " (Estética)" : ""}
          </button>
        ))}
      </div>

      {/* Table */}
      <div style={styles.tableCard}>
        {/* Header */}
        <div style={styles.tableHeader}>
          <span>Nombre</span>
          <span>Teléfono</span>
          <span>Tipo</span>
          <span>Próx. cita</span>
          <span style={{ textAlign: "center" }}>C</span>
        </div>

        {/* Rows */}
        {filtered.length === 0 ? (
          <div style={styles.empty}>
            No se encontraron pacientes.
          </div>
        ) : (
          filtered.map((p, i) => (
            <div
              key={p.telefono}
              style={styles.row(i, isHighlighted(p))}
              onClick={() => router.push(`/paciente/${p.telefono}`)}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.background =
                  "var(--bg-hover)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.background =
                  isHighlighted(p)
                    ? "rgba(239, 68, 68, 0.06)"
                    : i % 2 === 0
                      ? "var(--bg-card)"
                      : "var(--bg-surface)";
              }}
            >
              <span style={styles.nombre}>{p.nombre}</span>
              <span style={styles.telefono}>{p.telefono}</span>
              <span>
                <span style={styles.tipoBadge(p.tipo)}>{p.tipo}</span>
              </span>
              <span style={styles.citaText(p.proxCita)}>
                {p.proxCita.includes("❌") && (
                  <AlertTriangle
                    size={13}
                    style={{ marginRight: 4, verticalAlign: -1 }}
                  />
                )}
                {!p.proxCita.includes("❌") &&
                  p.proxCita !== "—" && (
                    <Calendar
                      size={13}
                      style={{
                        marginRight: 4,
                        verticalAlign: -1,
                        color: "var(--text-muted)",
                      }}
                    />
                  )}
                {p.proxCita}
              </span>
              <span
                style={{
                  ...styles.cancelBadge(p.cancelaciones),
                  textAlign: "center",
                }}
              >
                {p.cancelaciones}C
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
