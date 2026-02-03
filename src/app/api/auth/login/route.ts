import { NextRequest, NextResponse } from "next/server";
import { signToken, AUTH_COOKIE_NAME } from "../../../../lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code } = body;

    if (!code) {
      return NextResponse.json(
        { error: "Código requerido" },
        { status: 400 }
      );
    }

    const accessCode = process.env.ACCESS_CODE || process.env.DASHBOARD_PASSWORD;
    if (!accessCode) {
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    if (code !== accessCode) {
      return NextResponse.json(
        { error: "Código incorrecto" },
        { status: 401 }
      );
    }

    const token = await signToken();

    const response = NextResponse.json({ success: true });
    response.cookies.set(AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24, // 24 hours
    });

    return response;
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
