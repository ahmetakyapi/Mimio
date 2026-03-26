"use client";

const STAR_POP_CLASSES = ["star-pop-1", "star-pop-2", "star-pop-3"] as const;

export function StarRating({ stars, accent }: Readonly<{ stars: number; accent: string }>) {
  return (
    <div className="flex items-center justify-center gap-3 my-1">
      {[1, 2, 3].map((n) => {
        const isLit = n <= stars;
        const popClass = isLit ? STAR_POP_CLASSES[n - 1] : "opacity-20";
        return (
          <div
            key={n}
            className={`text-4xl transition-all ${popClass}`}
            style={isLit ? { filter: `drop-shadow(0 0 10px ${accent}88)` } : undefined}
          >
            {isLit ? "⭐" : "☆"}
          </div>
        );
      })}
    </div>
  );
}
