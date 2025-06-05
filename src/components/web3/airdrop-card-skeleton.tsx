import { GlassmorphismCard } from "@/components/ui/glassmorphism-card";

export function AirdropCardSkeleton() {
  return (
    <GlassmorphismCard className="overflow-hidden p-5">
      {/* Header with token info skeleton */}
      <div className="mb-4 flex items-center">
        <div className="mr-3 h-12 w-12 animate-pulse rounded-full bg-gray-700" />
        <div className="flex-1">
          <div className="mb-1 h-5 w-2/3 animate-pulse rounded bg-gray-700" />
          <div className="h-3 w-1/3 animate-pulse rounded bg-gray-700" />
        </div>
        <div className="h-6 w-16 animate-pulse rounded-full bg-gray-700" />
      </div>

      {/* Details skeleton */}
      <div className="mb-4 space-y-2">
        <div className="flex items-center">
          <div className="mr-2 h-4 w-4 animate-pulse rounded bg-gray-700" />
          <div className="h-4 w-3/4 animate-pulse rounded bg-gray-700" />
        </div>
        <div className="flex items-center">
          <div className="mr-2 h-4 w-4 animate-pulse rounded bg-gray-700" />
          <div className="h-4 w-2/4 animate-pulse rounded bg-gray-700" />
        </div>
      </div>

      {/* Amount skeleton */}
      <div className="mb-4 rounded border border-gray-700 p-3">
        <div className="mb-1 h-3 w-24 mx-auto animate-pulse rounded bg-gray-700" />
        <div className="h-6 w-32 mx-auto animate-pulse rounded bg-gray-700" />
      </div>

      {/* Button skeleton */}
      <div className="h-12 w-full animate-pulse rounded-lg bg-gray-700" />
    </GlassmorphismCard>
  );
} 