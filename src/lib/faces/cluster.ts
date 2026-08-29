export const SAME_PERSON_THRESHOLD = 0.6;

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

export function assignFaces(
  unclustered: FaceRow[],
  existingPeople: PersonGroup[],
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
