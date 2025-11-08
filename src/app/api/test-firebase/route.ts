import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-client";
import { collection, getDocs } from "firebase/firestore";

export async function GET() {
  try {
    const snap = await getDocs(collection(db, "students"));
    return NextResponse.json({ ok: true, count: snap.size });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message });
  }
}
