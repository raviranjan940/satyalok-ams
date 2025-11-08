import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { date, records, area } = body || {};

    if (!date || !records || !area) {
      return NextResponse.json({ error: "Missing date, records, or area" }, { status: 400 });
    }

    // ✅ Save to area attendance collection
    const attendanceRef = adminDb.collection("areas").doc(area).collection("attendance").doc(date);
    await attendanceRef.set({ records, date, area, createdAt: new Date() });

    // ✅ Also save globally
    await adminDb.collection("attendance").doc(`${area}_${date}`).set({ records, date, area });

    return NextResponse.json({
      ok: true,
      message: `Attendance saved for ${area} on ${date}.`,
    });
  } catch (error: any) {
    console.error("Error saving attendance:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
