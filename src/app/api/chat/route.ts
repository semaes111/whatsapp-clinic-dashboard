export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase";

const N8N_CHAT_WEBHOOK = "https://n8n.nexthorizont.ai/webhook/chat-report";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { question, context_type, context_id } = body;

    if (!question) {
      return NextResponse.json(
        { error: "Question is required" },
        { status: 400 }
      );
    }

    // Get the report for context
    const reportDate = context_id || new Date().toISOString().split("T")[0];

    const { data: informe } = await supabase
      .from("informes_diarios")
      .select("*")
      .eq("fecha", reportDate)
      .single();

    const reportContext = informe?.datos_raw
      ? JSON.stringify(informe.datos_raw)
      : informe?.resumen_ejecutivo || "No hay informe disponible.";

    // Call n8n webhook for Claude response
    const n8nResponse = await fetch(N8N_CHAT_WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question,
        date: reportDate,
        report: reportContext,
      }),
    });

    let answer = "Error al procesar la consulta.";
    if (n8nResponse.ok) {
      const result = await n8nResponse.json();
      answer = result.answer || result.response || "Sin respuesta.";
    }

    return NextResponse.json({
      answer,
      context: {
        type: context_type || "report",
        id: reportDate,
      },
      generated_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
