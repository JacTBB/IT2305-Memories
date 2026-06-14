'use client';

import { Music2, VolumeX } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export const MusicPlayer = () => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.play().then(() => setPlaying(true)).catch(() => {});
  }, []);

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      audio.play().then(() => setPlaying(true)).catch(() => {});
    }
  };

  return (
    <>
      <audio ref={audioRef} src="Bundle%20of%20Joy.mp3" loop />
      <button
        onClick={toggle}
        title={playing ? 'Stop music' : 'Play music'}
        className="w-11 h-11 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-md border border-white/30 flex items-center justify-center text-white/90 hover:text-white shadow-lg transition-all duration-200"
      >
        {playing ? <VolumeX className="w-5 h-5" /> : <Music2 className="w-5 h-5" />}
      </button>
    </>
  );
};
