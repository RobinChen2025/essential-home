"use client";

import { use$ } from "@legendapp/state/react";
import { motion, useAnimationControls } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { loaderState$ } from "@/state/loader.state";

export default function PlaygroundSpinner() {
  const introFinished = use$(loaderState$.isFinished);
  const controls = useAnimationControls();
  const angleRef = useRef(0);
  const baseDuration = 1.5;

  useEffect(() => {
    if (!introFinished) {
      controls.start({
        rotate: angleRef.current + 360,
        transition: {
          duration: baseDuration,
          ease: "linear",
          repeat: Infinity,
        },
      });
    } else {
      const current = angleRef.current;
      const next = Math.ceil(current / 180) * 180;
      if (next > current) {
        const remaining = next - current;
        const duration = (remaining / 360) * baseDuration;
        controls.start({
          rotate: next,
          transition: { duration, ease: "linear" },
        });
      } else {
        controls.stop();
      }
    }
  }, [introFinished, controls]);

  function handleMouseEnter() {
    controls.start({
      rotate: angleRef.current + 360,
      transition: { duration: baseDuration, ease: "linear", repeat: Infinity },
    });
  }

  function handleMouseLeave() {
    const current = angleRef.current;
    const next = Math.ceil(current / 180) * 180;
    if (next === current) {
      controls.stop();
      return;
    }
    const remaining = next - current;
    const duration = (remaining / 360) * baseDuration;
    controls.start({ rotate: next, transition: { duration, ease: "linear" } });
  }

  return (
    <motion.div
      className="fixed top-4 right-4 z-30 md:top-8 md:right-8"
      initial={{ rotate: 0 }}
      animate={controls}
      onUpdate={(latest: unknown) => {
        const r = (latest as { rotate?: number } | undefined)?.rotate;
        if (typeof r === "number") angleRef.current = r;
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Link href="https://playground.nothing.tech/" target="_blank">
        <Image
          src="/icons/creator-spinner.svg"
          width={29.3}
          height={32}
          alt="Creator Playground Logo"
        />
      </Link>
    </motion.div>
  );
}
