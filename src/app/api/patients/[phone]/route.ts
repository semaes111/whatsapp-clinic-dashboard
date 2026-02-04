export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "../../../../lib/supabase";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ phone: string }> }
) {
  try {
    const { phone } = await params;
    const decodedPhone = decodeURIComponent(phone);

    // Get patient
    const { data: patient, error } = await supabase
      .from("pacientes")
      .select("*")
      .eq("telefono", decodedPhone)
      .single();

    if (error || !patient) {
      return NextResponse.json(
        { error: "Patient not found" },
        { status: 404 }
      );
    }

    // Get appointments
    const { data: citas } = await supabase
      .from("citas")
      .select("*")
      .eq("paciente_id", patient.id)
      .order("fecha", { ascending: false })
      .limit(20);

    // Get interactions
    const { data: interacciones } = await supabase
      .from("interacciones")
      .select("*")
      .eq("paciente_id", patient.id)
      .order("created_at", { ascending: false })
      .limit(20);

    // Get notes
    const { data: notas } = await supabase
      .from("notas_paciente")
      .select("*")
      .eq("paciente_id", patient.id)
      .order("created_at", { ascending: false });

    // Get pending tasks
    const { data: tareas } = await supabase
      .from("tareas_noelia")
      .select("*")
      .eq("paciente_id", patient.id)
      .eq("estado", "pendiente")
      .order("orden", { ascending: true });

    return NextResponse.json({
      id: patient.id,
      name: `${patient.nombre || ""} ${patient.apellidos || ""}`.trim(),
      phone: patient.telefono,
      email: patient.email,
      tipo: patient.tipo,
      notas_internas: patient.notas_internas,
      alergias: patient.alergias,
      tratamientos_activos: patient.tratamientos_activos,
      cancelaciones: patient.cancelaciones_total,
      activo: patient.activo,
      created_at: patient.created_at,
      updated_at: patient.updated_at,
      citas: (citas || []).map((c) => ({
        id: c.id,
        fecha: c.fecha,
        hora: c.hora,
        tipo: c.tipo,
        estado: c.estado,
        motivo: c.motivo,
        notas: c.notas,
      })),
      interacciones: (interacciones || []).map((i) => ({
        id: i.id,
        origen: i.origen,
        mensaje: i.mensaje_original,
        resumen: i.resumen_ia,
        categoria: i.categoria,
        accion: i.accion_requerida,
        fecha: i.created_at,
      })),
      notas: notas || [],
      tareas_pendientes: tareas || [],
    });
  } catch (error) {
    console.error("Patient detail API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
