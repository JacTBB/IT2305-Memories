'use client';

import { AnimatePresence, motion } from 'framer-motion';
import React, { useEffect, useRef, useState } from 'react';

import { MusicPlayer } from '@/components/music-player';
import { Carousel } from '@/components/ui/carousel';

import { cn } from '@/lib/utils';

const slideData = [
  { title: '', button: '', src: 'Hero1.jpg' },
  { title: '', button: '', src: 'Hero2.jpg' },
  { title: '', button: '', src: 'Hero3.jpg' },
  { title: '', button: '', src: 'Hero4.jpg' },
  { title: '', button: '', src: '26-04-20%2017-47-47%201321.jpg' },
  { title: '', button: '', src: '26-04-20%2017-48-01%201324.jpg' },
  { title: '', button: '', src: '26-04-20%2017-49-11%201325.jpg' },
  { title: '', button: '', src: '26-04-20%2017-57-10%201331.jpg' },
  { title: '', button: '', src: '26-04-20%2020-13-35%201349.jpg' },
  { title: '', button: '', src: '26-04-20%2020-13-41%201351.jpg' },
  { title: '', button: '', src: '26-04-20%2023-36-39%201364.jpg' },
  { title: '', button: '', src: '26-04-20%2023-37-12%201368.jpg' },
  { title: '', button: '', src: '26-04-21%2001-26-06%201374.jpg' },
  { title: '', button: '', src: '26-04-21%2014-49-17%201406.jpg' },
  { title: '', button: '', src: '26-04-21%2016-19-24%201410.jpg' },
  { title: '', button: '', src: '26-04-21%2019-44-13%201417.jpg' },
  { title: '', button: '', src: '26-04-21%2019-44-13%201418.jpg' },
  { title: '', button: '', src: '26-04-21%2021-45-54%200280.jpg' },
  { title: '', button: '', src: '26-04-21%2021-46-32%206133.jpg' },
  { title: '', button: '', src: '26-04-21%2021-47-43%205.jpg' },
  { title: '', button: '', src: '26-04-21%2022-49-16%201426.jpg' },
  { title: '', button: '', src: '26-04-21%2022-49-19%201427.jpg' },
  { title: '', button: '', src: '26-04-22%2010-08-20%201437.jpg' },
  { title: '', button: '', src: '26-04-22%2010-08-26%201439.jpg' },
  { title: '', button: '', src: '26-04-22%2010-08-34%201440.jpg' },
  { title: '', button: '', src: '26-04-22%2010-43-07%201443.jpg' },
  { title: '', button: '', src: '26-04-22%2010-43-08%201444.jpg' },
  { title: '', button: '', src: '26-04-22%2010-45-16%201445.jpg' },
  { title: '', button: '', src: '26-04-22%2010-45-18%201446.jpg' },
  { title: '', button: '', src: '26-04-22%2011-10-10%201448.jpg' },
  { title: '', button: '', src: '26-04-22%2011-10-17%201450.jpg' },
  { title: '', button: '', src: '26-04-22%2011-10-44%201453.jpg' },
  { title: '', button: '', src: '26-04-22%2011-10-50%201454.jpg' },
  { title: '', button: '', src: '26-04-22%2011-10-50%201455.jpg' },
  { title: '', button: '', src: '26-04-22%2012-19-08%201460.jpg' },
  { title: '', button: '', src: '26-04-22%2012-28-29%201461.jpg' },
  { title: '', button: '', src: '26-04-22%2012-48-08%201482.jpg' },
  { title: '', button: '', src: '26-04-22%2012-48-14%201484.jpg' },
  { title: '', button: '', src: '26-04-22%2012-58-46%201488.jpg' },
  { title: '', button: '', src: '26-04-22%2012-58-50%201489.jpg' },
  { title: '', button: '', src: '26-04-22%2013-23-01%2026.jpg' },
  { title: '', button: '', src: '26-04-22%2013-23-04%209.jpg' },
  { title: '', button: '', src: '26-04-22%2014-38-03%201492.jpg' },
  { title: '', button: '', src: '26-04-22%2014-38-04%201493.jpg' },
  { title: '', button: '', src: '26-04-22%2014-38-05%201494.jpg' },
  { title: '', button: '', src: '26-04-22%2019-38-42%201542.jpg' },
  { title: '', button: '', src: '26-04-22%2019-38-44%201544.jpg' },
  { title: '', button: '', src: '26-04-22%2019-38-46%201545.jpg' },
  { title: '', button: '', src: '26-04-22%2020-11-06%201555.jpg' },
  { title: '', button: '', src: '26-04-23%2015-02-25%201650.jpg' },
  { title: '', button: '', src: '26-04-23%2015-14-11%201651.jpg' },
  { title: '', button: '', src: '26-04-23%2015-14-13%201652.jpg' },
  { title: '', button: '', src: '26-04-23%2015-14-14%201653.jpg' },
  { title: '', button: '', src: '26-04-23%2015-14-14%201654.jpg' },
  { title: '', button: '', src: '26-04-23%2015-15-02%201655.jpg' },
  { title: '', button: '', src: '26-04-23%2015-15-05%201657.jpg' },
  { title: '', button: '', src: '26-04-23%2021-55-25%207.jpg' },
  { title: '', button: '', src: '26-04-24%2000-57-29%201686.jpg' },
  { title: '', button: '', src: '26-04-24%2000-57-35%201687.jpg' },
  { title: '', button: '', src: '26-04-24%2001-01-16%201689.png' },
  { title: '', button: '', src: '26-04-24%2010-26-15%201697.jpg' },
  { title: '', button: '', src: '26-04-24%2010-26-24%201698.jpg' },
  { title: '', button: '', src: '26-04-24%2011-05-43%201699.jpg' },
  { title: '', button: '', src: '26-04-24%2011-06-00%201701.jpg' },
  { title: '', button: '', src: '26-04-24%2011-44-33%201713.jpg' },
  { title: '', button: '', src: '26-04-24%2011-52-37%201722.jpg' },
  { title: '', button: '', src: '26-04-24%2011-52-46%201723.jpg' },
  { title: '', button: '', src: '26-04-24%2011-57-07%201724.jpg' },
  { title: '', button: '', src: '26-04-24%2011-59-34%201727.jpg' },
  { title: '', button: '', src: '26-04-24%2011-59-35%201728.jpg' },
  { title: '', button: '', src: '26-04-24%2012-14-48%201730.jpg' },
  { title: '', button: '', src: '26-04-24%2012-25-10%201734.jpg' },
  { title: '', button: '', src: '26-04-24%2012-25-11%201735.jpg' },
  { title: '', button: '', src: '26-04-24%2012-39-35%201759.jpg' },
  { title: '', button: '', src: '26-04-24%2012-39-37%201760.jpg' },
  { title: '', button: '', src: '26-04-24%2018-57-17%201827.jpg' },
  { title: '', button: '', src: '26-04-25%2014-21-35%201885.jpg' },
  { title: '', button: '', src: '26-04-25%2014-21-40%201887.jpg' },
  { title: '', button: '', src: '26-04-25%2014-29-16%201890.jpg' },
  { title: '', button: '', src: '26-04-25%2014-30-37%201891.jpg' },
  { title: '', button: '', src: '26-04-25%2014-31-19%201892.jpg' },
  { title: '', button: '', src: '26-04-25%2014-31-27%201894.jpg' },
  { title: '', button: '', src: '26-04-25%2015-24-51%201912.jpg' },
  { title: '', button: '', src: '26-04-25%2015-24-54%201913.jpg' },
  { title: '', button: '', src: '26-04-25%2015-25-30%201916.jpg' },
  { title: '', button: '', src: '26-04-25%2015-38-56%201921.jpg' },
  { title: '', button: '', src: '26-04-25%2015-46-06%201922.jpg' },
  { title: '', button: '', src: '26-04-25%2015-46-18%201924.jpg' },
  { title: '', button: '', src: '26-04-25%2015-46-19%201925.jpg' },
  { title: '', button: '', src: '26-04-25%2015-46-21%201926.jpg' },
  { title: '', button: '', src: '26-04-25%2016-00-03%201927.jpg' },
  { title: '', button: '', src: '26-04-25%2016-00-05%201928.jpg' },
  { title: '', button: '', src: '26-04-25%2016-01-27%201930.jpg' },
  { title: '', button: '', src: '26-04-25%2016-01-29%201931.jpg' },
  { title: '', button: '', src: '26-04-25%2016-01-31%201932.jpg' },
  { title: '', button: '', src: '26-04-25%2016-10-49%201933.jpg' },
  { title: '', button: '', src: '26-04-25%2016-10-55%201934.jpg' },
  { title: '', button: '', src: '26-04-25%2017-02-25%201937.jpg' },
  { title: '', button: '', src: '26-04-25%2017-02-27%201938.jpg' },
  { title: '', button: '', src: '26-04-26%2010-43-07%201954.jpg' },
  { title: '', button: '', src: '26-04-26%2010-44-41%201955.jpg' },
  { title: '', button: '', src: '26-04-26%2016-46-19%202017.jpg' },
  { title: '', button: '', src: '26-04-26%2016-46-22%202018.jpg' },
  { title: '', button: '', src: '26-04-26%2023-47-23%202037.jpg' },
  { title: '', button: '', src: '26-04-27%2009-15-57%202049.jpg' },
  { title: '', button: '', src: '26-04-27%2009-28-06%202053.jpg' },
  { title: '', button: '', src: '26-04-27%2010-03-34%202058.jpg' },
  { title: '', button: '', src: '26-04-27%2010-03-35%202060.jpg' },
  { title: '', button: '', src: '26-04-27%2011-17-24%20765.jpg' },
  { title: '', button: '', src: '26-04-27%2011-30-29%202067.jpg' },
  { title: '', button: '', src: '26-04-27%2011-40-35%202071.jpg' },
  { title: '', button: '', src: '26-04-27%2011-55-55%202076.jpg' },
  { title: '', button: '', src: '26-04-27%2011-55-57%202077.jpg' },
  { title: '', button: '', src: '26-04-27%2016-42-42%202105.jpg' },
  { title: '', button: '', src: '26-04-27%2017-00-58%202106.jpg' },
  { title: '', button: '', src: '26-04-27%2017-01-03%202109.jpg' },
  { title: '', button: '', src: '26-04-27%2017-01-57%202112.jpg' },
  { title: '', button: '', src: '26-04-27%2017-21-22%202114.jpg' },
  { title: '', button: '', src: '26-04-27%2017-21-26%202115.jpg' },
  { title: '', button: '', src: '26-04-27%2017-25-02%202119.jpg' },
  { title: '', button: '', src: '26-04-27%2017-25-06%202120.jpg' },
  { title: '', button: '', src: '26-04-27%2017-25-14%202121.jpg' },
  { title: '', button: '', src: '26-04-27%2017-30-23%202124.jpg' },
  { title: '', button: '', src: '26-04-27%2017-47-15%202132.jpg' },
  { title: '', button: '', src: '26-04-27%2018-16-05%202142.jpg' },
  { title: '', button: '', src: '26-04-27%2019-00-49%202147.jpg' },
  { title: '', button: '', src: '26-04-27%2019-01-04%202149.jpg' },
  { title: '', button: '', src: '26-04-27%2019-07-56%202152.jpg' },
  { title: '', button: '', src: '26-04-27%2019-08-00%202153.jpg' },
  { title: '', button: '', src: '26-04-28%2017-02-30%202169.jpg' },
  { title: '', button: '', src: '26-04-28%2017-02-33%202171.jpg' },
  { title: '', button: '', src: '26-04-28%2017-02-34%202172.jpg' },
  { title: '', button: '', src: '26-04-29%2002-19-50%202187.jpg' },
  { title: '', button: '', src: '26-04-29%2002-19-55%202188.jpg' },
];

