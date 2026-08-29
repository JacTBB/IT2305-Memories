import { eq, isNull, isNotNull } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { auth } from '@/auth';
import { assignFaces } from '@/lib/faces/cluster';
import { db, faces, people } from '@/schema';

export async function POST() {
  const session = await auth();
  if (session?.user?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const unclusteredRows = await db
    .select({ id: faces.id, descriptor: faces.descriptor })
    .from(faces)
    .where(isNull(faces.personId));

  const clusteredRows = await db
    .select({ personId: faces.personId, descriptor: faces.descriptor })
    .from(faces)
    .where(isNotNull(faces.personId));

  const existingGroups = new Map<number, number[][]>();
  for (const row of clusteredRows) {
    if (row.personId === null) continue;
    if (!existingGroups.has(row.personId)) existingGroups.set(row.personId, []);
    existingGroups.get(row.personId)!.push(row.descriptor as number[]);
  }

  const { existingAssignments, newGroups } = assignFaces(
    unclusteredRows.map((r) => ({ id: r.id, descriptor: r.descriptor as number[] })),
    Array.from(existingGroups.entries()).map(([personId, descriptors]) => ({
      personId,
      descriptors,
    })),
  );

  for (const { faceId, personId } of existingAssignments) {
    await db.update(faces).set({ personId }).where(eq(faces.id, faceId));
  }

  for (const group of newGroups) {
    const [newPerson] = await db.insert(people).values({}).returning({ id: people.id });
    for (const face of group) {
      await db.update(faces).set({ personId: newPerson.id }).where(eq(faces.id, face.id));
    }
  }

  return NextResponse.json({
    assignedToExisting: existingAssignments.length,
    newPeople: newGroups.length,
  });
}

// DELETE: admin — wipe all clustering (every person, faces fall back to
// unclustered) so "Cluster faces" can be re-run from scratch, e.g. after a
// clustering-quality fix. Detected faces/descriptors are untouched.
export async function DELETE() {
  const session = await auth();
  if (session?.user?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await db.delete(people);
  return NextResponse.json({ ok: true });
}
