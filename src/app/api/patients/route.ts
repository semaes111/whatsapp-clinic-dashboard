import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    const allPatients = [
      {
        id: "pat-001",
        name: "Maria Garcia",
        phone: "+34612345001",
        last_interaction: "2026-02-03T09:15:00Z",
        total_conversations: 12,
        status: "active",
        next_appointment: "2026-02-05T10:00:00Z",
      },
      {
        id: "pat-002",
        name: "Carlos Lopez",
        phone: "+34612345002",
        last_interaction: "2026-02-02T14:30:00Z",
        total_conversations: 8,
        status: "active",
        next_appointment: "2026-02-04T09:30:00Z",
      },
      {
        id: "pat-003",
        name: "Ana Martinez",
        phone: "+34612345003",
        last_interaction: "2026-01-28T11:00:00Z",
        total_conversations: 5,
        status: "inactive",
        next_appointment: null,
      },
      {
        id: "pat-004",
        name: "Pedro Sanchez",
        phone: "+34612345004",
        last_interaction: "2026-02-01T16:45:00Z",
        total_conversations: 3,
        status: "active",
        next_appointment: "2026-02-06T11:00:00Z",
      },
      {
        id: "pat-005",
        name: "Laura Fernandez",
        phone: "+34612345005",
        last_interaction: "2026-02-03T08:00:00Z",
        total_conversations: 15,
        status: "urgent",
        next_appointment: "2026-02-03T11:00:00Z",
      },
    ];

    let filtered = allPatients;

    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(q) || p.phone.includes(q)
      );
    }

    if (status) {
      filtered = filtered.filter((p) => p.status === status);
    }

    const start = (page - 1) * limit;
    const paginated = filtered.slice(start, start + limit);

    return NextResponse.json({
      patients: paginated,
      pagination: {
        page,
        limit,
        total: filtered.length,
        total_pages: Math.ceil(filtered.length / limit),
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
