import { NextResponse } from "next/server";
import { stations } from "@/src/lib/data";

export function GET() {
  return NextResponse.json({ mode: "preview", stations });
}
