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
"[externals]/path [external] (path, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("path", () => require("path"));

module.exports = mod;
}),
"[externals]/fs [external] (fs, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("fs", () => require("fs"));

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
"[project]/app/api/register/route.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "POST",
    ()=>POST
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/path [external] (path, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$fs__$5b$external$5d$__$28$fs$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/fs [external] (fs, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$crypto__$5b$external$5d$__$28$crypto$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/crypto [external] (crypto, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$buffer__$5b$external$5d$__$28$buffer$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/buffer [external] (buffer, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$storage$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/storage.js [app-route] (ecmascript)");
;
;
;
;
;
;
const photosDir = __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__["default"].join(process.cwd(), "public", "uploads", "photos");
const paymentsDir = __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__["default"].join(process.cwd(), "public", "uploads", "payments");
const OCR_API_ENDPOINT = process.env.OCR_SPACE_ENDPOINT ?? "https://api.ocr.space/parse/image";
async function ensureDirectories() {
    await __TURBOPACK__imported__module__$5b$externals$5d2f$fs__$5b$external$5d$__$28$fs$2c$__cjs$29$__["promises"].mkdir(photosDir, {
        recursive: true
    });
    await __TURBOPACK__imported__module__$5b$externals$5d2f$fs__$5b$external$5d$__$28$fs$2c$__cjs$29$__["promises"].mkdir(paymentsDir, {
        recursive: true
    });
}
async function saveFile(file, targetDir, providedBuffer) {
    if (!(file instanceof File)) {
        return null;
    }
    const buffer = providedBuffer ?? Buffer.from(await file.arrayBuffer());
    const safeName = file.name.replace(/[^a-z0-9.\-_]/gi, "_").toLowerCase();
    const filename = `${Date.now()}-${safeName || "upload"}`;
    const fullPath = __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__["default"].join(targetDir, filename);
    await __TURBOPACK__imported__module__$5b$externals$5d2f$fs__$5b$external$5d$__$28$fs$2c$__cjs$29$__["promises"].writeFile(fullPath, buffer);
    const publicPath = __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__["default"].join("/uploads", __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__["default"].basename(targetDir), filename);
    return {
        filename,
        publicPath,
        fullPath,
        size: buffer.length
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
    const sanitizedName = originalFilename?.replace(/[^a-z0-9.\-_]/gi, "_").toLowerCase() || "payment.jpg";
    const blob = new __TURBOPACK__imported__module__$5b$externals$5d2f$buffer__$5b$external$5d$__$28$buffer$2c$__cjs$29$__["Blob"]([
        buffer
    ], {
        type: mimeType || "application/octet-stream"
    });
    formData.append("file", blob, sanitizedName);
    const response = await fetch(OCR_API_ENDPOINT, {
        method: "POST",
        body: formData
    });
    if (!response.ok) {
        throw new Error(`OCR request failed with status ${response.status} ${response.statusText}`);
    }
    const payload = await response.json();
    if (payload.IsErroredOnProcessing) {
        const message = Array.isArray(payload.ErrorMessage) ? payload.ErrorMessage.join("; ") : payload.ErrorMessage || "OCR processing failed.";
        throw new Error(message);
    }
    const text = payload.ParsedResults?.map((r)=>r.ParsedText).join("\n") ?? "";
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
    return patterns.some((regex)=>regex.test(sanitized));
}
async function POST(request) {
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
    if (!name || !address || !playerType || !tshirtSize || !jerseyName || !jerseyNumber || !foodType || !feeResponse || !(photo instanceof File) || !(paymentScreenshot instanceof File)) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: "Please complete all required fields."
        }, {
            status: 400
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
    if (feeResponse === "other" && !feeResponseOther) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: "Please describe your fee status."
        }, {
            status: 400
        });
    }
    if (photo.size > maxUploadSize || paymentScreenshot.size > maxUploadSize) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: "Uploads must be 10 MB or smaller."
        }, {
            status: 413
        });
    }
    try {
        const paymentBuffer = Buffer.from(await paymentScreenshot.arrayBuffer());
        const text = await runOcrSpace(paymentBuffer, paymentScreenshot.name, paymentScreenshot.type);
        console.log("OCR output:", text);
        if (!paymentLooksValid(text)) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: "Unable to confirm the ₹900 payment from the screenshot. Please ensure the amount is clearly visible."
            }, {
                status: 422
            });
        }
        const savedPhoto = await saveFile(photo, photosDir);
        const savedPayment = await saveFile(paymentScreenshot, paymentsDir, paymentBuffer);
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
            feeResponse,
            feeResponseOther: feeResponse === "other" ? feeResponseOther : "",
            photo: savedPhoto?.publicPath,
            paymentScreenshot: savedPayment?.publicPath,
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
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: "Something went wrong while processing the registration."
        }, {
            status: 500
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__cc66e89f._.js.map