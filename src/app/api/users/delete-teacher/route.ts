import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

export async function POST(req: NextRequest) {
  try {
    const secret = process.env.INTERNAL_ADMIN_SECRET;
    const header = req.headers.get("x-internal-secret");

    const isDev = process.env.NODE_ENV !== "production";
    const allowWithoutSecret = isDev && !header;

    if (!allowWithoutSecret && (!secret || header !== secret)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { uid, area } = await req.json();
    if (!uid) return NextResponse.json({ error: "Missing UID" }, { status: 400 });

    // 🔥 Delete from Auth
    try {
      await adminAuth.deleteUser(uid);
    } catch (err) {
      console.warn("User not found in Auth or already deleted:", err);
    }

    // 🗑 Delete from Firestore
    await adminDb.collection("users").doc(uid).delete();
    if (area) {
      await adminDb.collection("areas").doc(area).collection("users").doc(uid).delete();
    }

    return NextResponse.json({ ok: true, message: "Teacher deleted successfully." });
  } catch (error: any) {
    console.error("Error deleting teacher:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
