"use client";

import { useEffect } from "react";

export default function Favicon() {
  useEffect(() => {
    const frames = Array.from({ length: 12 }, (_, i) => {
      const index = (i + 1).toString().padStart(2, "0");
      return `/favicons/favicon-${index}.png`;
    });

    let currentIndex = 0;

    const ensureLink = () => {
      let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
      if (!link) {
        link = document.createElement("link");
        link.rel = "icon";
        document.head.appendChild(link);
      }
      return link;
    };

    const linkEl = ensureLink();
    linkEl.type = "image/png";

    const update = () => {
      linkEl.href = frames[currentIndex];
      currentIndex = (currentIndex + 1) % frames.length;
    };

    let intervalId: number | null = null;

    const start = () => {
      if (intervalId !== null) return;
      update();
      intervalId = window.setInterval(update, 1000);
    };

    const stop = () => {
      if (intervalId === null) return;
      window.clearInterval(intervalId);
      intervalId = null;
    };

    const handleVisibility = () => {
      if (document.visibilityState === "hidden") {
        stop();
      } else {
        start();
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    handleVisibility();

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      stop();
    };
  }, []);

  return null;
}
