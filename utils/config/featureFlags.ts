export const FEATURES = {
  USE_NEW_BRAND_SYSTEM: process.env.NEXT_PUBLIC_USE_NEW_BRAND_SYSTEM === "true",
  SHOW_BRAND_ADMIN:
    process.env.NEXT_PUBLIC_SHOW_BRAND_ADMIN === "true" ||
    process.env.NEXT_PUBLIC_SHOW_BRAND_BETA_ADMIN === "true",
} as const;

export type FeatureFlag = keyof typeof FEATURES;

export const isFeatureEnabled = (feature: FeatureFlag): boolean => {
  return FEATURES[feature] ?? false;
};

// Helper to check if we should use new brand system
export const shouldUseNewBrandSystem = (): boolean => {
  return isFeatureEnabled("USE_NEW_BRAND_SYSTEM");
};

// Helper to check if brand admin should be shown
export const shouldShowBrandAdmin = (): boolean => {
  return isFeatureEnabled("SHOW_BRAND_ADMIN");
};

// Keep old function for backward compatibility
export const shouldShowBrandBetaAdmin = (): boolean => {
  return shouldShowBrandAdmin();
};
