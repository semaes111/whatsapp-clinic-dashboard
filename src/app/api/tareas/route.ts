export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase";

// GET - obtener estado de tareas para una fecha
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const fecha = searchParams.get("fecha");

  if (!fecha) {
    return NextResponse.json({ error: "fecha required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("tareas_estado")
    .select("*")
    .eq("fecha", fecha);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ tareas: data || [] });
}

// POST - marcar tarea como completada o eliminada
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fecha, tarea_index, tarea_texto, accion, completada_por } = body;

    if (!fecha || tarea_index === undefined || !accion) {
      return NextResponse.json({ error: "fecha, tarea_index, accion required" }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {
      fecha,
      tarea_index,
      tarea_texto: tarea_texto || "",
    };

    if (accion === "completar") {
      updateData.completada = true;
      updateData.completada_at = new Date().toISOString();
      updateData.completada_por = completada_por || "Noelia";
    } else if (accion === "eliminar") {
      updateData.eliminada = true;
    } else if (accion === "restaurar") {
      updateData.completada = false;
      updateData.eliminada = false;
      updateData.completada_at = null;
    }

    const { data, error } = await supabase
      .from("tareas_estado")
      .upsert(updateData, { onConflict: "fecha,tarea_index" })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, tarea: data });
  } catch (error) {
    console.error("Tareas API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
