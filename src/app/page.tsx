"use client";

import { motion } from "motion/react";
import Background from "@/components/background";
import Card from "@/components/card";
import Decoration from "@/components/decoration";
import FixedCta from "@/components/fixed-cta";
import Footer from "@/components/footer";
import Frame from "@/components/frame";
import GalleryWidget from "@/components/gallery-widget";
import Loader from "@/components/loader";
import NdotText from "@/components/ndot-text";
import PlaygroundSpinner from "@/components/playground-spinner";
import Timeline from "@/components/timeline";
import Video from "@/components/video";
import Widget from "@/components/widget";
import { cn } from "@/lib/utils";

export default function Home() {
  return (
    <div className={cn("flex w-full flex-col items-center")}>
      <Background />
      <Frame />
      <PlaygroundSpinner />

      <main className="relative flex w-full flex-col items-center overflow-x-hidden">
        {/* 00 Loader */}
        <Loader />

        {/* 01 Intro */}
        <motion.section
          data-background="2"
          viewport={{ amount: 0.3 }}
          className={cn(
            "relative flex w-full max-w-6xl flex-col items-center justify-center p-6 md:p-12",
            "mt-10 mb-10 md:mt-20 md:mb-20",
          )}
        >
          <NdotText className="shrink-0 text-center text-headline md:text-headline-md">
            Essential <br className="block md:hidden" />
            is the first <br className="block md:hidden" />
            step <br className="hidden md:block" /> towards an
            <span className="hidden md:inline"> </span>
            <br className="block md:hidden" />
            AI operating <br className="block md:hidden" />
            system
          </NdotText>

          <Decoration
            src="/decoration/01.mp4"
            className="-right-6 md:-right-40 -bottom-4 md:-bottom-24 absolute"
          />
        </motion.section>

        {/* 02 Video Player (Nothing OS)*/}
        <motion.section
          className={cn(
            "flex w-full flex-col items-center justify-center gap-20 overflow-hidden px-6 md:px-12",
            "mb-20",
          )}
        >
          <Video vimeoId="1122880580" />
        </motion.section>

        <motion.section
          className={cn(
            "relative flex w-full max-w-6xl flex-col items-center justify-center gap-2 px-6 md:px-12",
            "mb-56",
          )}
        >
          <Card title="Introduction">
            Personal computing is entering a new phase. Where devices adapt to
            people, not the other way around.
            <br />
            <br />
            At Nothing, we’re building a new kind of phone, where data and
            design come together to create experiences no lab can replicate.
            <br />
            <br />
            The future is software you can shape with simple language, made
            possible only on top a powerful new phone that truly knows who you
            are.
            <br />
            <br />
            This combination is the only way to make an impactful OS that is
            just for you. Across every device, we can bring this knowledge into
            your control. This is how we move personal technology forward.
          </Card>
        </motion.section>

        {/* 03 Essential Apps */}
        <motion.section
          className={cn(
            "relative flex w-full max-w-6xl flex-col items-center justify-center gap-20 p-6 md:p-12",
            "mb-10 md:mb-56",
          )}
        >
          <NdotText className="shrink-0 text-center text-headline md:text-headline-md">
            With Essential, <br className="block md:hidden" />
            anyone can <br className="block md:hidden" />
            create <br className="hidden md:block" />
            their <br className="block md:hidden" />
            own apps in <br className="block md:hidden" />
            seconds <br />
            using natural <br className="block md:hidden" />
            language
          </NdotText>
          <Decoration
            src="/decoration/02.mp4"
            className="-top-25 md:-top-40 absolute right-8 size-25 md:right-4 md:size-40"
          />
        </motion.section>

        {/* 05 Essential Apps Video */}
        <motion.section
          data-background="3"
          className={cn(
            "flex w-full flex-col items-center justify-center gap-20 px-6 md:px-12",
            "mb-10 md:mb-20",
          )}
        >
          <Video vimeoId="1122882829" disableScroll />
        </motion.section>

        {/* 06 copy (Essential Apps) */}
        <motion.section
          className={cn(
            "relative z-0 flex w-full max-w-6xl flex-col items-center justify-center gap-2 px-6 md:px-12",
            "mb-56",
          )}
        >
          <Widget className="-bottom-34 md:-top-10 -z-10 absolute top-auto right-22 size-25 md:right-auto md:bottom-auto md:left-4 md:size-44" />
          <Card title="Essential Apps">
            Describe what you want to see in your app. Watch it come to life,
            and add it immediately to your home screen.
            <br />
            <br />
            Generative apps that start personal, then expand into a shared
            ecosystem.
            <br />
            <br />
            Building towards a future where your phone shapes itself after
            knowing who you are, and who you want to be.
          </Card>
        </motion.section>

        {/* 06 Playground*/}
        <motion.section
          className={cn(
            "relative flex w-full max-w-6xl flex-col items-center justify-center gap-20 p-12",
            "mb-20",
          )}
        >
          <NdotText className="text-center text-headline md:text-headline-md">
            The Playground <br className="block md:hidden" />
            is your <br className="block md:hidden" />
            platform <br className="hidden md:block" />
            to <br className="block md:hidden" />
            explore, <br className="block md:hidden" />
            create, and <br className="block md:hidden" />
            share <br className="hidden md:block" />
            the most <br className="block md:hidden" />
            creative ideas
          </NdotText>
          <Decoration
            src="/decoration/03.mp4"
            className="md:-right-8 -top-20 md:-top-64 absolute left-4 border-none mix-blend-darken md:left-auto"
          />
        </motion.section>

        {/* 07 Playground Video */}
        <motion.section
          className={cn(
            "flex w-full flex-col items-center justify-center gap-20 px-6 py-12 md:px-12",
            "mb-10 md:mb-20",
          )}
        >
          <Video vimeoId="1122891264" disableScroll />
        </motion.section>

        {/* 08 Playground Copy */}
        <motion.section
          className={cn(
            "relative flex w-full max-w-6xl flex-col items-center justify-center gap-2 px-6 md:px-12",
            "mb-62",
          )}
        >
          <Card title="Playground">
            Free from traditional app stores, we made new rules for a new era of
            AI created apps.
            <br />
            <br />
            Our Community platform let’s you share and remix the most creative
            ideas from the Nothing community across Essential Apps, audio-tuning
            profiles, camera presets, and Glyph toys, changing the very nature
            of how apps are shared and used.
            <br />
            <br />
            The creativity of millions of Nothing members, now discoverable for
            you to contribute to and enjoy.
          </Card>
          <GalleryWidget className="-bottom-36 md:-top-25 absolute right-16 md:right-10 md:bottom-auto" />
        </motion.section>

        <div className="relative h-0 w-full">
          <Decoration
            src="/decoration/04.mp4"
            className="-left-4 -bottom-20 absolute hidden md:block"
          />
        </div>

        <motion.section
          data-background="4"
          className={cn(
            "relative flex w-full max-w-6xl flex-col items-center justify-center gap-20 p-6 md:p-12",
            "mb-10",
          )}
        >
          <NdotText className="text-center text-headline md:text-headline-md">
            New thinking <br className="block md:hidden" />
            for a new era <br />
            of computing
          </NdotText>
        </motion.section>

        <motion.section
          className={cn(
            "relative flex w-full max-w-6xl flex-col items-center justify-center gap-2 px-6 md:px-12",
            "mb-56",
          )}
        >
          <Card title="Values">
            <b>Total openness.</b> Creators and platform owners share the same
            access level. No barriers, maximum possibility.
            <br />
            <br />
            <b>Remix and evolve.</b> Take what exists and make it yours. A
            culture of remix where every contribution enhances the next.
            <br />
            <br />
            <b>Radically personal.</b> There's no right answer, only what works
            for you. If it's beautiful to you, it's beautiful period.
          </Card>
          <Decoration
            src="/decoration/04.mp4"
            className="-bottom-40 absolute left-6 size-25 md:hidden"
          />
        </motion.section>

        {/* 09 Intro Roadmap */}
        <motion.section
          className={cn(
            "relative flex w-full max-w-6xl flex-col items-center justify-center gap-20 p-6 md:p-12",
            "mb-56",
          )}
        >
          <NdotText className="text-center text-headline md:text-headline-md">
            The next chapter <br className="block md:hidden" />
            of our story <br />
            builds on the <br className="block md:hidden" />
            same core values, <br />
            now with AI at the <br className="block md:hidden" />
            centre <br className="hidden md:block" />
            of our <br className="block md:hidden" />
            operating <br className="block md:hidden" />
            system
          </NdotText>
          <Decoration
            src="/decoration/05.mp4"
            className="md:-right-4 -bottom-40 md:-bottom-50 absolute right-18"
          />
        </motion.section>

        <Timeline />

        <Footer />

        <FixedCta />
      </main>
    </div>
  );
}
