"use client";

import { useSession } from "next-auth/react";
import { useTranslation } from "@/providers/language/LanguageContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Sidebar, useSidebar } from "@/components/ui/sidebar";
import { User as UserIcon, ShoppingBag, Heart, Settings } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

interface AppSidebarProps {
  variant?: "sidebar" | "inset";
}

export function AppSidebar({ variant = "sidebar" }: AppSidebarProps) {
  const { data: session } = useSession();
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = searchParams?.get("tab") || "profile";
  const { isMobile, setOpenMobile } = useSidebar();

  const handleTabChange = (tabId: string) => {
    router.push(`/profile?tab=${tabId}`);
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  if (!session?.user) return null;

  return (
    <Sidebar
      variant={variant}
      className=" mt-[100px] h-[calc(100vh-100px)] text-md rounded-none"
    >
      <div className="flex-1 overflow-auto">
        <nav className="space-y-1 px-2 pt-10">
          {[
            {
              id: "profile",
              label: t("navigation.profile"),
              icon: UserIcon,
            },
            {
              id: "orders",
              label: t("navigation.orders"),
              icon: ShoppingBag,
            },
            {
              id: "wishlist",
              label: t("navigation.wishlist"),
              icon: Heart,
            },
            {
              id: "settings",
              label: t("navigation.settings"),
              icon: Settings,
            },
          ].map((item) => (
            <Button
              key={item.id}
              variant={activeTab === item.id ? "secondary" : "ghost"}
              className={`w-full flex items-center ${
                activeTab === item.id
                  ? "bg-[#535C91] text-white dark:bg-[#6B74A9]"
                  : "hover:bg-accent"
              }`}
              onClick={() => handleTabChange(item.id)}
            >
              <div className="flex items-center">
                <item.icon className="h-5 w-5" />
                <span className="ml-3 text-base">{item.label}</span>
              </div>
            </Button>
          ))}
        </nav>
      </div>
      <Separator className="my-2" />
      <div className="px-4 py-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 border-2 border-[#535C91] dark:border-[#6B74A9]">
            <AvatarImage
              src={session.user.profileImage || ""}
              alt={session.user.name || ""}
            />
            <AvatarFallback className="bg-[#535C91] dark:bg-[#6B74A9] text-md text-white">
              {session.user.name
                ?.split(" ")
                .map((n) => n[0])
                .join("") || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-foreground">
              {session.user.name}
            </span>
            <span className="text-xs text-muted-foreground">
              {session.user.email}
            </span>
            <div className="flex gap-1 mt-0.5">
              {session.user.admin && (
                <span className="rounded bg-[#535C91] px-1.5 py-0.5 text-[10px] text-white dark:bg-[#6B74A9]">
                  {t("navigation.admin")}
                </span>
              )}
              <span className="rounded bg-secondary px-1.5 py-0.5 text-[10px] text-secondary-foreground">
                {session.user.role.charAt(0).toUpperCase() +
                  session.user.role.slice(1)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Sidebar>
  );
}
