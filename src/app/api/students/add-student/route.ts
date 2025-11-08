import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function POST(req: NextRequest) {
  try {
    const secret = process.env.INTERNAL_ADMIN_SECRET;
    const header = req.headers.get("x-internal-secret");

    const isDev = process.env.NODE_ENV !== "production";
    const allowWithoutSecret = isDev && !header;

    if (!allowWithoutSecret && (!secret || header !== secret)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      name,
      age,
      admissionDate,
      fatherName,
      motherName,
      contact,
      address,
      aadhaar,
      dateOfBirth,
      area,
    } = body || {};

    if (!name || !admissionDate || !area) {
      return NextResponse.json(
        { error: "Missing required fields: name, admissionDate, area" },
        { status: 400 }
      );
    }

    const newStudent = {
      name,
      age,
      admissionDate,
      fatherName,
      motherName,
      contact,
      address,
      aadhaar,
      dateOfBirth,
      area,
      createdAt: new Date(),
    };

    // ✅ Store globally
    const docRef = await adminDb.collection("students").add(newStudent);

    // ✅ Store inside area
    await adminDb.collection("areas").doc(area).collection("students").doc(docRef.id).set(newStudent);

    return NextResponse.json({
      ok: true,
      id: docRef.id,
      message: `Student "${name}" added to ${area} center.`,
    });
  } catch (error: any) {
    console.error("Error adding student:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export const GET = POST;
