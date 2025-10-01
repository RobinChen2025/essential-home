"use client";

import { domAnimation, LazyMotion, m, useInView } from "motion/react";
import type { ReactElement, ReactNode } from "react";
import {
  isValidElement,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { loadNdotFont } from "@/lib/font";
import { cn } from "@/lib/utils";

const pathCache = new Map<string, PathSeg[]>();
const MAX_CACHE_SIZE = 50;

function cleanupCache() {
  if (pathCache.size > MAX_CACHE_SIZE) {
    const entries = Array.from(pathCache.entries());
    const toDelete = entries.slice(0, entries.length - MAX_CACHE_SIZE);
    toDelete.forEach(([key]) => {
      pathCache.delete(key);
    });
  }
}

function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

type PathSeg = { d: string; cx: number; cy: number; line: number };
type Props = {
  children: ReactNode;
  speed?: number;
  gap?: number;
  delay?: number;
  className?: string;
  decorative?: boolean;
  random?: boolean;
};

export default function NdotText({
  children,
  speed = 5,
  gap = 10,
  delay = 0,
  className,
  decorative = false,
  random = false,
}: Props) {
  const [activeFontSize, setActiveFontSize] = useState<number>(0);
  const containerRef = useRef<HTMLSpanElement | null>(null);
  const wrapRef = useRef<HTMLSpanElement | null>(null);
  const [paths, setPaths] = useState<PathSeg[]>([]);
  const [visibleCount, setVisibleCount] = useState<number>(0);
  const [box, setBox] = useState<{ w: number; h: number }>({
    w: 0,
    h: 0,
  });
  const inView = useInView(wrapRef, {
    once: true,
    amount: "some",
  });
  const [measuredFontSize, setMeasuredFontSize] = useState<number | null>(null);
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const [viewportWidth, setViewportWidth] = useState<number | null>(null);
  const [revealComplete, setRevealComplete] = useState<boolean>(false);

  const extractText = useCallback(
    (node: ReactNode): string => {
      if (node === null || node === undefined || node === false) return "";
      if (typeof node === "string" || typeof node === "number")
        return String(node);
      if (Array.isArray(node)) return node.map(extractText).join("");
      if (isValidElement(node)) {
        const element = node as ReactElement<{
          children?: ReactNode;
          className?: string;
        }>;
        const elementType = element.type;
        if (typeof elementType === "string" && elementType === "br") {
          const className = element.props.className;
          if (className && viewportWidth !== null) {
            const isMd = viewportWidth >= 768;

            if (className.includes("block md:hidden")) {
              return isMd ? "" : "\n";
            }
            if (className.includes("hidden md:block")) {
              return isMd ? "\n" : "";
            }
            if (className.includes("hidden") && !className.includes("md:")) {
              return "";
            }
          }
          return "\n";
        }
        return extractText(element.props.children);
      }
      return "";
    },
    [viewportWidth]
  );

  const text = useMemo(() => extractText(children), [children, extractText]);

  const debouncedUpdateViewportWidth = useMemo(
    () => debounce(() => setViewportWidth(window.innerWidth), 100),
    []
  );

  const debouncedUpdateMeasurements = useMemo(
    () =>
      debounce(() => {
        const r = wrapRef.current;
        const c = containerRef.current;
        if (!r || !c) return;

        const computed = window.getComputedStyle(r);
        const parsed = parseFloat(computed.fontSize || "0");
        if (!Number.isNaN(parsed) && parsed > 0) setActiveFontSize(parsed);

        const w = r.clientWidth;
        const totalHeight = r.clientHeight;
        setBox({ w: Math.max(1, w), h: Math.max(1, totalHeight) });
        setContainerWidth(c.clientWidth || 0);
      }, 100),
    []
  );

  useEffect(() => {
    if (typeof window === "undefined") return;

    setViewportWidth(window.innerWidth);
    window.addEventListener("resize", debouncedUpdateViewportWidth);

    return () => {
      window.removeEventListener("resize", debouncedUpdateViewportWidth);
    };
  }, [debouncedUpdateViewportWidth]);

  // Combined measurement effect with single ResizeObserver
  useEffect(() => {
    const r = wrapRef.current;
    const c = containerRef.current;
    if (!r || !c) return;

    const measure = () => {
      const computed = window.getComputedStyle(r);
      const parsed = parseFloat(computed.fontSize || "0");
      if (!Number.isNaN(parsed) && parsed > 0) setActiveFontSize(parsed);

      const w = r.clientWidth;
      const totalHeight = r.clientHeight;
      setBox({ w: Math.max(1, w), h: Math.max(1, totalHeight) });
      setContainerWidth(c.clientWidth || 0);
    };

    measure();

    const ro = new ResizeObserver(debouncedUpdateMeasurements);
    ro.observe(r);
    ro.observe(c);

    window.addEventListener("resize", debouncedUpdateMeasurements);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", debouncedUpdateMeasurements);
    };
  }, [debouncedUpdateMeasurements]);

  // Memoized path calculation with caching
  const calculatePaths = useCallback(async () => {
    if (!inView) return;
    if (!activeFontSize || activeFontSize <= 0) return;

    const upper = text.toUpperCase();
    const cacheKey = `${upper}-${activeFontSize}-${random}`;

    // Check cache first
    if (pathCache.has(cacheKey)) {
      const cachedPaths = pathCache.get(cacheKey);
      if (cachedPaths) {
        setPaths(cachedPaths);
        setMeasuredFontSize(activeFontSize);
        return;
      }
    }

    const font = await loadNdotFont();
    const unitsPerEm = font.unitsPerEm || 1000;
    const scale = activeFontSize / unitsPerEm;

    const r = wrapRef.current;
    if (!r) return;

    const wrapRect = r.getBoundingClientRect();
    const range = document.createRange();
    range.selectNodeContents(r);
    const rectList = Array.from(range.getClientRects());
    if (rectList.length === 0) {
      setPaths([]);
      return;
    }

    // Per-character rects from the DOM for exact wrapping and positions
    const segs: PathSeg[] = [];
    const childNodes = Array.from(r.childNodes);
    const textNode = childNodes.find((n) => n.nodeType === Node.TEXT_NODE);
    if (!textNode || !("textContent" in textNode)) {
      setPaths([]);
      return;
    }
    const content = (textNode as Text).textContent || "";
    // Ensure we measure exactly what is rendered
    if (content !== upper) {
      // Update measurement source
      range.selectNodeContents(r);
    }

    const toleranceY = 1; // px tolerance to group same visual line
    const charRects: {
      index: number;
      left: number;
      top: number;
      right: number;
      bottom: number;
    }[] = [];
    for (let i = 0; i < upper.length; i++) {
      range.setStart(textNode as Text, i);
      range.setEnd(textNode as Text, i + 1);
      const rects = Array.from(range.getClientRects());
      const rect = rects[0];
      if (!rect) continue;
      charRects.push({
        index: i,
        left: rect.left - wrapRect.left,
        top: rect.top - wrapRect.top,
        right: rect.right - wrapRect.left,
        bottom: rect.bottom - wrapRect.top,
      });
    }

    // Group chars into lines by their top coordinate
    const lines: {
      indices: number[];
      top: number;
      bottom: number;
      left: number;
      right: number;
    }[] = [];
    for (const cr of charRects) {
      let line = lines.find((l) => Math.abs(l.top - cr.top) <= toleranceY);
      if (!line) {
        line = {
          indices: [],
          top: cr.top,
          bottom: cr.bottom,
          left: cr.left,
          right: cr.right,
        };
        lines.push(line);
      }
      line.indices.push(cr.index);
      if (cr.left < line.left) line.left = cr.left;
      if (cr.right > line.right) line.right = cr.right;
      if (cr.bottom > line.bottom) line.bottom = cr.bottom;
    }
    lines.sort((a, b) => a.top - b.top);

    // Shift last two characters of each line to the start of the next line
    for (let i = 0; i < lines.length - 1; i++) {
      const curr = lines[i];
      const next = lines[i + 1];
      if (curr.indices.length >= 1) {
        const moved = curr.indices.splice(-1, 1);
        next.indices.unshift(...moved);
      }
    }

    // Build paths using DOM positions and font ascender for baseline
    const baselineFromTop = font.ascender * scale;
    for (let li = 0; li < lines.length; li++) {
      const line = lines[li];
      const baselineY = line.top + baselineFromTop;
      let xCursor = line.left;
      if (li >= 1 && line.indices.length > 0) {
        const firstChar = upper[line.indices[0]] || "";
        if (firstChar && firstChar !== "\n") {
          const fGlyphs = font.stringToGlyphs(firstChar);
          let firstAdvance = 0;
          for (let gi = 0; gi < fGlyphs.length; gi++) {
            const g = fGlyphs[gi];
            firstAdvance += (g.advanceWidth || 0) * scale;
          }
          xCursor -= firstAdvance;
        }
      }
      for (const charIndex of line.indices) {
        const ch = upper[charIndex] || "";
        if (ch === "\n") continue;
        const glyphs = font.stringToGlyphs(ch);
        for (let gi = 0; gi < glyphs.length; gi++) {
          const g = glyphs[gi];
          const next = glyphs[gi + 1];
          const kern = next ? font.getKerningValue(g, next) : 0;
          const path = g.getPath(xCursor, baselineY, activeFontSize);
          let d = "";
          let minX = Infinity,
            minY = Infinity,
            maxX = -Infinity,
            maxY = -Infinity;
          const pushSeg = () => {
            if (!d) return;
            const cx = (minX + maxX) / 2;
            const cy = (minY + maxY) / 2;
            segs.push({ d, cx, cy, line: li });
          };
          let started = false;
          for (const c of path.commands) {
            const upd = (px?: number, py?: number) => {
              if (typeof px === "number") {
                if (px < minX) minX = px;
                if (px > maxX) maxX = px;
              }
              if (typeof py === "number") {
                if (py < minY) minY = py;
                if (py > maxY) maxY = py;
              }
            };
            if (c.type === "M") {
              if (started) pushSeg();
              d = `M${c.x} ${c.y}`;
              minX = Infinity;
              minY = Infinity;
              maxX = -Infinity;
              maxY = -Infinity;
              upd(c.x, c.y);
              started = true;
            } else if (c.type === "L") {
              d += `L${c.x} ${c.y}`;
              upd(c.x, c.y);
            } else if (c.type === "C") {
              d += `C${c.x1} ${c.y1} ${c.x2} ${c.y2} ${c.x} ${c.y}`;
              upd(c.x1, c.y1);
              upd(c.x2, c.y2);
              upd(c.x, c.y);
            } else if (c.type === "Q") {
              d += `Q${c.x1} ${c.y1} ${c.x} ${c.y}`;
              upd(c.x1, c.y1);
              upd(c.x, c.y);
            } else if (c.type === "Z") {
              d += "Z";
            }
          }
          if (started) pushSeg();
          const adv = ((g.advanceWidth || 0) + kern) * scale;
          xCursor += adv;
        }
      }
    }

    const byLine: Map<number, PathSeg[]> = new Map();
    for (const s of segs) {
      const arr = byLine.get(s.line) || [];
      arr.push(s);
      byLine.set(s.line, arr);
    }
    const ordered: PathSeg[] = [];
    const tolerance = 0.6;
    const lineKeys = Array.from(byLine.keys()).sort((a, b) => a - b);
    for (const li of lineKeys) {
      const items = byLine.get(li) || [];
      items.sort((a, b) => a.cy - b.cy || a.cx - b.cx);
      const rows: PathSeg[][] = [];
      for (const it of items) {
        let row = rows.find((r) => Math.abs(r[0].cy - it.cy) <= tolerance);
        if (!row) {
          row = [];
          rows.push(row);
        }
        row.push(it);
      }
      rows.sort((a, b) => a[0].cy - b[0].cy);
      for (const row of rows) {
        row.sort((a, b) => a.cx - b.cx);
      }
      for (let ri = 0; ri < rows.length - 1; ri++) {
        const curr = rows[ri];
        const next = rows[ri + 1];
        if (curr.length >= 2) {
          const moved = curr.splice(-2, 2);
          if (moved.length) next.unshift(...moved);
        }
      }
      for (const row of rows) {
        for (const it of row) ordered.push(it);
      }
    }

    let finalPaths = ordered;
    if (random) {
      const shuffled = [...ordered];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const t = shuffled[i];
        shuffled[i] = shuffled[j];
        shuffled[j] = t;
      }
      finalPaths = shuffled;
    }

    pathCache.set(cacheKey, finalPaths);
    cleanupCache();
    setPaths(finalPaths);
    setMeasuredFontSize(activeFontSize);
  }, [text, activeFontSize, inView, random]);

  useEffect(() => {
    let mounted = true;
    calculatePaths().then(() => {
      if (!mounted) return;
    });
    return () => {
      mounted = false;
    };
  }, [calculatePaths]);

  useEffect(() => {
    if (!inView) return;
    if (paths.length === 0) return;

    setVisibleCount(0);

    const startAfterMs = (delay || 0) * 1000;
    const totalPaths = paths.length;
    let rafId: number | undefined;
    let startTimestamp: number | null = null;
    let started = false;

    const tick = (timestamp: number) => {
      if (startTimestamp === null) startTimestamp = timestamp;
      if (!started) {
        if (timestamp - startTimestamp < startAfterMs) {
          rafId = window.requestAnimationFrame(tick);
          return;
        }
        started = true;
        startTimestamp = timestamp;
      }
      const elapsed = timestamp - startTimestamp;
      const steps = Math.floor(elapsed / gap) * speed;
      const next = Math.min(steps, totalPaths);
      setVisibleCount((prev) => (prev !== next ? next : prev));
      if (next < totalPaths) {
        rafId = window.requestAnimationFrame(tick);
      }
    };

    rafId = window.requestAnimationFrame(tick);

    return () => {
      if (rafId !== undefined) window.cancelAnimationFrame(rafId);
    };
  }, [inView, paths.length, delay, gap, speed]);

  useEffect(() => {
    let timeoutId: number | undefined;
    if (paths.length > 0 && visibleCount >= paths.length) {
      timeoutId = window.setTimeout(() => {
        setRevealComplete(true);
      }, 150);
    } else {
      setRevealComplete(false);
    }
    return () => {
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
    };
  }, [visibleCount, paths.length]);

  // Memoized animation variants to prevent recreation on every render
  const svgV = useMemo(() => ({ hidden: {}, show: {} }), []);
  const dotV = useMemo(
    () => ({
      hidden: { opacity: 0.8, scale: decorative ? 0 : 1 },
      show: { opacity: 1, scale: decorative ? 1 : 1 },
    }),
    [decorative]
  );

  // Memoized transition config
  const transition = useMemo(
    () => ({ duration: 0.15, ease: "easeOut" as const }),
    []
  );

  // Compute font size for real text in decorative mode to match SVG scaled width
  const decorativeRealTextFontSize = useMemo(() => {
    if (!decorative) return undefined;
    if (!revealComplete) return undefined;
    if (!measuredFontSize || box.w <= 0 || containerWidth <= 0)
      return undefined;
    const scaled = (measuredFontSize * containerWidth) / box.w;
    return `${scaled}px`;
  }, [decorative, measuredFontSize, box.w, containerWidth, revealComplete]);

  if (viewportWidth === null) {
    return (
      <span
        ref={containerRef}
        className={cn("relative flex", decorative && "w-full")}
      >
        <span
          ref={wrapRef}
          className={cn(
            className,
            "trim-text whitespace-pre font-ndot leading-[1.3em]",
            decorative && "pointer-events-none absolute top-0 left-0 opacity-0"
          )}
          style={{
            color: "transparent",
          }}
          aria-hidden={decorative}
        >
          {children}
        </span>
      </span>
    );
  }

  return (
    <span
      ref={containerRef}
      className={cn("relative flex  pb-2.5", decorative && "w-full")}
    >
      <span
        ref={wrapRef}
        className={cn(
          className,
          "trim-text whitespace-pre font-ndot leading-[1.3em] text-transparent!",
          decorative && "pointer-events-none absolute top-0 left-0 opacity-0"
        )}
        aria-hidden={decorative}
      >
        {text.toUpperCase()}
      </span>
      {decorative && decorativeRealTextFontSize && (
        <span
          className={cn(
            className,
            "trim-text absolute top-0 left-0 whitespace-pre font-ndot text-transparent leading-[1.3em]"
          )}
          style={{
            fontSize: decorativeRealTextFontSize,
          }}
          aria-hidden={true}
        >
          {text.toUpperCase()}
        </span>
      )}
      <LazyMotion features={domAnimation}>
        <m.svg
          viewBox={`0 0 ${box.w} ${box.h}`}
          preserveAspectRatio="xMinYMin meet"
          initial="hidden"
          animate={inView ? "show" : "hidden"}
          variants={svgV}
          className={cn(
            "pointer-events-none",
            decorative ? "h-auto w-full" : "absolute top-0 left-0 h-full w-full"
          )}
          aria-hidden={decorative ? true : undefined}
          role={!decorative && text.trim().length > 0 ? "img" : undefined}
          aria-label={!decorative && text.trim().length > 0 ? text : undefined}
          focusable={decorative ? false : undefined}
        >
          <title>{text}</title>
          {paths.slice(0, visibleCount).map((p, i) => (
            <m.path
              key={`${p.d}-${i}`}
              d={p.d}
              fill="currentColor"
              variants={dotV}
              transition={transition}
            />
          ))}
        </m.svg>
      </LazyMotion>
    </span>
  );
}
