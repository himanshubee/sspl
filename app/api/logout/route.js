import { NextResponse } from "next/server";

const COOKIE_NAME = "admin_session";

export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.set({
    name: COOKIE_NAME,
    value: "",
    path: "/",
    maxAge: 0,
  });
  return response;
}
