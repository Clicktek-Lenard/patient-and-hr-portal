(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push(["chunks/[root-of-the-server]__f1b1cd1f._.js",
"[externals]/node:buffer [external] (node:buffer, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:buffer", () => require("node:buffer"));

module.exports = mod;
}),
"[externals]/node:async_hooks [external] (node:async_hooks, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:async_hooks", () => require("node:async_hooks"));

module.exports = mod;
}),
"[project]/ [middleware-edge] (unsupported edge import 'crypto', ecmascript)", ((__turbopack_context__, module, exports) => {

__turbopack_context__.n(__import_unsupported(`crypto`));
}),
"[project]/src/lib/prisma.ts [middleware-edge] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "prisma",
    ()=>prisma
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$prisma$2f$client$2f$default$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@prisma/client/default.js [middleware-edge] (ecmascript)");
;
const globalForPrisma = globalThis;
const prisma = globalForPrisma.prisma ?? new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$prisma$2f$client$2f$default$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["PrismaClient"]({
    log: ("TURBOPACK compile-time truthy", 1) ? [
        "query",
        "error",
        "warn"
    ] : "TURBOPACK unreachable"
});
if ("TURBOPACK compile-time truthy", 1) globalForPrisma.prisma = prisma;
}),
"[project]/src/lib/prisma-cms.ts [middleware-edge] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "cmsPrisma",
    ()=>cmsPrisma
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$prisma$2f$cms$2d$client$2f$default$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.prisma/cms-client/default.js [middleware-edge] (ecmascript)");
;
const globalForCms = globalThis;
const cmsPrisma = globalForCms.cmsPrisma ?? new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$prisma$2f$cms$2d$client$2f$default$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["PrismaClient"]({
    log: ("TURBOPACK compile-time truthy", 1) ? [
        "error",
        "warn"
    ] : "TURBOPACK unreachable"
});
if ("TURBOPACK compile-time truthy", 1) globalForCms.cmsPrisma = cmsPrisma;
}),
"[project]/src/lib/auth.ts [middleware-edge] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "auth",
    ()=>auth,
    "handlers",
    ()=>handlers,
    "signIn",
    ()=>signIn,
    "signOut",
    ()=>signOut
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$auth$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/next-auth/index.js [middleware-edge] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$auth$2f$providers$2f$credentials$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/next-auth/providers/credentials.js [middleware-edge] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$auth$2f$node_modules$2f40$auth$2f$core$2f$providers$2f$credentials$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next-auth/node_modules/@auth/core/providers/credentials.js [middleware-edge] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$bcryptjs$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/bcryptjs/index.js [middleware-edge] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/prisma.ts [middleware-edge] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2d$cms$2e$ts__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/prisma-cms.ts [middleware-edge] (ecmascript)");
;
;
;
;
;
// ── In-memory login rate limiter ─────────────────────────────────────────────
// Keyed by identifier — max 5 attempts per 15 minutes
const loginAttempts = new Map();
function checkLoginRateLimit(identifier) {
    const now = Date.now();
    const entry = loginAttempts.get(identifier);
    if (!entry || now > entry.resetAt) {
        loginAttempts.set(identifier, {
            count: 1,
            resetAt: now + 15 * 60 * 1000
        });
        return true;
    }
    if (entry.count >= 5) return false;
    entry.count++;
    return true;
}
function clearLoginAttempts(identifier) {
    loginAttempts.delete(identifier);
}
const { handlers, auth, signIn, signOut } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$auth$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__$3c$locals$3e$__["default"])({
    providers: [
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$auth$2f$node_modules$2f40$auth$2f$core$2f$providers$2f$credentials$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["default"])({
            name: "credentials",
            credentials: {
                loginType: {
                    label: "Login Type",
                    type: "text"
                },
                identifier: {
                    label: "ID",
                    type: "text"
                },
                dob: {
                    label: "Birthdate",
                    type: "text"
                },
                pin: {
                    label: "PIN",
                    type: "text"
                }
            },
            async authorize (credentials) {
                const loginType = credentials?.loginType;
                const rawIdentifier = credentials?.identifier?.trim() ?? "";
                const dob = credentials?.dob;
                const pin = credentials?.pin?.trim();
                if (!loginType || !rawIdentifier) {
                    throw new Error("Missing credentials");
                }
                // ── Rate limit by identifier ──────────────────────────────────────
                if (!checkLoginRateLimit(rawIdentifier.toLowerCase())) {
                    throw new Error("Too many login attempts. Please wait 15 minutes.");
                }
                // ── PATIENT LOGIN: patientCode + dob ──────────────────────────────
                if (loginType === "patient") {
                    const patientCode = rawIdentifier.toUpperCase();
                    if (!dob) throw new Error("Date of birth is required");
                    const user = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["prisma"].portalUser.findUnique({
                        where: {
                            patientCode
                        }
                    });
                    if (!user || !user.isActive || user.deletedAt) {
                        throw new Error("Invalid Patient ID or date of birth");
                    }
                    const cmsPatient = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2d$cms$2e$ts__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["cmsPrisma"].cmsPatient.findUnique({
                        where: {
                            code: patientCode
                        },
                        select: {
                            dob: true
                        }
                    });
                    if (!cmsPatient) {
                        throw new Error("Invalid Patient ID or date of birth");
                    }
                    const inputDob = new Date(dob);
                    const cmsDob = new Date(cmsPatient.dob);
                    const dobMatches = inputDob.getFullYear() === cmsDob.getFullYear() && inputDob.getMonth() === cmsDob.getMonth() && inputDob.getDate() === cmsDob.getDate();
                    if (!dobMatches) {
                        throw new Error("Invalid Patient ID or date of birth");
                    }
                    // Clear rate limit on success
                    clearLoginAttempts(patientCode.toLowerCase());
                    await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["prisma"].portalUser.update({
                        where: {
                            id: user.id
                        },
                        data: {
                            lastLoginAt: new Date()
                        }
                    });
                    return {
                        id: user.id,
                        email: user.email,
                        name: `${user.firstName} ${user.lastName}`,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        mobile: user.mobile,
                        patientCode: user.patientCode ?? undefined,
                        role: user.role
                    };
                }
                // ── HR LOGIN: email + password ────────────────────────────────────
                if (loginType === "hr") {
                    const password = pin; // "pin" field carries the password from the form
                    const emailLower = rawIdentifier.toLowerCase();
                    if (!password) {
                        throw new Error("Password is required");
                    }
                    const user = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["prisma"].portalUser.findUnique({
                        where: {
                            email: emailLower
                        }
                    });
                    if (!user || !user.isActive || user.deletedAt) {
                        throw new Error("Invalid email or password");
                    }
                    if (user.role !== "HR" && user.role !== "ADMIN") {
                        throw new Error("Unauthorized role");
                    }
                    const passwordMatches = await __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$bcryptjs$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["default"].compare(password, user.password);
                    if (!passwordMatches) {
                        throw new Error("Invalid email or password");
                    }
                    // Clear rate limit on success
                    clearLoginAttempts(emailLower);
                    await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["prisma"].portalUser.update({
                        where: {
                            id: user.id
                        },
                        data: {
                            lastLoginAt: new Date()
                        }
                    });
                    return {
                        id: user.id,
                        email: user.email,
                        name: `${user.firstName} ${user.lastName}`,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        mobile: user.mobile,
                        patientCode: undefined,
                        role: user.role
                    };
                }
                throw new Error("Invalid login type");
            }
        })
    ],
    session: {
        strategy: "jwt",
        maxAge: 8 * 60 * 60,
        updateAge: 60 * 60
    },
    pages: {
        signIn: "/login",
        error: "/login"
    },
    callbacks: {
        async jwt ({ token, user }) {
            if (user) {
                token.id = user.id;
                token.firstName = user.firstName;
                token.lastName = user.lastName;
                token.mobile = user.mobile;
                token.patientCode = user.patientCode;
                token.role = user.role;
            }
            return token;
        },
        async session ({ session, token }) {
            if (token) {
                session.user.id = token.id;
                session.user.firstName = token.firstName;
                session.user.lastName = token.lastName;
                session.user.mobile = token.mobile;
                session.user.patientCode = token.patientCode;
                session.user.role = token.role;
            }
            return session;
        }
    },
    secret: process.env.AUTH_SECRET,
    trustHost: true
});
}),
"[project]/src/middleware.ts [middleware-edge] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "config",
    ()=>config,
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2e$ts__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/auth.ts [middleware-edge] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$api$2f$server$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/next/dist/esm/api/server.js [middleware-edge] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$exports$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/esm/server/web/exports/index.js [middleware-edge] (ecmascript)");
;
;
const publicRoutes = [
    "/login",
    "/register",
    "/verify-otp",
    "/forgot-password",
    "/reset-password"
];
const authRoutes = [
    "/login",
    "/register",
    "/verify-otp",
    "/forgot-password",
    "/reset-password"
];
const hrRoutes = [
    "/hr"
];
const __TURBOPACK__default__export__ = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2e$ts__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["auth"])((req)=>{
    const { nextUrl } = req;
    const isLoggedIn = !!req.auth?.user?.id;
    const userRole = req.auth?.user?.role ?? "PATIENT";
    const isPublicRoute = publicRoutes.some((route)=>nextUrl.pathname.startsWith(route));
    const isAuthRoute = authRoutes.some((route)=>nextUrl.pathname.startsWith(route));
    const isHrRoute = hrRoutes.some((route)=>nextUrl.pathname.startsWith(route));
    const isApiRoute = nextUrl.pathname.startsWith("/api");
    const isRootRoute = nextUrl.pathname === "/";
    // Allow API routes to handle their own auth
    if (isApiRoute) return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$exports$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].next();
    // Root route: show landing page for guests, redirect logged-in users to their portal
    if (isRootRoute) {
        if (isLoggedIn) {
            return userRole === "HR" || userRole === "ADMIN" ? __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$exports$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].redirect(new URL("/hr/dashboard", nextUrl)) : __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$exports$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].redirect(new URL("/dashboard", nextUrl));
        }
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$exports$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].next();
    }
    // Logged-in users on auth pages → redirect to their portal
    if (isAuthRoute && isLoggedIn) {
        return userRole === "HR" || userRole === "ADMIN" ? __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$exports$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].redirect(new URL("/hr/dashboard", nextUrl)) : __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$exports$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].redirect(new URL("/dashboard", nextUrl));
    }
    // HR routes: require login + HR/ADMIN role
    if (isHrRoute) {
        if (!isLoggedIn) {
            const loginUrl = new URL("/login", nextUrl);
            loginUrl.searchParams.set("callbackUrl", nextUrl.pathname + nextUrl.search);
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$exports$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].redirect(loginUrl);
        }
        if (userRole !== "HR" && userRole !== "ADMIN") {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$exports$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].redirect(new URL("/dashboard", nextUrl));
        }
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$exports$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].next();
    }
    // Portal routes: require login
    if (!isPublicRoute && !isLoggedIn) {
        const loginUrl = new URL("/login", nextUrl);
        const callbackUrl = nextUrl.pathname + nextUrl.search;
        if (callbackUrl !== "/") loginUrl.searchParams.set("callbackUrl", callbackUrl);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$exports$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].redirect(loginUrl);
    }
    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$exports$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].next();
});
const config = {
    matcher: [
        "/((?!_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.gif|.*\\.svg|.*\\.ico|.*\\.webp|images|icons|fonts).*)"
    ]
};
}),
]);

//# sourceMappingURL=%5Broot-of-the-server%5D__f1b1cd1f._.js.map