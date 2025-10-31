import { NextResponse } from "next/server";
import path from "path";
import { promises as fs } from "fs";
import crypto from "crypto";
import { Blob } from "buffer";
import { addSubmission } from "@/lib/storage";

const photosDir = path.join(process.cwd(), "public", "uploads", "photos");
const paymentsDir = path.join(process.cwd(), "public", "uploads", "payments");
const OCR_API_ENDPOINT =
  process.env.OCR_SPACE_ENDPOINT ?? "https://api.ocr.space/parse/image";

async function ensureDirectories() {
  await fs.mkdir(photosDir, { recursive: true });
  await fs.mkdir(paymentsDir, { recursive: true });
}

async function saveFile(file, targetDir, providedBuffer) {
  if (!(file instanceof File)) {
    return null;
  }
  const buffer =
    providedBuffer ?? Buffer.from(await file.arrayBuffer());

  const safeName = file.name.replace(/[^a-z0-9.\-_]/gi, "_").toLowerCase();
  const filename = `${Date.now()}-${safeName || "upload"}`;
  const fullPath = path.join(targetDir, filename);
  await fs.writeFile(fullPath, buffer);

  const publicPath = path.join(
    "/uploads",
    path.basename(targetDir),
    filename,
  );

  return {
    filename,
    publicPath,
    fullPath,
    size: buffer.length,
  };
}

async function runOcrSpace(buffer, originalFilename, mimeType) {
  const apiKey = process.env.OCR_SPACE_API_KEY;
  if (!apiKey) {
    throw new Error("OCR_SPACE_API_KEY is not configured.");
  }

  const formData = new FormData();
  formData.append("apikey", apiKey);
  formData.append("language", "eng");
  formData.append("isOverlayRequired", "false");
  formData.append("scale", "true");
  formData.append("OCREngine", "5");

  const sanitizedName =
    originalFilename?.replace(/[^a-z0-9.\-_]/gi, "_").toLowerCase() ||
    "payment.jpg";
  const blob = new Blob([buffer], {
    type: mimeType || "application/octet-stream",
  });
  formData.append("file", blob, sanitizedName);

  const response = await fetch(OCR_API_ENDPOINT, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(
      `OCR request failed with status ${response.status} ${response.statusText}`,
    );
  }

  const payload = await response.json();

  if (payload.IsErroredOnProcessing) {
    const message = Array.isArray(payload.ErrorMessage)
      ? payload.ErrorMessage.join("; ")
      : payload.ErrorMessage || "OCR processing failed.";
    throw new Error(message);
  }

  const text = payload.ParsedResults?.map((r) => r.ParsedText).join("\n") ?? "";
  return text;
}

function paymentLooksValid(text) {
  if (!text) return false;
  const normalized = text.toLowerCase();
  const zeroFriendly = normalized.replace(/o/g, "0");
  const digitsOnly = zeroFriendly.replace(/[^0-9]/g, "");
  if (digitsOnly.includes("900")) {
    return true;
  }

  if (zeroFriendly.includes("₹900") || zeroFriendly.includes("rs 900")) {
    return true;
  }

  const sanitized = zeroFriendly.replace(/[,₹]/g, "");
  const patterns = [
    /\b900(?:\.00)?\b/,
    /\b900\/-\b/,
    /\brs\.?\s*900(?:\.00)?\b/,
    /\binr\.?\s*900(?:\.00)?\b/,
    /\bamount\s*:?\.?\s*900(?:\.00)?\b/,
    /\bamount\s*:?\.?\s*rs\.?\s*900(?:\.00)?\b/,
  ];
  return patterns.some((regex) => regex.test(sanitized));
}

export async function POST(request) {
  await ensureDirectories();
  const formData = await request.formData();

  const name = formData.get("name")?.toString().trim();
  const address = formData.get("address")?.toString().trim();
  const playerType = formData.get("playerType")?.toString();
  const playerTypeOther = formData.get("playerTypeOther")?.toString().trim();
  const tshirtSize = formData.get("tshirtSize")?.toString();
  const jerseyName = formData.get("jerseyName")?.toString().trim();
  const jerseyNumber = formData.get("jerseyNumber")?.toString().trim();
  const foodType = formData.get("foodType")?.toString();
  const foodTypeOther = formData.get("foodTypeOther")?.toString().trim();
  const feeResponse = formData.get("feeResponse")?.toString();
  const feeResponseOther = formData.get("feeResponseOther")?.toString().trim();
  const photo = formData.get("photo");
  const paymentScreenshot = formData.get("paymentScreenshot");

  const maxUploadSize = 10 * 1024 * 1024; // 10 MB

  if (
    !name ||
    !address ||
    !playerType ||
    !tshirtSize ||
    !jerseyName ||
    !jerseyNumber ||
    !foodType ||
    !feeResponse ||
    !(photo instanceof File) ||
    !(paymentScreenshot instanceof File)
  ) {
    return NextResponse.json(
      { error: "Please complete all required fields." },
      { status: 400 },
    );
  }

  if (playerType === "other" && !playerTypeOther) {
    return NextResponse.json(
      { error: "Please specify your player type." },
      { status: 400 },
    );
  }

  if (foodType === "other" && !foodTypeOther) {
    return NextResponse.json(
      { error: "Please specify your food preference." },
      { status: 400 },
    );
  }

  if (feeResponse === "other" && !feeResponseOther) {
    return NextResponse.json(
      { error: "Please describe your fee status." },
      { status: 400 },
    );
  }

  if (photo.size > maxUploadSize || paymentScreenshot.size > maxUploadSize) {
    return NextResponse.json(
      { error: "Uploads must be 10 MB or smaller." },
      { status: 413 },
    );
  }

  try {
    const paymentBuffer = Buffer.from(await paymentScreenshot.arrayBuffer());

    const text = await runOcrSpace(
      paymentBuffer,
      paymentScreenshot.name,
      paymentScreenshot.type,
    );
    console.log("OCR output:", text);

    if (!paymentLooksValid(text)) {
      return NextResponse.json(
        {
          error:
            "Unable to confirm the ₹900 payment from the screenshot. Please ensure the amount is clearly visible.",
        },
        { status: 422 },
      );
    }

    const savedPhoto = await saveFile(photo, photosDir);
    const savedPayment = await saveFile(
      paymentScreenshot,
      paymentsDir,
      paymentBuffer,
    );

    const submission = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      name,
      address,
      playerType,
      playerTypeOther: playerType === "other" ? playerTypeOther : "",
      tshirtSize,
      jerseyName,
      jerseyNumber,
      foodType,
      foodTypeOther: foodType === "other" ? foodTypeOther : "",
      feeResponse,
      feeResponseOther: feeResponse === "other" ? feeResponseOther : "",
      photo: savedPhoto?.publicPath,
      paymentScreenshot: savedPayment?.publicPath,
      ocrText: text,
    };

    await addSubmission(submission);

    return NextResponse.json(
      { success: true, submissionId: submission.id },
      { status: 201 },
    );
  } catch (error) {
    console.error("Registration error", error);
    return NextResponse.json(
      { error: "Something went wrong while processing the registration." },
      { status: 500 },
    );
  }
}
