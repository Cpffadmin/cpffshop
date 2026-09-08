export const NAV_INTRO_EVENT = "nav-intro:play";
const NAV_INTRO_FLAG = "cpff:playNavIntro";

export const NAV_INTRO_KEYS = [
  "home",
  "products",
  "quickOrder",
  "blog",
  "about",
  "contact",
] as const;

export type NavIntroKey = (typeof NAV_INTRO_KEYS)[number];

export type ProductPageIntroSettings = {
  enabled: boolean;
  videoUrl: string;
  message: {
    en: string;
    "zh-TW": string;
  };
};

export type NavIntros = Record<NavIntroKey, ProductPageIntroSettings>;

const EMPTY_INTRO: ProductPageIntroSettings = {
  enabled: true,
  videoUrl: "",
  message: {
    en: "",
    "zh-TW": "",
  },
};

export const DEFAULT_PRODUCT_PAGE_INTRO: ProductPageIntroSettings = {
  enabled: true,
  videoUrl: "/videos/product-page-intro.mp4",
  message: {
    en: "Welcome to our shop, choose the fresh foods",
    "zh-TW": "歡迎光臨，請選新鮮食材",
  },
};

export const DEFAULT_NAV_INTROS: NavIntros = {
  home: { ...EMPTY_INTRO, message: { ...EMPTY_INTRO.message } },
  products: {
    ...DEFAULT_PRODUCT_PAGE_INTRO,
    message: { ...DEFAULT_PRODUCT_PAGE_INTRO.message },
  },
  quickOrder: { ...EMPTY_INTRO, message: { ...EMPTY_INTRO.message } },
  blog: { ...EMPTY_INTRO, message: { ...EMPTY_INTRO.message } },
  about: { ...EMPTY_INTRO, message: { ...EMPTY_INTRO.message } },
  contact: { ...EMPTY_INTRO, message: { ...EMPTY_INTRO.message } },
};

export const NAV_INTRO_PATHS: Record<NavIntroKey, string> = {
  home: "/",
  products: "/products",
  quickOrder: "/quick-order",
  blog: "/blog",
  about: "/about",
  contact: "/contact",
};

export function mergeProductPageIntro(
  value?: Partial<ProductPageIntroSettings> | null
): ProductPageIntroSettings {
  return {
    enabled: value?.enabled ?? DEFAULT_PRODUCT_PAGE_INTRO.enabled,
    videoUrl: value?.videoUrl || DEFAULT_PRODUCT_PAGE_INTRO.videoUrl,
    message: {
      en: value?.message?.en ?? DEFAULT_PRODUCT_PAGE_INTRO.message.en,
      "zh-TW":
        value?.message?.["zh-TW"] ?? DEFAULT_PRODUCT_PAGE_INTRO.message["zh-TW"],
    },
  };
}

export function mergeNavIntro(
  key: NavIntroKey,
  value?: Partial<ProductPageIntroSettings> | null
): ProductPageIntroSettings {
  const fallback = DEFAULT_NAV_INTROS[key];
  return {
    enabled: value?.enabled ?? fallback.enabled,
    videoUrl: value?.videoUrl ?? fallback.videoUrl,
    message: {
      en: value?.message?.en ?? fallback.message.en,
      "zh-TW": value?.message?.["zh-TW"] ?? fallback.message["zh-TW"],
    },
  };
}

export function mergeNavIntros(
  value?: Partial<Record<NavIntroKey, Partial<ProductPageIntroSettings>>> | null,
  legacyProductIntro?: Partial<ProductPageIntroSettings> | null
): NavIntros {
  return {
    home: mergeNavIntro("home", value?.home),
    products: mergeNavIntro(
      "products",
      value?.products || legacyProductIntro
    ),
    quickOrder: mergeNavIntro("quickOrder", value?.quickOrder),
    blog: mergeNavIntro("blog", value?.blog),
    about: mergeNavIntro("about", value?.about),
    contact: mergeNavIntro("contact", value?.contact),
  };
}

