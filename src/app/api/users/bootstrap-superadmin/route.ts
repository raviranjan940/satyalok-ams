import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

export async function POST() {
  const emails = (process.env.SUPERADMINS || '')
    .split(',')
    .map((e) => e.trim())
    .filter(Boolean);

  const results: any[] = [];

  for (const email of emails) {
    let user = null;
    try {
      user = await adminAuth.getUserByEmail(email);
    } catch {}

    if (!user) {
      user = await adminAuth.createUser({
        email,
        emailVerified: true,
        password: Math.random().toString(36).slice(2, 10),
      });
    }

    await adminAuth.setCustomUserClaims(user.uid, { role: 'superadmin' });
    await adminDb.collection('users').doc(user.uid).set(
      {
        email,
        role: 'superadmin',
        displayName: 'Super Admin',
        active: true,
        createdAt: new Date(),
      },
      { merge: true }
    );

    results.push({ email, uid: user.uid });
  }

  return NextResponse.json({ ok: true, results });
}

export const GET = POST; // 👈 add this temporarily so you can open it in browser
