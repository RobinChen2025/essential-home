"use client";

import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useScroll,
} from "motion/react";
import Image from "next/image";
import { forwardRef, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import NdotText from "./ndot-text";

const TOLERANCE = 0.15;

export default function Timeline() {
  const [currentEvent, setCurrentEvent] = useState(0);
  const [isMilestoneVisible, setIsMilestoneVisible] = useState(false);
  const [hasReachedFirstThreshold, setHasReachedFirstThreshold] =
    useState(false);
  const [closestDistance, setClosestDistance] = useState<number>(
    Number.POSITIVE_INFINITY
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const { scrollY } = useScroll();

  const shouldShowMilestone =
    isMilestoneVisible && closestDistance <= window.innerHeight * TOLERANCE;

  useMotionValueEvent(scrollY, "change", () => {
    if (!containerRef.current) return;

    const viewportCenter = window.innerHeight / 2;
    let closestIndex = 0;
    let smallestDistance = Number.POSITIVE_INFINITY;

    for (let i = 0; i < EVENTS.length; i += 1) {
      const btn = buttonRefs.current[i];
      if (!btn) continue;
      const rect = btn.getBoundingClientRect();
      const elementCenter = rect.top + rect.height / 2;
      const distance = Math.abs(elementCenter - viewportCenter);
      if (distance < smallestDistance) {
        smallestDistance = distance;
        closestIndex = i;
      }
    }

    setCurrentEvent(closestIndex);
    setClosestDistance(smallestDistance);

    const firstBtn = buttonRefs.current[0];
    if (firstBtn) {
      const rect = firstBtn.getBoundingClientRect();
      const elementCenter = rect.top + rect.height / 2;
      const firstDistance = Math.abs(elementCenter - viewportCenter);
      const withinTwentyVh = firstDistance <= window.innerHeight * TOLERANCE;
      if (
        !hasReachedFirstThreshold &&
        withinTwentyVh &&
        elementCenter <= viewportCenter
      ) {
        setHasReachedFirstThreshold(true);
        setIsMilestoneVisible(true);
      }
    }
  });

  function scrollToEvent(event: number): void {
    const btn = buttonRefs.current[event];
    if (!btn) return;

    const rect = btn.getBoundingClientRect();
    const viewportCenter = window.innerHeight / 2;
    const elementCenterFromViewportTop = rect.top + rect.height / 2;
    const currentScrollY = window.scrollY || window.pageYOffset;
    const targetScrollY =
      currentScrollY + (elementCenterFromViewportTop - viewportCenter);

    window.scrollTo({ top: targetScrollY, behavior: "smooth" });
  }

  return (
    <section
      ref={containerRef}
      className={cn(
        "relative mt-20 flex min-h-[100svh] w-full max-w-7xl flex-col items-start justify-center px-6 py-12 md:px-12",
        "mb-56 pb-24 md:mb-20 md:pb-0"
      )}
    >
      <motion.nav className="flex w-full flex-col items-center justify-center gap-12.5 overflow-visible pb-20 md:items-start md:justify-start">
        {EVENTS.map((event, index) => (
          <NavButton
            key={event.title}
            ref={(el) => {
              buttonRefs.current[index] = el;
            }}
            active={shouldShowMilestone && currentEvent === index}
            onClick={() => scrollToEvent(index)}
          >
            {event.title}
          </NavButton>
        ))}
      </motion.nav>

      <AnimatePresence>
        {hasReachedFirstThreshold && shouldShowMilestone && (
          <motion.div
            key="milestone"
            className="md:-translate-y-1/2 md:-translate-x-1/2 fixed bottom-0 left-0 z-30 flex items-center justify-center p-4 md:top-1/2 md:bottom-auto md:left-1/2 md:max-w-sm"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.2 }}
          >
            <Milestone event={EVENTS[currentEvent]} />
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

const NavButton = forwardRef<
  HTMLButtonElement,
  {
    children: React.ReactNode;
    active: boolean;
    onClick: () => void;
  }
>(function NavButton({ children, active, onClick }, ref) {
  return (
    <button
      ref={ref}
      type="button"
      className={cn(
        "cursor-pointer transition-colors duration-200",
        active ? "text-essential-black" : "text-essential-grey-darker"
      )}
      onClick={onClick}
    >
      <NdotText className="text-headline md:text-headline-md">
        {children}
      </NdotText>
    </button>
  );
});

function Milestone({
  event,
}: {
  event: {
    title: string;
    image: string;
    description: string;
    timestamp: string;
  };
}) {
  return (
    <div className="flex w-full flex-col items-center justify-between gap-2 overflow-hidden rounded-[20px] bg-white md:aspect-square md:w-auto">
      <div className="flex w-full flex-row items-center justify-between p-2">
        <h3 className="trim-text px-2">
          {event.title.replace("( ", "(").replace(" )", ")")}
        </h3>
        <div className="flex items-center rounded-full bg-red p-2 text-white">
          <span className="px-1">{event.timestamp}</span>
        </div>
      </div>

      <div className="flex min-h-28 w-full flex-1 flex-row-reverse gap-4 pr-2 pb-2 pl-4 md:min-h-0 md:flex-col md:justify-between">
        <motion.div
          layoutId="milestone-image"
          layout="position"
          className="flex min-w-18 flex-1 items-center justify-center"
        >
          <Image
            src={event.image}
            alt={event.title}
            width={150}
            height={150}
            className="aspect-square h-full max-h-18 w-auto rounded-3xl object-contain md:max-h-38"
          />
        </motion.div>
        <p className="trim-text flex flex-col items-center justify-center self-stretch text-essential-black">
          {event.description}
        </p>
      </div>
    </div>
  );
}

const EVENTS = [
  {
    title: "Ear ( 1 )",
    image: "/roadmap/ear1.webp",
    description:
      "Our debut product. Introducing Nothing to the world in the loudest way possible.",
    timestamp: "Q1 2021",
  },
  {
    title: "Phone ( 1 )",
    image: "/roadmap/phone1.webp",
    description: "Live launched our first smartphone to 2 million viewers.",
    timestamp: "Q2 2022",
  },

  {
    title: "Phone ( 2 )",
    image: "/roadmap/phone2.webp",
    description:
      "Phone 2 is our most premium device yet. Phone (2a) breaks records, selling 100,000 units in 24 hours.",
    timestamp: "Q2 2023",
  },

  {
    title: "Essential Space",
    image: "/roadmap/essential-space.webp",
    description:
      "Our first glimpse into hardware + software AI features working together.",
    timestamp: "Q1 2025",
  },

  {
    title: "Essential Apps",
    image: "/roadmap/essential-apps.webp",
    description:
      "The AI operating system foundation for a personal experience at scale.",
    timestamp: "Q3 2025",
  },

  {
    title: "AI-Native Devices",
    image: "/roadmap/ai-native0930.webp",
    description:
      "Pairing software experiences with new use case specific shaped devices.",
    timestamp: "H2 2026",
  },
  {
    title: "Essential OS",
    image: "/roadmap/essential-os0930.webp",
    description: "The future of personal computing with AI at its core.",
    timestamp: "H1 2028",
  },
];
