import { NextResponse } from "next/server";
import { updateSubmissionPaymentValidation } from "@/lib/storage";
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
  const validated =
    payload?.validated === undefined ? true : Boolean(payload.validated);

  if (!id || (typeof id !== "string" && typeof id !== "number")) {
    return NextResponse.json(
      { error: "Submission id is required." },
      { status: 400 },
    );
  }

  try {
    const updated = await updateSubmissionPaymentValidation(id, validated);
    if (!updated) {
      return NextResponse.json({ error: "Submission not found." }, { status: 404 });
    }
    return NextResponse.json({ submission: updated });
  } catch (error) {
    console.error("[Admin] Failed to update payment validation.", error);
    return NextResponse.json(
      { error: "Unable to update payment validation. Please try again." },
      { status: 500 },
    );
  }
}
