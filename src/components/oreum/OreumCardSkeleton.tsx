import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function OreumCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("bg-card border rounded-2xl overflow-hidden", className)}>
      <Skeleton className="aspect-[4/3] w-full rounded-none" />
      <div className="p-3 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  );
}

export function OreumCardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 px-4">
      {Array.from({ length: count }).map((_, i) => (
        <OreumCardSkeleton key={i} />
      ))}
    </div>
  );
}
