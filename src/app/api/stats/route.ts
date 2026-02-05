export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const now = new Date();
    const defaultFrom = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    const fromDate = searchParams.get("from") || defaultFrom;
    const toDate = searchParams.get("to") || now.toISOString().split("T")[0];

    const { data, error } = await supabase
      .from("informes_diarios")
      .select("*")
      .gte("fecha", fromDate)
      .lte("fecha", toDate)
      .order("fecha", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const daily = (data || []).map((d) => {
      const raw = d.datos_raw || {};
      const cats = raw.categorias || {};
      const tareas = raw.tareas_noelia || [];

      // Extract special categories from datos_raw text analysis
      const allPatients = [
        ...(cats.urgente || []),
        ...(cats.pendiente || []),
        ...(cats.confirmado || []),
        ...(cats.no_acude || []),
      ];

      const textFields = allPatients.map((p: Record<string, string>) =>
        `${p.descripcion || ""} ${p.accion_requerida || ""} ${p.detalle || ""} ${p.motivo || ""}`.toLowerCase()
      );

      const yaAvisaran = textFields.filter((t: string) =>
        t.includes("ya te aviso") || t.includes("ya avisará") || t.includes("ya aviso") || t.includes("ya te avisaré")
      ).length;

      const sinAtender = textFields.filter((t: string) =>
        t.includes("sin respuesta") || t.includes("no responde") || t.includes("sin atender") || t.includes("no contesta")
      ).length;

      const primerasVisitas = textFields.filter((t: string) =>
        t.includes("primera visita") || t.includes("primera vez") || t.includes("paciente nuevo") || t.includes("nuevo paciente")
      ).length;

      return {
        fecha: d.fecha,
        confirmados: d.total_confirmados || 0,
        cancelaciones: d.total_cancelaciones || 0,
        pendientes: d.total_pendientes || 0,
        urgentes: d.total_urgentes || 0,
        no_acude: (cats.no_acude || []).length,
        total_conversaciones: d.total_conversaciones || 0,
        total_pacientes: d.total_pacientes || 0,
        primeras_visitas: primerasVisitas,
        ya_avisaran: yaAvisaran,
        sin_atender: sinAtender,
        tareas_pendientes: tareas.length,
      };
    });

    const sum = (key: string) => daily.reduce((acc: number, d: Record<string, number>) => acc + (d[key] || 0), 0);
    const totalConfirmados = sum("confirmados");
    const totalCancelaciones = sum("cancelaciones");
    const totalAll = totalConfirmados + totalCancelaciones + sum("pendientes") + sum("no_acude");

    const totals = {
      total_dias: daily.length,
      total_confirmados: totalConfirmados,
      total_cancelaciones: totalCancelaciones,
      total_pendientes: sum("pendientes"),
      total_urgentes: sum("urgentes"),
      tasa_confirmacion: totalAll > 0 ? Math.round((totalConfirmados / totalAll) * 1000) / 10 : 0,
      tasa_cancelacion: totalAll > 0 ? Math.round((totalCancelaciones / totalAll) * 1000) / 10 : 0,
      promedio_conversaciones_dia: daily.length > 0 ? Math.round((sum("total_conversaciones") / daily.length) * 10) / 10 : 0,
    };

    return NextResponse.json({ daily, totals });
  } catch (error) {
    console.error("Stats API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
