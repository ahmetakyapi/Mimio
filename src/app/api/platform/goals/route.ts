import { NextRequest, NextResponse } from "next/server";
import { createClientGoal, deleteClientGoal, getClientGoals, updateClientGoal } from "@/lib/server/platform-db";
import type { ClientGoalCreatePayload, ClientGoalUpdatePayload } from "@/lib/platform-data";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const clientId = searchParams.get("clientId");
  if (!clientId) return NextResponse.json({ error: "clientId gerekli" }, { status: 400 });
  const goals = await getClientGoals(clientId);
  return NextResponse.json({ goals });
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Geçersiz JSON" }, { status: 400 }); }
  const payload = body as Partial<ClientGoalCreatePayload>;
  if (!payload.clientId || !payload.title?.trim()) {
    return NextResponse.json({ error: "clientId ve title zorunludur" }, { status: 400 });
  }
  const goal = await createClientGoal(payload as ClientGoalCreatePayload);
  if (!goal) return NextResponse.json({ error: "Hedef kaydedilemedi" }, { status: 503 });
  return NextResponse.json({ goal }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Geçersiz JSON" }, { status: 400 }); }
  const payload = body as Partial<ClientGoalUpdatePayload>;
  if (!payload.goalId) return NextResponse.json({ error: "goalId gerekli" }, { status: 400 });
  const goal = await updateClientGoal(payload as ClientGoalUpdatePayload);
  if (!goal) return NextResponse.json({ error: "Hedef güncellenemedi" }, { status: 503 });
  return NextResponse.json({ goal });
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const goalId = searchParams.get("goalId");
  if (!goalId) return NextResponse.json({ error: "goalId gerekli" }, { status: 400 });
  await deleteClientGoal(goalId);
  return NextResponse.json({ ok: true });
}
