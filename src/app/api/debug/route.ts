export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "NOT SET";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "NOT SET";
  
  const keyPreview = key.length > 20 ? `${key.slice(0, 20)}...${key.slice(-10)}` : key;
  
  try {
    const supabase = createClient(url, key);
    
    const { data: pacientes, error: errPac } = await supabase
      .from("pacientes")
      .select("nombre")
      .limit(2);
    
    const { data: informe, error: errInf } = await supabase
      .from("informes_diarios")
      .select("fecha, total_urgentes")
      .order("fecha", { ascending: false })
      .limit(1);

    const { data: tareas, error: errTar } = await supabase
      .from("tareas_noelia")
      .select("titulo")
      .eq("estado", "pendiente")
      .limit(2);

    return NextResponse.json({
      env: {
        url,
        key_preview: keyPreview,
        key_length: key.length,
      },
      pacientes: { data: pacientes, error: errPac?.message },
      informe: { data: informe, error: errInf?.message },
      tareas: { data: tareas, error: errTar?.message },
    });
  } catch (e: unknown) {
    return NextResponse.json({
      env: { url, key_preview: keyPreview },
      error: e instanceof Error ? e.message : String(e),
    });
  }
}
