import { NextResponse } from "next/server";
import { approveFailedSubmission } from "@/lib/storage";
import { computeSessionToken } from "@/lib/auth";

const COOKIE_NAME = "admin_session";

function isAuthorized(request) {
  const sessionCookie = request.cookies.get(COOKIE_NAME)?.value;
  return sessionCookie && sessionCookie === computeSessionToken();
}

export async function POST(request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body. Expected JSON payload." },
      { status: 400 },
    );
  }

  const id = payload?.id;
  if (!id || (typeof id !== "string" && typeof id !== "number")) {
    return NextResponse.json(
      { error: "Submission id is required." },
      { status: 400 },
    );
  }

  try {
    const approved = await approveFailedSubmission(id);
    if (!approved) {
      return NextResponse.json({ error: "Submission not found." }, { status: 404 });
    }
    return NextResponse.json({ submission: approved });
  } catch (error) {
    console.error("[Admin] Failed to approve submission.", error);
    return NextResponse.json(
      { error: "Unable to approve submission. Please try again." },
      { status: 500 },
    );
  }
}
