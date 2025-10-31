(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push(["chunks/[root-of-the-server]__d05cd417._.js",
"[externals]/node:buffer [external] (node:buffer, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:buffer", () => require("node:buffer"));

module.exports = mod;
}),
"[externals]/node:async_hooks [external] (node:async_hooks, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:async_hooks", () => require("node:async_hooks"));

module.exports = mod;
}),
"[project]/lib/auth.js [middleware-edge] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "computeSessionToken",
    ()=>computeSessionToken,
    "credentialsAreValid",
    ()=>credentialsAreValid,
    "getCredentials",
    ()=>getCredentials
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$buffer__$5b$external$5d$__$28$node$3a$buffer$2c$__cjs$29$__ = /*#__PURE__*/ __turbopack_context__.i("[externals]/node:buffer [external] (node:buffer, cjs)");
const fallbackUser = "admin";
const fallbackPass = "sspl@secure";
function getCredentials() {
    return {
        username: process.env.ADMIN_USERNAME || fallbackUser,
        password: process.env.ADMIN_PASSWORD || fallbackPass
    };
}
function credentialsAreValid(inputUser, inputPass) {
    if (!inputUser || !inputPass) return false;
    const { username, password } = getCredentials();
    return inputUser.trim() === username.trim() && inputPass === password;
}
function base64Encode(raw) {
    if (typeof __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$buffer__$5b$external$5d$__$28$node$3a$buffer$2c$__cjs$29$__["Buffer"] !== "undefined") {
        return __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$buffer__$5b$external$5d$__$28$node$3a$buffer$2c$__cjs$29$__["Buffer"].from(raw, "utf-8").toString("base64");
    }
    if (typeof btoa !== "undefined") {
        return btoa(unescape(encodeURIComponent(raw)));
    }
    throw new Error("No base64 encoder available in this environment.");
}
function computeSessionToken() {
    const { username, password } = getCredentials();
    return base64Encode(`${username}:${password}`);
}
}),
"[project]/middleware.js [middleware-edge] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "config",
    ()=>config,
    "middleware",
    ()=>middleware
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$api$2f$server$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/next/dist/esm/api/server.js [middleware-edge] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$exports$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/esm/server/web/exports/index.js [middleware-edge] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$auth$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/auth.js [middleware-edge] (ecmascript)");
;
;
const COOKIE_NAME = "admin_session";
function middleware(request) {
    const { pathname } = request.nextUrl;
    if (pathname.startsWith("/admin")) {
        if (pathname === "/admin/login") {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$exports$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].next();
        }
        const sessionCookie = request.cookies.get(COOKIE_NAME)?.value;
        const expectedToken = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$auth$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["computeSessionToken"])();
        if (sessionCookie !== expectedToken) {
            const loginUrl = request.nextUrl.clone();
            loginUrl.pathname = "/admin/login";
            loginUrl.searchParams.set("redirect", pathname);
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$exports$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].redirect(loginUrl);
        }
    }
    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$exports$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].next();
}
const config = {
    matcher: [
        "/admin/:path*"
    ]
};
}),
]);

//# sourceMappingURL=%5Broot-of-the-server%5D__d05cd417._.js.map