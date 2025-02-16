'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';

import { AudioPlayer } from '@/components/audio-player';
import { Hero } from '@/components/hero';
import { MusicPlayer } from '@/components/music-player';

export default function Home() {
  return (
    <main>
      <Hero>
        <div className="relative flex h-full flex-col items-center justify-center px-4 text-center">
          <motion.h1
            className="mb-6 text-6xl font-bold tracking-tighter sm:text-7xl lg:text-8xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            IT2305
          </motion.h1>
          <motion.p
            className="max-w-[600px] text-lg text-gray-400 sm:text-xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            The Skibidi Class
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="absolute top-10 right-10"
        >
          <MusicPlayer />
        </motion.div>
      </Hero>
    </main>
  );
}
