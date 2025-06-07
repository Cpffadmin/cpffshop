import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { IoMdClose } from "react-icons/io";
import { IoSearchOutline } from "react-icons/io5";
import {
  IoHomeOutline,
  IoInformationCircleOutline,
  IoMailOutline,
} from "react-icons/io5";
import { FaBlogger } from "react-icons/fa";
import { MdContactSupport } from "react-icons/md";
import Link from "next/link";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Session } from "next-auth";
import type { CustomUser } from "@/types";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { useTranslation } from "@/providers/language/LanguageContext";
import { LanguageToggle } from "@/components/language/language-toggle";
import { ShoppingCart } from "lucide-react";
import useCartStore from "@/store/cartStore";
import { useStore } from "@/providers/store/StoreContext";
import { useRouter, usePathname } from "next/navigation";
import LoadingSkeleton from "@/components/ui/LoadingSkeleton";
import { cn } from "@/lib/utils";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { signOut } from "next-auth/react";
import { useCartUI } from "@/components/ui/CartUIContext";
import Cart from "@/components/ui/Cart";
import CategoryMenu from "@/components/ui/CategoryMenu";
import axios from "axios";

interface MobileMenuProps {
  isOpen: boolean;
  setMenuClose: () => void;
  setSearchOpen: (value: boolean) => void;
  searchTerm: string;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSearchClose: () => void;
  firstTwelveItems: Array<{
    _id: string;
    name: string;
    price: number;
    images: string[];
  }>;
  resultArr: Array<{
    _id: string;
    name: string;
    price: number;
    images: string[];
  }>;
  productModile: boolean;
  setProductModile: (value: boolean) => void;
  setAdminPanelMob: (value: boolean) => void;
  session: (Session & { user?: CustomUser }) | null;
  user: CustomUser | undefined;
  adminPanelMob: boolean;
  isLoading?: boolean;
}

interface Category {
  _id: string;
  name: string;
  displayNames?: {
    [key: string]: string;
  };
}

// Common styles for navbar buttons
const navbarButtonStyles = {
  base: "flex items-center w-full text-lg transition-colors duration-200 py-2.5 px-3 rounded-lg",
  default: "text-muted-foreground hover:text-foreground hover:bg-accent",
  active: "text-foreground bg-accent",
  primary: "text-primary hover:text-primary/80 hover:bg-primary/10",
  danger: "text-red-500 hover:text-red-600 hover:bg-red-50/10",
  withIcon: "gap-3",
  divider: "mt-6 pt-6 border-t border-border",
};

