import { NextRequest, NextResponse } from "next/server";
import { getWeeklyPlan, saveWeeklyPlan } from "@/lib/server/platform-db";
import type { WeeklyPlan } from "@/lib/platform-data";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const clientId = searchParams.get("clientId");
  const weekStartDate = searchParams.get("weekStartDate");
  if (!clientId || !weekStartDate) {
    return NextResponse.json({ error: "clientId ve weekStartDate gerekli" }, { status: 400 });
  }
  const plan = await getWeeklyPlan(clientId, weekStartDate);
  return NextResponse.json({ plan });
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Geçersiz JSON" }, { status: 400 }); }
  const { clientId, therapistId, weekStartDate, days } = body as {
    clientId?: string; therapistId?: string; weekStartDate?: string; days?: WeeklyPlan["days"];
  };
  if (!clientId || !weekStartDate || !days) {
    return NextResponse.json({ error: "clientId, weekStartDate ve days zorunludur" }, { status: 400 });
  }
  const plan = await saveWeeklyPlan({ clientId, therapistId, weekStartDate, days });
  if (!plan) return NextResponse.json({ error: "Plan kaydedilemedi" }, { status: 503 });
  return NextResponse.json({ plan }, { status: 201 });
}
