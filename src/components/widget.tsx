import { motion } from "motion/react";
import HangerIcon from "@/icons/hanger-icon";
import TemperatureIcon from "@/icons/temperature-icon";
import { cn } from "@/lib/utils";

export default function Widget({
  className,
  ...props
}: { className: string } & React.ComponentProps<typeof motion.div>) {
  return (
    <motion.div
      className={cn(
        "size-44 rounded-[20px] text-white [background:linear-gradient(180deg,rgba(0,0,0,0)_0%,rgba(0,0,0,0.20)_100%),url('/decoration/widget.webp')_lightgray_50%/cover_no-repeat,#F2F2F2]",
        className,
      )}
      {...props}
    >
      <HangerIcon className="absolute top-3 left-3 h-auto w-2.5 md:w-4" />
      <TemperatureIcon className="absolute bottom-3 left-3 h-auto w-3 md:w-5" />
      <div className="-translate-y-1/2 absolute top-1/2 right-1.5 z-10 flex w-0.5 flex-col gap-[3px] md:right-3 md:w-1 md:gap-1.5">
        <div className="size-0.5 rounded-full bg-white/30 md:size-1" />
        <div className="size-0.5 rounded-full bg-white/30 md:size-1" />
        <div className="size-0.5 rounded-full bg-white md:size-1" />
      </div>
    </motion.div>
  );
}