const beams = [
  {
    initialX: 10,
    translateX: 10,
    duration: 7,
    repeatDelay: 3,
    delay: 2,
  },
  {
    initialX: 600,
    translateX: 600,
    duration: 3,
    repeatDelay: 3,
    delay: 4,
  },
  {
    initialX: 100,
    translateX: 100,
    duration: 7,
    repeatDelay: 7,
    className: 'h-6',
  },
  {
    initialX: 400,
    translateX: 400,
    duration: 5,
    repeatDelay: 14,
    delay: 4,
  },
  {
    initialX: 800,
    translateX: 800,
    duration: 11,
    repeatDelay: 2,
    className: 'h-20',
  },
  {
    initialX: 1000,
    translateX: 1000,
    duration: 4,
    repeatDelay: 2,
    className: 'h-12',
  },
  {
    initialX: 1200,
    translateX: 1200,
    duration: 6,
    repeatDelay: 4,
    delay: 2,
    className: 'h-6',
  },
];

export const Hero = ({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const parentRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: Particle[] = [];
    const particleCount = 100;

    class Particle {
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;

      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 2 + 0.1;
        this.speedX = (Math.random() * 2 - 1) / 4;
        this.speedY = (Math.random() * 2 - 1) / 4;
      }

      update() {
        this.x += this.speedX;
        this.y += this.speedY;

        if (this.x > canvas.width) this.x = 0;
        if (this.x < 0) this.x = canvas.width;
        if (this.y > canvas.height) this.y = 0;
        if (this.y < 0) this.y = canvas.height;
      }

      draw() {
        if (!ctx) return;
        ctx.fillStyle = 'rgba(180, 120, 255, 0.5)';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle());
    }

    function animate() {
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const particle of particles) {
        particle.update();
        particle.draw();
      }

      requestAnimationFrame(animate);
    }

    animate();

    const handleResize = () => {
      if (!canvasRef.current) return;
      canvasRef.current.width = window.innerWidth;
      canvasRef.current.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div
      ref={parentRef}
      className={cn(
        'h-[100vh] bg-gradient-to-b from-white to-neutral-100 dark:from-neutral-950 dark:to-blue-950 relative flex items-center w-full justify-center overflow-hidden',
        // h-screen if you want bigger
        className,
      )}
    >
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full bg-black" />

      {beams.map((beam) => (
        <CollisionMechanism
          key={beam.initialX + 'beam-idx'}
          beamOptions={beam}
          containerRef={containerRef}
          parentRef={parentRef}
        />
      ))}

      <div className="relative flex h-full flex-col items-center justify-center px-4 text-center">
        <motion.h1
          className="mb-6 text-6xl font-bold tracking-tighter sm:text-7xl lg:text-8xl"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          IT2305
        </motion.h1>
        <motion.p
          className="max-w-[600px] text-lg text-gray-400 sm:text-xl mb-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          The Skibidi Class
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <Carousel slides={slideData} />
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="absolute top-10 right-10"
      >
        <MusicPlayer />
      </motion.div>
      {children}
      <div
        ref={containerRef}
        className="absolute bottom-0 bg-neutral-100 w-full inset-x-0 pointer-events-none"
        style={{
          boxShadow:
            '0 0 24px rgba(34, 42, 53, 0.06), 0 1px 1px rgba(0, 0, 0, 0.05), 0 0 0 1px rgba(34, 42, 53, 0.04), 0 0 4px rgba(34, 42, 53, 0.08), 0 16px 68px rgba(47, 48, 55, 0.05), 0 1px 0 rgba(255, 255, 255, 0.1) inset',
        }}
      ></div>
    </div>
  );
};

