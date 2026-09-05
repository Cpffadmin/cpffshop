"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useHero } from "@/providers/hero/HeroContext";
import { useTranslation } from "@/providers/language/LanguageContext";
import Image from "next/image";

const DynamicHeroVideo = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const { heroSections, isLoading } = useHero();
  const { language } = useTranslation();

  // Only get active section, no fallback
  const activeSection = heroSections.find((section) => section.isActive);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const attemptPlay = () => {
      video?.play().catch((error: unknown) => {
        console.log("autoplay was prevented", error);
      });
    };

    // Try to play when video data is loaded
    video.addEventListener("loadeddata", attemptPlay);

    // Try to play on user interaction
    document.addEventListener("touchstart", attemptPlay);
    document.addEventListener("click", attemptPlay);

    // Cleanup
    return () => {
      video.removeEventListener("loadeddata", attemptPlay);
      document.removeEventListener("touchstart", attemptPlay);
      document.removeEventListener("click", attemptPlay);
    };
  }, [activeSection?.media.videoUrl]); // Re-run when video URL changes

  if (isLoading || !activeSection) {
    return <div className="h-screen md:h-[55rem] w-full bg-gray-900" />;
  }

  return (
    <div className="relative h-screen md:h-[55rem] w-full overflow-hidden mt-0">
      {/* Video/Image Container */}
      <div className="absolute inset-0 z-0">
        {activeSection.media.mediaType === "video" &&
        activeSection.media.videoUrl ? (
          <video
            ref={videoRef}
            loop
            autoPlay
            muted
            playsInline
            preload="auto"
            className="absolute z-0 w-full h-full object-cover"
            poster={activeSection.media.posterUrl}
          >
            <source src={activeSection.media.videoUrl} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        ) : (
          <Image
            src={activeSection.media.posterUrl}
            alt={activeSection.title[language] || "Hero Image"}
            fill
            sizes="100vw"
            className="object-cover"
            priority
          />
        )}
      </div>

      {/* Content */}
      <div className="absolute inset-0 z-10">
        <div className="container mx-auto h-full flex flex-col items-center justify-center text-white px-4">
          <motion.h1
            className="text-2xl sm:text-4xl md:text-6xl font-bold mb-3 sm:mb-4 text-center"
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            {activeSection.title[language]}
          </motion.h1>

          <motion.p
            className="text-xs sm:text-xl md:text-2xl text-center max-w-2xl mb-2 sm:mb-4"
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            {activeSection.description[language]}
          </motion.p>

          {activeSection.creditText[language] && (
            <motion.p
              className="mb-6 sm:mb-8 text-xs sm:text-sm"
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              {activeSection.creditText[language]}
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
              <button
                className="w-full sm:w-auto px-6 py-2.5 sm:py-3 rounded-full font-semibold transition-all duration-300"
                style={{
                  backgroundColor: "#ffffff",
                  color: "#000000",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#000000";
                  e.currentTarget.style.color = "#ffffff";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "#ffffff";
                  e.currentTarget.style.color = "#000000";
                }}
              >
                {activeSection.buttons.primary.text[language]}
              </button>
            </Link>
            <Link
              href={activeSection.buttons.secondary.link}
              className="w-full sm:w-auto"
            >
              <button
                className="w-full sm:w-auto px-6 py-2.5 sm:py-3 rounded-full font-semibold transition-all duration-300"
                style={{
                  background: "none",
                  color: "#ffffff",
                  border: "2px solid #ffffff",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "none";
                  e.currentTarget.style.color = "#000000";
                  e.currentTarget.style.border = "2px solid #000000";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "none";
                  e.currentTarget.style.color = "#ffffff";
                  e.currentTarget.style.border = "2px solid #ffffff";
                }}
              >
                {activeSection.buttons.secondary.text[language]}
              </button>
            </Link>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default DynamicHeroVideo;
