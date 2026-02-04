export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";

async function callClaude(systemPrompt: string, userMessage: string): Promise<string> {
  // Get API key from n8n credential via workflow or use env
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return "Error: API key de Anthropic no configurada.";
  }

  const res = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2000,
      messages: [{ role: "user", content: userMessage }],
      system: systemPrompt,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("Claude API error:", err);
    return "Error al consultar la IA. Inténtalo de nuevo.";
  }

  const data = await res.json();
  return data.content?.[0]?.text || "Sin respuesta.";
}

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
    let reportContext = "";
    const reportDate = context_id || new Date().toISOString().split("T")[0];

    const { data: informe } = await supabase
      .from("informes_diarios")
      .select("*")
      .eq("fecha", reportDate)
      .single();

    if (informe?.datos_raw) {
      const raw = informe.datos_raw;
      reportContext = JSON.stringify(raw, null, 2);
    } else if (informe) {
      reportContext = `Resumen: ${informe.resumen_ejecutivo}\nPuntos clave: ${(informe.puntos_clave || []).join(", ")}`;
    }

    const systemPrompt = `Eres el asistente inteligente del Dashboard de la Consulta del Dr. Martínez Escobar en El Ejido, Almería. Noelia es la auxiliar que gestiona WhatsApp.

Tienes acceso al informe diario del ${reportDate}. Responde preguntas sobre pacientes, citas, tareas pendientes, urgencias y cualquier dato del informe.

Sé conciso, directo y útil. Usa formato con negritas y listas cuando sea apropiado. Responde siempre en español.

DATOS DEL INFORME:
${reportContext || "No hay informe disponible para esta fecha."}`;

    const answer = await callClaude(systemPrompt, question);

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
