import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const logLine = `[${new Date().toISOString()}] FRONTEND ERROR: ${JSON.stringify(data)}\n`;
    fs.appendFileSync(path.join(process.cwd(), "frontend_errors.log"), logLine);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: "Failed to log" }, { status: 500 });
  }
}
