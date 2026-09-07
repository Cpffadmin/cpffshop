import type { OrderTemplate } from "@/types";
import type { Language } from "@/types/language";

export type TemplateNames = { en: string; "zh-TW": string };

/**
 * Saved lists carry bilingual names like the rest of the catalogue. Falls back
 * through the other language and then `name`, so lists saved before
 * `displayNames` existed still render.
 */
export function templateLabel(
  template: Pick<OrderTemplate, "name" | "displayNames">,
  language: Language
) {
  const names = template.displayNames;
  return (
    names?.[language] || names?.en || names?.["zh-TW"] || template.name || ""
  );
}

export function templateNames(
  template: Pick<OrderTemplate, "name" | "displayNames">
): TemplateNames {
  return {
    en: template.displayNames?.en || template.name || "",
    "zh-TW": template.displayNames?.["zh-TW"] || "",
  };
}

export function hasAnyName(names: Partial<TemplateNames>) {
  return Boolean(names.en?.trim() || names["zh-TW"]?.trim());
}
