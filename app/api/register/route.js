import { NextResponse } from "next/server";
import crypto from "crypto";
import { Blob } from "buffer";
import sharp from "sharp";
import { addSubmission, addFailedSubmission } from "@/lib/storage";
import { buildPaymentValidationSummary } from "@/lib/paymentValidation";
import { uploadObject } from "@/lib/objectStorage";

const OCR_API_ENDPOINT =
  process.env.OCR_SPACE_ENDPOINT ?? "https://api.ocr.space/parse/image";

const MAX_COMPRESSED_SIZE_BYTES = 1 * 1024 * 1024; // 1 MB
const MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
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

  while (output.length > MAX_COMPRESSED_SIZE_BYTES && quality > 40) {
    quality -= 10;
    output = await sharp(buffer)
      .rotate()
      .resize({ width, withoutEnlargement: true })
      .jpeg({ quality })
      .toBuffer();
  }

  while (output.length > MAX_COMPRESSED_SIZE_BYTES && width > MIN_RESIZE_WIDTH) {
    width = Math.max(MIN_RESIZE_WIDTH, Math.round(width * 0.8));
    output = await sharp(buffer)
      .rotate()
      .resize({ width, withoutEnlargement: true })
      .jpeg({ quality })
      .toBuffer();
  }

  if (output.length > MAX_COMPRESSED_SIZE_BYTES) {
    throw new Error("Unable to compress image under 1 MB.");
  }

  return { buffer: output, contentType: JPEG_MIME_TYPE };
}

