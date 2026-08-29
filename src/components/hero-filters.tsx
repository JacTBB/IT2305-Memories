'use client';

import { ChevronDown, Filter, MapPin, Users } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { FaceChip } from '@/components/face-chip';
import { cn } from '@/lib/utils';

interface PersonSummary {
  id: number;
  name: string | null;
  thumbnail: { photoSrc: string; box: { x: number; y: number; width: number; height: number } } | null;
}

export interface HeroFilterResult {
  locationFilter: string | null;
  personName: string | null;
  photoSrcs: Set<string> | null;
}

// Place + person filter dropdowns for the hero carousel. Owns all of its own
// state/fetching and reports the combined result up so Hero just narrows
// `carouselSlides` with it.
export function HeroFilters({
  carouselLocations,
  onChange,
}: {
  carouselLocations: string[];
  onChange: (result: HeroFilterResult) => void;
}) {
  const [locationFilter, setLocationFilter] = useState<string | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  const [people, setPeople] = useState<PersonSummary[]>([]);
  const [personFilter, setPersonFilter] = useState<number | null>(null);
  const [personPhotoSrcs, setPersonPhotoSrcs] = useState<Set<string> | null>(null);
  const [personFilterOpen, setPersonFilterOpen] = useState(false);
  const personFilterRef = useRef<HTMLDivElement>(null);

  const selectedPersonName = personFilter !== null
    ? (people.find((p) => p.id === personFilter)?.name ?? null)
    : null;

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

  useEffect(() => {
    onChange({ locationFilter, personName: selectedPersonName, photoSrcs: personPhotoSrcs });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locationFilter, selectedPersonName, personPhotoSrcs]);

  useEffect(() => {
    if (!filterOpen && !personFilterOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setFilterOpen(false);
      }
      if (personFilterRef.current && !personFilterRef.current.contains(e.target as Node)) {
        setPersonFilterOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [filterOpen, personFilterOpen]);

  if (carouselLocations.length === 0 && people.length === 0) return null;

  return (
    <div className="flex items-center gap-2 mb-4">
      {carouselLocations.length > 0 && (
        <div className="relative z-40" ref={filterRef}>
          <button
            onClick={() => setFilterOpen((o) => !o)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white text-sm font-medium backdrop-blur-sm border border-white/20 transition-all"
          >
            <Filter className="w-3.5 h-3.5" />
            {locationFilter ?? 'Filter by place'}
            <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', filterOpen && 'rotate-180')} />
          </button>

          {filterOpen && (
            <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 z-30 w-56 max-h-64 overflow-y-auto rounded-xl bg-black/90 backdrop-blur-md border border-white/20 shadow-xl py-1">
              <button
                onClick={() => {
                  setLocationFilter(null);
                  setFilterOpen(false);
                }}
                className={cn(
                  'w-full text-left px-4 py-2 text-sm transition-colors',
                  locationFilter === null
                    ? 'text-white bg-white/10'
                    : 'text-white/60 hover:bg-white/5 hover:text-white',
                )}
              >
                All places
              </button>
              {carouselLocations.map((loc) => (
                <button
                  key={loc}
                  onClick={() => {
                    setLocationFilter(loc);
                    setFilterOpen(false);
                  }}
                  className={cn(
                    'w-full text-left px-4 py-2 text-sm transition-colors flex items-center gap-1.5',
                    locationFilter === loc
                      ? 'text-white bg-white/10'
                      : 'text-white/60 hover:bg-white/5 hover:text-white',
                  )}
                >
                  <MapPin className="w-3 h-3 shrink-0" />
                  {loc}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {people.length > 0 && (
        <div className="relative z-40" ref={personFilterRef}>
          <button
            onClick={() => setPersonFilterOpen((o) => !o)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white text-sm font-medium backdrop-blur-sm border border-white/20 transition-all"
          >
            <Users className="w-3.5 h-3.5" />
            {selectedPersonName ?? 'Filter by person'}
            <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', personFilterOpen && 'rotate-180')} />
          </button>

          {personFilterOpen && (
            <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 z-30 w-56 max-h-64 overflow-y-auto rounded-xl bg-black/90 backdrop-blur-md border border-white/20 shadow-xl py-1">
              <button
                onClick={() => {
                  setPersonFilter(null);
                  setPersonFilterOpen(false);
                }}
                className={cn(
                  'w-full text-left px-4 py-2 text-sm transition-colors',
                  personFilter === null
                    ? 'text-white bg-white/10'
                    : 'text-white/60 hover:bg-white/5 hover:text-white',
                )}
              >
                Everyone
              </button>
              {people.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    setPersonFilter(p.id);
                    setPersonFilterOpen(false);
                  }}
                  className={cn(
                    'w-full text-left px-4 py-2 text-sm transition-colors flex items-center gap-2',
                    personFilter === p.id
                      ? 'text-white bg-white/10'
                      : 'text-white/60 hover:bg-white/5 hover:text-white',
                  )}
                >
                  {p.thumbnail && <FaceChip photoSrc={p.thumbnail.photoSrc} box={p.thumbnail.box} size={20} />}
                  {p.name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
