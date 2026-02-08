import { NextResponse } from "next/server";
import { supabase } from "../../../../lib/supabase";

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("informes_diarios")
      .select("fecha, total_conversaciones, total_pacientes, total_confirmados, total_cancelaciones, total_pendientes, total_urgentes, generado_at")
      .order("fecha", { ascending: false })
      .limit(30);

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ reports: data || [] });
  } catch (error) {
    console.error("Error fetching reports:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