async function runOcrSpace(buffer, originalFilename, mimeType) {
  const apiKey = process.env.OCR_SPACE_API_KEY;
  if (!apiKey) {
    throw new Error("OCR_SPACE_API_KEY is not configured.");
  }

  console.log(
    "[Registration] Starting OCR request",
    JSON.stringify({
      endpoint: OCR_API_ENDPOINT,
      filename: originalFilename,
      payloadBytes: buffer.length,
    }),
  );

  const formData = new FormData();
  formData.append("apikey", apiKey);
  formData.append("language", "eng");
  formData.append("isOverlayRequired", "false");
  formData.append("scale", "true");
  formData.append("OCREngine", "2");

  const sanitizedName = ensureJpegFilename(originalFilename, "payment");
  const blob = new Blob([buffer], {
    type: mimeType || JPEG_MIME_TYPE,
  });
  formData.append("file", blob, sanitizedName);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 20000);

  let response;
  try {
    response = await fetch(OCR_API_ENDPOINT, {
      method: "POST",
      body: formData,
      signal: controller.signal,
    });
  } catch (fetchError) {
    console.error("[Registration] OCR request failed to send", fetchError);
    throw new Error("Failed to reach the OCR service. Please try again.");
  } finally {
    clearTimeout(timeoutId);
  }

  console.log(
    "[Registration] OCR response status",
    JSON.stringify({
      status: response.status,
      statusText: response.statusText,
    }),
  );

  if (!response.ok) {
    const errorBody = await response.text();
    console.error("[Registration] OCR non-OK response body", errorBody);
    throw new Error(
      `OCR request failed with status ${response.status} ${response.statusText}`,
    );
  }

  const payload = await response.json();
  console.log(
    "[Registration] OCR payload snapshot",
    JSON.stringify({
      isErrored: payload.IsErroredOnProcessing,
      errorMessage: payload.ErrorMessage,
      parsedResultsCount: payload.ParsedResults?.length ?? 0,
    }),
  );

  if (payload.IsErroredOnProcessing) {
    const message = Array.isArray(payload.ErrorMessage)
      ? payload.ErrorMessage.join("; ")
      : payload.ErrorMessage || "OCR processing failed.";
    console.error("[Registration] OCR reported processing error", message);
    throw new Error(message);
  }

  const text = payload.ParsedResults?.map((r) => r.ParsedText).join("\n") ?? "";
  console.log(
    "[Registration] OCR text preview",
    JSON.stringify({ length: text.length, snippet: text.slice(0, 200) }),
  );

  return text;
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

  if (
    photo.size > MAX_UPLOAD_SIZE_BYTES ||
    paymentScreenshot.size > MAX_UPLOAD_SIZE_BYTES
  ) {
    return NextResponse.json(
      { error: "Images must be 10 MB or smaller before upload." },
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

  try {
    const photoBuffer = Buffer.from(await photo.arrayBuffer());
    const paymentBuffer = Buffer.from(await paymentScreenshot.arrayBuffer());
    console.log(
      "[Registration] Raw upload sizes",
      JSON.stringify({
        photoBytes: photoBuffer.length,
        paymentBytes: paymentBuffer.length,
      }),
    );

    const compressedPhoto = await compressImage(photoBuffer);
    const compressedPayment = await compressImage(paymentBuffer);
    console.log(
      "[Registration] Compressed sizes",
      JSON.stringify({
        photoBytes: compressedPhoto.buffer.length,
        paymentBytes: compressedPayment.buffer.length,
      }),
    );

    const text = await runOcrSpace(
      compressedPayment.buffer,
      paymentScreenshot.name,
      compressedPayment.contentType,
    );

    const validationSummary = buildPaymentValidationSummary(text);

    if (!validationSummary.matched) {
      console.warn(
        "[Registration] OCR could not validate 900 payment",
        JSON.stringify({
          ocrTextSnippet: text.slice(0, 200),
          candidateAmounts: validationSummary.amounts,
        }),
      );

      let failedPhotoKey = null;
      let failedPaymentKey = null;

      try {
        failedPhotoKey = await uploadObject({
          key: buildStorageKey(
            "failed/photos",
            ensureJpegFilename(photo.name, "photo"),
          ),
          body: compressedPhoto.buffer,
          contentType: compressedPhoto.contentType,
          metadata: {
            originalname: sanitizeFilename(photo.name || "photo"),
            originaltype: photo.type || "",
          },
        });
      } catch (uploadError) {
        console.error(
          "[Registration] Failed to upload photo for failed submission",
          uploadError,
        );
      }

      try {
        failedPaymentKey = await uploadObject({
          key: buildStorageKey(
            "failed/payments",
            ensureJpegFilename(paymentScreenshot.name, "payment"),
          ),
          body: compressedPayment.buffer,
          contentType: compressedPayment.contentType,
          metadata: {
            originalname: sanitizeFilename(paymentScreenshot.name || "payment"),
            originaltype: paymentScreenshot.type || "",
          },
        });
      } catch (uploadError) {
        console.error(
          "[Registration] Failed to upload payment screenshot for failed submission",
          uploadError,
        );
      }

      try {
        await addFailedSubmission({
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
          photoKey: failedPhotoKey,
          photoContentType: compressedPhoto.contentType,
          paymentScreenshotKey: failedPaymentKey,
          paymentContentType: compressedPayment.contentType,
          ocrText: text,
          ocrPaymentDetected: false,
          ocrCandidateAmounts: validationSummary.amounts,
          ocrValidationReasons: validationSummary.reasons,
          ocrMatchedAmount: validationSummary.matchedAmount ?? null,
          failureReason: "payment_validation_failed",
          failureMessage:
            "OCR validation could not confirm the ₹900 payment amount.",
        });
      } catch (persistError) {
        console.error(
          "[Registration] Failed to persist failed submission record",
          persistError,
        );
      }

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
      photoKey,
      photoContentType: compressedPhoto.contentType,
      paymentScreenshotKey: paymentKey,
      paymentContentType: compressedPayment.contentType,
      ocrText: text,
      ocrPaymentDetected: validationSummary.matched,
      ocrCandidateAmounts: validationSummary.amounts,
      ocrValidationReasons: validationSummary.reasons,
      ocrMatchedAmount: validationSummary.matchedAmount ?? null,
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
