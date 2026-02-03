import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { date } = body;

    const targetDate = date || new Date().toISOString().split("T")[0];

    // TODO: Call n8n webhook to trigger report generation
    // const webhookUrl = process.env.N8N_WEBHOOK_URL;
    // await fetch(webhookUrl, { method: "POST", body: JSON.stringify({ date: targetDate }) });

    return NextResponse.json({
      status: "generating",
      message: "Report generation triggered",
      date: targetDate,
      estimated_time_seconds: 30,
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
