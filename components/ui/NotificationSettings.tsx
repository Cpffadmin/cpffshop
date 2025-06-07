import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Switch } from "@/components/ui/switch";
import { DevEmailService } from "@/utils/email/devEmailService";
import { useTranslation } from "@/providers/language/LanguageContext";
import toast from "react-hot-toast";

export function NotificationSettings() {
  const { data: session } = useSession();
  const { t } = useTranslation();
  const [preferences, setPreferences] = useState({
    orderUpdates: false,
    promotions: false,
  });
  const [isMounted, setIsMounted] = useState(true);

  useEffect(() => {
    setIsMounted(true);
    return () => {
      setIsMounted(false);
    };
  }, []);

  const handleToggle = async (key: "orderUpdates" | "promotions") => {
    if (!isMounted) return;

    try {
      const newValue = !preferences[key];
      setPreferences((prev) => ({ ...prev, [key]: newValue }));

      if (!session?.user?.email) {
        throw new Error("No user email found");
      }

      if (key === "orderUpdates") {
        await DevEmailService.sendOrderUpdateEmail(
          session.user.email,
          newValue
        );
      } else {
        await DevEmailService.sendPromotionalEmail(
          session.user.email,
          newValue
        );
      }

      if (isMounted) {
        toast.success(
          newValue ? t(`settings.${key}Enabled`) : t(`settings.${key}Disabled`)
        );
      }
    } catch (error) {
      console.error("Failed to update notification preference:", error);
      if (isMounted) {
        toast.error(t("common.error"));
        // Revert the toggle if there's an error
        setPreferences((prev) => ({ ...prev, [key]: !prev[key] }));
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between p-4 bg-white/50 dark:bg-gray-800/50 rounded-lg shadow-sm transition-all duration-200 hover:shadow-md">
        <div className="space-y-0.5">
          <label
            htmlFor="orderUpdates"
            className="text-sm font-medium text-gray-900 dark:text-gray-100"
          >
            {t("settings.emailNotifications")}
          </label>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t("settings.emailNotificationsDescription")}
          </p>
        </div>
        <Switch
          id="orderUpdates"
          checked={preferences.orderUpdates}
          onCheckedChange={() => handleToggle("orderUpdates")}
          className="data-[state=checked]:bg-[#535C91] dark:data-[state=checked]:bg-[#6B74A9]"
        />
      </div>

      <div className="flex items-center justify-between p-4 bg-white/50 dark:bg-gray-800/50 rounded-lg shadow-sm transition-all duration-200 hover:shadow-md">
        <div className="space-y-0.5">
          <label
            htmlFor="promotions"
            className="text-sm font-medium text-gray-900 dark:text-gray-100"
          >
            {t("settings.pushNotifications")}
          </label>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t("settings.pushNotificationsDescription")}
          </p>
        </div>
        <Switch
          id="promotions"
          checked={preferences.promotions}
          onCheckedChange={() => handleToggle("promotions")}
          className="data-[state=checked]:bg-[#535C91] dark:data-[state=checked]:bg-[#6B74A9]"
        />
      </div>
    </div>
  );
}
