"use client";

import { useMotionValueEvent, useReducedMotion, useScroll } from "motion/react";
import { useEffect, useRef } from "react";

const ASCII_CHARS = "#N$976543210?!abcxyz;:+=-_,. ".split("");
const DEFAULT_DUR = 500;
export const VIDEO_CROSSFADE_MS = 750;

export default function AsciiPre() {
  const prefersReducedMotion = useReducedMotion();

  const preRef = useRef<HTMLPreElement | null>(null);
  const rafRef = useRef<number>(0);
  const lastFrameRef = useRef<number>(0);
  const isRunningRef = useRef<boolean>(false);
  const backgroundElementsRef = useRef<
    Array<{ element: HTMLElement; value: number; offsetTop: number }>
  >([]);

  type Active = { c: string; t: number; d: number; s: number[] };

  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (current) => {
    const getCurrentVideoNumber = (scrollPosition: number): number | null => {
      const elements = backgroundElementsRef.current;
      if (elements.length === 0) return null;

      const viewportHeight = window.innerHeight;
      const threshold = viewportHeight * 0.5; // 50vh

      // Find the closest element above the scroll position
      let closestElement = null;
      for (let i = elements.length - 1; i >= 0; i--) {
        if (elements[i].offsetTop <= scrollPosition) {
          closestElement = elements[i];
          break;
        }
      }

      if (!closestElement) return null;

      const nextElementIndex = elements.findIndex(
        (el) => el.offsetTop > closestElement.offsetTop,
      );
      if (nextElementIndex !== -1) {
        const nextElement = elements[nextElementIndex];
        if (nextElement.offsetTop - scrollPosition < threshold) {
          return nextElement.value;
        }
      }

      return closestElement.value;
    };

    const newVideoNumber = getCurrentVideoNumber(current);
    const s = stateRef.current;

    if (newVideoNumber !== s.currentVideoNumber) {
      s.currentVideoNumber = newVideoNumber;

      if (newVideoNumber === null) {
        // Fade out to no background
        if (s.currentVideo) {
          s.previousVideo = s.currentVideo;
          s.previousVideoW = s.currentVideoW;
          s.previousVideoH = s.currentVideoH;
          s.transitionStart = performance.now();
          s.currentVideo = null;
          s.currentVideoReady = false;
        }
      } else {
        // Switch to new video
        const preloadedVideo = s.preloadedVideos.get(newVideoNumber);
        if (preloadedVideo && preloadedVideo !== s.currentVideo) {
          if (s.currentVideo) {
            s.previousVideo = s.currentVideo;
            s.previousVideoW = s.currentVideoW;
            s.previousVideoH = s.currentVideoH;
            s.transitionStart = performance.now();
          }
          s.currentVideo = preloadedVideo;
          const ready = preloadedVideo.videoWidth && preloadedVideo.videoHeight;
          const boot = () => {
            s.currentVideoW = preloadedVideo.videoWidth;
            s.currentVideoH = preloadedVideo.videoHeight;
            s.currentVideoReady = true;
            preloadedVideo.currentTime = 0;
            preloadedVideo.play().catch(() => {});
          };
          if (ready) boot();
          else preloadedVideo.onloadedmetadata = boot;
        }
      }
    }
  });

  const stateRef = useRef<{
    cell: number;
    cellX: number;
    cols: number;
    rows: number;
    actives: Map<number, Active>;
    off: HTMLCanvasElement | null;
    offCtx: CanvasRenderingContext2D | null;
    currentVideo: HTMLVideoElement | null;
    previousVideo: HTMLVideoElement | null;
    currentVideoReady: boolean;
    currentVideoW: number;
    currentVideoH: number;
    previousVideoW: number;
    previousVideoH: number;
    startedAt: number;
    pauseAt: number | 0;
    transitionStart: number;
    transitionDur: number;
    luminanceCache: Map<string, number>;
    lastFrameHash: string;
    preloadedVideos: Map<number, HTMLVideoElement>;
    currentVideoNumber: number | null;
  }>({
    cell: 18,
    cellX: 18,
    cols: 0,
    rows: 0,
    actives: new Map<number, Active>(),
    off: null,
    offCtx: null,
    currentVideo: null,
    previousVideo: null,
    currentVideoReady: false,
    currentVideoW: 0,
    currentVideoH: 0,
    previousVideoW: 0,
    previousVideoH: 0,
    startedAt: 0,
    pauseAt: 0,
    transitionStart: 0,
    transitionDur: VIDEO_CROSSFADE_MS,
    luminanceCache: new Map<string, number>(),
    lastFrameHash: "",
    preloadedVideos: new Map<number, HTMLVideoElement>(),
    currentVideoNumber: null,
  });

  useEffect(() => {
    if (prefersReducedMotion) return;
    const TARGET_FPS = 24;
    const FRAME_INTERVAL = 1000 / TARGET_FPS;

    const updateBackgroundElements = () => {
      const elements = document.querySelectorAll("[data-background]");
      backgroundElementsRef.current = Array.from(elements)
        .map((element) => {
          const htmlElement = element as HTMLElement;
          const value = parseInt(
            htmlElement.getAttribute("data-background") || "0",
            10,
          );
          return {
            element: htmlElement,
            value: Number.isNaN(value) ? 0 : value,
            offsetTop: htmlElement.offsetTop,
          };
        })
        .sort((a, b) => a.offsetTop - b.offsetTop);
    };

    const waitForFont = async () => {
      if ("fonts" in document) {
        try {
          await document.fonts.load('1em "Geist Mono"');
        } catch {}
      }
    };

    const renderVideoToOffscreen = (
      s: typeof stateRef.current,
      vid: HTMLVideoElement,
      vw: number,
      vh: number,
      alpha: number,
    ) => {
      if (!(s.offCtx && s.off)) return;
      const oc = s.offCtx;
      const cols = s.cols;
      const rows = s.rows;
      const aspectX = s.cellX / s.cell || 1;
      const effectiveCols = cols * aspectX;
      const scale = Math.max(effectiveCols / vw, rows / vh);
      const drawW = vw * scale;
      const drawH = vh * scale;
      const dx = (effectiveCols - drawW) / 2;
      const dy = (rows - drawH) / 2;
      oc.save();
      oc.globalAlpha = alpha;
      oc.scale(1 / aspectX, 1);
      oc.drawImage(vid, dx, dy, drawW, drawH);
      oc.restore();
    };

    const setup = async () => {
      await waitForFont();
      const s = stateRef.current;
      const w = window.innerWidth;
      const h = window.innerHeight;
      const el = preRef.current;
      let letterSpacingPx = 6;
      if (el) {
        el.style.fontFamily = '"Geist Mono", ui-monospace, monospace';
        el.style.fontSize = `${s.cell}px`;
        el.style.lineHeight = `${s.cell}px`;
        el.style.whiteSpace = "pre";
        el.style.letterSpacing = `${letterSpacingPx}px`;
      }
      if (el) {
        const cs = getComputedStyle(el);
        const ls = cs.letterSpacing || "0px";
        if (ls.endsWith("px")) letterSpacingPx = parseFloat(ls);
        else if (ls.endsWith("em")) letterSpacingPx = parseFloat(ls) * s.cell;
      }
      const probe = document.createElement("span");
      probe.textContent = "M".repeat(200);
      probe.style.position = "absolute";
      probe.style.visibility = "hidden";
      probe.style.whiteSpace = "pre";
      probe.style.fontFamily = '"Geist Mono", ui-monospace, monospace';
      probe.style.fontSize = `${s.cell}px`;
      probe.style.letterSpacing = "0px";
      document.body.appendChild(probe);
      const adv = probe.getBoundingClientRect().width / 200 || s.cell;
      document.body.removeChild(probe);
      s.cellX = adv + letterSpacingPx;
      s.cols = Math.floor((w + letterSpacingPx) / s.cellX);
      s.rows = Math.floor(h / s.cell);

      const actualTextWidth = s.cols * s.cellX - letterSpacingPx;
      const remainingGap = w - actualTextWidth;
      const sideMargin = Math.max(0, remainingGap / 2);

      if (el) {
        el.style.marginLeft = `${sideMargin}px`;
        el.style.marginRight = `${sideMargin}px`;
      }

      if (!s.off) s.off = document.createElement("canvas");
      s.off.width = s.cols;
      s.off.height = s.rows;
      s.offCtx = s.off.getContext("2d", { willReadFrequently: true });

      if (!s.startedAt) s.startedAt = performance.now();
    };

    const draw = (nowHr?: number) => {
      const s = stateRef.current;
      const { cols, rows, actives } = s;
      const now = nowHr ?? performance.now();
      const sinceLast = now - lastFrameRef.current;
      if (sinceLast < FRAME_INTERVAL) {
        rafRef.current = requestAnimationFrame(draw);
        return;
      }
      lastFrameRef.current = now - (sinceLast % FRAME_INTERVAL);

      let frameData: Uint8ClampedArray | null = null;
      let frameHash = "";

      if (s.offCtx && s.off) {
        s.offCtx.clearRect(0, 0, s.off.width, s.off.height);
        if (s.currentVideo && s.currentVideoReady) {
          let alpha = 1;
          if (s.previousVideo && s.transitionStart) {
            const t =
              (now - s.transitionStart) /
              (s.transitionDur || VIDEO_CROSSFADE_MS);
            alpha = Math.max(0, Math.min(1, t));
            renderVideoToOffscreen(
              s,
              s.previousVideo,
              s.previousVideoW,
              s.previousVideoH,
              1 - alpha,
            );
            if (t >= 1) {
              s.previousVideo = null;
              s.transitionStart = 0;
            }
          }
          renderVideoToOffscreen(
            s,
            s.currentVideo,
            s.currentVideoW,
            s.currentVideoH,
            alpha,
          );
        }
        const imageData = s.offCtx.getImageData(
          0,
          0,
          s.off.width,
          s.off.height,
        );
        frameData = imageData.data;
        frameHash = `${s.currentVideoReady}-${s.previousVideo ? 1 : 0}`;
      }

      const getCharFromBuffer = (x: number, y: number): string => {
        if (!frameData) return " ";
        const i = (y * cols + x) * 4;
        const a = frameData[i + 3];
        if (a === 0) return " ";
        const r = frameData[i + 0];
        const g = frameData[i + 1];
        const b = frameData[i + 2];
        const cacheKey = `${r},${g},${b}`;
        let lum = s.luminanceCache.get(cacheKey);
        if (lum === undefined) {
          lum = (54 * r + 183 * g + 18 * b) >> 8;
          s.luminanceCache.set(cacheKey, lum);
        }
        const idx = Math.max(
          0,
          Math.min(
            ASCII_CHARS.length - 1,
            Math.round((lum * (ASCII_CHARS.length - 1)) / 255),
          ),
        );
        return ASCII_CHARS[idx];
      };

      if (frameHash !== s.lastFrameHash) {
        s.luminanceCache.clear();
        s.lastFrameHash = frameHash;
      }

      let out = "";
      for (let y = 0; y < rows; y++) {
        let rowStr = "";
        for (let x = 0; x < cols; x++) {
          const key = y * cols + x;
          const a = actives.get(key);
          let char = " ";
          if (a) {
            const localDur = a.d ?? DEFAULT_DUR;
            const age = now - a.t;
            if (age >= 0 && age < localDur) {
              const progress = Math.min(1, Math.max(0, age / localDur));
              const steps = 4;
              const stepIdx = Math.min(steps - 1, Math.floor(progress * steps));
              const seq =
                a.s?.length === steps ? a.s : [0, 1, 2, ASCII_CHARS.length - 1];
              char = ASCII_CHARS[seq[stepIdx]];
            } else if (age >= localDur) {
              actives.delete(key);
              char = getCharFromBuffer(x, y);
            }
          } else {
            char = getCharFromBuffer(x, y);
          }
          rowStr += char;
        }
        out += rowStr + (y < rows - 1 ? "\n" : "");
      }

      const el = preRef.current;
      if (el) el.textContent = out;

      rafRef.current = requestAnimationFrame(draw);
    };

    const preloadVideos = async () => {
      const s = stateRef.current;
      const pad = (n: number) => n.toString().padStart(2, "0");
      for (let i = 1; i <= 6; i++) {
        if (!s.preloadedVideos.has(i)) {
          const video = document.createElement("video");
          video.playsInline = true;
          video.muted = true;
          video.loop = true;
          video.preload = "auto";
          video.src = `/ascii/${pad(i)}.mp4`;
          s.preloadedVideos.set(i, video);
          video.load();
        }
      }
    };

    const start = async () => {
      if (isRunningRef.current) return;
      await setup();
      await preloadVideos();
      updateBackgroundElements();
      isRunningRef.current = true;
      lastFrameRef.current = 0;
      rafRef.current = requestAnimationFrame(draw);

      const currentScroll = window.scrollY;
      const getCurrentVideoNumber = (scrollPosition: number): number | null => {
        const elements = backgroundElementsRef.current;
        if (elements.length === 0) return null;

        const viewportHeight = window.innerHeight;
        const threshold = viewportHeight * 0.5; // 50vh

        let closestElement = null;
        for (let i = elements.length - 1; i >= 0; i--) {
          if (elements[i].offsetTop <= scrollPosition) {
            closestElement = elements[i];
            break;
          }
        }

        if (!closestElement) return null;

        const nextElementIndex = elements.findIndex(
          (el) => el.offsetTop > closestElement.offsetTop,
        );
        if (nextElementIndex !== -1) {
          const nextElement = elements[nextElementIndex];
          if (nextElement.offsetTop - scrollPosition < threshold) {
            return nextElement.value;
          }
        }

        return closestElement.value;
      };

      const initialVideoNumber = getCurrentVideoNumber(currentScroll);
      const s = stateRef.current;
      s.currentVideoNumber = initialVideoNumber;

      if (initialVideoNumber !== null) {
        const preloadedVideo = s.preloadedVideos.get(initialVideoNumber);
        if (preloadedVideo) {
          s.currentVideo = preloadedVideo;
          const ready = preloadedVideo.videoWidth && preloadedVideo.videoHeight;
          const boot = () => {
            s.currentVideoW = preloadedVideo.videoWidth;
            s.currentVideoH = preloadedVideo.videoHeight;
            s.currentVideoReady = true;
            preloadedVideo.currentTime = 0;
            preloadedVideo.play().catch(() => {});
          };
          if (ready) boot();
          else preloadedVideo.onloadedmetadata = boot;
        }
      }
    };

    const stop = () => {
      if (!isRunningRef.current) return;
      isRunningRef.current = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    };

    const onVisibility = () => {
      const s = stateRef.current;
      if (document.hidden) {
        s.pauseAt = performance.now();
        stop();
      } else {
        if (s.pauseAt) {
          const now = performance.now();
          s.startedAt += now - s.pauseAt;
          s.pauseAt = 0;
        }
        start();
      }
    };

    const stamp = (cx: number, cy: number) => {
      const s = stateRef.current;
      const { cell, cellX, cols, rows } = s;
      const x = Math.max(0, Math.min(cols - 1, Math.floor(cx / cellX)));
      const y = Math.max(0, Math.min(rows - 1, Math.floor(cy / cell)));
      const tBase = performance.now();
      const radius = 6;
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          if (dx * dx + dy * dy > radius * radius) continue;
          if (Math.random() > 0.05) continue;
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue;
          const key = ny * cols + nx;
          const existing = stateRef.current.actives.get(key);
          const now = performance.now();
          if (existing) {
            const localDur = existing.d ?? DEFAULT_DUR;
            const age = now - existing.t;
            if (age >= 0 && age < localDur) continue;
          }
          const c = ASCII_CHARS[(Math.random() * ASCII_CHARS.length) | 0];
          const jitter = 0.8 + Math.random() * 0.6;
          const lastIdx = ASCII_CHARS.length - 1;
          const chosen: Set<number> = new Set();
          while (chosen.size < 3 && lastIdx > 0) {
            const idx = (Math.random() * lastIdx) | 0;
            chosen.add(idx);
          }
          const seq = Array.from(chosen.values())
            .concat([lastIdx])
            .sort((a, b) => a - b);
          stateRef.current.actives.set(key, {
            c,
            t: tBase,
            d: DEFAULT_DUR * jitter,
            s: seq,
          });
        }
      }
    };

    const onMove = (e: MouseEvent) => {
      const el = preRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      stamp(e.clientX - r.left, e.clientY - r.top);
    };

    const onResize = async () => {
      stateRef.current.actives.clear();
      await setup();
      updateBackgroundElements();
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("resize", onResize);
    document.addEventListener("visibilitychange", onVisibility);
    start();

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibility);
      stop();
    };
  }, [prefersReducedMotion]);

  return prefersReducedMotion ? (
    <span>.</span>
  ) : (
    <div className="pointer-events-none fixed top-0 left-0 z-[-5] size-full h-screen w-full overflow-x-hidden overflow-y-hidden">
      <pre
        ref={preRef}
        className="z-0 size-full select-none font-mono text-[#d7d7d7] text-[18px] leading-none"
        aria-hidden="true"
      />
    </div>
  );
}