const MobileMenu = ({
  isOpen,
  setMenuClose,
  setSearchOpen,
  searchTerm,
  handleChange,
  handleSearchClose,
  firstTwelveItems,
  resultArr = [],
  productModile,
  setProductModile,
  setAdminPanelMob,
  session,
  user,
  adminPanelMob,
  isLoading = false,
}: MobileMenuProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const [showSearch, setShowSearch] = useState(false);
  const { t, language } = useTranslation();
  const items = useCartStore((state) => state.items);
  const clearCart = useCartStore((state) => state.clearCart);
  const { settings } = useStore();
  const { openCart, closeCart, isOpen: isCartOpen } = useCartUI();
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [categories, setCategories] = useState<Category[]>([]);
  const [lastFetch, setLastFetch] = useState(Date.now());
  const [isNavigating, setIsNavigating] = useState(false);

  const fetchCategories = async () => {
    try {
      const response = await axios.get("/api/categories");
      setCategories(response.data.categories);
      setLastFetch(Date.now());
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    }
  };

  // Initial fetch only
  useEffect(() => {
    if (!categories.length) {
      fetchCategories();
    }
  }, [categories.length]);

  const handleCategoryClick = async (categoryId?: string) => {
    setIsNavigating(true);
    handleMenuClose();
    const path = categoryId ? `/products?category=${categoryId}` : "/products";
    await router.push(path);
    setIsNavigating(false);
  };

  // Close mobile menu when screen size changes to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768 && isOpen) {
        setMenuClose();
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isOpen, setMenuClose]);

  const handleMenuClose = () => {
    setMenuClose();
    setShowSearch(false);
    handleSearchClose();
    setSearchOpen(false);
    // Reset search term
    handleChange({
      target: { value: "", name: "search" },
    } as React.ChangeEvent<HTMLInputElement>);
  };

  const NavLink = ({
    href,
    onClick,
    className,
    variant = "default",
    isDivider = false,
    children,
  }: {
    href: string;
    onClick?: () => void;
    className?: string;
    variant?: "default" | "active" | "primary" | "danger";
    isDivider?: boolean;
    children: React.ReactNode;
  }) => (
    <li className={isDivider ? navbarButtonStyles.divider : ""}>
      <Link
        href={href}
        onClick={onClick}
        className={cn(
          navbarButtonStyles.base,
          navbarButtonStyles[variant],
          className
        )}
      >
        {children}
      </Link>
    </li>
  );

  const NavButton = ({
    onClick,
    className,
    variant = "default",
    isDivider = false,
    children,
  }: {
    onClick?: () => void;
    className?: string;
    variant?: "default" | "active" | "primary" | "danger";
    isDivider?: boolean;
    children: React.ReactNode;
  }) => (
    <li className={isDivider ? navbarButtonStyles.divider : ""}>
      <button
        onClick={onClick}
        className={cn(
          navbarButtonStyles.base,
          navbarButtonStyles[variant],
          className
        )}
      >
        {children}
      </button>
    </li>
  );

  // Categories Section JSX
  const categoriesSection = (
    <div className="border-t border-border/50 mt-4">
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-medium text-foreground dark:text-white">
            {t("navigation.products")}
          </h3>
          <button
            onClick={fetchCategories}
            className="text-xs text-green-500 hover:text-green-400 dark:text-green-400 dark:hover:text-green-300 transition-colors"
          >
            Refresh
          </button>
        </div>
        <div className="space-y-1">
          <a
            href="/products"
            onClick={(e) => {
              e.preventDefault();
              handleMenuClose();
              window.location.replace("/products");
            }}
            className="block w-full text-left px-3 py-2 text-sm text-foreground hover:bg-accent rounded-lg transition-colors"
          >
            {t("common.allCategories")}
          </a>
          {categories.map((category) => (
            <a
              key={category._id}
              href={`/products?category=${category._id}`}
              onClick={(e) => {
                e.preventDefault();
                handleMenuClose();
                window.location.replace(`/products?category=${category._id}`);
              }}
              className="block w-full text-left px-3 py-2 text-sm text-foreground hover:bg-accent rounded-lg transition-colors"
            >
              {category.displayNames?.[language] || category.name}
            </a>
          ))}
        </div>
      </div>
    </div>
  );

  if (!isOpen) return null;

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/60 z-40 ${
          isOpen ? "visible" : "invisible pointer-events-none"
        }`}
        onClick={handleMenuClose}
      >
        <div
          className={`fixed top-0 left-0 h-full w-3/4 bg-background/95 dark:bg-black/60 backdrop-blur-sm shadow-lg transform transition-transform duration-500 ${
            isOpen ? "translate-x-0" : "-translate-x-full"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-end pt-20 border-b border-border/50"></div>

            <div className="p-3 border-b border-border/50">
              <div className="relative">
                <Input
                  type="text"
                  placeholder={t("common.search")}
                  className="w-full pl-9 h-9 bg-accent/50 text-foreground placeholder:text-muted-foreground"
                  value={searchTerm || ""}
                  onChange={handleChange}
                  name="search"
                />
                <IoSearchOutline className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-base" />
              </div>
              {searchTerm && firstTwelveItems.length > 0 && (
                <div className="mt-2 max-h-[300px] overflow-y-auto">
                  {firstTwelveItems.map((item) => (
                    <Link
                      key={item._id}
                      href={`/product/${item._id}`}
                      className="flex items-center gap-2 p-2 hover:bg-accent/50 rounded-lg"
                      onClick={handleMenuClose}
                    >
                      <Image
                        src={item.images[0]}
                        alt={item.name}
                        width={40}
                        height={40}
                        className="rounded-md object-cover"
                      />
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {item.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          ${item.price}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {categoriesSection}

            <div className="overflow-y-auto max-h-[calc(100vh-120px)]">
              <nav className="p-2">
                {session?.user?.admin && (
                  <Button
                    onClick={() => {
                      setMenuClose();
                      setAdminPanelMob(true);
                    }}
                    variant="ghost"
                    className="w-full mt-4 bg-yellow-500 hover:bg-yellow-400 text-foreground dark:text-foreground transition-colors"
                  >
                    {t("navigation.adminPanel")}
                  </Button>
                )}
              </nav>

              {/* User Section */}
              <div className="p-2 mt-2">
                <div className="flex items-center justify-between border-b border-border/50 pb-4">
                  <div className="flex items-center gap-6">
                    <Link
                      href="/"
                      onClick={() => {
                        setMenuClose();
                        if (productModile) setProductModile(false);
                        if (adminPanelMob) setAdminPanelMob(false);
                      }}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <IoHomeOutline className="h-6 w-6" />
                    </Link>

                    <Link
                      href="/blog"
                      onClick={() => {
                        setMenuClose();
                        if (productModile) setProductModile(false);
                        if (adminPanelMob) setAdminPanelMob(false);
                      }}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <FaBlogger className="h-6 w-6" />
                    </Link>

                    <Link
                      href="/about"
                      onClick={() => {
                        setMenuClose();
                        if (productModile) setProductModile(false);
                        if (adminPanelMob) setAdminPanelMob(false);
                      }}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <IoInformationCircleOutline className="h-6 w-6" />
                    </Link>

                    <Link
                      href="/contact"
                      onClick={() => {
                        setMenuClose();
                        if (productModile) setProductModile(false);
                        if (adminPanelMob) setAdminPanelMob(false);
                      }}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <MdContactSupport className="h-6 w-6" />
                    </Link>
                    {session?.user && (
                      <div className="flex items-center gap-2 list-none">
                        <Avatar className="h-8 w-8">
                          <AvatarImage
                            src={session.user.image || "/default-avatar.png"}
                            alt={session.user.name || "User"}
                          />
                          <AvatarFallback>
                            {session.user.name?.[0] || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <NavLink
                          href="/profile"
                          onClick={() => {
                            setMenuClose();
                            if (productModile) setProductModile(false);
                            if (adminPanelMob) setAdminPanelMob(false);
                          }}
                          className="text-foreground hover:text-foreground/80 hover:bg-accent"
                        >
                          {t("navigation.profile")}
                        </NavLink>
                      </div>
                    )}
                  </div>
                </div>
                {session?.user ? (
                  <ul className="space-y-1 list-none">
                    <NavButton
                      onClick={async () => {
                        setMenuClose();
                        try {
                          await signOut({
                            redirect: true,
                            callbackUrl: "/",
                          });
                        } catch (error) {
                          console.error("Logout failed:", error);
                        }
                      }}
                      variant="danger"
                      className="text-destructive hover:text-destructive/80 hover:bg-accent"
                    >
                      {t("navigation.logout")}
                    </NavButton>
                  </ul>
                ) : (
                  <div className="list-none">
                    <NavLink
                      href="/login"
                      onClick={() => {
                        setMenuClose();
                      }}
                      variant="primary"
                      className="text-foreground hover:text-foreground/80 hover:bg-accent"
                    >
                      {t("navigation.login")}
                    </NavLink>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      {isCartOpen && <Cart onClose={closeCart} isMobile={true} />}
      <style jsx>{`
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </>
  );
};

export default MobileMenu;
