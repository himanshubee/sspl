import { NextResponse } from "next/server";
import crypto from "crypto";
import { Blob } from "buffer";
import sharp from "sharp";
import { addSubmission } from "@/lib/storage";
import { uploadObject } from "@/lib/objectStorage";

const OCR_API_ENDPOINT =
  process.env.OCR_SPACE_ENDPOINT ?? "https://api.ocr.space/parse/image";

const MAX_IMAGE_SIZE_BYTES = 1 * 1024 * 1024; // 1 MB
const JPEG_MIME_TYPE = "image/jpeg";
const MAX_RESIZE_WIDTH = 1600;
const MIN_RESIZE_WIDTH = 640;

function sanitizeFilename(filename) {
  return filename?.replace(/[^a-z0-9.\-_]/gi, "_").toLowerCase() || "upload";
}

function ensureJpegFilename(filename, fallbackBase) {
  const base = sanitizeFilename(filename).replace(/\.[^.]+$/, "") || fallbackBase;
  return `${base}.jpg`;
}

function buildStorageKey(folder, filename) {
  const safeName = sanitizeFilename(filename);
  const uniquePrefix = `${Date.now()}-${crypto.randomUUID()}`;
  return `${folder}/${uniquePrefix}-${safeName}`;
}

function isImageFile(file) {
  const mime = file?.type?.toLowerCase();
  if (mime?.startsWith("image/")) {
    return true;
  }

  const name = file?.name?.toLowerCase() ?? "";
  return /\.(jpg|jpeg|png|webp|heic|heif|gif)$/.test(name);
}

async function compressImage(buffer) {
  let quality = 80;
  let width = MAX_RESIZE_WIDTH;
  let output = await sharp(buffer)
    .rotate()
    .resize({ width, withoutEnlargement: true })
    .jpeg({ quality })
    .toBuffer();

  while (output.length > MAX_IMAGE_SIZE_BYTES && quality > 40) {
    quality -= 10;
    output = await sharp(buffer)
      .rotate()
      .resize({ width, withoutEnlargement: true })
      .jpeg({ quality })
      .toBuffer();
  }

  while (output.length > MAX_IMAGE_SIZE_BYTES && width > MIN_RESIZE_WIDTH) {
    width = Math.max(MIN_RESIZE_WIDTH, Math.round(width * 0.8));
    output = await sharp(buffer)
      .rotate()
      .resize({ width, withoutEnlargement: true })
      .jpeg({ quality })
      .toBuffer();
  }

  if (output.length > MAX_IMAGE_SIZE_BYTES) {
    throw new Error("Unable to compress image under 1 MB.");
  }

  return { buffer: output, contentType: JPEG_MIME_TYPE };
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

  const sanitizedName = ensureJpegFilename(originalFilename, "payment");
  const blob = new Blob([buffer], {
    type: mimeType || JPEG_MIME_TYPE,
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
      { error: "Please complete all required fields with valid uploads." },
      { status: 400 },
    );
  }

  if (!isImageFile(photo) || !isImageFile(paymentScreenshot)) {
    return NextResponse.json(
      { error: "Only image files are accepted for photo and payment proof." },
      { status: 400 },
    );
  }

  if (photo.size > MAX_IMAGE_SIZE_BYTES || paymentScreenshot.size > MAX_IMAGE_SIZE_BYTES) {
    return NextResponse.json(
      { error: "Images must be 1 MB or smaller." },
      { status: 413 },
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

  try {
    const photoBuffer = Buffer.from(await photo.arrayBuffer());
    const paymentBuffer = Buffer.from(await paymentScreenshot.arrayBuffer());

    const compressedPhoto = await compressImage(photoBuffer);
    const compressedPayment = await compressImage(paymentBuffer);

    const text = await runOcrSpace(
      compressedPayment.buffer,
      paymentScreenshot.name,
      compressedPayment.contentType,
    );

    if (!paymentLooksValid(text)) {
      return NextResponse.json(
        {
          error:
            "Unable to confirm the ₹900 payment from the screenshot. Please ensure the amount is clearly visible.",
        },
        { status: 422 },
      );
    }

    const photoKey = await uploadObject({
      key: buildStorageKey("photos", ensureJpegFilename(photo.name, "photo")),
      body: compressedPhoto.buffer,
      contentType: compressedPhoto.contentType,
      metadata: {
        originalname: sanitizeFilename(photo.name || "photo"),
        originaltype: photo.type || "",
      },
    });

    const paymentKey = await uploadObject({
      key: buildStorageKey(
        "payments",
        ensureJpegFilename(paymentScreenshot.name, "payment"),
      ),
      body: compressedPayment.buffer,
      contentType: compressedPayment.contentType,
      metadata: {
        originalname: sanitizeFilename(paymentScreenshot.name || "payment"),
        originaltype: paymentScreenshot.type || "",
      },
    });

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
      photoKey,
      photoContentType: compressedPhoto.contentType,
      paymentScreenshotKey: paymentKey,
      paymentContentType: compressedPayment.contentType,
      ocrText: text,
    };

    await addSubmission(submission);

    return NextResponse.json(
      { success: true, submissionId: submission.id },
      { status: 201 },
    );
  } catch (error) {
    console.error("Registration error", error);
    const message =
      error instanceof Error ? error.message : "Unexpected upload error.";
    const status =
      message === "Unable to compress image under 1 MB." ? 413 : 500;
    return NextResponse.json(
      { error: status === 413 ? message : "Something went wrong while processing the registration." },
      { status },
    );
  }
}
