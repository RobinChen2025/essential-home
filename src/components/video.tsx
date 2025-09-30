"use client";

import Player from "@vimeo/player";
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useScroll,
} from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import ExitFullscreenIcon from "@/icons/exit-fullscreen-icon";
import FullscreenIcon from "@/icons/fullscreen-icon";
import MuteIcon from "@/icons/mute-icon";
import PauseIcon from "@/icons/pause-icon";
import PlayIcon from "@/icons/play-icon";
import UnmuteIcon from "@/icons/unmute-icon";
import { cn } from "@/lib/utils";

export default function Video({
  vimeoId,
  disableScroll = false,
}: {
  vimeoId: string | number;
  disableScroll?: boolean;
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isControlsHovered, setIsControlsHovered] = useState(false);
  const [isVideoHovered, setIsVideoHovered] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [proximity, setProximity] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [bufferedPercent, setBufferedPercent] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSeeking, setIsSeeking] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<Player | null>(null);
  const prevVolumeRef = useRef(1);
  const hideControlsTimeoutRef = useRef<number | null>(null);
  const seekBarRef = useRef<HTMLDivElement>(null);

  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", () => {
    if (disableScroll) {
      setProximity(0);
      return;
    }
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const centerY = rect.top + rect.height / 2;
    const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
    const start = 1 * viewportHeight;
    const end = 0.5 * viewportHeight;
    const t = (start - centerY) / (start - end);
    const value = Math.max(0, Math.min(1, t));
    setProximity(value);
  });

  useEffect(() => {
    if (!vimeoId) return;
    if (!playerContainerRef.current) return;
    if (playerRef.current) {
      playerRef.current.destroy().catch(() => {});
      playerRef.current = null;
    }
    const player = new Player(playerContainerRef.current, {
      id: typeof vimeoId === "string" ? parseInt(vimeoId, 10) : vimeoId,
      controls: false,
      dnt: true,
      byline: false,
      title: false,
      portrait: false,
      autoplay: true,
      autopause: true,
      responsive: true,
      playsinline: true,
      background: false,
      muted: false,
      transparent: true,
      loop: true,
    });
    playerRef.current = player;

    player
      .getDuration()
      .then((d) => setDuration(d || 0))
      .catch(() => {});
    player
      .getVolume()
      .then((v) => setVolume(v ?? 1))
      .catch(() => {});
    player
      .getMuted()
      .then((m) => setIsMuted(!!m))
      .catch(() => {});

    const timeHandler = (data: { seconds: number }) => {
      setCurrentTime(data.seconds || 0);
    };
    const playHandler = () => setIsPlaying(true);
    const pauseHandler = () => setIsPlaying(false);
    const progressHandler = (data: { percent: number }) => {
      setBufferedPercent(typeof data.percent === "number" ? data.percent : 0);
    };
    const volumeChangeHandler = () => {
      player
        .getVolume()
        .then((v) => setVolume(v ?? 1))
        .catch(() => {});
      player
        .getMuted()
        .then((m) => setIsMuted(!!m))
        .catch(() => {});
    };

    player.on("timeupdate", timeHandler);
    player.on("play", playHandler);
    player.on("pause", pauseHandler);
    player.on("progress", progressHandler);
    player.on("volumechange", volumeChangeHandler);

    return () => {
      player.off("timeupdate", timeHandler);
      player.off("play", playHandler);
      player.off("pause", pauseHandler);
      player.off("progress", progressHandler);
      player.off("volumechange", volumeChangeHandler);
      player.destroy().catch(() => {});
      playerRef.current = null;
    };
  }, [vimeoId]);

  useEffect(() => {
    const onFsChange = () => {
      const el = containerRef.current;
      setIsFullscreen(!!el && document.fullscreenElement === el);
    };
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  useEffect(() => {
    const onDocPointerMove = (e: PointerEvent) => {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const inside =
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom;
      if (!inside) {
        if (hideControlsTimeoutRef.current)
          window.clearTimeout(hideControlsTimeoutRef.current);
        setIsVideoHovered(false);
        if (!isControlsHovered) setShowControls(false);
      }
    };
    document.addEventListener("pointermove", onDocPointerMove);
    return () => document.removeEventListener("pointermove", onDocPointerMove);
  }, [isControlsHovered]);

  useEffect(() => {
    return () => {
      if (hideControlsTimeoutRef.current)
        window.clearTimeout(hideControlsTimeoutRef.current);
    };
  }, []);

  const clamp = useCallback(
    (v: number, min: number, max: number) => Math.max(min, Math.min(max, v)),
    [],
  );
  const percentFromEvent = useCallback(
    (clientX: number) => {
      const el = seekBarRef.current;
      if (!el || duration <= 0) return 0;
      const rect = el.getBoundingClientRect();
      const width = rect.width - 32;
      const x = clamp(clientX - 16 - rect.left, 0, width);
      return width === 0 ? 0 : x / width;
    },
    [duration, clamp],
  );
  const handleSeekToPercent = useCallback(
    (percent: number) => {
      const p = clamp(percent, 0, 1);
      const t = p * (duration || 0);
      setCurrentTime(t);
      const player = playerRef.current;
      if (player) player.setCurrentTime(t).catch(() => {});
    },
    [duration, clamp],
  );
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!isSeeking) return;
      handleSeekToPercent(percentFromEvent(e.clientX));
    };
    const onUp = () => {
      if (!isSeeking) return;
      setIsSeeking(false);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [isSeeking, percentFromEvent, handleSeekToPercent]);

  return (
    <motion.div
      ref={containerRef}
      className={
        isFullscreen
          ? "relative top-0 flex aspect-video w-full items-center justify-center p-0"
          : "relative aspect-video w-full p-px"
      }
      animate={{
        maxWidth: disableScroll
          ? "1000px"
          : `calc(1000px + ${proximity * 250}px)`,
      }}
      transition={{
        duration: 0.3,
        ease: "easeOut",
        type: "tween",
      }}
      onMouseEnter={() => {
        setIsVideoHovered(true);
        setShowControls(true);
        if (hideControlsTimeoutRef.current)
          window.clearTimeout(hideControlsTimeoutRef.current);
      }}
      onMouseLeave={() => {
        setIsVideoHovered(false);
        if (hideControlsTimeoutRef.current)
          window.clearTimeout(hideControlsTimeoutRef.current);
        if (!isControlsHovered) setShowControls(false);
      }}
      onPointerMove={() => {
        setShowControls(true);
        if (hideControlsTimeoutRef.current)
          window.clearTimeout(hideControlsTimeoutRef.current);
        hideControlsTimeoutRef.current = window.setTimeout(() => {
          if (isVideoHovered && !isControlsHovered) setShowControls(false);
        }, 3000);
      }}
      onTouchStart={() => {
        setIsVideoHovered(true);
        setShowControls(true);
        if (hideControlsTimeoutRef.current)
          window.clearTimeout(hideControlsTimeoutRef.current);
        hideControlsTimeoutRef.current = window.setTimeout(() => {
          if (isVideoHovered && !isControlsHovered) setShowControls(false);
        }, 3000);
      }}
      onViewportLeave={() => {
        const p = playerRef.current;
        if (!p) return;
        p.setMuted(true);
      }}
    >
      <div
        ref={playerContainerRef}
        className={cn(
          "relative z-0 aspect-video w-full overflow-hidden",
          !isFullscreen && "rounded-[20px]",
        )}
      />
      <button
        type="button"
        className="absolute inset-0 cursor-pointer"
        onClick={() => {
          const p = playerRef.current;
          if (!p) return;
          if (isPlaying) p.pause();
          else p.play();
        }}
      />
      <AnimatePresence initial={false}>
        {(isControlsHovered || showControls) && (
          <motion.div
            className="absolute bottom-0 z-10 flex w-full items-end justify-between p-2 md:p-4"
            initial={{ visibility: "hidden" }}
            animate={{ visibility: "visible" }}
            exit={{ visibility: "hidden" }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            onMouseEnter={() => {
              setIsControlsHovered(true);
              setShowControls(true);
              if (hideControlsTimeoutRef.current)
                window.clearTimeout(hideControlsTimeoutRef.current);
            }}
            onMouseLeave={() => {
              setIsControlsHovered(false);
              if (hideControlsTimeoutRef.current)
                window.clearTimeout(hideControlsTimeoutRef.current);
              if (!isVideoHovered) {
                setShowControls(false);
              } else {
                hideControlsTimeoutRef.current = window.setTimeout(() => {
                  if (!isControlsHovered) setShowControls(false);
                }, 3000);
              }
            }}
          >
            <div className="flex w-full shrink-0 items-center gap-2 p-2">
              {/* Play/Pause */}
              <button
                type="button"
                className="flex size-8 cursor-pointer items-center justify-center rounded-full bg-white/20 backdrop-blur-3xl"
                onClick={(e) => {
                  e.stopPropagation();
                  const p = playerRef.current;
                  if (!p) return;
                  if (isPlaying) p.pause();
                  else p.play();
                }}
              >
                <AnimatePresence mode="wait">
                  {isPlaying ? (
                    <motion.span
                      key="pause"
                      initial={{ opacity: 0.5 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0.5 }}
                      transition={{
                        duration: 0.1,
                        ease: "easeOut",
                      }}
                    >
                      <PauseIcon />
                    </motion.span>
                  ) : (
                    <motion.span
                      key="play"
                      initial={{ opacity: 0.5 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0.5 }}
                      transition={{
                        duration: 0.1,
                        ease: "easeOut",
                      }}
                    >
                      <PlayIcon />
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
              {/* Seek */}
              <div
                ref={seekBarRef}
                role="slider"
                aria-valuemin={0}
                aria-valuemax={Math.max(1, Math.floor(duration))}
                aria-valuenow={Math.floor(currentTime)}
                aria-label="Seek"
                tabIndex={0}
                className="group relative flex h-8 w-full flex-1 cursor-pointer items-center justify-center overflow-hidden rounded-full bg-white/20 px-4 backdrop-blur-3xl"
                onPointerUp={(e) => {
                  e.stopPropagation();
                  setIsSeeking(true);
                  handleSeekToPercent(percentFromEvent(e.clientX));
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleSeekToPercent(percentFromEvent(e.clientX));
                }}
                onKeyDown={(e) => {
                  if (duration <= 0) return;
                  let handled = true;
                  if (e.key === "ArrowRight") {
                    handleSeekToPercent((currentTime + 5) / duration);
                  } else if (e.key === "ArrowLeft") {
                    handleSeekToPercent((currentTime - 5) / duration);
                  } else if (e.key === "Home") {
                    handleSeekToPercent(0);
                  } else if (e.key === "End") {
                    handleSeekToPercent(1);
                  } else {
                    handled = false;
                  }
                  if (handled) e.preventDefault();
                }}
              >
                <div className="relative h-1 w-full rounded-full bg-essential-grey-dark">
                  <div
                    className="absolute inset-y-0 left-0 rounded bg-essential-grey-darker"
                    style={{ width: `${bufferedPercent * 100}%` }}
                  />
                  <div
                    className="absolute inset-y-0 left-0 rounded bg-black"
                    style={{
                      width: `${duration ? (currentTime / duration) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
              {/* Volume */}
              <button
                type="button"
                className="flex size-8 cursor-pointer items-center justify-center rounded-full bg-white/20 backdrop-blur-3xl"
                onClick={(e) => {
                  e.stopPropagation();
                  const p = playerRef.current;
                  if (!p) return;
                  if (isMuted || volume === 0) {
                    const target = prevVolumeRef.current || volume || 1;
                    setIsMuted(false);
                    setVolume(target);
                    Promise.allSettled([
                      p.setMuted(false),
                      p.setVolume(target),
                    ]);
                  } else {
                    prevVolumeRef.current = volume;
                    setIsMuted(true);
                    Promise.allSettled([p.setMuted(true)]);
                  }
                }}
              >
                <AnimatePresence mode="wait">
                  {!isMuted && volume > 0 ? (
                    <motion.span
                      key="mute"
                      initial={{ opacity: 0.5 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0.5 }}
                      transition={{ duration: 0.1, ease: "easeOut" }}
                    >
                      <UnmuteIcon />
                    </motion.span>
                  ) : (
                    <motion.span
                      key="unmute"
                      initial={{ opacity: 0.5 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0.5 }}
                      transition={{ duration: 0.1, ease: "easeOut" }}
                    >
                      <MuteIcon className="translate-x-px" />
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
              {/* Fullscreen */}
              <button
                type="button"
                className="flex size-8 cursor-pointer items-center justify-center rounded-full bg-white/20 backdrop-blur-3xl"
                onClick={(e) => {
                  e.stopPropagation();
                  const el = containerRef.current;
                  if (!el) return;
                  if (!document.fullscreenElement) {
                    el.requestFullscreen().catch(() => {});
                    setShowControls(true);
                  } else {
                    document.exitFullscreen().catch(() => {});
                  }
                }}
              >
                <AnimatePresence mode="wait">
                  {isFullscreen ? (
                    <motion.span
                      key="exit-fullscreen"
                      initial={{ opacity: 0.5 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0.5 }}
                      transition={{ duration: 0.1, ease: "easeOut" }}
                    >
                      <ExitFullscreenIcon />
                    </motion.span>
                  ) : (
                    <motion.span
                      key="fullscreen"
                      initial={{ opacity: 0.5 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0.5 }}
                      transition={{ duration: 0.1, ease: "easeOut" }}
                    >
                      <FullscreenIcon />
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
