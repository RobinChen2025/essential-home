export default function Frame() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 flex flex-col justify-between p-4 md:p-6">
      <div className="flex items-center justify-between p-2 md:p-4">
        <Cross />
        <Cross />
        <Cross />
      </div>
      <div className="flex items-center justify-between p-2 md:p-4">
        <Cross />
        <Cross />
        <Cross />
      </div>
    </div>
  );
}

function Cross() {
  return (
    <div className="relative size-4">
      <div className="-translate-x-1/2 absolute top-1/2 left-1/2 h-px w-full bg-[#C8C8C8]" />
      <div className="-translate-y-1/2 absolute top-1/2 left-1/2 h-full w-px bg-[#C8C8C8]" />
    </div>
  );
}
