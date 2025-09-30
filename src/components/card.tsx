"use client";

import { motion, useInView } from "motion/react";
import type { ReactElement, ReactNode } from "react";
import { isValidElement, useEffect, useMemo, useRef, useState } from "react";

export default function Card({
  title,
  children,
}: {
  title: string;
  children?: React.ReactNode;
}) {
  const segments = useMemo(() => {
    const out: Array<
      { type: "text"; value: string; bold?: boolean } | { type: "br" }
    > = [];
    const walk = (node: ReactNode, isBold = false) => {
      if (node === null || node === undefined || node === false) return;
      if (typeof node === "string" || typeof node === "number") {
        out.push({ type: "text", value: String(node), bold: isBold });
        return;
      }
      if (Array.isArray(node)) {
        for (const n of node) walk(n, isBold);
        return;
      }
      if (isValidElement(node)) {
        const el = node as ReactElement<{ children?: ReactNode }>;
        if (typeof el.type === "string") {
          if (el.type === "br") {
            out.push({ type: "br" });
            return;
          }
          if (el.type === "b") {
            walk(el.props.children, true);
            return;
          }
        }
        walk(el.props.children, isBold);
      }
    };
    walk(children);
    return out;
  }, [children]);

  const totalChars = useMemo(
    () =>
      segments.reduce(
        (acc, seg) => acc + (seg.type === "text" ? seg.value.length : 0),
        0,
      ),
    [segments],
  );

  const [visible, setVisible] = useState(0);
  const parentRef = useRef<HTMLDivElement | null>(null);
  const inView = useInView(parentRef, { once: true, amount: 0.3 });
  useEffect(() => {
    if (totalChars === 0) return;
    if (!inView) return;
    setVisible(0);
    const id = window.setInterval(() => {
      setVisible((v) => (v < totalChars ? v + 1 : v));
    }, 5);
    return () => window.clearInterval(id);
  }, [totalChars, inView]);

  let shown = visible;

  return (
    <motion.div
      layout="position"
      className="flex w-full max-w-md shrink-0 flex-col items-start justify-end gap-16 rounded-2xl bg-white p-3"
    >
      <div
        ref={parentRef}
        className="relative flex flex-col items-start justify-start"
      >
        <div className="invisible">
          {(() => {
            let charOffset = 0;
            let brCount = 0;
            return segments.map((seg) => {
              if (seg.type === "br") {
                brCount += 1;
                return <br key={`full-br-${brCount}`} />;
              }
              const key = `full-text-${charOffset}`;
              charOffset += seg.value.length;
              return (
                <span key={key} className={seg.bold ? "font-bold" : ""}>
                  {seg.value}
                </span>
              );
            });
          })()}
        </div>
        <div className="pointer-events-none absolute inset-0">
          {(() => {
            let charOffset = 0;
            let brCount = 0;
            return segments.map((seg) => {
              if (seg.type === "br") {
                brCount += 1;
                return <br key={`br-${brCount}`} />;
              }
              if (shown <= 0) return null;
              const take = Math.min(seg.value.length, shown);
              shown -= take;
              const content = take > 0 ? seg.value.slice(0, take) : "";
              const key = `text-${charOffset}`;
              charOffset += seg.value.length;
              if (!content) return null;
              return (
                <span key={key} className={seg.bold ? "font-bold" : ""}>
                  {content}
                </span>
              );
            });
          })()}
        </div>
      </div>
      <div className="flex w-full flex-row items-center justify-between">
        <span className="trim-text text-label uppercase">{title}</span>
        <div className="size-2 rounded-full border border-essential-black" />
      </div>
    </motion.div>
  );
}
