import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ date: string }> }
) {
  try {
    const { date } = await params;

    const report = {
      id: `rpt-${date}`,
      date,
      title: `Informe diario - ${date}`,
      status: "completed",
      summary: {
        total_conversations: 42,
        unique_patients: 35,
        appointments_booked: 8,
        appointments_cancelled: 2,
        urgent_cases: 3,
        average_response_time_seconds: 45,
      },
      conversations_by_type: {
        appointment_booking: 15,
        appointment_change: 8,
        general_inquiry: 12,
        urgent: 3,
        follow_up: 4,
      },
      top_issues: [
        { issue: "Solicitud de cita", count: 15 },
        { issue: "Cambio de horario", count: 8 },
        { issue: "Consulta de precios", count: 6 },
        { issue: "Dolor dental urgente", count: 3 },
      ],
      generated_at: new Date().toISOString(),
    };

    return NextResponse.json(report);
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
