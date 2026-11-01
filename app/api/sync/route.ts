import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getChatGPTUser } from "../../chatgpt-auth";
import { getDb } from "../../../db";
import { plannerData } from "../../../db/schema";

export const dynamic = "force-dynamic";
export async function GET() {
  const user = await getChatGPTUser();
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const row = await getDb().select().from(plannerData).where(eq(plannerData.userId, user.userId)).get();
  return NextResponse.json({ data: row ? JSON.parse(row.payload) : null, revision: row?.revision ?? 0 });
}
export async function PUT(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const body = await request.json() as { data?: unknown; revision?: number };
  if (!body.data || JSON.stringify(body.data).length > 2_000_000) return NextResponse.json({ error: "Invalid planner data" }, { status: 400 });
  const revision = Math.max(1, Number(body.revision || 0) + 1);
  await getDb().insert(plannerData).values({ userId: user.userId, payload: JSON.stringify(body.data), revision, updatedAt: Date.now() }).onConflictDoUpdate({ target: plannerData.userId, set: { payload: JSON.stringify(body.data), revision, updatedAt: Date.now() } });
  return NextResponse.json({ ok: true, revision });
}
