import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/auth';
import { db, faces } from '@/schema';

interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

function isBox(v: unknown): v is Box {
  if (!v || typeof v !== 'object') return false;
  const b = v as Record<string, unknown>;
  return ['x', 'y', 'width', 'height'].every((k) => typeof b[k] === 'number');
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (session?.user?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const { photoSrc, faces: detected } = body ?? {};

  if (!photoSrc || typeof photoSrc !== 'string') {
    return NextResponse.json({ error: 'Missing photoSrc' }, { status: 400 });
  }
  if (!Array.isArray(detected)) {
    return NextResponse.json({ error: 'Missing faces' }, { status: 400 });
  }
  for (const f of detected) {
    if (!Array.isArray(f?.descriptor) || !f.descriptor.every((n: unknown) => typeof n === 'number')) {
      return NextResponse.json({ error: 'Invalid descriptor' }, { status: 400 });
    }
    if (!isBox(f?.box)) {
      return NextResponse.json({ error: 'Invalid box' }, { status: 400 });
    }
  }

  await db.delete(faces).where(eq(faces.photoSrc, photoSrc));

  if (detected.length > 0) {
    await db.insert(faces).values(
      detected.map((f) => ({
        photoSrc,
        descriptor: f.descriptor,
        box: f.box,
      })),
    );
  }

  return NextResponse.json({ ok: true, count: detected.length });
}
