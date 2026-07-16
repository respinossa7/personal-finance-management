import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { DEMO_SESSION_COOKIE, DEMO_USER_ID } from "@/lib/demo/constants";

export async function POST() {
  const store = await cookies();
  store.set(DEMO_SESSION_COOKIE, DEMO_USER_ID, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  const store = await cookies();
  store.delete(DEMO_SESSION_COOKIE);
  return NextResponse.json({ ok: true });
}
