export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { question, context_type, context_id, session_id } = body;

    if (!question) {
      return NextResponse.json(
        { error: "Question is required" },
        { status: 400 }
      );
    }

    // Get or create session
    let sessionId = session_id;
    if (!sessionId) {
      const { data: session } = await supabase
        .from("sesiones_chat")
        .insert({ contexto: context_id, titulo: question.slice(0, 100) })
        .select("id")
        .single();
      sessionId = session?.id;
    }

    // Save user message
    if (sessionId) {
      await supabase.from("mensajes_chat").insert({
        sesion_id: sessionId,
        rol: "user",
        contenido: question,
      });
    }

    // TODO: Integrate with Claude API for real AI answers
    // For now, query Supabase for relevant data and return a basic response
    let answer = "No tengo suficiente información para responder a esa pregunta.";

    const q = question.toLowerCase();

    if (q.includes("urgente") || q.includes("urgencia")) {
      const { data } = await supabase
        .from("interacciones")
        .select("resumen_ia, accion_requerida, pacientes(nombre, apellidos)")
        .eq("categoria", "urgente")
        .order("created_at", { ascending: false })
        .limit(5);

      if (data && data.length > 0) {
        const items = data.map((i: Record<string, unknown>) => {
          const pac = i.pacientes as Record<string, unknown> | null;
          return `• ${pac ? `${pac.nombre} ${pac.apellidos}` : "?"}: ${i.resumen_ia}`;
        });
        answer = `Hay ${data.length} casos urgentes:\n\n${items.join("\n")}`;
      }
    } else if (q.includes("tarea") || q.includes("pendiente") || q.includes("noelia")) {
      const { data } = await supabase
        .from("tareas_noelia")
        .select("titulo, descripcion, prioridad, pacientes(nombre, apellidos)")
        .eq("estado", "pendiente")
        .order("orden");

      if (data && data.length > 0) {
        const items = data.map((t: Record<string, unknown>) => {
          const pac = t.pacientes as Record<string, unknown> | null;
          return `• [${t.prioridad}] ${t.titulo}${pac ? ` — ${pac.nombre} ${pac.apellidos}` : ""}`;
        });
        answer = `Hay ${data.length} tareas pendientes:\n\n${items.join("\n")}`;
      }
    } else if (q.includes("cita") || q.includes("hoy") || q.includes("mañana")) {
      const { data } = await supabase
        .from("v_citas_hoy")
        .select("*");

      if (data && data.length > 0) {
        const items = data.map((c: Record<string, unknown>) =>
          `• ${c.hora} — ${c.nombre} ${c.apellidos} (${c.estado})`
        );
        answer = `Citas de hoy (${data.length}):\n\n${items.join("\n")}`;
      } else {
        answer = "No hay citas registradas para hoy.";
      }
    } else if (q.includes("informe") || q.includes("resumen")) {
      const { data } = await supabase
        .from("informes_diarios")
        .select("*")
        .order("fecha", { ascending: false })
        .limit(1)
        .single();

      if (data) {
        answer = `**Informe ${data.fecha}**\n\n${data.resumen_ejecutivo}\n\n**Puntos clave:**\n${(data.puntos_clave || []).map((p: string) => `• ${p}`).join("\n")}`;
      }
    }

    // Save assistant message
    if (sessionId) {
      await supabase.from("mensajes_chat").insert({
        sesion_id: sessionId,
        rol: "assistant",
        contenido: answer,
      });
    }

    return NextResponse.json({
      answer,
      session_id: sessionId,
      context: {
        type: context_type || null,
        id: context_id || null,
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
