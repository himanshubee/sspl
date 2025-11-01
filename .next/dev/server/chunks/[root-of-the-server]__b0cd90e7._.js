module.exports = [
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/crypto [external] (crypto, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("crypto", () => require("crypto"));

module.exports = mod;
}),
"[externals]/buffer [external] (buffer, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("buffer", () => require("buffer"));

module.exports = mod;
}),
"[externals]/sharp [external] (sharp, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("sharp", () => require("sharp"));

module.exports = mod;
}),
"[externals]/mongodb [external] (mongodb, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("mongodb", () => require("mongodb"));

module.exports = mod;
}),
"[project]/lib/mongodb.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getMongoClient",
    ()=>getMongoClient,
    "getSubmissionsCollection",
    ()=>getSubmissionsCollection
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$mongodb__$5b$external$5d$__$28$mongodb$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/mongodb [external] (mongodb, cjs)");
;
const uri = process.env.MONGODB_URI;
if (!uri) {
    throw new Error("Missing MONGODB_URI. Add it to your environment configuration (e.g. .env.local).");
}
const options = {};
let clientPromise;
const globalForMongo = globalThis;
if (!globalForMongo._mongoClientPromise) {
    const client = new __TURBOPACK__imported__module__$5b$externals$5d2f$mongodb__$5b$external$5d$__$28$mongodb$2c$__cjs$29$__["MongoClient"](uri, options);
    globalForMongo._mongoClientPromise = client.connect();
}
clientPromise = globalForMongo._mongoClientPromise;
async function getMongoClient() {
    return clientPromise;
}
async function getSubmissionsCollection() {
    const client = await getMongoClient();
    const dbName = process.env.MONGODB_DB || "sspl";
    const collectionName = process.env.MONGODB_COLLECTION || "submissions";
    return client.db(dbName).collection(collectionName);
}
}),
"[project]/lib/storage.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "addSubmission",
    ()=>addSubmission,
    "readSubmissions",
    ()=>readSubmissions
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$mongodb$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/mongodb.js [app-route] (ecmascript)");
;
const DEFAULT_SORT = {
    createdAt: -1
};
async function mapCursorToSubmissions(cursor) {
    const documents = await cursor.toArray();
    return documents.map(({ _id, ...document })=>({
            ...document,
            mongoId: _id?.toString()
        }));
}
async function readSubmissions() {
    const collection = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$mongodb$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getSubmissionsCollection"])();
    const cursor = collection.find().sort(DEFAULT_SORT);
    return mapCursorToSubmissions(cursor);
}
async function addSubmission(submission) {
    const collection = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$mongodb$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getSubmissionsCollection"])();
    await collection.insertOne(submission);
}
}),
"[externals]/@aws-sdk/client-s3 [external] (@aws-sdk/client-s3, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("@aws-sdk/client-s3", () => require("@aws-sdk/client-s3"));

module.exports = mod;
}),
"[externals]/path [external] (path, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("path", () => require("path"));

module.exports = mod;
}),
"[externals]/os [external] (os, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("os", () => require("os"));

module.exports = mod;
}),
"[externals]/fs [external] (fs, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("fs", () => require("fs"));

