import { NextResponse } from "next/server";
import { getPlatformOverviewFromDatabase } from "@/lib/server/platform-db";

export const dynamic = "force-dynamic";

export async function GET() {
  const overview = await getPlatformOverviewFromDatabase();
  return NextResponse.json(overview);
}
