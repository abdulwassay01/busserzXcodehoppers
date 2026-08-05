import { NextResponse } from "next/server";
import { deleteJsonStore, readJsonStore, writeJsonStore } from "@/lib/json-store";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get("key");

  if (!key) {
    return NextResponse.json({ error: "Missing key" }, { status: 400 });
  }

  const data = await readJsonStore(key, null);
  return NextResponse.json({ key, data });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const key = body?.key;
  const data = body?.data;

  if (!key || data === undefined) {
    return NextResponse.json({ error: "Missing key or data" }, { status: 400 });
  }

  await writeJsonStore(`${key}.json`, data);
  return NextResponse.json({ ok: true, key, storedAt: new Date().toISOString() });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get("key");

  if (!key) {
    return NextResponse.json({ error: "Missing key" }, { status: 400 });
  }

  await deleteJsonStore(`${key}.json`);
  return NextResponse.json({ ok: true, key });
}
