export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "../../../../lib/supabase";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ date: string }> }
) {
  try {
    const { date } = await params;

    // Get report
    const { data: informe, error } = await supabase
      .from("informes_diarios")
      .select("*")
      .eq("fecha", date)
      .single();

    if (error || !informe) {
      return NextResponse.json(
        { error: "Report not found" },
        { status: 404 }
      );
    }

    // Get report patient details
    const { data: detalle } = await supabase
      .from("informe_pacientes")
      .select("*, pacientes(nombre, apellidos, telefono)")
      .eq("informe_id", informe.id)
      .order("categoria");

    // Get tasks for this report
    const { data: tareas } = await supabase
      .from("tareas_noelia")
      .select("*, pacientes(nombre, apellidos, telefono)")
      .eq("informe_id", informe.id)
      .order("orden", { ascending: true });

    // Group patients by category
    const byCategory: Record<string, unknown[]> = {
      urgente: [],
      pendiente: [],
      confirmado: [],
      no_acude: [],
    };

    (detalle || []).forEach((d: Record<string, unknown>) => {
      const pac = d.pacientes as Record<string, unknown> | null;
      const item = {
        id: d.id,
        patient_name: pac ? `${pac.nombre || ""} ${pac.apellidos || ""}`.trim() : "Desconocido",
        phone: pac?.telefono ?? null,
        descripcion: d.descripcion,
        accion_requerida: d.accion_requerida,
        etiquetas: d.etiquetas,
        hora_cita: d.hora_cita,
        motivo_cancelacion: d.motivo_cancelacion,
        reagendado: d.reagendado,
      };
      const cat = d.categoria as string;
      if (byCategory[cat]) {
        byCategory[cat].push(item);
      }
    });

    const tasks = (tareas || []).map((t: Record<string, unknown>) => {
      const pac = t.pacientes as Record<string, unknown> | null;
      return {
        id: t.id,
        titulo: t.titulo,
        descripcion: t.descripcion,
        prioridad: t.prioridad,
        estado: t.estado,
        patient_name: pac ? `${pac.nombre || ""} ${pac.apellidos || ""}`.trim() : null,
        phone: pac?.telefono ?? null,
      };
    });

    return NextResponse.json({
      id: informe.id,
      date: informe.fecha,
      title: `Informe diario - ${informe.fecha}`,
      resumen_ejecutivo: informe.resumen_ejecutivo,
      puntos_clave: informe.puntos_clave,
      stats: {
        total_conversaciones: informe.total_conversaciones,
        total_pacientes: informe.total_pacientes,
        total_confirmados: informe.total_confirmados,
        total_cancelaciones: informe.total_cancelaciones,
        total_pendientes: informe.total_pendientes,
        total_urgentes: informe.total_urgentes,
      },
      categorias: byCategory,
      tareas: tasks,
      generated_at: informe.generado_at,
    });
  } catch (error) {
    console.error("Report detail API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
