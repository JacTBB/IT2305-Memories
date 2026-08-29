import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/auth';
import { db, faceRejections, faces } from '@/schema';

function parseId(idParam: string): number | null {
  const id = Number(idParam);
  return Number.isInteger(id) ? id : null;
}

// PATCH: admin — confirm or reject a single face's assignment to its current
// person. Body: { action: 'confirm' | 'reject' }
export async function PATCH(req: NextRequest, { params }: { params: { faceId: string } }) {
  const session = await auth();
  if (session?.user?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const faceId = parseId(params.faceId);
  if (faceId === null) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  const { action } = await req.json();
  if (action !== 'confirm' && action !== 'reject') {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }

  if (action === 'confirm') {
    await db.update(faces).set({ verified: true }).where(eq(faces.id, faceId));
    return NextResponse.json({ ok: true });
  }

  // reject: unassign from its current person, and remember the pair so
  // future clustering runs never propose it again.
  const [row] = await db
    .select({ personId: faces.personId })
    .from(faces)
    .where(eq(faces.id, faceId))
    .limit(1);

  if (row?.personId != null) {
    await db.insert(faceRejections).values({ faceId, personId: row.personId });
  }
  await db.update(faces).set({ personId: null, verified: false }).where(eq(faces.id, faceId));

  return NextResponse.json({ ok: true });
}
