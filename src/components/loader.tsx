"use client";

import { use$ } from "@legendapp/state/react";
import { motion, useInView } from "motion/react";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { loaderState$ } from "@/state/loader.state";
import NdotText from "./ndot-text";

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

function smoothScrollTo(distance: number, duration: number = 1000) {
  const startTime = performance.now();
  const startScrollY = window.scrollY;
  const targetScrollY = startScrollY + distance;

  function animate(currentTime: number) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const easedProgress = easeInOut(progress);

    const currentScrollY =
      startScrollY + (targetScrollY - startScrollY) * easedProgress;
    window.scrollTo(0, currentScrollY);

    if (progress < 1) {
      requestAnimationFrame(animate);
    }
  }

  requestAnimationFrame(animate);
}

export default function Loader() {
  const introFinished = use$(loaderState$.isFinished);
  const loaderRef = useRef<HTMLDivElement>(null);
  const inView = useInView(loaderRef, { amount: 0.6 });

  useEffect(() => {
    document.body.style.overflow = "hidden";
    document.body.style.height = "100vh";
    window.scrollTo(0, 0);

    setTimeout(() => {
      document.body.style.overflow = "auto";
      document.body.style.height = "auto";
      loaderState$.isFinished.set(true);
      const triggerScroll = () => smoothScrollTo(window.innerHeight);
      if (document.readyState === "complete") {
        triggerScroll();
      } else {
        window.addEventListener("load", triggerScroll, { once: true });
      }
    }, 2500);
  }, []);

  return (
    <motion.section
      data-background="1"
      ref={loaderRef}
      viewport={{ amount: 0.3 }}
      className={cn(
        "relative flex min-h-svh w-full items-center justify-center p-4 md:p-6",
        !introFinished && "cursor-progress",
      )}
    >
      <motion.video
        initial={{ opacity: 1 }}
        animate={{ opacity: inView ? 1 : 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        src="/backgrounds/loader.mp4"
        autoPlay
        muted
        loop
        playsInline
        disablePictureInPicture
        disableRemotePlayback
        className="-z-10 fixed inset-0 size-full object-cover"
      />
      <div className="w-full max-w-[90%] md:max-w-[65%]">
        <NdotText decorative random speed={2} gap={12}>
          Essential
        </NdotText>
      </div>
    </motion.section>
  );
}
