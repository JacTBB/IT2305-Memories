'use client';

import { useCallback, useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FaceChip } from '@/components/face-chip';
import { detectFaces, loadFaceModels, loadImage } from '@/lib/faces/faceapi';
import { slides } from '@/lib/slides';

interface Person {
  id: number;
  name: string | null;
  photoCount: number;
  thumbnail: { photoSrc: string; box: { x: number; y: number; width: number; height: number } } | null;
}

const imageSlides = slides.filter((s) => s.type === 'image');

export function FacesIndexer() {
  const [indexing, setIndexing] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [status, setStatus] = useState('');
  const [clustering, setClustering] = useState(false);
  const [people, setPeople] = useState<Person[]>([]);
  const [unassignedFaces, setUnassignedFaces] = useState(0);
  const [names, setNames] = useState<Record<number, string>>({});
  const [mergeTarget, setMergeTarget] = useState<Record<number, string>>({});

  const refreshPeople = useCallback(async () => {
    const res = await fetch('/api/faces/people?all=1');
    const data = await res.json();
    setPeople(data.people ?? []);
    setUnassignedFaces(data.unassignedFaces ?? 0);
    setNames(Object.fromEntries((data.people ?? []).map((p: Person) => [p.id, p.name ?? ''])));
  }, []);

  useEffect(() => {
    refreshPeople();
  }, [refreshPeople]);

  const runIndexing = async () => {
    setIndexing(true);
    setStatus('Loading face detection models...');
    try {
      await loadFaceModels();

      const statusRes = await fetch('/api/faces/status');
      const { indexed }: { indexed: string[] } = await statusRes.json();
      const indexedSet = new Set(indexed);
      const toProcess = imageSlides.filter((s) => !indexedSet.has(s.src));

      setProgress({ done: 0, total: toProcess.length });
      setStatus(`Indexing ${toProcess.length} photos...`);

      for (let i = 0; i < toProcess.length; i++) {
        const slide = toProcess[i];
        try {
          const img = await loadImage(slide.src);
          const detected = await detectFaces(img);
          await fetch('/api/faces/index', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ photoSrc: slide.src, faces: detected }),
          });
        } catch (err) {
          console.error(`Failed to index ${slide.src}`, err);
        }
        setProgress({ done: i + 1, total: toProcess.length });
      }

      setStatus('Indexing complete.');
    } finally {
      setIndexing(false);
    }
  };

  const runClustering = async () => {
    setClustering(true);
    try {
      const res = await fetch('/api/faces/cluster', { method: 'POST' });
      const data = await res.json();
      setStatus(`Clustered: ${data.assignedToExisting} faces matched existing people, ${data.newPeople} new people found.`);
      await refreshPeople();
    } finally {
      setClustering(false);
    }
  };

  const resetClustering = async () => {
    if (!confirm('This unassigns every face from every person so you can re-cluster from scratch. Names you set will be lost. Continue?')) return;
    setClustering(true);
    try {
      await fetch('/api/faces/cluster', { method: 'DELETE' });
      setStatus('Clustering reset. Click "Cluster faces" to regroup.');
      await refreshPeople();
    } finally {
      setClustering(false);
    }
  };

  const rename = async (id: number) => {
    const name = names[id]?.trim();
    if (!name) return;
    await fetch(`/api/faces/people/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    await refreshPeople();
  };

  const mergePerson = async (id: number) => {
    const intoId = Number(mergeTarget[id]);
    if (!intoId) return;
    await fetch(`/api/faces/people/${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ intoId }),
    });
    await refreshPeople();
  };

  const deletePerson = async (id: number) => {
    await fetch(`/api/faces/people/${id}`, { method: 'DELETE' });
    await refreshPeople();
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 space-y-8">
      <h1 className="text-2xl font-semibold">People / Face Indexing</h1>

      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={runIndexing} disabled={indexing}>
          {indexing ? 'Indexing...' : 'Index photos'}
        </Button>
        <Button onClick={runClustering} disabled={clustering} variant="secondary">
          {clustering ? 'Clustering...' : 'Cluster faces'}
        </Button>
        <Button onClick={resetClustering} disabled={clustering} variant="outline">
          Reset clustering
        </Button>
        {indexing && (
          <span className="text-sm text-muted-foreground">
            {progress.done} / {progress.total}
          </span>
        )}
      </div>

      {status && <p className="text-sm text-muted-foreground">{status}</p>}
      <p className="text-sm text-muted-foreground">
        {unassignedFaces} unclustered face{unassignedFaces === 1 ? '' : 's'} waiting to be grouped.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
        {people.map((p) => (
          <div key={p.id} className="flex flex-col items-center gap-2 border rounded-lg p-4">
            {p.thumbnail && <FaceChip photoSrc={p.thumbnail.photoSrc} box={p.thumbnail.box} size={80} />}
            <p className="text-xs text-muted-foreground">{p.photoCount} photos</p>
            <Input
              value={names[p.id] ?? ''}
              onChange={(e) => setNames((n) => ({ ...n, [p.id]: e.target.value }))}
              placeholder="Name"
              className="text-center"
            />
            <Button size="sm" onClick={() => rename(p.id)}>
              Save name
            </Button>

            <select
              className="text-xs border rounded px-1 py-1 bg-background w-full"
              value={mergeTarget[p.id] ?? ''}
              onChange={(e) => setMergeTarget((m) => ({ ...m, [p.id]: e.target.value }))}
            >
              <option value="">Merge into...</option>
              {people
                .filter((other) => other.id !== p.id)
                .map((other) => (
                  <option key={other.id} value={other.id}>
                    {other.name || `Person #${other.id}`}
                  </option>
                ))}
            </select>
            <Button size="sm" variant="secondary" onClick={() => mergePerson(p.id)}>
              Merge
            </Button>

            <Button size="sm" variant="destructive" onClick={() => deletePerson(p.id)}>
              Delete
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
