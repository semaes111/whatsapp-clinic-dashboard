import { NextResponse } from "next/server";
import { AUTH_COOKIE_NAME } from "../../../../lib/auth";

export async function POST() {
  try {
    const response = NextResponse.json({ success: true });
    response.cookies.set(AUTH_COOKIE_NAME, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });

    return response;
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
