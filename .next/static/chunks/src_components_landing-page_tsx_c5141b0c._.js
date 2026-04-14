(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/src/components/landing-page.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>LandingPage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$image$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/image.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$shield$2d$check$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ShieldCheck$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/shield-check.js [app-client] (ecmascript) <export default as ShieldCheck>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$activity$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Activity$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/activity.js [app-client] (ecmascript) <export default as Activity>");
;
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature();
"use client";
;
;
;
;
/* ── Privacy / Terms Modal ── */ function PrivacyModal(param) {
    let { onAccept } = param;
    _s();
    const [agreed, setAgreed] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        style: {
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "rgba(27,58,107,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
            backdropFilter: "blur(2px)"
        },
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            style: {
                background: "white",
                borderRadius: 20,
                width: "100%",
                maxWidth: 560,
                maxHeight: "90vh",
                display: "flex",
                flexDirection: "column",
                boxShadow: "0 24px 80px rgba(0,0,0,0.35)",
                overflow: "hidden"
            },
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    style: {
                        background: "#08036A",
                        padding: "20px 24px",
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        flexShrink: 0
                    },
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            style: {
                                fontSize: 22
                            },
                            children: "🔒"
                        }, void 0, false, {
                            fileName: "[project]/src/components/landing-page.tsx",
                            lineNumber: 32,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    style: {
                                        fontFamily: "var(--font-playfair, Georgia, serif)",
                                        fontSize: "1.1rem",
                                        fontWeight: 700,
                                        color: "white",
                                        lineHeight: 1.2,
                                        margin: 0
                                    },
                                    children: "Privacy Notice & Terms of Use"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/landing-page.tsx",
                                    lineNumber: 34,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    style: {
                                        fontSize: "0.72rem",
                                        color: "rgba(255,255,255,0.55)",
                                        margin: 0,
                                        marginTop: 2
                                    },
                                    children: "NEW WORLD DIAGNOSTICS, INC. (NWD) · Patient & HR Portal"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/landing-page.tsx",
                                    lineNumber: 41,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/landing-page.tsx",
                            lineNumber: 33,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/landing-page.tsx",
                    lineNumber: 27,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    style: {
                        overflowY: "auto",
                        padding: "24px",
                        flex: 1,
                        fontSize: "0.82rem",
                        color: "#374151",
                        lineHeight: 1.7
                    },
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            style: {
                                marginBottom: 16,
                                color: "#1e293b"
                            },
                            children: "By accessing this portal, you acknowledge and agree to the following:"
                        }, void 0, false, {
                            fileName: "[project]/src/components/landing-page.tsx",
                            lineNumber: 53,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            style: {
                                marginBottom: 20
                            },
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    style: {
                                        fontWeight: 700,
                                        color: "#08036A",
                                        fontSize: "0.78rem",
                                        textTransform: "uppercase",
                                        letterSpacing: "0.06em",
                                        marginBottom: 8,
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 6
                                    },
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            style: {
                                                color: "#E00500"
                                            },
                                            children: "01"
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/landing-page.tsx",
                                            lineNumber: 64,
                                            columnNumber: 15
                                        }, this),
                                        " Data Privacy & Confidentiality"
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/components/landing-page.tsx",
                                    lineNumber: 59,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    style: {
                                        margin: 0
                                    },
                                    children: [
                                        "Your personal health information is collected, stored, and processed in accordance with the",
                                        " ",
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                            children: "Data Privacy Act of 2012 (RA 10173)"
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/landing-page.tsx",
                                            lineNumber: 68,
                                            columnNumber: 15
                                        }, this),
                                        ". NWD is committed to protecting the confidentiality, integrity, and availability of all patient and employee data. Information shared through this portal is used solely for healthcare delivery and administrative purposes."
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/components/landing-page.tsx",
                                    lineNumber: 66,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/landing-page.tsx",
                            lineNumber: 58,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            style: {
                                marginBottom: 20
                            },
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    style: {
                                        fontWeight: 700,
                                        color: "#08036A",
                                        fontSize: "0.78rem",
                                        textTransform: "uppercase",
                                        letterSpacing: "0.06em",
                                        marginBottom: 8,
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 6
                                    },
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            style: {
                                                color: "#E00500"
                                            },
                                            children: "02"
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/landing-page.tsx",
                                            lineNumber: 81,
                                            columnNumber: 15
                                        }, this),
                                        " Authorized Use Only"
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/components/landing-page.tsx",
                                    lineNumber: 76,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    style: {
                                        margin: 0
                                    },
                                    children: [
                                        "This portal is restricted to ",
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                            children: "authorized users only"
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/landing-page.tsx",
                                            lineNumber: 84,
                                            columnNumber: 44
                                        }, this),
                                        ". Unauthorized access, sharing of credentials, or misuse of health information is strictly prohibited and may result in legal action under applicable Philippine laws. All sessions are logged and monitored for security purposes."
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/components/landing-page.tsx",
                                    lineNumber: 83,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/landing-page.tsx",
                            lineNumber: 75,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            style: {
                                marginBottom: 20
                            },
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    style: {
                                        fontWeight: 700,
                                        color: "#08036A",
                                        fontSize: "0.78rem",
                                        textTransform: "uppercase",
                                        letterSpacing: "0.06em",
                                        marginBottom: 8,
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 6
                                    },
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            style: {
                                                color: "#E00500"
                                            },
                                            children: "03"
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/landing-page.tsx",
                                            lineNumber: 98,
                                            columnNumber: 15
                                        }, this),
                                        " Session & Security Policy"
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/components/landing-page.tsx",
                                    lineNumber: 93,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    style: {
                                        margin: 0
                                    },
                                    children: [
                                        "For your protection, sessions automatically expire after ",
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                            children: "15 minutes of inactivity"
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/landing-page.tsx",
                                            lineNumber: 101,
                                            columnNumber: 72
                                        }, this),
                                        ". Always log out after use, especially on shared devices. NWD uses 256-bit SSL encryption and complies with ISO 27001 information security standards."
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/components/landing-page.tsx",
                                    lineNumber: 100,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/landing-page.tsx",
                            lineNumber: 92,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            style: {
                                marginBottom: 20
                            },
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    style: {
                                        fontWeight: 700,
                                        color: "#08036A",
                                        fontSize: "0.78rem",
                                        textTransform: "uppercase",
                                        letterSpacing: "0.06em",
                                        marginBottom: 8,
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 6
                                    },
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            style: {
                                                color: "#E00500"
                                            },
                                            children: "04"
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/landing-page.tsx",
                                            lineNumber: 114,
                                            columnNumber: 15
                                        }, this),
                                        " Your Rights as a Data Subject"
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/components/landing-page.tsx",
                                    lineNumber: 109,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    style: {
                                        margin: 0
                                    },
                                    children: [
                                        "Under RA 10173, you have the right to be informed, to access, to correct, to object, and to data portability. To exercise these rights or report a concern, contact our Data Protection Officer at ",
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                            children: "dpo@nwdi.com.ph"
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/landing-page.tsx",
                                            lineNumber: 119,
                                            columnNumber: 37
                                        }, this),
                                        "."
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/components/landing-page.tsx",
                                    lineNumber: 116,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/landing-page.tsx",
                            lineNumber: 108,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            style: {
                                background: "#f0f4ff",
                                border: "1px solid #c7d2fe",
                                borderRadius: 10,
                                padding: "12px 14px"
                            },
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                style: {
                                    margin: 0,
                                    fontSize: "0.78rem",
                                    color: "#1e3a8a",
                                    fontWeight: 500
                                },
                                children: "🛡 This portal is DOH accredited and compliant with Philippine healthcare regulations including the Magna Carta of Patients' Rights (RA 7432) and the Universal Health Care Act (RA 11223)."
                            }, void 0, false, {
                                fileName: "[project]/src/components/landing-page.tsx",
                                lineNumber: 128,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/src/components/landing-page.tsx",
                            lineNumber: 124,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/landing-page.tsx",
                    lineNumber: 48,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    style: {
                        padding: "18px 24px",
                        borderTop: "1px solid #e2e8f0",
                        background: "#f8fafc",
                        flexShrink: 0
                    },
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                            style: {
                                display: "flex",
                                alignItems: "flex-start",
                                gap: 10,
                                cursor: "pointer",
                                marginBottom: 14
                            },
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                    type: "checkbox",
                                    checked: agreed,
                                    onChange: (e)=>setAgreed(e.target.checked),
                                    style: {
                                        width: 16,
                                        height: 16,
                                        marginTop: 2,
                                        accentColor: "#08036A",
                                        flexShrink: 0,
                                        cursor: "pointer"
                                    }
                                }, void 0, false, {
                                    fileName: "[project]/src/components/landing-page.tsx",
                                    lineNumber: 147,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    style: {
                                        fontSize: "0.8rem",
                                        color: "#374151",
                                        lineHeight: 1.5
                                    },
                                    children: [
                                        "I have read and agree to the ",
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                            children: "Privacy Notice"
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/landing-page.tsx",
                                            lineNumber: 157,
                                            columnNumber: 44
                                        }, this),
                                        " and",
                                        " ",
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                            children: "Terms of Use"
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/landing-page.tsx",
                                            lineNumber: 158,
                                            columnNumber: 15
                                        }, this),
                                        " of the NWD Patient & HR Portal"
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/components/landing-page.tsx",
                                    lineNumber: 156,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/landing-page.tsx",
                            lineNumber: 143,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            onClick: onAccept,
                            disabled: !agreed,
                            style: {
                                width: "100%",
                                padding: "12px",
                                borderRadius: 12,
                                border: "none",
                                background: agreed ? "#08036A" : "#cbd5e1",
                                color: "white",
                                fontSize: "0.9rem",
                                fontWeight: 700,
                                cursor: agreed ? "pointer" : "not-allowed",
                                transition: "background 0.2s",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: 8
                            },
                            onMouseEnter: (e)=>{
                                if (agreed) e.currentTarget.style.background = "#060280";
                            },
                            onMouseLeave: (e)=>{
                                if (agreed) e.currentTarget.style.background = "#08036A";
                            },
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    children: "✓"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/landing-page.tsx",
                                    lineNumber: 177,
                                    columnNumber: 13
                                }, this),
                                " Accept & Continue"
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/landing-page.tsx",
                            lineNumber: 162,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/landing-page.tsx",
                    lineNumber: 137,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/src/components/landing-page.tsx",
            lineNumber: 20,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/src/components/landing-page.tsx",
        lineNumber: 13,
        columnNumber: 5
    }, this);
}
_s(PrivacyModal, "M2qgP4UlCM7VqtLVo0/m0bCgG0Y=");
_c = PrivacyModal;
function LandingPage() {
    _s1();
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"])();
    const [hovering, setHovering] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [showPrivacy, setShowPrivacy] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(true);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        style: {
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            fontFamily: "var(--font-source-sans, 'Source Sans 3', system-ui, sans-serif)"
        },
        children: [
            showPrivacy && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(PrivacyModal, {
                onAccept: ()=>setShowPrivacy(false)
            }, void 0, false, {
                fileName: "[project]/src/components/landing-page.tsx",
                lineNumber: 195,
                columnNumber: 23
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("header", {
                style: {
                    background: "linear-gradient(180deg, #1006A0 0%, #1006A0 75%, #E00500 75%, #E00500 100%)",
                    padding: "0 clamp(20px, 5vw, 48px)",
                    height: 64,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    borderBottom: "4px solid #E00500",
                    position: "sticky",
                    top: 0,
                    zIndex: 100,
                    flexShrink: 0
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: {
                            display: "flex",
                            alignItems: "center",
                            gap: 14
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$image$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                src: "/nwdi-logo.png",
                                alt: "NEW WORLD DIAGNOSTICS, INC.",
                                width: 1448,
                                height: 144,
                                style: {
                                    height: 30,
                                    width: "auto",
                                    display: "block"
                                },
                                priority: true,
                                unoptimized: true
                            }, void 0, false, {
                                fileName: "[project]/src/components/landing-page.tsx",
                                lineNumber: 209,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                style: {
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 1
                                },
                                className: "hidden sm:flex",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        style: {
                                            fontSize: "0.8rem",
                                            fontWeight: 800,
                                            color: "white",
                                            letterSpacing: "0.04em",
                                            lineHeight: 1.2
                                        },
                                        children: "NEW WORLD DIAGNOSTICS, INC."
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/landing-page.tsx",
                                        lineNumber: 211,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        style: {
                                            fontSize: "0.65rem",
                                            color: "rgba(255,255,255,0.6)",
                                            fontStyle: "italic"
                                        },
                                        children: '"Your Health is Our Commitment"'
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/landing-page.tsx",
                                        lineNumber: 214,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/landing-page.tsx",
                                lineNumber: 210,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/landing-page.tsx",
                        lineNumber: 208,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("nav", {
                        style: {
                            display: "flex",
                            gap: 20
                        },
                        className: "hidden sm:flex",
                        children: [
                            {
                                label: "Services",
                                href: "https://www.nwdi.com.ph/"
                            },
                            {
                                label: "Our Clinics",
                                href: "https://www.nwdi.com.ph/"
                            },
                            {
                                label: "Contact Us",
                                href: "https://www.nwdi.com.ph/"
                            }
                        ].map((param)=>{
                            let { label, href } = param;
                            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                href: href,
                                target: "_blank",
                                rel: "noopener noreferrer",
                                style: {
                                    color: "rgba(255,255,255,0.75)",
                                    fontSize: "0.82rem",
                                    textDecoration: "none",
                                    transition: "color 0.2s",
                                    fontWeight: 500
                                },
                                onMouseEnter: (e)=>e.currentTarget.style.color = "white",
                                onMouseLeave: (e)=>e.currentTarget.style.color = "rgba(255,255,255,0.75)",
                                children: label
                            }, label, false, {
                                fileName: "[project]/src/components/landing-page.tsx",
                                lineNumber: 227,
                                columnNumber: 13
                            }, this);
                        })
                    }, void 0, false, {
                        fileName: "[project]/src/components/landing-page.tsx",
                        lineNumber: 221,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/landing-page.tsx",
                lineNumber: 198,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                style: {
                    flex: 1,
                    background: "linear-gradient(150deg, #08036A 0%, #1006A0 55%, #1B3A6B 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "clamp(40px, 8vw, 80px) clamp(16px, 5vw, 48px)",
                    position: "relative",
                    overflow: "hidden"
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: {
                            position: "absolute",
                            inset: 0,
                            pointerEvents: "none",
                            background: "radial-gradient(ellipse 50% 70% at 80% 50%, rgba(192,57,43,0.12) 0%, transparent 60%)"
                        }
                    }, void 0, false, {
                        fileName: "[project]/src/components/landing-page.tsx",
                        lineNumber: 254,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: {
                            position: "absolute",
                            inset: 0,
                            pointerEvents: "none",
                            opacity: 0.03,
                            backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
                            backgroundSize: "40px 40px"
                        }
                    }, void 0, false, {
                        fileName: "[project]/src/components/landing-page.tsx",
                        lineNumber: 259,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: {
                            position: "relative",
                            zIndex: 1,
                            textAlign: "center",
                            width: "100%",
                            maxWidth: 720
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                style: {
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 8,
                                    marginBottom: 24,
                                    background: "rgba(255,255,255,0.08)",
                                    border: "1px solid rgba(255,255,255,0.15)",
                                    borderRadius: 20,
                                    padding: "6px 16px"
                                },
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$shield$2d$check$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ShieldCheck$3e$__["ShieldCheck"], {
                                        style: {
                                            width: 13,
                                            height: 13,
                                            color: "#F0B429",
                                            flexShrink: 0
                                        }
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/landing-page.tsx",
                                        lineNumber: 273,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        style: {
                                            fontSize: "clamp(0.65rem, 1.5vw, 0.78rem)",
                                            color: "rgba(255,255,255,0.75)",
                                            fontWeight: 600,
                                            letterSpacing: "0.04em"
                                        },
                                        children: "ISO 27001 · DOH Accredited · RA 10173 Compliant"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/landing-page.tsx",
                                        lineNumber: 274,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/landing-page.tsx",
                                lineNumber: 268,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                                style: {
                                    fontFamily: "var(--font-playfair, Georgia, serif)",
                                    fontSize: "clamp(2rem, 5vw, 3rem)",
                                    lineHeight: 1.15,
                                    color: "white",
                                    marginBottom: 14,
                                    fontWeight: 700
                                },
                                children: [
                                    "Your Health,",
                                    " ",
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("em", {
                                        style: {
                                            color: "#F0B429",
                                            fontStyle: "italic"
                                        },
                                        children: "Accessible"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/landing-page.tsx",
                                        lineNumber: 289,
                                        columnNumber: 13
                                    }, this),
                                    " ",
                                    "Anywhere"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/landing-page.tsx",
                                lineNumber: 283,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                style: {
                                    fontSize: "clamp(0.85rem, 2vw, 1rem)",
                                    color: "rgba(255,255,255,0.65)",
                                    marginBottom: 48,
                                    lineHeight: 1.7,
                                    maxWidth: 520,
                                    margin: "0 auto 48px"
                                },
                                children: "Secure self-service access to your lab results, health records, and appointments. One platform for patients and HR professionals."
                            }, void 0, false, {
                                fileName: "[project]/src/components/landing-page.tsx",
                                lineNumber: 294,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                style: {
                                    display: "flex",
                                    gap: 24,
                                    justifyContent: "center",
                                    flexWrap: "wrap"
                                },
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        role: "button",
                                        tabIndex: 0,
                                        onClick: ()=>router.push("/login?portal=patient"),
                                        onKeyDown: (e)=>e.key === "Enter" && router.push("/login?portal=patient"),
                                        onMouseEnter: ()=>setHovering("patient"),
                                        onMouseLeave: ()=>setHovering(null),
                                        style: {
                                            background: "white",
                                            borderRadius: 20,
                                            padding: "36px 32px",
                                            width: "min(280px, calc(100vw - 64px))",
                                            cursor: "pointer",
                                            textAlign: "center",
                                            border: "2px solid ".concat(hovering === "patient" ? "#D4A017" : "transparent"),
                                            boxShadow: hovering === "patient" ? "0 24px 64px rgba(0,0,0,0.35)" : "0 16px 48px rgba(0,0,0,0.25)",
                                            transform: hovering === "patient" ? "translateY(-6px)" : "none",
                                            transition: "all 0.25s cubic-bezier(0.4,0,0.2,1)"
                                        },
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                style: {
                                                    width: 64,
                                                    height: 64,
                                                    borderRadius: 16,
                                                    margin: "0 auto 18px",
                                                    background: "linear-gradient(135deg, #EBF4FF, #DBEAFE)",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center"
                                                },
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$activity$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Activity$3e$__["Activity"], {
                                                    style: {
                                                        width: 28,
                                                        height: 28,
                                                        color: "#1006A0"
                                                    }
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/landing-page.tsx",
                                                    lineNumber: 337,
                                                    columnNumber: 17
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/landing-page.tsx",
                                                lineNumber: 332,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                style: {
                                                    fontFamily: "var(--font-playfair, Georgia, serif)",
                                                    fontSize: "1.25rem",
                                                    color: "#1006A0",
                                                    marginBottom: 8,
                                                    fontWeight: 700
                                                },
                                                children: "Patient Portal"
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/landing-page.tsx",
                                                lineNumber: 339,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                style: {
                                                    fontSize: "0.82rem",
                                                    color: "#555577",
                                                    lineHeight: 1.6,
                                                    marginBottom: 20
                                                },
                                                children: "Access results, book appointments, and manage your health records securely."
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/landing-page.tsx",
                                                lineNumber: 345,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                style: {
                                                    display: "block",
                                                    width: "100%",
                                                    padding: "11px",
                                                    borderRadius: 10,
                                                    border: "none",
                                                    fontSize: "0.88rem",
                                                    fontWeight: 700,
                                                    cursor: "pointer",
                                                    background: "#1006A0",
                                                    color: "white",
                                                    transition: "background 0.2s",
                                                    fontFamily: "inherit"
                                                },
                                                onMouseEnter: (e)=>e.currentTarget.style.background = "#0B0480",
                                                onMouseLeave: (e)=>e.currentTarget.style.background = "#1006A0",
                                                children: "Sign In as Patient"
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/landing-page.tsx",
                                                lineNumber: 348,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/landing-page.tsx",
                                        lineNumber: 310,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        role: "button",
                                        tabIndex: 0,
                                        onClick: ()=>router.push("/login?portal=hr"),
                                        onKeyDown: (e)=>e.key === "Enter" && router.push("/login?portal=hr"),
                                        onMouseEnter: ()=>setHovering("hr"),
                                        onMouseLeave: ()=>setHovering(null),
                                        style: {
                                            background: "white",
                                            borderRadius: 20,
                                            padding: "36px 32px",
                                            width: "min(280px, calc(100vw - 64px))",
                                            cursor: "pointer",
                                            textAlign: "center",
                                            border: "2px solid ".concat(hovering === "hr" ? "#D4A017" : "transparent"),
                                            boxShadow: hovering === "hr" ? "0 24px 64px rgba(0,0,0,0.35)" : "0 16px 48px rgba(0,0,0,0.25)",
                                            transform: hovering === "hr" ? "translateY(-6px)" : "none",
                                            transition: "all 0.25s cubic-bezier(0.4,0,0.2,1)"
                                        },
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                style: {
                                                    width: 64,
                                                    height: 64,
                                                    borderRadius: 16,
                                                    margin: "0 auto 18px",
                                                    background: "linear-gradient(135deg, #FFF5E6, #FDEBD0)",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center"
                                                },
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$shield$2d$check$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ShieldCheck$3e$__["ShieldCheck"], {
                                                    style: {
                                                        width: 28,
                                                        height: 28,
                                                        color: "#E00500"
                                                    }
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/landing-page.tsx",
                                                    lineNumber: 392,
                                                    columnNumber: 17
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/landing-page.tsx",
                                                lineNumber: 387,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                style: {
                                                    fontFamily: "var(--font-playfair, Georgia, serif)",
                                                    fontSize: "1.25rem",
                                                    color: "#1006A0",
                                                    marginBottom: 8,
                                                    fontWeight: 700
                                                },
                                                children: "HR Portal"
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/landing-page.tsx",
                                                lineNumber: 394,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                style: {
                                                    fontSize: "0.82rem",
                                                    color: "#555577",
                                                    lineHeight: 1.6,
                                                    marginBottom: 20
                                                },
                                                children: "Manage employee health compliance, APE tracking, and workforce analytics."
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/landing-page.tsx",
                                                lineNumber: 400,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                style: {
                                                    display: "block",
                                                    width: "100%",
                                                    padding: "11px",
                                                    borderRadius: 10,
                                                    border: "none",
                                                    fontSize: "0.88rem",
                                                    fontWeight: 700,
                                                    cursor: "pointer",
                                                    background: "#E00500",
                                                    color: "white",
                                                    transition: "background 0.2s",
                                                    fontFamily: "inherit"
                                                },
                                                onMouseEnter: (e)=>e.currentTarget.style.background = "#B80400",
                                                onMouseLeave: (e)=>e.currentTarget.style.background = "#E00500",
                                                children: "Sign In as HR Staff"
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/landing-page.tsx",
                                                lineNumber: 403,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/landing-page.tsx",
                                        lineNumber: 365,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/landing-page.tsx",
                                lineNumber: 304,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                style: {
                                    marginTop: 40,
                                    fontSize: "0.72rem",
                                    color: "rgba(255,255,255,0.35)",
                                    letterSpacing: "0.04em"
                                },
                                children: [
                                    "© ",
                                    new Date().getFullYear(),
                                    " NEW WORLD DIAGNOSTICS, INC. · All rights reserved"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/landing-page.tsx",
                                lineNumber: 422,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/landing-page.tsx",
                        lineNumber: 265,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/landing-page.tsx",
                lineNumber: 246,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/landing-page.tsx",
        lineNumber: 191,
        columnNumber: 5
    }, this);
}
_s1(LandingPage, "OMZkNPZ7WKokDqXqzMle4b7vuDk=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"]
    ];
});
_c1 = LandingPage;
var _c, _c1;
__turbopack_context__.k.register(_c, "PrivacyModal");
__turbopack_context__.k.register(_c1, "LandingPage");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=src_components_landing-page_tsx_c5141b0c._.js.map