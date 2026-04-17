import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

// POST /api/uat/upload — saves a screenshot (base64 or file), returns path
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const contentType = req.headers.get("content-type") ?? "";

    let buffer: Buffer;
    let ext = "png";

    if (contentType.includes("application/json")) {
      // html2canvas sends base64 data URL
      const { dataUrl } = (await req.json()) as { dataUrl: string };
      const matches = dataUrl.match(/^data:image\/(\w+);base64,(.+)$/);
      if (!matches) {
        return NextResponse.json({ error: "Invalid image data" }, { status: 400 });
      }
      ext    = matches[1];
      buffer = Buffer.from(matches[2], "base64");
    } else {
      // multipart form upload fallback
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      if (!file) {
        return NextResponse.json({ error: "No file provided" }, { status: 400 });
      }
      const arrBuf = await file.arrayBuffer();
      buffer = Buffer.from(arrBuf);
      ext    = file.name.split(".").pop() ?? "png";
    }

    const now      = new Date();
    const yyyy     = now.getFullYear();
    const mm       = String(now.getMonth() + 1).padStart(2, "0");
    const u = session.user as { email?: string };
    const username = (u.email ?? "user").replace(/[^a-z0-9]/gi, "_").toLowerCase();
    const filename = `uat_${Date.now()}_${username}.${ext}`;

    const relDir  = path.join("uploads", "uat", String(yyyy), mm);
    const absDir  = path.join(process.cwd(), "public", relDir);
    const absPath = path.join(absDir, filename);

    await mkdir(absDir, { recursive: true });
    await writeFile(absPath, buffer);

    const publicPath = `/${relDir.replace(/\\/g, "/")}/${filename}`;
    return NextResponse.json({ path: publicPath }, { status: 201 });
  } catch (err) {
    console.error("[UAT_UPLOAD]", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
