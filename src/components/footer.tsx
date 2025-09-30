"use client";

import { motion, useInView } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import IconLink from "@/icons/icon-link";
import { cn } from "@/lib/utils";

export default function Footer() {
  const MotionLink = motion.create(Link);
  const ctaRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);
  const inView = useInView(footerRef, { amount: 0.7 });

  return (
    <footer
      ref={footerRef}
      data-background="5"
      className="relative flex min-h-svh w-full flex-col"
    >
      <motion.video
        initial={{ opacity: 0 }}
        animate={{ opacity: inView ? 1 : 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        src="/backgrounds/footer.mp4"
        autoPlay
        muted
        loop
        playsInline
        disablePictureInPicture
        disableRemotePlayback
        className="-z-10 fixed inset-0 size-full object-cover"
        style={{
          mask: "linear-gradient(to bottom, transparent 0%, black 10%, black 100%)",
          WebkitMask:
            "linear-gradient(to bottom, transparent 0%, black 10%, black 100%)",
        }}
      />

      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 md:px-12">
        <div className="flex flex-col items-center justify-center gap-4">
          <div
            ref={ctaRef}
            className="z-20 flex flex-col items-center justify-center gap-8 rounded-[20px] bg-white p-6 py-14"
          >
            <Image
              src="/icons/gradient-logo.svg"
              alt="Playground Logo"
              width={120}
              height={120}
            />

            <div className="flex flex-col items-center justify-center gap-6">
              <h3 className="trim-text text-center font-ntype82 text-title leading-6">
                Come to play with Essential.
                <br />
                Your digital Playground awaits.
              </h3>
              <p className="trim-text max-w-sm text-center text-balanace">
                Join thousands of creators to build something uniquely yours,
                and discover the creativity of the Nothing Community.
              </p>
            </div>

            <div className="flex h-12 w-full items-center justify-center">
              <MotionLink
                id="footer-cta"
                href="https://playground.nothing.tech/"
                target="_blank"
                className={cn(
                  "flex cursor-pointer items-center justify-center gap-3 rounded-full p-4 transition-colors",
                  "relative bg-yellow text-essential-black"
                )}
              >
                <span className="trim-text px-1">Playground</span>
                <IconLink />
              </MotionLink>
            </div>
          </div>

          <Links className="flex flex-col md:hidden" />
        </div>
      </div>

      <div className="flex items-center justify-center px-6 py-4 md:px-20">
        <div className="flex w-full flex-col items-center gap-4 py-4 md:grid md:grid-cols-[0.5fr_1fr_0.5fr]">
          <Link
            href="https://nothing.tech"
            target="_blank"
            className="trim-text shrink-0 select-none px-2 text-center font-ndot text-xl uppercase md:text-nowrap md:text-left"
          >
            Nothing (R)
          </Link>
          <Links className="hidden md:flex" />
          <h6 className="trim-text w-full text-balance text-center md:text-right">
            <span className="text-nowrap">Nothing Technology</span>{" "}
            <span className="text-nowrap">© 2020–2025</span>
          </h6>
        </div>
      </div>
    </footer>
  );
}

function Links({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex w-full items-center justify-center gap-2 md:w-auto",
        className
      )}
      {...props}
    >
      <Link
        href="mailto:press@nothing.tech"
        className="flex h-8 w-full items-center justify-center rounded-full bg-white px-2 py-2 md:w-auto"
      >
        <span className="trim-text block items-center justify-center px-1">
          Press enquiries
        </span>
      </Link>
      <Link
        href="https://careers.nothing.tech/"
        target="_blank"
        className="flex h-8 w-full items-center justify-center rounded-full bg-white px-2 py-2 md:w-auto"
      >
        <span className="trim-text block items-center justify-center px-1">
          Careers
        </span>
      </Link>
      <Link
        href="https://nothing.tech/pages/privacy-policy"
        target="_blank"
        className="flex h-8 w-full items-center justify-center rounded-full bg-white px-2 py-2 md:w-auto"
      >
        <span className="trim-text block items-center justify-center px-1">
          Legals
        </span>
      </Link>
    </div>
  );
}
