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

    // Read from datos_raw (Claude's analysis stored as JSON)
    const raw = informe.datos_raw || {};
    const categorias = raw.categorias || {};

    const byCategory: Record<string, unknown[]> = {
      urgente: (categorias.urgente || []).map((p: Record<string, string>) => ({
        patient_name: p.nombre,
        phone: p.telefono,
        descripcion: p.descripcion,
        accion_requerida: p.accion_requerida,
        estado: p.estado,
      })),
      pendiente: (categorias.pendiente || []).map((p: Record<string, string>) => ({
        patient_name: p.nombre,
        phone: p.telefono,
        descripcion: p.descripcion,
        accion_requerida: p.accion_requerida,
      })),
      confirmado: (categorias.confirmado || []).map((p: Record<string, string>) => ({
        patient_name: p.nombre,
        phone: p.telefono,
        hora_cita: p.hora_cita,
        descripcion: p.detalle,
      })),
      no_acude: (categorias.no_acude || []).map((p: Record<string, string>) => ({
        patient_name: p.nombre,
        phone: p.telefono,
        motivo_cancelacion: p.motivo,
        descripcion: p.detalle,
      })),
    };

    const tasks = (raw.tareas_noelia || []).map((t: Record<string, string>, i: number) => ({
      id: i,
      titulo: t.texto,
      descripcion: t.texto,
      prioridad: t.prioridad,
      estado: "pendiente",
    }));

    const otrosContactos = raw.otros_contactos || [];

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
      otros_contactos: otrosContactos,
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
