import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { writeFile, mkdir, readFile } from "fs/promises";
import path from "path";

// Uploads are stored at <project_root>/uat-uploads/ (outside public/)
// and served back via GET /api/uat/upload?file=...
function getUploadsDir() {
  // process.cwd() is reliable in both dev and pm2/standalone
  return path.join(process.cwd(), "uat-uploads");
}

// GET /api/uat/upload?file=uat/2026/04/filename.png — serve the file
export async function GET(req: NextRequest) {
  const file = req.nextUrl.searchParams.get("file");
  if (!file || file.includes("..")) {
    return NextResponse.json({ error: "Invalid file" }, { status: 400 });
  }

  try {
    const absPath = path.join(getUploadsDir(), file);
    const buf = await readFile(absPath);
    const ext = file.split(".").pop()?.toLowerCase() ?? "png";
    const mime = ext === "jpg" || ext === "jpeg" ? "image/jpeg"
      : ext === "webp" ? "image/webp"
      : "image/png";

    return new NextResponse(buf, {
      headers: {
        "Content-Type": mime,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}

// POST /api/uat/upload — saves a screenshot, returns API path
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
      const { dataUrl } = (await req.json()) as { dataUrl: string };
      const matches = dataUrl.match(/^data:image\/(\w+);base64,(.+)$/);
      if (!matches) {
        return NextResponse.json({ error: "Invalid image data" }, { status: 400 });
      }
      ext    = matches[1];
      buffer = Buffer.from(matches[2], "base64");
    } else {
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
    const u        = session.user as { email?: string };
    const username = (u.email ?? "user").replace(/[^a-z0-9]/gi, "_").toLowerCase();
    const filename = `uat_${Date.now()}_${username}.${ext}`;

    const relPath = `uat/${yyyy}/${mm}/${filename}`;
    const absDir  = path.join(getUploadsDir(), "uat", String(yyyy), mm);
    const absPath = path.join(absDir, filename);

    await mkdir(absDir, { recursive: true });
    await writeFile(absPath, buffer);

    // Return the API-served path
    const publicPath = `/api/uat/upload?file=${relPath}`;
    return NextResponse.json({ path: publicPath }, { status: 201 });
  } catch (err) {
    console.error("[UAT_UPLOAD]", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
