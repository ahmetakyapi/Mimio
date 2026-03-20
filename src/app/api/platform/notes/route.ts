import { NextRequest, NextResponse } from "next/server";
import { createClientNote, deleteClientNote, getClientNotes } from "@/lib/server/platform-db";
import type { NoteMode, SoapNoteContent } from "@/lib/platform-data";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const clientId = searchParams.get("clientId");
  if (!clientId) return NextResponse.json({ error: "clientId gerekli" }, { status: 400 });
  const notes = await getClientNotes(clientId);
  return NextResponse.json({ notes });
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Geçersiz JSON" }, { status: 400 }); }
  const { clientId, therapistId, date, content, noteMode, soapContent } = body as {
    clientId?: string; therapistId?: string; date?: string; content?: string;
    noteMode?: NoteMode; soapContent?: SoapNoteContent;
  };
  if (!clientId || !date || !content?.trim()) {
    return NextResponse.json({ error: "clientId, date ve content zorunludur" }, { status: 400 });
  }
  const note = await createClientNote({ clientId, therapistId, date, content: content.trim(), noteMode, soapContent });
  if (!note) return NextResponse.json({ error: "Not kaydedilemedi" }, { status: 503 });
  return NextResponse.json({ note }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const noteId = searchParams.get("noteId");
  if (!noteId) return NextResponse.json({ error: "noteId gerekli" }, { status: 400 });
  await deleteClientNote(noteId);
  return NextResponse.json({ ok: true });
}
