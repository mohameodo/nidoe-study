import { cn } from "@/lib/utils"

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div className={cn("animate-pulse rounded-md bg-muted", className)} />
  )
}

export function QuizCardSkeleton() {
  return (
    <div className="bg-card rounded-xl border p-5 shadow-sm">
      <div className="space-y-3">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-1/4" />
        <div className="pt-4 mt-4 border-t flex justify-between">
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-4 w-8" />
        </div>
      </div>
    </div>
  )
} 