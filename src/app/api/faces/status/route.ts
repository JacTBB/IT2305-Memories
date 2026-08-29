import { NextResponse } from 'next/server';

import { auth } from '@/auth';
import { db, faces } from '@/schema';

export async function GET() {
  const session = await auth();
  if (session?.user?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const rows = await db.selectDistinct({ photoSrc: faces.photoSrc }).from(faces);

  return NextResponse.json({ indexed: rows.map((r) => r.photoSrc) });
}
