// face-api.js's docs cite 0.6 as the "same person" cutoff, but that's
// calibrated on well-lit, front-facing benchmark photos. Measured against
// this library's actual data (candid group shots, webp compression, a
// less-precise TinyFaceDetector crop/alignment), nearly every cluster
// — right and wrong alike — had its farthest pairwise distance sitting
// right at ~0.58-0.60, which means 0.6 wasn't discriminating anything; it
// was just the ceiling complete-linkage clustering walks up to. Tightened
// to 0.45, which is well above where confirmed-good clusters sat (~0.26-0.48)
// and should reject most of the false merges. Re-run "Reset clustering" +
// "Cluster faces" after changing this to rebuild existing groups with it.
export const SAME_PERSON_THRESHOLD = 0.45;

export function euclideanDistance(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const d = a[i] - b[i];
    sum += d * d;
  }
  return Math.sqrt(sum);
}

// Distance to the *farthest* member of the group, not the nearest or the
// mean. A face only joins if it's close to every existing member — this is
// "complete-linkage" clustering. Plain nearest-neighbor (single-linkage) or a
// running centroid both let a cluster "walk" across the descriptor space one
// small step at a time, eventually chaining together unrelated people; this
// won't, at the cost of occasionally splitting one real person into a couple
// of clusters when their photos vary a lot (fixable with the merge tool).
function maxDistanceToGroup(descriptor: number[], group: number[][]): number {
  let max = 0;
  for (const member of group) {
    const dist = euclideanDistance(descriptor, member);
    if (dist > max) max = dist;
  }
  return max;
}

interface FaceRow {
  id: number;
  descriptor: number[];
}

interface PersonGroup {
  personId: number;
  descriptors: number[][];
}

// `rejectedPairs` holds `${faceId}:${personId}` strings for admin-rejected
// matches — clustering must never re-propose one of those exact pairs, even
// if the descriptors would otherwise be close enough.
export function assignFaces(
  unclustered: FaceRow[],
  existingPeople: PersonGroup[],
  rejectedPairs: Set<string> = new Set(),
): { existingAssignments: { faceId: number; personId: number }[]; newGroups: FaceRow[][] } {
  const groups = existingPeople.map((p) => ({
    personId: p.personId,
    descriptors: [...p.descriptors],
  }));

  const existingAssignments: { faceId: number; personId: number }[] = [];
  const newGroups: { descriptors: number[][]; faces: FaceRow[] }[] = [];

  for (const face of unclustered) {
    let best: { group: (typeof groups)[number]; dist: number } | null = null;
    for (const group of groups) {
      if (rejectedPairs.has(`${face.id}:${group.personId}`)) continue;
      const dist = maxDistanceToGroup(face.descriptor, group.descriptors);
      if (dist < SAME_PERSON_THRESHOLD && (!best || dist < best.dist)) {
        best = { group, dist };
      }
    }

    if (best) {
      existingAssignments.push({ faceId: face.id, personId: best.group.personId });
      best.group.descriptors.push(face.descriptor);
      continue;
    }

    let joinedNewGroup = false;
    for (const newGroup of newGroups) {
      if (maxDistanceToGroup(face.descriptor, newGroup.descriptors) < SAME_PERSON_THRESHOLD) {
        newGroup.descriptors.push(face.descriptor);
        newGroup.faces.push(face);
        joinedNewGroup = true;
        break;
      }
    }
    if (!joinedNewGroup) newGroups.push({ descriptors: [face.descriptor], faces: [face] });
  }

  return { existingAssignments, newGroups: newGroups.map((g) => g.faces) };
}