const CollisionMechanism = React.forwardRef<
  HTMLDivElement,
  {
    containerRef: React.RefObject<HTMLDivElement>;
    parentRef: React.RefObject<HTMLDivElement>;
    beamOptions?: {
      initialX?: number;
      translateX?: number;
      initialY?: number;
      translateY?: number;
      rotate?: number;
      className?: string;
      duration?: number;
      delay?: number;
      repeatDelay?: number;
    };
  }
>(({ parentRef, containerRef, beamOptions = {} }, ref) => {
  const beamRef = useRef<HTMLDivElement>(null);
  const [collision, setCollision] = useState<{
    detected: boolean;
    coordinates: { x: number; y: number } | null;
  }>({
    detected: false,
    coordinates: null,
  });
  const [beamKey, setBeamKey] = useState(0);
  const [cycleCollisionDetected, setCycleCollisionDetected] = useState(false);

  useEffect(() => {
    const checkCollision = () => {
      if (beamRef.current && containerRef.current && parentRef.current && !cycleCollisionDetected) {
        const beamRect = beamRef.current.getBoundingClientRect();
        const containerRect = containerRef.current.getBoundingClientRect();
        const parentRect = parentRef.current.getBoundingClientRect();

        if (beamRect.bottom >= containerRect.top) {
          const relativeX = beamRect.left - parentRect.left + beamRect.width / 2;
          const relativeY = beamRect.bottom - parentRect.top;

          setCollision({
            detected: true,
            coordinates: {
              x: relativeX,
              y: relativeY,
            },
          });
          setCycleCollisionDetected(true);
        }
      }
    };

    const animationInterval = setInterval(checkCollision, 50);

    return () => clearInterval(animationInterval);
  }, [cycleCollisionDetected, containerRef]);

  useEffect(() => {
    if (collision.detected && collision.coordinates) {
      setTimeout(() => {
        setCollision({ detected: false, coordinates: null });
        setCycleCollisionDetected(false);
      }, 2000);

      setTimeout(() => {
        setBeamKey((prevKey) => prevKey + 1);
      }, 2000);
    }
  }, [collision]);

  return (
    <>
      <motion.div
        key={beamKey}
        ref={beamRef}
        animate="animate"
        initial={{
          translateY: beamOptions.initialY || '-200px',
          translateX: beamOptions.initialX || '0px',
          rotate: beamOptions.rotate || 0,
        }}
        variants={{
          animate: {
            translateY: beamOptions.translateY || '1800px',
            translateX: beamOptions.translateX || '0px',
            rotate: beamOptions.rotate || 0,
          },
        }}
        transition={{
          duration: beamOptions.duration || 8,
          repeat: Infinity,
          repeatType: 'loop',
          ease: 'linear',
          delay: beamOptions.delay || 0,
          repeatDelay: beamOptions.repeatDelay || 0,
        }}
        className={cn(
          'absolute left-0 top-20 m-auto h-14 w-px rounded-full bg-gradient-to-t from-indigo-500 via-purple-500 to-transparent',
          beamOptions.className,
        )}
      />
      <AnimatePresence>
        {collision.detected && collision.coordinates && (
          <Explosion
            key={`${collision.coordinates.x}-${collision.coordinates.y}`}
            className=""
            style={{
              left: `${collision.coordinates.x}px`,
              top: `${collision.coordinates.y}px`,
              transform: 'translate(-50%, -50%)',
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
});

CollisionMechanism.displayName = 'CollisionMechanism';

const Explosion = ({ ...props }: React.HTMLProps<HTMLDivElement>) => {
  const spans = Array.from({ length: 20 }, (_, index) => ({
    id: index,
    initialX: 0,
    initialY: 0,
    directionX: Math.floor(Math.random() * 80 - 40),
    directionY: Math.floor(Math.random() * -50 - 10),
  }));

  return (
    <div {...props} className={cn('absolute z-50 h-2 w-2', props.className)}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 1.5, ease: 'easeOut' }}
        className="absolute -inset-x-10 top-0 m-auto h-2 w-10 rounded-full bg-gradient-to-r from-transparent via-indigo-500 to-transparent blur-sm"
      ></motion.div>
      {spans.map((span) => (
        <motion.span
          key={span.id}
          initial={{ x: span.initialX, y: span.initialY, opacity: 1 }}
          animate={{
            x: span.directionX,
            y: span.directionY,
            opacity: 0,
          }}
          transition={{ duration: Math.random() * 1.5 + 0.5, ease: 'easeOut' }}
          className="absolute h-1 w-1 rounded-full bg-gradient-to-b from-indigo-500 to-purple-500"
        />
      ))}
    </div>
  );
};
