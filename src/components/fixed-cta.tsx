"use client";

import { use$ } from "@legendapp/state/react";
import { motion, useMotionValueEvent, useScroll } from "motion/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import IconLink from "@/icons/icon-link";
import { useMediaQuery } from "@/lib/use-media-query";
import { cn } from "@/lib/utils";
import { loaderState$ } from "@/state/loader.state";

export default function FixedCta() {
  const MotionLink = motion.create(Link);
  const introFinished = use$(loaderState$.isFinished);
  const [visible, setVisible] = useState(false);

  const { scrollY } = useScroll();
  const [isInTopViewport, setIsInTopViewport] = useState(true);
  const [footerCtaBelow, setFooterCtaBelow] = useState(false);

  useMotionValueEvent(scrollY, "change", (current) => {
    const vh = typeof window !== "undefined" ? window.innerHeight : 0;
    setIsInTopViewport(current < vh * 0.5);

    const footerCta = document.getElementById("footer-cta");
    if (footerCta) {
      const footerCtaRect = footerCta.getBoundingClientRect();
      const fixedButtonBottom = window.innerHeight - 24;
      setFooterCtaBelow(footerCtaRect.top < fixedButtonBottom);
    }
  });

  useEffect(() => {
    if (introFinished) {
      setTimeout(() => setVisible(true), 1200);
    }
  }, [introFinished]);

  const isMobile = useMediaQuery("(max-width: 768px)");

  return (
    visible &&
    !footerCtaBelow && (
      <MotionLink
        initial={{ opacity: 0, y: isMobile ? 24 : 32 }}
        animate={{
          opacity: isInTopViewport ? 0 : 1,
          y: isInTopViewport ? 76 : 0,
        }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        type="button"
        className={cn(
          "-translate-x-1/2 fixed bottom-4 left-1/2 flex cursor-pointer items-center justify-center gap-3 rounded-full bg-white/20 p-4 text-black backdrop-blur-3xl transition-colors duration-200 hover:bg-yellow hover:text-black md:bottom-6",
        )}
        href="https://playground.nothing.tech/"
        target="_blank"
      >
        <span className="trim-text px-1">Playground</span>
        <IconLink />
      </MotionLink>
    )
  );
}
