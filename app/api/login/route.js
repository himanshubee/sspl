import { NextResponse } from "next/server";
import { computeSessionToken, credentialsAreValid } from "@/lib/auth";

const COOKIE_NAME = "admin_session";
const ONE_DAY = 24 * 60 * 60;

export async function POST(request) {
  const body = await request.json();
  const username = body?.username;
  const password = body?.password;

  if (!credentialsAreValid(username, password)) {
    return NextResponse.json(
      { error: "Invalid credentials." },
      { status: 401 },
    );
  }

  const token = computeSessionToken();
  const response = NextResponse.json({ success: true });
  response.cookies.set({
    name: COOKIE_NAME,
    value: token,
    path: "/",
    maxAge: ONE_DAY,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });
  return response;
}
