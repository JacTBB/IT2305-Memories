'use client';

import { ChevronLeft, Frame, Grid3x3, MapPin, Play } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { FaceChip } from '@/components/face-chip';
import { Reactions } from '@/components/reactions';
import { Lightbox } from '@/components/ui/lightbox';
import { slides, type Slide } from '@/lib/slides';

interface PersonSummary {
  id: number;
  name: string | null;
  photoCount: number;
  thumbnail: { photoSrc: string; box: { x: number; y: number; width: number; height: number } } | null;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function parseDateKey(src: string): string | null {
  const filename = decodeURIComponent(src.split('/').pop() ?? '');
  const match = filename.match(/^(\d{2})-(\d{2})-(\d{2})/);
  if (!match) return null;
  return `20${match[1]}-${match[2]}-${match[3]}`;
}

function formatDateKey(key: string): string {
  const [year, month, day] = key.split('-');
  return `${parseInt(day)} ${MONTHS[parseInt(month) - 1]} ${year}`;
}

function filterSummaryLabel(locationFilter: string | null, personName?: string): string {
  return [locationFilter, personName].filter(Boolean).join(', ');
}

function emptyStateMessage(locationFilter: string | null, personName?: string): string {
  const parts = [
    locationFilter && `from ${locationFilter}`,
    personName && `of ${personName}`,
  ].filter(Boolean);
  return parts.length ? `No photos ${parts.join(' ')}.` : 'No photos yet.';
}

function polaroidTransform(src: string): string {
  let r = 0, o = 5381;
  for (let i = 0; i < src.length; i++) {
    r = (r * 31 + src.charCodeAt(i)) | 0;
    o = (o * 33 ^ src.charCodeAt(i)) | 0;
  }
  const rot = (Math.abs(r) % 13) - 6;      // -6 to +6 deg
  const yOff = (Math.abs(o) % 18) - 9;     // -9 to +8 px
  return `rotate(${rot}deg) translateY(${yOff}px)`;
}

// Build ordered groups: only dated photos, sorted by date then by original order
const datedSlides = slides.filter((s) => parseDateKey(s.src) !== null);

// Only a subset of photos carry EXIF GPS (mostly the dated .jpg originals —
// plain .webp uploads and videos don't), so this group is necessarily partial.
const locatedSlides = slides.filter((s) => s.location);

const groupedByLocation: Record<string, Slide[]> = {};
const locationOrder: string[] = [];
for (const slide of locatedSlides) {
  const loc = slide.location!;
  if (!groupedByLocation[loc]) {
    groupedByLocation[loc] = [];
    locationOrder.push(loc);
  }
  groupedByLocation[loc].push(slide);
}

export default function TimelinePage() {
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const [allCounts, setAllCounts] = useState<Record<string, Record<string, number>> | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'polaroid' | 'location'>('polaroid');
  const [hoveredPolaroid, setHoveredPolaroid] = useState<number | null>(null);
  const [locationFilter, setLocationFilter] = useState<string | null>(null);
  const [people, setPeople] = useState<PersonSummary[]>([]);
  const [personFilter, setPersonFilter] = useState<number | null>(null);
  const [personPhotoSrcs, setPersonPhotoSrcs] = useState<Set<string> | null>(null);

  useEffect(() => {
    fetch('/api/reactions/all')
      .then((r) => r.json())
      .then((data) => setAllCounts(data))
      .catch(() => setAllCounts({}));
  }, []);

  useEffect(() => {
    fetch('/api/faces/people')
      .then((r) => r.json())
      .then((data) => setPeople(Array.isArray(data) ? data : []))
      .catch(() => setPeople([]));
  }, []);

  useEffect(() => {
    if (personFilter === null) {
      setPersonPhotoSrcs(null);
      return;
    }
    fetch(`/api/faces/people/${personFilter}`)
      .then((r) => r.json())
      .then((data) => setPersonPhotoSrcs(new Set<string>(data.photoSrcs ?? [])))
      .catch(() => setPersonPhotoSrcs(new Set()));
  }, [personFilter]);

  // Dated slides, narrowed to the selected location and/or person (if any).
  // Feeds the polaroid and grid views.
  const { grouped, sortedDates, allDatedSlides } = useMemo(() => {
    const filtered = datedSlides
      .filter((s) => !locationFilter || s.location === locationFilter)
      .filter((s) => !personPhotoSrcs || personPhotoSrcs.has(s.src));

    const grouped: Record<string, Slide[]> = {};
    for (const slide of filtered) {
      const key = parseDateKey(slide.src)!;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(slide);
    }
    const sortedDates = Object.keys(grouped).sort();
    const allDatedSlides = sortedDates.flatMap((d) => grouped[d]);

    return { grouped, sortedDates, allDatedSlides };
  }, [locationFilter, personPhotoSrcs]);

  // Locations to render in the location view, narrowed to the selection.
  const filteredLocationOrder = locationFilter ? [locationFilter] : locationOrder;
  const allLocatedSlides = filteredLocationOrder
    .flatMap((l) => groupedByLocation[l])
    .filter((s) => !personPhotoSrcs || personPhotoSrcs.has(s.src));

  const onPrev = useCallback(() => {
    setLightboxIdx((i) => i === null ? null : (i - 1 + allDatedSlides.length) % allDatedSlides.length);
  }, [allDatedSlides.length]);

  const onNext = useCallback(() => {
    setLightboxIdx((i) => i === null ? null : (i + 1) % allDatedSlides.length);
  }, [allDatedSlides.length]);

  const onLocPrev = useCallback(() => {
    setLightboxIdx((i) => i === null ? null : (i - 1 + allLocatedSlides.length) % allLocatedSlides.length);
  }, [allLocatedSlides.length]);

  const onLocNext = useCallback(() => {
    setLightboxIdx((i) => i === null ? null : (i + 1) % allLocatedSlides.length);
  }, [allLocatedSlides.length]);

  const selectedPersonName = personFilter !== null
    ? (people.find((p) => p.id === personFilter)?.name ?? undefined)
    : undefined;

  let globalIdx = 0;

  return (
    <main className="bg-black min-h-screen text-white">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-black/80 backdrop-blur-md border-b border-white/10 px-6 py-4 flex items-center gap-4">
        <Link href="/" className="text-white/60 hover:text-white transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-lg font-semibold tracking-tight">Timeline</h1>
          <p className="text-xs text-white/40">
            {filterSummaryLabel(locationFilter, selectedPersonName)
              ? `${(viewMode === 'location' ? allLocatedSlides : allDatedSlides).length} photos — ${filterSummaryLabel(locationFilter, selectedPersonName)}`
              : viewMode === 'location'
                ? `${locatedSlides.length} photos across ${locationOrder.length} places`
                : `${datedSlides.length} photos across ${sortedDates.length} days`}
          </p>
        </div>
        <div className="flex gap-1 bg-white/5 rounded-lg p-1">
          <button
            onClick={() => setViewMode('polaroid')}
            title="Scrapbook view"
            className={`p-1.5 rounded-md transition-all ${viewMode === 'polaroid' ? 'bg-white/20 text-white' : 'text-white/40 hover:text-white/70'}`}
          >
            <Frame className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('grid')}
            title="Grid view"
            className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white/20 text-white' : 'text-white/40 hover:text-white/70'}`}
          >
            <Grid3x3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('location')}
            title="Location view"
            className={`p-1.5 rounded-md transition-all ${viewMode === 'location' ? 'bg-white/20 text-white' : 'text-white/40 hover:text-white/70'}`}
          >
            <MapPin className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Location filter */}
      {locationOrder.length > 0 && (
        <div className="border-b border-white/10 px-6 py-3 overflow-x-auto">
          <div className="flex gap-2 w-max">
            <button
              onClick={() => setLocationFilter(null)}
              className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all border ${
                locationFilter === null
                  ? 'bg-white/20 text-white border-white/30'
                  : 'bg-white/5 text-white/50 border-white/10 hover:text-white/80'
              }`}
            >
              All places
            </button>
            {locationOrder.map((loc) => (
              <button
                key={loc}
                onClick={() => setLocationFilter(loc)}
                className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all border flex items-center gap-1 ${
                  locationFilter === loc
                    ? 'bg-white/20 text-white border-white/30'
                    : 'bg-white/5 text-white/50 border-white/10 hover:text-white/80'
                }`}
              >
                <MapPin className="w-3 h-3" />
                {loc}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* People filter */}
      {people.length > 0 && (
        <div className="border-b border-white/10 px-6 py-3 overflow-x-auto">
          <div className="flex gap-3 w-max items-center">
            <button
              onClick={() => setPersonFilter(null)}
              className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all border ${
                personFilter === null
                  ? 'bg-white/20 text-white border-white/30'
                  : 'bg-white/5 text-white/50 border-white/10 hover:text-white/80'
              }`}
            >
              Everyone
            </button>
            {people.map((p) => (
              <button
                key={p.id}
                onClick={() => setPersonFilter(p.id)}
                title={p.name ?? undefined}
                className={`flex flex-col items-center gap-1 transition-opacity ${
                  personFilter === p.id ? 'opacity-100' : 'opacity-60 hover:opacity-90'
                }`}
              >
                {p.thumbnail && (
                  <FaceChip
                    photoSrc={p.thumbnail.photoSrc}
                    box={p.thumbnail.box}
                    size={44}
                    className={personFilter === p.id ? 'ring-2 ring-white' : ''}
                  />
                )}
                <span className="text-[10px] text-white/70 max-w-[56px] truncate">{p.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Polaroid / scrapbook view */}
      {viewMode === 'polaroid' && (
        <div className="max-w-6xl mx-auto px-8 py-16">
          {allDatedSlides.length === 0 && (
            <p className="text-center text-white/40 text-sm py-20">
              {emptyStateMessage(locationFilter, selectedPersonName)}
            </p>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-8 sm:gap-12">
            {allDatedSlides.map(({ src, type }, idx) => {
              const dateKey = parseDateKey(src);
              const isHovered = hoveredPolaroid === idx;
              return (
                <div
                  key={src}
                  className="cursor-pointer"
                  style={{
                    transform: polaroidTransform(src),
                    zIndex: isHovered ? 20 : 1,
                    position: 'relative',
                    transition: 'z-index 0s',
                  }}
                  onMouseEnter={() => setHoveredPolaroid(idx)}
                  onMouseLeave={() => setHoveredPolaroid(null)}
                  onClick={() => setLightboxIdx(idx)}
                >
                  <div
                    className="bg-white transition-all duration-200"
                    style={{
                      padding: '10px 10px 40px 10px',
                      boxShadow: isHovered
                        ? '6px 8px 32px rgba(0,0,0,0.8), 0 2px 6px rgba(0,0,0,0.4)'
                        : '3px 4px 18px rgba(0,0,0,0.55), 0 1px 3px rgba(0,0,0,0.3)',
                      transform: isHovered ? 'scale(1.08)' : 'scale(1)',
                    }}
                  >
                    <div className="relative w-full aspect-square">
                      {type === 'video' ? (
                        <video
                          src={src}
                          muted
                          playsInline
                          preload="metadata"
                          className="w-full h-full object-cover block"
                        />
                      ) : (
                        <img
                          src={src}
                          alt=""
                          className="w-full h-full object-cover block"
                          loading="lazy"
                          decoding="async"
                        />
                      )}
                      {type === 'video' && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                          <Play className="w-8 h-8 text-white/90 fill-white/90" />
                        </div>
                      )}
                    </div>
                    <p className="text-center text-gray-400 text-xs mt-2 font-mono leading-none tracking-tight">
                      {dateKey ? formatDateKey(dateKey) : ''}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Grid / timeline view */}
      {viewMode === 'grid' && (
        <div className="max-w-4xl mx-auto px-6 py-10 space-y-14">
          {sortedDates.length === 0 && (
            <p className="text-center text-white/40 text-sm py-20">
              {emptyStateMessage(locationFilter, selectedPersonName)}
            </p>
          )}
          {sortedDates.map((dateKey) => {
            const daySlides = grouped[dateKey];
            const startIdx = globalIdx;
            globalIdx += daySlides.length;

            return (
              <section key={dateKey}>
                <div className="flex items-center gap-4 mb-4">
                  <div className="h-px flex-1 bg-white/10" />
                  <h2 className="text-sm font-medium text-white/60 whitespace-nowrap">
                    {formatDateKey(dateKey)}
                  </h2>
                  <div className="h-px flex-1 bg-white/10" />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {daySlides.map(({ src, type }, i) => {
                    const idx = startIdx + i;
                    const photoId = decodeURIComponent(src.split('/').pop() ?? '');
                    return (
                      <div key={src} className="flex flex-col gap-1">
                        <button
                          onClick={() => setLightboxIdx(idx)}
                          className="aspect-square overflow-hidden rounded-lg cursor-zoom-in group relative"
                        >
                          {type === 'video' ? (
                            <video
                              src={src}
                              muted
                              playsInline
                              preload="metadata"
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                          ) : (
                            <img
                              src={src}
                              alt=""
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                              loading="lazy"
                              decoding="async"
                            />
                          )}
                          {type === 'video' && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                              <Play className="w-6 h-6 text-white/90 fill-white/90" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                        </button>
                        {allCounts !== null && (
                          <Reactions
                            photoId={photoId}
                            compact
                            initialCounts={allCounts[photoId] ?? {}}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {/* Location view */}
      {viewMode === 'location' && (
        <div className="max-w-4xl mx-auto px-6 py-10 space-y-14">
          {filteredLocationOrder.length === 0 && (
            <p className="text-center text-white/40 text-sm py-20">
              No photos have location data yet.
            </p>
          )}
          {filteredLocationOrder.map((location) => {
            const placeSlides = groupedByLocation[location].filter(
              (s) => !personPhotoSrcs || personPhotoSrcs.has(s.src),
            );
            if (placeSlides.length === 0) return null;
            const startIdx = globalIdx;
            globalIdx += placeSlides.length;

            return (
              <section key={location}>
                <div className="flex items-center gap-4 mb-4">
                  <div className="h-px flex-1 bg-white/10" />
                  <h2 className="text-sm font-medium text-white/60 whitespace-nowrap flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" />
                    {location}
                  </h2>
                  <div className="h-px flex-1 bg-white/10" />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {placeSlides.map(({ src, type }, i) => {
                    const idx = startIdx + i;
                    const photoId = decodeURIComponent(src.split('/').pop() ?? '');
                    return (
                      <div key={src} className="flex flex-col gap-1">
                        <button
                          onClick={() => setLightboxIdx(idx)}
                          className="aspect-square overflow-hidden rounded-lg cursor-zoom-in group relative"
                        >
                          {type === 'video' ? (
                            <video
                              src={src}
                              muted
                              playsInline
                              preload="metadata"
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                          ) : (
                            <img
                              src={src}
                              alt=""
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                              loading="lazy"
                              decoding="async"
                            />
                          )}
                          {type === 'video' && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                              <Play className="w-6 h-6 text-white/90 fill-white/90" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                        </button>
                        {allCounts !== null && (
                          <Reactions
                            photoId={photoId}
                            compact
                            initialCounts={allCounts[photoId] ?? {}}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {lightboxIdx !== null && (
        <Lightbox
          slides={viewMode === 'location' ? allLocatedSlides : allDatedSlides}
          index={lightboxIdx}
          onClose={() => setLightboxIdx(null)}
          onPrev={viewMode === 'location' ? onLocPrev : onPrev}
          onNext={viewMode === 'location' ? onLocNext : onNext}
        />
      )}
    </main>
  );
}
