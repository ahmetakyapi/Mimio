import { NextRequest, NextResponse } from "next/server";
import { getWeeklyPlan, getWeeklyPlansForWeek, saveWeeklyPlan } from "@/lib/server/platform-db";
import { getSessionTherapistId } from "@/lib/server/session";
import type { WeeklyPlan } from "@/lib/platform-data";

const UNAUTHORIZED = { error: "Bu işlem için oturum açmanız gerekiyor." };

export async function GET(req: NextRequest) {
  if (!(await getSessionTherapistId())) return NextResponse.json(UNAUTHORIZED, { status: 401 });
  const { searchParams } = new URL(req.url);
  const clientId = searchParams.get("clientId");
  const weekStartDate = searchParams.get("weekStartDate");
  if (!weekStartDate) {
    return NextResponse.json({ error: "weekStartDate gerekli" }, { status: 400 });
  }
  /* clientId verilmezse haftanın tüm planları döner — kabuk, hafta
     ızgarasını ve "sıradaki seans" sütununu bununla dolduruyor. */
  if (!clientId) {
    const plans = await getWeeklyPlansForWeek(weekStartDate);
    return NextResponse.json({ plans });
  }
  const plan = await getWeeklyPlan(clientId, weekStartDate);
  return NextResponse.json({ plan });
}

export async function POST(req: NextRequest) {
  if (!(await getSessionTherapistId())) return NextResponse.json(UNAUTHORIZED, { status: 401 });
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
