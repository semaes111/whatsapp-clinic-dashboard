export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search") || "";
    const tipo = searchParams.get("tipo") || "";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const offset = (page - 1) * limit;

    let query = supabase
      .from("pacientes")
      .select("*", { count: "exact" })
      .eq("activo", true)
      .order("updated_at", { ascending: false });

    if (search) {
      query = query.or(`nombre.ilike.%${search}%,apellidos.ilike.%${search}%,telefono.ilike.%${search}%`);
    }

    if (tipo) {
      query = query.eq("tipo", tipo);
    }

    query = query.range(offset, offset + limit - 1);

    const { data, count, error } = await query;

    if (error) throw error;

    const patients = (data || []).map((p) => ({
      id: p.id,
      name: `${p.nombre || ""} ${p.apellidos || ""}`.trim(),
      phone: p.telefono,
      tipo: p.tipo,
      notas: p.notas_internas,
      cancelaciones: p.cancelaciones_total,
      created_at: p.created_at,
      updated_at: p.updated_at,
    }));

    return NextResponse.json({
      patients,
      pagination: {
        page,
        limit,
        total: count || 0,
        total_pages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error("Patients API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
