/** biome-ignore-all lint/a11y/useMediaCaption: just visual decoration, no info */
"use client";

import { motion, useInView, useReducedMotion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export default function Decoration({
  src,
  className,
  ...props
}: { src: string } & React.ComponentProps<typeof motion.div>) {
  const reducedMotion = useReducedMotion();
  const videoRef = useRef<HTMLVideoElement>(null);
  const inView = useInView(videoRef, { amount: 0.1 });

  const [shouldAnimate, setShouldAnimate] = useState(false);
  const [animationProgress, setAnimationProgress] = useState(0);
  const cells = useMemo(
    () =>
      Array.from({ length: 10 }).flatMap((_, row) =>
        Array.from({ length: 10 }).map((_, col) => {
          const index = row * 10 + col;
          return {
            id: `r${row}-c${col}`,
            x: col / 10,
            y: row / 10,
            w: 1 / 10,
            h: 1 / 10,
            delay: 0.2 + index * 0.015,
          };
        }),
      ),
    [],
  );

  useEffect(() => {
    if (inView && !reducedMotion) {
      videoRef.current?.play();
    } else {
      videoRef.current?.pause();
    }
  }, [inView, reducedMotion]);

  useEffect(() => {
    if (inView && !reducedMotion && !shouldAnimate) {
      setShouldAnimate(true);
    }
  }, [inView, reducedMotion, shouldAnimate]);

  useEffect(() => {
    if (shouldAnimate) {
      const maxDelay = Math.max(...cells.map((cell) => cell.delay));
      const duration = maxDelay + 1.0; // Add more buffer time
      const startTime = Date.now();

      const animate = () => {
        const elapsed = (Date.now() - startTime) / 1000;
        const progress = Math.min(elapsed / duration, 1);
        setAnimationProgress(progress);

        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };

      requestAnimationFrame(animate);
    }
  }, [shouldAnimate, cells]);

  const clipPath = useMemo(() => {
    if (!shouldAnimate) return undefined;

    const totalRows = 10;
    const progress = animationProgress;

    const currentRow = Math.floor(progress * totalRows);
    const rowProgress = progress * totalRows - currentRow;

    const currentY = Math.floor(((currentRow + rowProgress) * 10) / 10) * 10;
    const currentX = Math.floor((rowProgress * 100) / 10) * 10;

    const points = [
      "0% 0%",
      "100% 0%",
      `100% ${currentY}%`,
      `${currentX}% ${currentY}%`,
      `${currentX}% ${currentY + 10}%`,
      `0% ${currentY + 10}%`,
    ];

    return `polygon(${points.join(", ")})`;
  }, [shouldAnimate, animationProgress]);

  return (
    <motion.div
      className={cn(
        "pointer-events-none relative z-[-1] size-25 md:size-52",
        "border-2 border-white",
        !reducedMotion && !shouldAnimate && "opacity-0",
        className,
      )}
      style={
        shouldAnimate && clipPath
          ? ({
              clipPath: clipPath,
              WebkitClipPath: clipPath,
            } as React.CSSProperties)
          : undefined
      }
      {...props}
    >
      <video
        ref={videoRef}
        src={src}
        className="absolute inset-0 size-full object-cover"
        muted
        loop
        preload="auto"
        playsInline
        disablePictureInPicture
        disableRemotePlayback
      />
    </motion.div>
  );
}
