'use client';

import Image from 'next/image';
import AudioPlayer from 'react-modern-audio-player';

import { cn } from '@/lib/utils';

import './music-player.css';

export const MusicPlayer = () => {
  const playList = [
    {
      name: 'name',
      img: 'https://cdn.jactbb.com/bp-website/Ark%20Banner.png',
      src: 'https://cdn.jactbb.com/bp-website/Faust.mp3',
      id: 1,
    },
    {
      name: 'name',
      img: 'https://cdn.jactbb.com/bp-website/Ark%20Banner.png',
      src: 'https://cdn.jactbb.com/bp-website/Faust.mp3',
      id: 2,
    },
  ];

  return (
    <div className="max-w-xs w-full group/card">
      <div
        className={cn(
          'cursor-pointer relative card min-h-[100px] h-full w-[240px] rounded-xl shadow-2xl mx-auto backgroundImage flex flex-col justify-between p-6',
          'border-2 border-[#131e41] rounded-xl bg-[#2f395b56] backdrop-blur-sm',
        )}
      >
        <div className="flex justify-center flex-wrap content-center items-center">
          <AudioPlayer
            playList={playList}
            audioInitialState={{ isPlaying: false }}
            activeUI={{
              all: true,
              progress: 'bar',
              repeatType: true,
              playList: false,
              artwork: false,
              trackInfo: false,
            }}
            placement={{
              player: 'top',
              playList: 'bottom',
              volumeSlider: 'right',
              interface: {
                templateArea: {
                  artwork: 'row1-2',
                  trackInfo: 'row2-2',
                  trackTimeCurrent: 'row3-1',
                  progress: 'row3-2',
                  trackTimeDuration: 'row3-3',
                  playList: 'row4-3',
                  repeatType: 'row4-3',
                  playButton: 'row4-2',
                  volume: 'row4-1',
                },
              },
            }}
            rootContainerProps={{
              width: '220px',
              height: '100px',
            }}
          />
        </div>
      </div>
    </div>
  );
};
