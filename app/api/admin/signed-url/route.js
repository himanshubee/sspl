import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { computeSessionToken } from "@/lib/auth";
import { getSignedObjectUrl } from "@/lib/objectStorage";

const SESSION_COOKIE = "admin_session";

function keyLooksSafe(key) {
  if (!key || typeof key !== "string") return false;
  if (key.includes("..") || key.startsWith("/") || key.startsWith("\\")) {
    return false;
  }
  return true;
}

export async function GET(request) {
  const sessionToken = cookies().get(SESSION_COOKIE)?.value;
  const expectedToken = computeSessionToken();

  if (!sessionToken || sessionToken !== expectedToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const key = request.nextUrl.searchParams.get("key");
  if (!keyLooksSafe(key)) {
    return NextResponse.json({ error: "Invalid key" }, { status: 400 });
  }

  try {
    const url = await getSignedObjectUrl(key);
    if (!url) {
      return NextResponse.json(
        { error: "Attachment is unavailable" },
        { status: 404 },
      );
    }
    return NextResponse.json({ url });
  } catch (error) {
    console.error("[Admin] Failed to generate signed URL", error);
    return NextResponse.json(
      { error: "Unable to generate signed URL" },
      { status: 500 },
    );
  }
}
