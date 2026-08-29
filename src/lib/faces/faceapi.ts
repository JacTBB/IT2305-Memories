'use client';

import * as faceapi from 'face-api.js';

const MODEL_URL = '/models';

let loadPromise: Promise<void> | null = null;

export function loadFaceModels(): Promise<void> {
  if (!loadPromise) {
    loadPromise = Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
    ]).then(() => undefined);
  }
  return loadPromise;
}

export interface DetectedFace {
  descriptor: number[];
  box: { x: number; y: number; width: number; height: number };
}

export async function detectFaces(img: HTMLImageElement): Promise<DetectedFace[]> {
  // Bump inputSize above the 416 default so smaller/farther faces in
  // group photos and high-res originals still get picked up.
  const results = await faceapi
    .detectAllFaces(img, new faceapi.TinyFaceDetectorOptions({ inputSize: 608 }))
    .withFaceLandmarks()
    .withFaceDescriptors();

  return results.map((r) => ({
    descriptor: Array.from(r.descriptor),
    box: {
      x: r.detection.box.x / img.naturalWidth,
      y: r.detection.box.y / img.naturalHeight,
      width: r.detection.box.width / img.naturalWidth,
      height: r.detection.box.height / img.naturalHeight,
    },
  }));
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load ${src}`));
    img.src = src;
  });
}
