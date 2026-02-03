import { NextResponse } from "next/server";

export async function GET() {
  try {
    const reports = [
      {
        id: "rpt-001",
        date: "2026-02-03",
        title: "Informe diario - 3 Feb 2026",
        status: "completed",
        total_conversations: 42,
        appointments_booked: 8,
        created_at: "2026-02-03T08:00:00Z",
      },
      {
        id: "rpt-002",
        date: "2026-02-02",
        title: "Informe diario - 2 Feb 2026",
        status: "completed",
        total_conversations: 38,
        appointments_booked: 6,
        created_at: "2026-02-02T08:00:00Z",
      },
      {
        id: "rpt-003",
        date: "2026-02-01",
        title: "Informe diario - 1 Feb 2026",
        status: "completed",
        total_conversations: 45,
        appointments_booked: 10,
        created_at: "2026-02-01T08:00:00Z",
      },
      {
        id: "rpt-004",
        date: "2026-01-31",
        title: "Informe diario - 31 Ene 2026",
        status: "completed",
        total_conversations: 30,
        appointments_booked: 5,
        created_at: "2026-01-31T08:00:00Z",
      },
    ];

    return NextResponse.json({ reports });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
