"use client";

import { useTranslation } from "@/providers/language/LanguageContext";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function NotFound() {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-primary">404</h1>
        <h2 className="text-2xl font-semibold text-foreground mt-4">
          {t("common.pageNotFound")}
        </h2>
        <p className="text-muted-foreground mt-2">
          {t("common.pageNotFoundDesc")}
        </p>
        <div className="mt-6">
          <Button
            onClick={() => router.push("/")}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {t("common.backToHome")}
          </Button>
        </div>
      </div>
    </div>
  );
}