module.exports = mod;
}),
"[project]/lib/objectStorage.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getBucketName",
    ()=>getBucketName,
    "getSignedObjectUrl",
    ()=>getSignedObjectUrl,
    "uploadObject",
    ()=>uploadObject
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f40$aws$2d$sdk$2f$client$2d$s3__$5b$external$5d$__$2840$aws$2d$sdk$2f$client$2d$s3$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/@aws-sdk/client-s3 [external] (@aws-sdk/client-s3, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$aws$2d$sdk$2f$s3$2d$request$2d$presigner$2f$dist$2d$es$2f$getSignedUrl$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@aws-sdk/s3-request-presigner/dist-es/getSignedUrl.js [app-route] (ecmascript)");
;
;
const endpoint = process.env.B2_S3_ENDPOINT;
const region = process.env.B2_S3_REGION || "us-east-005";
const accessKeyId = process.env.B2_KEY_ID;
const secretAccessKey = process.env.B2_APPLICATION_KEY;
const bucket = process.env.B2_BUCKET;
const defaultExpirySeconds = Number(process.env.B2_SIGNED_URL_TTL ?? 900);
if (!endpoint) {
    throw new Error("Missing B2_S3_ENDPOINT in environment configuration.");
}
if (!accessKeyId || !secretAccessKey) {
    throw new Error("Missing Backblaze B2 credentials (B2_KEY_ID/B2_APPLICATION_KEY).");
}
if (!bucket) {
    throw new Error("Missing Backblaze B2 bucket (B2_BUCKET).");
}
const s3Client = new __TURBOPACK__imported__module__$5b$externals$5d2f40$aws$2d$sdk$2f$client$2d$s3__$5b$external$5d$__$2840$aws$2d$sdk$2f$client$2d$s3$2c$__cjs$29$__["S3Client"]({
    endpoint,
    region,
    credentials: {
        accessKeyId,
        secretAccessKey
    },
    forcePathStyle: true
});
async function uploadObject({ key, body, contentType, metadata }) {
    if (!key) {
        throw new Error("uploadObject requires a key.");
    }
    if (!body) {
        throw new Error("uploadObject requires a body.");
    }
    const command = new __TURBOPACK__imported__module__$5b$externals$5d2f40$aws$2d$sdk$2f$client$2d$s3__$5b$external$5d$__$2840$aws$2d$sdk$2f$client$2d$s3$2c$__cjs$29$__["PutObjectCommand"]({
        Bucket: bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
        Metadata: metadata
    });
    await s3Client.send(command);
    return key;
}
async function getSignedObjectUrl(key, expiresIn = defaultExpirySeconds) {
    if (!key) return null;
    const command = new __TURBOPACK__imported__module__$5b$externals$5d2f40$aws$2d$sdk$2f$client$2d$s3__$5b$external$5d$__$2840$aws$2d$sdk$2f$client$2d$s3$2c$__cjs$29$__["GetObjectCommand"]({
        Bucket: bucket,
        Key: key
    });
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$aws$2d$sdk$2f$s3$2d$request$2d$presigner$2f$dist$2d$es$2f$getSignedUrl$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getSignedUrl"])(s3Client, command, {
        expiresIn
    });
}
function getBucketName() {
    return bucket;
}
}),
"[project]/app/api/register/route.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "POST",
    ()=>POST
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$crypto__$5b$external$5d$__$28$crypto$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/crypto [external] (crypto, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$buffer__$5b$external$5d$__$28$buffer$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/buffer [external] (buffer, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$sharp__$5b$external$5d$__$28$sharp$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/sharp [external] (sharp, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$storage$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/storage.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$objectStorage$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/objectStorage.js [app-route] (ecmascript)");
;
;
;
;
;
;
const OCR_API_ENDPOINT = process.env.OCR_SPACE_ENDPOINT ?? "https://api.ocr.space/parse/image";
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
    const uniquePrefix = `${Date.now()}-${__TURBOPACK__imported__module__$5b$externals$5d2f$crypto__$5b$external$5d$__$28$crypto$2c$__cjs$29$__["default"].randomUUID()}`;
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
    let output = await (0, __TURBOPACK__imported__module__$5b$externals$5d2f$sharp__$5b$external$5d$__$28$sharp$2c$__cjs$29$__["default"])(buffer).rotate().resize({
        width,
        withoutEnlargement: true
    }).jpeg({
        quality
    }).toBuffer();
    while(output.length > MAX_COMPRESSED_SIZE_BYTES && quality > 40){
        quality -= 10;
        output = await (0, __TURBOPACK__imported__module__$5b$externals$5d2f$sharp__$5b$external$5d$__$28$sharp$2c$__cjs$29$__["default"])(buffer).rotate().resize({
            width,
            withoutEnlargement: true
        }).jpeg({
            quality
        }).toBuffer();
    }
    while(output.length > MAX_COMPRESSED_SIZE_BYTES && width > MIN_RESIZE_WIDTH){
        width = Math.max(MIN_RESIZE_WIDTH, Math.round(width * 0.8));
        output = await (0, __TURBOPACK__imported__module__$5b$externals$5d2f$sharp__$5b$external$5d$__$28$sharp$2c$__cjs$29$__["default"])(buffer).rotate().resize({
            width,
            withoutEnlargement: true
        }).jpeg({
            quality
        }).toBuffer();
    }
    if (output.length > MAX_COMPRESSED_SIZE_BYTES) {
        throw new Error("Unable to compress image under 1 MB.");
    }
    return {
        buffer: output,
        contentType: JPEG_MIME_TYPE
    };
}
async function runOcrSpace(buffer, originalFilename, mimeType) {
    const apiKey = process.env.OCR_SPACE_API_KEY;
    if (!apiKey) {
        throw new Error("OCR_SPACE_API_KEY is not configured.");
    }
    console.log("[Registration] Starting OCR request", JSON.stringify({
        endpoint: OCR_API_ENDPOINT,
        filename: originalFilename,
        payloadBytes: buffer.length
    }));
    const formData = new FormData();
    formData.append("apikey", apiKey);
    formData.append("language", "eng");
    formData.append("isOverlayRequired", "false");
    formData.append("scale", "true");
    formData.append("OCREngine", "5");
    const sanitizedName = ensureJpegFilename(originalFilename, "payment");
    const blob = new __TURBOPACK__imported__module__$5b$externals$5d2f$buffer__$5b$external$5d$__$28$buffer$2c$__cjs$29$__["Blob"]([
        buffer
    ], {
        type: mimeType || JPEG_MIME_TYPE
    });
    formData.append("file", blob, sanitizedName);
    const controller = new AbortController();
    const timeoutId = setTimeout(()=>controller.abort(), 20000);
    let response;
    try {
        response = await fetch(OCR_API_ENDPOINT, {
            method: "POST",
            body: formData,
            signal: controller.signal
        });
    } catch (fetchError) {
        console.error("[Registration] OCR request failed to send", fetchError);
        throw new Error("Failed to reach the OCR service. Please try again.");
    } finally{
        clearTimeout(timeoutId);
    }
    console.log("[Registration] OCR response status", JSON.stringify({
        status: response.status,
        statusText: response.statusText
    }));
    if (!response.ok) {
        const errorBody = await response.text();
        console.error("[Registration] OCR non-OK response body", errorBody);
        throw new Error(`OCR request failed with status ${response.status} ${response.statusText}`);
    }
    const payload = await response.json();
    console.log("[Registration] OCR payload snapshot", JSON.stringify({
        isErrored: payload.IsErroredOnProcessing,
        errorMessage: payload.ErrorMessage,
        parsedResultsCount: payload.ParsedResults?.length ?? 0
    }));
    if (payload.IsErroredOnProcessing) {
        const message = Array.isArray(payload.ErrorMessage) ? payload.ErrorMessage.join("; ") : payload.ErrorMessage || "OCR processing failed.";
        console.error("[Registration] OCR reported processing error", message);
        throw new Error(message);
    }
    const text = payload.ParsedResults?.map((r)=>r.ParsedText).join("\n") ?? "";
    console.log("[Registration] OCR text preview", JSON.stringify({
        length: text.length,
        snippet: text.slice(0, 200)
    }));
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
        /\bamount\s*:?\.?\s*rs\.?\s*900(?:\.00)?\b/
    ];
    const patternHit = patterns.some((regex)=>regex.test(sanitized));
    if (patternHit) {
        console.log("[Registration] OCR regex matched 900");
        return true;
    }
    const amounts = extractCandidateAmounts(zeroFriendly);
    console.log("[Registration] OCR extracted amounts", JSON.stringify({
        amounts
    }));
    return amounts.some((amount)=>Math.abs(amount - 900) <= 1);
}
function extractCandidateAmounts(text) {
    const amounts = [];
    const currencyRegex = /(?:₹|rs\.?|inr\.?|amount|paid|payment|total)\s*[:=]?\s*([0-9]+(?:[.,][0-9]+)?)/gi;
    let match;
    while((match = currencyRegex.exec(text)) !== null){
        const raw = match[1].replace(/,/g, "");
        const value = Number.parseFloat(raw);
        if (!Number.isNaN(value)) {
            amounts.push(value);
        }
    }
    const plainNumberRegex = /\b([0-9]{2,6})(?:[.,][0-9]{2})?\b/g;
    while((match = plainNumberRegex.exec(text)) !== null){
        const value = Number.parseFloat(match[1]);
        if (!Number.isNaN(value)) {
            amounts.push(value);
        }
    }
    return amounts;
}
async function POST(request) {
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
    if (!name || !address || !playerType || !tshirtSize || !jerseyName || !jerseyNumber || !foodType || !(photo instanceof File) || !(paymentScreenshot instanceof File)) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: "Please complete all required fields with valid uploads."
        }, {
            status: 400
        });
    }
    if (!isImageFile(photo) || !isImageFile(paymentScreenshot)) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: "Only image files are accepted for photo and payment proof."
        }, {
            status: 400
        });
    }
    if (photo.size > MAX_UPLOAD_SIZE_BYTES || paymentScreenshot.size > MAX_UPLOAD_SIZE_BYTES) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: "Images must be 10 MB or smaller before upload."
        }, {
            status: 413
        });
    }
    if (playerType === "other" && !playerTypeOther) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: "Please specify your player type."
        }, {
            status: 400
        });
    }
    if (foodType === "other" && !foodTypeOther) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: "Please specify your food preference."
        }, {
            status: 400
        });
    }
    try {
        const photoBuffer = Buffer.from(await photo.arrayBuffer());
        const paymentBuffer = Buffer.from(await paymentScreenshot.arrayBuffer());
        console.log("[Registration] Raw upload sizes", JSON.stringify({
            photoBytes: photoBuffer.length,
            paymentBytes: paymentBuffer.length
        }));
        const compressedPhoto = await compressImage(photoBuffer);
        const compressedPayment = await compressImage(paymentBuffer);
        console.log("[Registration] Compressed sizes", JSON.stringify({
            photoBytes: compressedPhoto.buffer.length,
            paymentBytes: compressedPayment.buffer.length
        }));
        const text = await runOcrSpace(compressedPayment.buffer, paymentScreenshot.name, compressedPayment.contentType);
        if (!paymentLooksValid(text)) {
            console.warn("[Registration] OCR could not validate 900 payment", JSON.stringify({
                ocrTextSnippet: text.slice(0, 200)
            }));
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: "Unable to confirm the ₹900 payment from the screenshot. Please ensure the amount is clearly visible."
            }, {
                status: 422
            });
        }
        const photoKey = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$objectStorage$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["uploadObject"])({
            key: buildStorageKey("photos", ensureJpegFilename(photo.name, "photo")),
            body: compressedPhoto.buffer,
            contentType: compressedPhoto.contentType,
            metadata: {
                originalname: sanitizeFilename(photo.name || "photo"),
                originaltype: photo.type || ""
            }
        });
        const paymentKey = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$objectStorage$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["uploadObject"])({
            key: buildStorageKey("payments", ensureJpegFilename(paymentScreenshot.name, "payment")),
            body: compressedPayment.buffer,
            contentType: compressedPayment.contentType,
            metadata: {
                originalname: sanitizeFilename(paymentScreenshot.name || "payment"),
                originaltype: paymentScreenshot.type || ""
            }
        });
        const submission = {
            id: __TURBOPACK__imported__module__$5b$externals$5d2f$crypto__$5b$external$5d$__$28$crypto$2c$__cjs$29$__["default"].randomUUID(),
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
            ocrText: text
        };
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$storage$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["addSubmission"])(submission);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            success: true,
            submissionId: submission.id
        }, {
            status: 201
        });
    } catch (error) {
        console.error("Registration error", error);
        const message = error instanceof Error ? error.message : "Unexpected upload error.";
        const status = message === "Unable to compress image under 1 MB." ? 413 : 500;
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: status === 413 ? message : "Something went wrong while processing the registration."
        }, {
            status
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__b0cd90e7._.js.map