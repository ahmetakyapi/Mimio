"use client";

const CONFETTI_COLORS = ["#7fb2cc","#14847a","#c4614a","#c07c2c","#7aac3a","#f97316","#4f93b5","#a855f7"];
const CONFETTI_SEEDS = Array.from({ length: 24 }, (_, i) => ({
  id: `cp-${i}`,
  left: 5 + (i / 24) * 90,
  delay: (i * 0.18) % 1.8,
  duration: 1.4 + (i % 5) * 0.3,
  wide: i % 2 === 0,
}));

export function ConfettiPieces({ count = 18, accent }: Readonly<{ count?: number; accent: string }>) {
  return (
    <>
      {CONFETTI_SEEDS.slice(0, count).map((seed) => {
        const color = seed.id.charCodeAt(3) % 3 === 0 ? accent : CONFETTI_COLORS[seed.id.charCodeAt(3) % CONFETTI_COLORS.length];
        return (
          <div
            key={seed.id}
            className="confetti-piece pointer-events-none"
            style={{
              left: `${seed.left}%`,
              top: 0,
              background: color,
              animationDelay: `${seed.delay}s`,
              animationDuration: `${seed.duration}s`,
              width: seed.wide ? "5px" : "7px",
              height: seed.wide ? "12px" : "7px",
              borderRadius: seed.wide ? "2px" : "50%",
              opacity: 0,
            }}
          />
        );
      })}
    </>
  );
}