export function navIntroHasVideo(intro: ProductPageIntroSettings): boolean {
  return intro.enabled && Boolean(intro.videoUrl?.trim());
}

export function resolveIntroMessage(
  message: ProductPageIntroSettings["message"] | undefined,
  language: string,
  fallback: ProductPageIntroSettings["message"] = DEFAULT_PRODUCT_PAGE_INTRO.message
): string {
  const raw = message ?? fallback;
  const english = (raw.en || fallback.en || "").trim();
  const chinese = (
    raw["zh-TW"] ||
    (raw as { zh?: string }).zh ||
    fallback["zh-TW"] ||
    ""
  ).trim();

  if (language === "zh-TW" || language.toLowerCase().startsWith("zh")) {
    return chinese || english;
  }
  return english || chinese;
}

export function getNavKeyFromPath(pathname: string): NavIntroKey | null {
  if (pathname === "/") return "home";
  const match = NAV_INTRO_KEYS.find(
    (key) => key !== "home" && pathname === NAV_INTRO_PATHS[key]
  );
  return match ?? null;
}

type IntroWindow = Window & { __cpffLandingPath?: string };

function getLandingPath(): string {
  if (typeof window === "undefined") return "";
  const w = window as IntroWindow;
  if (w.__cpffLandingPath == null) {
    w.__cpffLandingPath = window.location.pathname;
  }
  return w.__cpffLandingPath;
}

if (typeof window !== "undefined") {
  getLandingPath();
}

let persistedIntroVisible = false;
let persistedIntroKey: NavIntroKey | null = null;
const playedKeys = new Set<NavIntroKey>();
const consumedLoadKeys = new Set<NavIntroKey>();

export function getPersistedIntroVisible() {
  return persistedIntroVisible;
}

export function getPersistedIntroKey() {
  return persistedIntroKey;
}

export function setPersistedIntroVisible(
  value: boolean,
  key: NavIntroKey | null = null
) {
  persistedIntroVisible = value;
  persistedIntroKey = value ? key : null;
}

export function markNavIntroPlayed(key: NavIntroKey) {
  playedKeys.add(key);
}

export function consumeDocumentLoadPlay(key: NavIntroKey): boolean {
  if (typeof window === "undefined") return false;
  if (playedKeys.has(key) || consumedLoadKeys.has(key)) return false;
  if (getNavKeyFromPath(window.location.pathname) !== key) return false;
  if (getNavKeyFromPath(getLandingPath()) !== key) return false;
  consumedLoadKeys.add(key);
  playedKeys.add(key);
  return true;
}

export function markNavIntroRequested(key: NavIntroKey) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(NAV_INTRO_FLAG, key);
  } catch {
    // Ignore private-mode / blocked storage.
  }
}

export function consumeNavIntroRequest(): NavIntroKey | null {
  if (typeof window === "undefined") return null;
  try {
    const key = sessionStorage.getItem(NAV_INTRO_FLAG);
    sessionStorage.removeItem(NAV_INTRO_FLAG);
    if (key && NAV_INTRO_KEYS.includes(key as NavIntroKey)) {
      return key as NavIntroKey;
    }
    return null;
  } catch {
    return null;
  }
}

export function requestNavIntro(key: NavIntroKey) {
  if (typeof window === "undefined") return;
  if (playedKeys.has(key)) return;
  markNavIntroRequested(key);
  markNavIntroPlayed(key);
  window.dispatchEvent(new CustomEvent(NAV_INTRO_EVENT, { detail: key }));
}

export function requestProductPageIntro() {
  requestNavIntro("products");
}

export const PRODUCT_PAGE_INTRO_EVENT = NAV_INTRO_EVENT;

export function consumeProductPageIntroRequest(): boolean {
  return consumeNavIntroRequest() === "products";
}

export function toPlayableVideoUrl(url: string): string {
  const source = url.trim();
  if (!source) return "";
  if (
    source.includes("res.cloudinary.com") &&
    source.includes("/upload/") &&
    !source.includes("/upload/f_")
  ) {
    return source.replace("/upload/", "/upload/f_mp4/");
  }
  return source;
}
