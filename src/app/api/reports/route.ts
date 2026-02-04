export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase";

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("informes_diarios")
      .select("*")
      .order("fecha", { ascending: false })
      .limit(30);

    if (error) throw error;

    const reports = (data || []).map((r) => ({
      id: r.id,
      date: r.fecha,
      title: `Informe diario - ${r.fecha}`,
      status: r.generado_at ? "completed" : "pending",
      total_conversations: r.total_conversaciones,
      total_patients: r.total_pacientes,
      total_confirmed: r.total_confirmados,
      total_cancelled: r.total_cancelaciones,
      total_pending: r.total_pendientes,
      total_urgent: r.total_urgentes,
      created_at: r.created_at,
    }));

    return NextResponse.json({ reports });
  } catch (error) {
    console.error("Reports API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
