import { eq, isNotNull, isNull } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/auth';
import { db, faces, people } from '@/schema';

// GET: public — named people only, for the visitor-facing filter.
// GET ?all=1: admin — every person (named or not), for the review UI.
export async function GET(req: NextRequest) {
  const wantsAll = req.nextUrl.searchParams.get('all') === '1';

  if (wantsAll) {
    const session = await auth();
    if (session?.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  const allPeople = await db.select().from(people);
  const allFaces = await db
    .select({ id: faces.id, photoSrc: faces.photoSrc, personId: faces.personId, box: faces.box })
    .from(faces)
    .where(isNotNull(faces.personId));

  const facesByPerson = new Map<number, typeof allFaces>();
  for (const face of allFaces) {
    if (face.personId === null) continue;
    if (!facesByPerson.has(face.personId)) facesByPerson.set(face.personId, []);
    facesByPerson.get(face.personId)!.push(face);
  }

  const unassignedCount = await db
    .select({ id: faces.id })
    .from(faces)
    .where(isNull(faces.personId))
    .then((rows) => rows.length);

  const result = allPeople
    .filter((p) => wantsAll || p.name)
    .map((p) => {
      const personFaces = facesByPerson.get(p.id) ?? [];
      const uniquePhotos = new Set(personFaces.map((f) => f.photoSrc));
      return {
        id: p.id,
        name: p.name,
        photoCount: uniquePhotos.size,
        thumbnail: personFaces[0] ? { photoSrc: personFaces[0].photoSrc, box: personFaces[0].box } : null,
      };
    })
    .filter((p) => p.thumbnail !== null);

  return NextResponse.json(wantsAll ? { people: result, unassignedFaces: unassignedCount } : result);
}
