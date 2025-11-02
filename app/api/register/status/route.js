import { NextResponse } from "next/server";
import { countActiveSubmissions } from "@/lib/storage";
import { REGISTRATION_LIMIT } from "@/lib/constants";

export async function GET() {
  try {
    const total = await countActiveSubmissions();
    const available = Math.max(REGISTRATION_LIMIT - total, 0);
    return NextResponse.json({
      total,
      limit: REGISTRATION_LIMIT,
      available,
      open: total < REGISTRATION_LIMIT,
    });
  } catch (error) {
    console.error("[Registration] Failed to read capacity.", error);
    return NextResponse.json(
      { error: "Unable to determine registration capacity." },
      { status: 500 },
    );
  }
}
