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

    const body = await req.json();

    const {
      email,
      password,
      displayName,
      phone,
      gender,
      joinDate,
      area,
    } = body || {};

    if (!email || !displayName || !password || !area) {
      return NextResponse.json(
        { error: "Missing required fields: email, displayName, password, area" },
        { status: 400 }
      );
    }

    // ✅ Create Firebase Auth user
    let user;
    try {
      user = await adminAuth.getUserByEmail(email);
    } catch {
      user = await adminAuth.createUser({
        email,
        password,
        displayName,
      });
    }

    // ✅ Assign custom role
    await adminAuth.setCustomUserClaims(user.uid, { role: "teacher", area });

    const teacherData = {
      uid: user.uid,
      email,
      displayName,
      phone: phone || "",
      gender: gender || "",
      joinDate: joinDate || "",
      area,
      password, // ⚠️ stored for admin view only
      role: "teacher",
      active: true,
      createdAt: new Date(),
    };

    // ✅ Global record
    await adminDb.collection("users").doc(user.uid).set(teacherData, { merge: true });

    // ✅ Area-specific record
    await adminDb
      .collection("areas")
      .doc(area)
      .collection("users")
      .doc(user.uid)
      .set(teacherData, { merge: true });

    return NextResponse.json({
      ok: true,
      uid: user.uid,
      message: `Teacher ${displayName} created successfully in ${area} center.`,
    });
  } catch (error: any) {
    console.error("Error creating teacher:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export const GET = POST;
