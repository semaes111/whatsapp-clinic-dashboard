export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase";

export async function GET() {
  try {
    const today = new Date().toISOString().split("T")[0];

    // Stats from latest report (today or most recent)
    const { data: informe } = await supabase
      .from("informes_diarios")
      .select("*")
      .lte("fecha", today)
      .order("fecha", { ascending: false })
      .limit(1)
      .single();

    // Today's appointments via view, fallback to nearest future date
    let { data: citasHoy } = await supabase
      .from("v_citas_hoy")
      .select("*");

    // If no appointments today, get nearest upcoming
    if (!citasHoy || citasHoy.length === 0) {
      const { data: proximasCitas } = await supabase
        .from("citas")
        .select("*, pacientes(nombre, apellidos, telefono)")
        .gte("fecha", today)
        .order("fecha", { ascending: true })
        .order("hora", { ascending: true })
        .limit(20);

      citasHoy = (proximasCitas || []).map((c: Record<string, unknown>) => {
        const pac = c.pacientes as Record<string, unknown> | null;
        return {
          cita_id: c.id,
          fecha: c.fecha,
          hora: c.hora,
          estado: c.estado,
          tipo: c.tipo,
          motivo: c.motivo,
          nombre: pac?.nombre,
          apellidos: pac?.apellidos,
          telefono: pac?.telefono,
        };
      });
    }

    // Pending tasks
    const { data: tareas } = await supabase
      .from("tareas_noelia")
      .select("*, pacientes(nombre, apellidos, telefono)")
      .eq("estado", "pendiente")
      .order("orden", { ascending: true });

    // Recent urgent interactions
    const { data: urgentes } = await supabase
      .from("interacciones")
      .select("*, pacientes(nombre, apellidos, telefono)")
      .eq("categoria", "urgente")
      .order("created_at", { ascending: false })
      .limit(10);

    const stats = {
      urgent: informe?.total_urgentes ?? 0,
      pending: informe?.total_pendientes ?? 0,
      resolved: informe?.total_confirmados ?? 0,
      no_show: informe?.total_cancelaciones ?? 0,
      total_conversations: informe?.total_conversaciones ?? 0,
      total_patients: informe?.total_pacientes ?? 0,
    };

    const appointments = (citasHoy || []).map((c: Record<string, unknown>) => ({
      id: c.cita_id,
      patient_name: `${c.nombre || ""} ${c.apellidos || ""}`.trim(),
      phone: c.telefono,
      time: c.hora,
      type: c.tipo,
      status: c.estado,
    }));

    const pending_tasks = (tareas || []).map((t: Record<string, unknown>) => {
      const pac = t.pacientes as Record<string, unknown> | null;
      return {
        id: t.id,
        description: t.titulo,
        detail: t.descripcion,
        patient_name: pac ? `${pac.nombre || ""} ${pac.apellidos || ""}`.trim() : null,
        phone: pac?.telefono ?? null,
        priority: t.prioridad,
        status: t.estado,
        created_at: t.created_at,
      };
    });

    const urgent_items = (urgentes || []).map((i: Record<string, unknown>) => {
      const pac = i.pacientes as Record<string, unknown> | null;
      return {
        id: i.id,
        patient_name: pac ? `${pac.nombre || ""} ${pac.apellidos || ""}`.trim() : null,
        phone: pac?.telefono ?? null,
        summary: i.resumen_ia,
        action: i.accion_requerida,
        created_at: i.created_at,
      };
    });

    return NextResponse.json({
      date: today,
      stats,
      appointments,
      pending_tasks,
      urgent_items,
      report_summary: informe?.resumen_ejecutivo ?? null,
      key_points: informe?.puntos_clave ?? [],
    });
  } catch (error) {
    console.error("Dashboard API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
// build 1770172800
