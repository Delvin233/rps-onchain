/**
 * LeaderboardSkeleton Component
 *
 * Skeleton loader for leaderboard entries while data is loading
 */
export const LeaderboardSkeleton: React.FC<{ count?: number }> = ({ count = 5 }) => {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="flex items-center justify-between p-4 rounded-lg bg-base-200 animate-pulse">
          {/* Left: Position and Name */}
          <div className="flex items-center gap-4 flex-1">
            {/* Position skeleton */}
            <div className="w-12 h-8 bg-base-300 rounded"></div>

            {/* Name skeleton */}
            <div className="flex flex-col gap-2 flex-1">
              <div className="h-4 bg-base-300 rounded w-32"></div>
            </div>
          </div>

          {/* Right: Wins and Rank */}
          <div className="flex items-center gap-4">
            {/* Wins skeleton */}
            <div className="hidden sm:block">
              <div className="h-6 bg-base-300 rounded w-12 mb-1"></div>
              <div className="h-3 bg-base-300 rounded w-16"></div>
            </div>

            {/* Rank badge skeleton */}
            <div className="h-8 bg-base-300 rounded w-24"></div>
          </div>
        </div>
      ))}
    </div>
  );
};
