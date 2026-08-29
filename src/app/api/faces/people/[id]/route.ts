import { and, eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/auth';
import { db, faces, people } from '@/schema';

function parseId(idParam: string): number | null {
  const id = Number(idParam);
  return Number.isInteger(id) ? id : null;
}

// GET: public — distinct photos this person appears in.
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const id = parseId(params.id);
  if (id === null) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  const rows = await db
    .selectDistinct({ photoSrc: faces.photoSrc })
    .from(faces)
    .where(eq(faces.personId, id));

  return NextResponse.json({ photoSrcs: rows.map((r) => r.photoSrc) });
}

// PATCH: admin — rename and/or set the cover photo.
// Body: { name?: string, coverFaceId?: number }
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (session?.user?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const id = parseId(params.id);
  if (id === null) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  const body = await req.json();
  const updates: { name?: string; coverFaceId?: number } = {};

  if (body.name !== undefined) {
    if (typeof body.name !== 'string' || body.name.trim().length === 0) {
      return NextResponse.json({ error: 'Invalid name' }, { status: 400 });
    }
    updates.name = body.name.trim();
  }

  if (body.coverFaceId !== undefined) {
    if (typeof body.coverFaceId !== 'number') {
      return NextResponse.json({ error: 'Invalid coverFaceId' }, { status: 400 });
    }
    const [face] = await db
      .select({ id: faces.id })
      .from(faces)
      .where(and(eq(faces.id, body.coverFaceId), eq(faces.personId, id)))
      .limit(1);
    if (!face) {
      return NextResponse.json({ error: 'That photo does not belong to this person' }, { status: 400 });
    }
    updates.coverFaceId = body.coverFaceId;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  }

  await db.update(people).set(updates).where(eq(people.id, id));
  return NextResponse.json({ ok: true });
}

// POST: admin — merge this person's faces into another person. Body: { intoId: number }
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (session?.user?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const id = parseId(params.id);
  if (id === null) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  const { intoId } = await req.json();
  if (typeof intoId !== 'number' || intoId === id) {
    return NextResponse.json({ error: 'Invalid intoId' }, { status: 400 });
  }

  await db.update(faces).set({ personId: intoId }).where(eq(faces.personId, id));
  await db.delete(people).where(eq(people.id, id));

  return NextResponse.json({ ok: true });
}

// DELETE: admin — unassign this person's faces (back to unclustered) and remove the person.
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (session?.user?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const id = parseId(params.id);
  if (id === null) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  await db.delete(people).where(eq(people.id, id));
  return NextResponse.json({ ok: true });
}
