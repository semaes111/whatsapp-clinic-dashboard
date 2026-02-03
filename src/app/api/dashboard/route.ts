import { NextResponse } from "next/server";

export async function GET() {
  try {
    const data = {
      date: new Date().toISOString().split("T")[0],
      stats: {
        urgent: 4,
        pending: 5,
        resolved: 7,
        no_show: 2,
      },
      appointments: [
        {
          id: "apt-001",
          patient_name: "Maria Garcia",
          phone: "+34612345001",
          time: "09:00",
          type: "Revisión general",
          status: "confirmed",
        },
        {
          id: "apt-002",
          patient_name: "Carlos Lopez",
          phone: "+34612345002",
          time: "09:30",
          type: "Limpieza dental",
          status: "pending",
        },
        {
          id: "apt-003",
          patient_name: "Ana Martinez",
          phone: "+34612345003",
          time: "10:00",
          type: "Ortodoncia",
          status: "confirmed",
        },
        {
          id: "apt-004",
          patient_name: "Pedro Sanchez",
          phone: "+34612345004",
          time: "10:30",
          type: "Empaste",
          status: "no_show",
        },
        {
          id: "apt-005",
          patient_name: "Laura Fernandez",
          phone: "+34612345005",
          time: "11:00",
          type: "Extracción",
          status: "urgent",
        },
      ],
      pending_tasks: [
        {
          id: "task-001",
          description: "Llamar a paciente para confirmar cita",
          patient_name: "Juan Ruiz",
          priority: "high",
          created_at: new Date().toISOString(),
        },
        {
          id: "task-002",
          description: "Enviar recordatorio de cita",
          patient_name: "Sofia Moreno",
          priority: "medium",
          created_at: new Date().toISOString(),
        },
        {
          id: "task-003",
          description: "Revisar resultados de radiografía",
          patient_name: "Miguel Torres",
          priority: "high",
          created_at: new Date().toISOString(),
        },
      ],
    };

    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
