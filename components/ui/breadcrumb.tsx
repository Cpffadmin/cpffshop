import * as React from "react";
import { ChevronRight, Home, LucideIcon } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/providers/language/LanguageContext";

interface BreadcrumbItem {
  label: string;
  href: string;
  icon?: LucideIcon;
  current?: boolean;
  onClick?: (e: React.MouseEvent) => void;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  const { t } = useTranslation();

  return (
    <nav className="flex items-center space-x-1 text-sm text-muted-foreground mb-4 md:mt-0 mt-14 relative z-10">
      <Link
        href="/"
        className="flex items-center hover:text-[#535C91] dark:hover:text-[#6B74A9] transition-colors overflow-hidden"
      >
        <Home className="h-4 w-4" />
        <span className="ml-1">{t("navigation.home")}</span>
      </Link>
      {items.map((item, index) => (
        <React.Fragment key={item.href}>
          <ChevronRight className="h-4 w-4" />
          <Link
            href={item.href}
            onClick={item.onClick}
            className={cn(
              "flex items-center hover:text-[#535C91] dark:hover:text-[#6B74A9] transition-colors overflow-hidden",
              item.current && "text-foreground font-medium"
            )}
          >
            {item.icon && <item.icon className="mr-1 h-4 w-4" />}
            <span className="line-clamp-1">{item.label}</span>
          </Link>
        </React.Fragment>
      ))}
    </nav>
  );
}
