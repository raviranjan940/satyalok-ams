import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function GET() {
  try {
    const docRef = await adminDb.collection("ping-test").add({
      ok: true,
      time: new Date().toISOString(),
    });
    return NextResponse.json({ success: true, id: docRef.id });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Unexpected server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
