import { NextRequest, NextResponse } from "next/server";
import { supabase } from "../../../../lib/supabase";

const N8N_WEBHOOK_URL = "https://n8n.nexthorizont.ai/webhook/generate-report";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { date } = body;

    const targetDate = date || new Date().toISOString().split("T")[0];

    // Call n8n webhook to trigger report generation
    const n8nResponse = await fetch(N8N_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: targetDate }),
    });

    if (!n8nResponse.ok) {
      const errorText = await n8nResponse.text();
      return NextResponse.json(
        { error: "n8n webhook failed", details: errorText },
        { status: 502 }
      );
    }

    const result = await n8nResponse.json();
    const report = result.report;

    if (!report) {
      return NextResponse.json(
        { error: "No report data received" },
        { status: 500 }
      );
    }

    // Save to Supabase
    const supabaseData = {
      fecha: targetDate,
      total_conversaciones: report.total_conversaciones || 0,
      total_pacientes: report.total_pacientes || 0,
      total_confirmados: (report.categorias?.confirmado || []).length,
      total_cancelaciones: (report.categorias?.no_acude || []).length,
      total_pendientes: (report.categorias?.pendiente || []).length,
      total_urgentes: (report.categorias?.urgente || []).length,
      resumen_ejecutivo: report.resumen_ejecutivo || "",
      puntos_clave: report.puntos_clave || [],
      datos_raw: report,
      generado_at: new Date().toISOString(),
    };

    const { error: upsertError } = await supabase
      .from("informes_diarios")
      .upsert(supabaseData, { onConflict: "fecha" });

    if (upsertError) {
      console.error("Supabase upsert error:", upsertError);
      // Still return the report even if save fails
    }

    return NextResponse.json({
      status: "completed",
      date: targetDate,
      report: report,
      saved: !upsertError,
    });
  } catch (error) {
    console.error("Report generation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
