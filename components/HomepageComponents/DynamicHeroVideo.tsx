"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useHero } from "@/providers/hero/HeroContext";
import Image from "next/image";

const DynamicHeroVideo = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const { heroSections, isLoading } = useHero();

  // Only get active section, no fallback
  const activeSection = heroSections.find((section) => section.isActive);

  useEffect(() => {
    const video = videoRef.current;
    const attemptPlay = () => {
      video?.play().catch((error: unknown) => {
        console.log("autoplay was prevented", error);
      });
    };
    if (video) {
      video.addEventListener("loadeddata", attemptPlay);
      document.addEventListener("touchstart", attemptPlay);
      document.addEventListener("click", attemptPlay);
    }
    return () => {
      if (video) {
        video.removeEventListener("loadeddata", attemptPlay);
        document.removeEventListener("touchstart", attemptPlay);
        document.removeEventListener("click", attemptPlay);
      }
    };
  }, []);

  if (isLoading || !activeSection) {
    return <div className="h-screen md:h-[55rem] w-full bg-gray-900" />;
  }

  return (
    <div className="relative h-screen md:h-[55rem] w-full overflow-hidden mt-0">
      {activeSection.media.mediaType === "video" ? (
        <video
          ref={videoRef}
          loop
          autoPlay
          muted
          playsInline
          preload="auto"
          className="absolute z-0 w-full h-full object-cover top-0 left-0"
          poster={activeSection.media.posterUrl}
        >
          <source src={activeSection.media.videoUrl} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      ) : (
        <div className="absolute z-0 w-full h-full">
          <Image
            src={activeSection.media.posterUrl}
            alt={activeSection.title}
            fill
            className="object-cover"
            priority
          />
        </div>
      )}

      {/* Overlay */}
      <div className="absolute z-10 inset-0 px-4 sm:px-0 bg-black bg-opacity-50 flex flex-col items-center justify-center text-white">
        <motion.h1
          className="text-2xl sm:text-4xl md:text-6xl font-bold mb-3 sm:mb-4 text-center"
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          {activeSection.title}
        </motion.h1>
        <motion.p
          className="text-xs sm:text-xl md:text-2xl text-center max-w-2xl mb-2 sm:mb-4"
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          {activeSection.description}
        </motion.p>
        {activeSection.creditText && (
          <motion.p
            className="mb-6 sm:mb-8 text-xs sm:text-sm"
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            {activeSection.creditText}
          </motion.p>
        )}
        <motion.div
          className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 w-full sm:w-auto px-4 sm:px-0"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          <Link
            href={activeSection.buttons.primary.link}
            className="w-full sm:w-auto"
          >
            <button className="w-full sm:w-auto bg-white text-black px-6 py-2.5 sm:py-3 rounded-full font-semibold hover:bg-gray-200 transition duration-300">
              {activeSection.buttons.primary.text}
            </button>
          </Link>
          <Link
            href={activeSection.buttons.secondary.link}
            className="w-full sm:w-auto"
          >
            <button className="w-full sm:w-auto bg-transparent border-2 border-white px-6 py-2.5 sm:py-3 rounded-full font-semibold hover:bg-white hover:text-black transition duration-300">
              {activeSection.buttons.secondary.text}
            </button>
          </Link>
        </motion.div>
      </div>
    </div>
  );
};

export default DynamicHeroVideo;
