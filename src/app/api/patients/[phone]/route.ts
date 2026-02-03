import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ phone: string }> }
) {
  try {
    const { phone } = await params;

    const patient = {
      id: "pat-001",
      name: "Maria Garcia",
      phone: decodeURIComponent(phone),
      email: "maria.garcia@email.com",
      status: "active",
      registered_at: "2025-06-15T10:00:00Z",
      last_interaction: "2026-02-03T09:15:00Z",
      total_conversations: 12,
      next_appointment: "2026-02-05T10:00:00Z",
      conversation_history: [
        {
          id: "conv-001",
          date: "2026-02-03T09:15:00Z",
          summary: "Confirmación de cita para el 5 de febrero",
          type: "appointment_booking",
          messages_count: 6,
        },
        {
          id: "conv-002",
          date: "2026-01-28T14:00:00Z",
          summary: "Consulta sobre limpieza dental",
          type: "general_inquiry",
          messages_count: 4,
        },
        {
          id: "conv-003",
          date: "2026-01-15T11:30:00Z",
          summary: "Cambio de cita de enero a febrero",
          type: "appointment_change",
          messages_count: 8,
        },
      ],
      appointments: [
        {
          id: "apt-010",
          date: "2026-02-05T10:00:00Z",
          type: "Revisión general",
          status: "confirmed",
        },
        {
          id: "apt-008",
          date: "2026-01-20T09:00:00Z",
          type: "Limpieza dental",
          status: "completed",
        },
      ],
      tags: ["regular", "orthodontics"],
    };

    return NextResponse.json(patient);
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
