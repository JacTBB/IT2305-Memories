import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/auth';
import { db, faces } from '@/schema';

function parseId(idParam: string): number | null {
  const id = Number(idParam);
  return Number.isInteger(id) ? id : null;
}

// GET: admin — every individual face row assigned to a person, for the
// review UI (confirm/reject per photo).
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (session?.user?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const id = parseId(params.id);
  if (id === null) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  const rows = await db
    .select({ id: faces.id, photoSrc: faces.photoSrc, box: faces.box, verified: faces.verified })
    .from(faces)
    .where(eq(faces.personId, id))
    .orderBy(faces.verified, faces.id);

  return NextResponse.json({ faces: rows });
}
