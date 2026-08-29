interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Props {
  photoSrc: string;
  box: Box;
  size?: number;
  className?: string;
}

// Crops just the face out of a full photo using background-position/size math,
// so we never need to generate and store separate cropped thumbnail images.
export function FaceChip({ photoSrc, box, size = 64, className }: Props) {
  const pad = 0.5; // include a margin around the detected box so the crop isn't too tight
  const cropWidth = box.width * (1 + pad);
  const cropHeight = box.height * (1 + pad);
  const cropX = Math.max(0, box.x - (box.width * pad) / 2);
  const cropY = Math.max(0, box.y - (box.height * pad) / 2);

  const bgWidth = 100 / cropWidth;
  const bgHeight = 100 / cropHeight;
  const bgPosX = (cropX / (1 - cropWidth)) * 100;
  const bgPosY = (cropY / (1 - cropHeight)) * 100;

  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: '9999px',
        overflow: 'hidden',
        backgroundImage: `url(${photoSrc})`,
        backgroundSize: `${bgWidth}% ${bgHeight}%`,
        backgroundPosition: `${Number.isFinite(bgPosX) ? bgPosX : 50}% ${Number.isFinite(bgPosY) ? bgPosY : 50}%`,
        backgroundRepeat: 'no-repeat',
        flexShrink: 0,
      }}
    />
  );
}
