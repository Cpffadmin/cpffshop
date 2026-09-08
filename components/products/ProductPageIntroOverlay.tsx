"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useStore } from "@/providers/store/StoreContext";
import { useTranslation } from "@/providers/language/LanguageContext";
import {
  DEFAULT_NAV_INTROS,
  NAV_INTRO_EVENT,
  consumeDocumentLoadPlay,
  consumeNavIntroRequest,
  getNavKeyFromPath,
  getPersistedIntroKey,
  getPersistedIntroVisible,
  markNavIntroPlayed,
  mergeNavIntros,
  navIntroHasVideo,
  resolveIntroMessage,
  setPersistedIntroVisible,
  toPlayableVideoUrl,
  type NavIntroKey,
} from "@/lib/productPageIntro";

function prefersReducedMotion() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export default function ProductPageIntroOverlay() {
  const pathname = usePathname();
  const { settings } = useStore();
  const { language, t } = useTranslation();
  const navIntros = mergeNavIntros(settings.navIntros, settings.productPageIntro);
  const [activeKey, setActiveKey] = useState<NavIntroKey | null>(
    getPersistedIntroKey
  );
  const intro = activeKey ? navIntros[activeKey] : navIntros.products;
  const videoUrl = toPlayableVideoUrl(intro.videoUrl);
  const message = resolveIntroMessage(
    intro.message,
    language,
    DEFAULT_NAV_INTROS[activeKey ?? "products"].message
  );

  const [visible, setVisible] = useState(getPersistedIntroVisible);
  const [replayKey, setReplayKey] = useState(0);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const reachedPageRef = useRef(false);
  const closeTimerRef = useRef<number | null>(null);
  const activePath = activeKey
    ? activeKey === "home"
      ? "/"
      : {
          products: "/products",
          quickOrder: "/quick-order",
          blog: "/blog",
          about: "/about",
          contact: "/contact",
          home: "/",
        }[activeKey]
    : null;

  const close = useCallback(() => {
    setPersistedIntroVisible(false);
    setVisible(false);
    setActiveKey(null);
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const open = useCallback(
    (key: NavIntroKey) => {
      const next = navIntros[key];
      if (!navIntroHasVideo(next) || prefersReducedMotion()) return;
      markNavIntroPlayed(key);
      reachedPageRef.current = pathname === (key === "home" ? "/" : {
        products: "/products",
        quickOrder: "/quick-order",
        blog: "/blog",
        about: "/about",
        contact: "/contact",
        home: "/",
      }[key]);
      setActiveKey(key);
      setPersistedIntroVisible(true, key);
      setReplayKey((current) => current + 1);
      setVisible(true);
    },
    [navIntros, pathname]
  );

  useLayoutEffect(() => {
    const pathKey = getNavKeyFromPath(pathname);
    const requested = consumeNavIntroRequest();
    const key = requested || pathKey;
    if (!key) return;
    if (!navIntroHasVideo(navIntros[key]) || prefersReducedMotion()) return;
    if (requested === key || consumeDocumentLoadPlay(key)) {
      reachedPageRef.current = true;
      setActiveKey(key);
      setPersistedIntroVisible(true, key);
      setVisible(true);
    }
  }, [pathname, navIntros]);

  useEffect(() => {
    const handlePlay = (event: Event) => {
      const key = (event as CustomEvent<NavIntroKey>).detail;
      if (key) open(key);
    };
    window.addEventListener(NAV_INTRO_EVENT, handlePlay);
    return () => {
      window.removeEventListener(NAV_INTRO_EVENT, handlePlay);
    };
  }, [open]);

  useEffect(() => {
    if (!visible) {
      reachedPageRef.current = false;
      return;
    }
    if (activePath && pathname === activePath) {
      reachedPageRef.current = true;
      return;
    }
    if (reachedPageRef.current) {
      close();
    }
  }, [pathname, visible, activePath, close]);

  useEffect(() => {
    if (!visible) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    closeTimerRef.current = window.setTimeout(() => {
      const video = videoRef.current;
      if (!video || video.readyState < 2 || video.paused) {
        close();
      }
    }, 8000);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      if (closeTimerRef.current) {
        window.clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
    };
  }, [visible, close]);

  useEffect(() => {
    if (!visible) return;
    const video = videoRef.current;
    if (!video) return;

    const tryPlay = () => {
      const playPromise = video.play();
      if (!playPromise) return;
      playPromise.catch((error: unknown) => {
        const name =
          error && typeof error === "object" && "name" in error
            ? String(error.name)
            : "";
        if (name === "AbortError" || name === "NotAllowedError") return;
        close();
      });
    };

    video.currentTime = 0;
    const onReady = () => tryPlay();
    video.addEventListener("loadeddata", onReady);
    tryPlay();

    return () => {
      video.removeEventListener("loadeddata", onReady);
    };
  }, [visible, replayKey, close]);

  if (!visible || !videoUrl) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="nav-intro"
          role="dialog"
          aria-modal="true"
          aria-label={t("common.productPageIntroLabel")}
          className="fixed inset-0 z-[100] bg-black"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
        >
          <button
            type="button"
            onClick={close}
            className="absolute right-[max(1rem,env(safe-area-inset-right))] top-[max(1rem,env(safe-area-inset-top))] z-10 min-h-11 min-w-11 rounded-full bg-white/15 px-4 text-sm font-medium text-white backdrop-blur-sm hover:bg-white/25"
          >
            {t("common.skip")}
          </button>

          <motion.video
            key={replayKey}
            ref={videoRef}
            src={videoUrl}
            muted
            playsInline
            preload="auto"
            className="absolute inset-0 h-full w-full object-cover"
            initial={{ opacity: 0, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            onEnded={close}
            onError={close}
          />

          {message && (
            <div className="pointer-events-none absolute inset-x-0 top-[78%] z-10 flex -translate-y-1/2 justify-center px-4 sm:px-8">
              <div className="relative mx-auto w-full max-w-4xl rounded-2xl bg-white/95 px-5 py-4 text-center shadow-lg sm:px-8 sm:py-5 md:px-10 md:py-6">
                <p className="text-xl font-semibold leading-snug text-gray-900 sm:text-2xl md:text-3xl lg:text-4xl">
                  {message}
                </p>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
