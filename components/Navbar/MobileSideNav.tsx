"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Session } from "next-auth";
import { AiOutlineHome } from "react-icons/ai";
import { BsInfoCircle } from "react-icons/bs";
import { FaBlogger } from "react-icons/fa";
import { FaShop } from "react-icons/fa6";
import { MdContactSupport } from "react-icons/md";
import { RiAdminLine } from "react-icons/ri";
import { UserIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/providers/language/LanguageContext";
import HamburgerIcon from "@/components/ui/HamburgerIcon";
import type { CustomUser } from "@/types";

interface MobileSideNavProps {
  isOpen: boolean;
  onMenuToggle: () => void;
  session: (Session & { user?: CustomUser }) | null;
  onAdminOpen: () => void;
}

const iconLinkClass =
  "flex h-10 w-10 items-center justify-center rounded-md text-foreground hover:bg-accent hover:text-accent-foreground transition-colors";

export default function MobileSideNav({
  isOpen,
  onMenuToggle,
  session,
  onAdminOpen,
}: MobileSideNavProps) {
  const pathname = usePathname() || "";
  const { t } = useTranslation();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    if (href === "/products") {
      return pathname === "/products" || pathname.startsWith("/product");
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const items = [
    { href: "/", label: t("navigation.home"), icon: AiOutlineHome },
    { href: "/products", label: t("navigation.products"), icon: FaShop },
    { href: "/blog", label: t("navigation.blog"), icon: FaBlogger },
    { href: "/about", label: t("navigation.about"), icon: BsInfoCircle },
    {
      href: "/contact",
      label: t("navigation.contact"),
      icon: MdContactSupport,
    },
  ];

  return (
    <aside
      className="md:hidden fixed left-0 top-0 bottom-0 z-50 w-14 flex flex-col items-center gap-1 py-3 border-r border-border"
      style={{
        backgroundColor:
          "hsla(var(--navbar-background), var(--navbar-opacity, 1))",
      }}
    >
      <button
        type="button"
        onClick={onMenuToggle}
        className={iconLinkClass}
        aria-label={isOpen ? t("common.close") : t("common.menu")}
      >
        <HamburgerIcon isOpen={isOpen} />
      </button>

      {items.map((item) => {
        const Icon = item.icon;
        const active = isActive(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            title={item.label}
            aria-label={item.label}
            className={cn(
              iconLinkClass,
              active && "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground"
            )}
          >
            <Icon className="h-5 w-5" />
          </Link>
        );
      })}

      {session?.user?.admin && (
        <button
          type="button"
          onClick={onAdminOpen}
          title={t("navigation.adminPanel")}
          aria-label={t("navigation.adminPanel")}
          className={iconLinkClass}
        >
          <RiAdminLine className="h-5 w-5" />
        </button>
      )}

      <div className="flex-1" />

      <Link
        href={session?.user ? "/profile" : "/login"}
        title={
          session?.user ? t("navigation.profile") : t("navigation.login")
        }
        aria-label={
          session?.user ? t("navigation.profile") : t("navigation.login")
        }
        className={cn(
          iconLinkClass,
          isActive("/profile") &&
            "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground"
        )}
      >
        <UserIcon className="h-5 w-5" />
      </Link>
    </aside>
  );
}
