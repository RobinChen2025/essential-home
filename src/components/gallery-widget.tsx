import { motion } from "motion/react";
import Image from "next/image";
import { cn } from "@/lib/utils";

export default function GalleryWidget({
  className,
  ...props
}: React.ComponentProps<typeof motion.div>) {
  return (
    <motion.div
      className={cn(
        "group relative flex size-25 transition-all hover:scale-105 md:size-44",
        className,
      )}
      {...props}
    >
      <Image
        src="/decoration/gallery1.webp"
        alt="Photo 1"
        className="-translate-x-full -translate-y-1/2 absolute top-1/2 left-1/2 h-14 w-10 rotate-[-10deg] rounded-[5px] transition-all group-hover:rotate-[-14deg] md:h-25 md:w-19 md:rounded-xl"
        width={300}
        height={150}
      />
      <Image
        src="/decoration/gallery3.webp"
        alt="Photo 3"
        className="-translate-y-1/2 absolute top-1/2 left-1/2 h-14 w-10 translate-x-[0%] rotate-[10deg] rounded-[5px] transition-all group-hover:rotate-[14deg] md:h-25 md:w-19 md:rounded-xl"
        width={300}
        height={150}
      />
      <Image
        src="/decoration/gallery2.webp"
        alt="Photo 2"
        className="-translate-x-1/2 -translate-y-1/2 absolute top-1/2 left-1/2 h-14 w-10 rounded-[5px] md:h-25 md:w-19 md:rounded-xl"
        width={300}
        height={150}
      />
    </motion.div>
  );
}
