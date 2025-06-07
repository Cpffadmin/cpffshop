import { Button } from "@/components/ui/button";
import { useTranslation } from "@/providers/language/LanguageContext";

export function LanguageToggle() {
  const { language, setLanguage } = useTranslation();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setLanguage(language === "en" ? "zh-TW" : "en")}
      className="px-2 font-medium"
    >
      {language === "en" ? "中文" : "ENG"}
    </Button>
  );
}
