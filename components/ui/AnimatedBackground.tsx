"use client";

import { motion } from "framer-motion";

// Seeded so the server and client render identical circles. Math.random()
// here would produce different values per render and break hydration.
const seededRandom = (seed: number) => {
  const value = Math.sin(seed) * 10000;
  return value - Math.floor(value);
};

const CIRCLES = Array.from({ length: 20 }, (_, i) => {
  const seed = i * 7;
  return {
    radius: seededRandom(seed + 1) * 20 + 10,
    opacity: seededRandom(seed + 2) * 0.5 + 0.1,
    fromX: seededRandom(seed + 3) * 100,
    fromY: seededRandom(seed + 4) * 100,
    toX: seededRandom(seed + 5) * 100,
    toY: seededRandom(seed + 6) * 100,
    duration: seededRandom(seed + 7) * 10 + 20,
  };
});

export default function AnimatedBackground() {
  return (
    <svg
      className="absolute inset-0 w-full h-full"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4F46E5" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#7C3AED" stopOpacity="0.2" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#grad1)" />
      {CIRCLES.map((circle, i) => (
        <motion.circle
          key={i}
          r={circle.radius}
          fill="#fff"
          initial={{
            opacity: circle.opacity,
            x: `${circle.fromX}%`,
            y: `${circle.fromY}%`,
          }}
          animate={{
            x: `${circle.toX}%`,
            y: `${circle.toY}%`,
          }}
          transition={{
            duration: circle.duration,
            repeat: Infinity,
            repeatType: "reverse",
          }}
        />
      ))}
    </svg>
  );
}
