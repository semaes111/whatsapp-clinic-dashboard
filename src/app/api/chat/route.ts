import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { question, context_type, context_id } = body;

    if (!question) {
      return NextResponse.json(
        { error: "Question is required" },
        { status: 400 }
      );
    }

    // TODO: Integrate with AI/LLM service for real answers
    const mockAnswers: Record<string, string> = {
      default:
        "Según los datos del sistema, hoy hay 5 citas pendientes de confirmar y 4 casos urgentes que requieren atención inmediata.",
      patient:
        "El paciente tiene 12 conversaciones registradas. Su última interacción fue para confirmar una cita de revisión general.",
      report:
        "El informe muestra un total de 42 conversaciones procesadas, con 8 citas agendadas y un tiempo medio de respuesta de 45 segundos.",
    };

    const contextKey = context_type || "default";
    const answer =
      mockAnswers[contextKey] || mockAnswers.default;

    return NextResponse.json({
      answer,
      context: {
        type: context_type || null,
        id: context_id || null,
      },
      generated_at: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
