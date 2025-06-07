import React from "react";
import { Button } from "@/components/ui/button";
import { IoMdClose } from "react-icons/io";
import Link from "next/link";
import {
  Plus,
  ListOrdered,
  Mail,
  SettingsIcon,
  FileText,
  PenTool,
  Tag,
  Sliders,
  Grid,
  Shield,
  Star,
} from "lucide-react";
import { useTranslation } from "@/providers/language/LanguageContext";

interface AdminDrawerProps {
  admin: boolean;
  setAdmin: (value: boolean) => void;
  adminPanelMob?: boolean;
  setAdminPanelMob?: (value: boolean) => void;
}

const AdminDrawer = ({
  admin,
  setAdmin,
  adminPanelMob,
  setAdminPanelMob,
}: AdminDrawerProps) => {
  const { t, isLoading } = useTranslation();

  const handleClose = () => {
    if (adminPanelMob && setAdminPanelMob) {
      setAdminPanelMob(false);
      return;
    }
    setAdmin(false);
  };

  const handleOutsideClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  // Don't render if translations aren't loaded yet
  if (isLoading) {
    return null;
  }

  return (
    <div
      className={`fixed inset-0 bg-black/50 transition-all duration-300 z-50 ${
        admin || adminPanelMob
          ? "opacity-100 visible"
          : "opacity-0 invisible pointer-events-none"
      }`}
      onClick={handleOutsideClick}
    >
      <div
        className={`absolute top-0 left-0 right-0 bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/85 border-b border-border shadow-lg transition-all duration-300 transform overflow-y-auto max-h-[85vh] ${
          admin || adminPanelMob ? "translate-y-0" : "-translate-y-full"
        }`}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border p-4 bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/85">
          <h2 className="text-2xl font-bold text-foreground">
            {t("navigation.adminPanel")}
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="text-muted-foreground hover:text-foreground flex items-center gap-2"
          >
            <IoMdClose className="h-5 w-5" /> {t("navigation.close")}
          </Button>
        </div>

        <div className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-2 text-foreground">
                {t("product.products")}
              </h3>
              <div className="space-y-2">
                <Link
                  href="/admin/products/create"
                  onClick={handleClose}
                  className="flex items-center rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-foreground"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {t("product.addProduct")}
                </Link>
                <Link
                  href="/admin/products"
                  onClick={handleClose}
                  className="flex items-center rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-foreground"
                >
                  <ListOrdered className="mr-2 h-4 w-4" />
                  {t("product.viewAllProducts")}
                </Link>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2 text-foreground">
                {t("navigation.orders")}
              </h3>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/admin/orders"
                    onClick={handleClose}
                    className="flex items-center rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-foreground"
                  >
                    <ListOrdered className="mr-2 h-4 w-4" />
                    {t("orders.viewAllOrders")}
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2 text-foreground">
                {t("navigation.logistics")}
              </h3>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/admin/logistics"
                    onClick={handleClose}
                    className="flex items-center rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-foreground"
                  >
                    {t("logistics.manageVehicles")}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/admin/logistics/create"
                    onClick={handleClose}
                    className="flex items-center rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-foreground"
                  >
                    {t("logistics.addVehicle")}
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2 text-foreground">
                {t("admin.usersAndRoles")}
              </h3>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/admin/roles"
                    onClick={handleClose}
                    className="flex items-center rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-foreground"
                  >
                    {t("admin.manageRoles")}
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2 text-foreground">
                {t("admin.contentManagement")}
              </h3>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/admin/categories"
                    onClick={handleClose}
                    className="flex items-center rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-foreground"
                  >
                    <Grid className="h-4 w-4 mr-2" />
                    {t("admin.categories")}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/admin/brands"
                    onClick={handleClose}
                    className="flex items-center rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-foreground"
                  >
                    <Tag className="h-4 w-4 mr-2" />
                    {t("admin.brands")}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/admin/specifications"
                    onClick={handleClose}
                    className="flex items-center rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-foreground"
                  >
                    <Sliders className="h-4 w-4 mr-2" />
                    {t("admin.specifications")}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/admin/blog"
                    onClick={handleClose}
                    className="flex items-center rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-foreground"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    {t("navigation.blog")}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/admin/newsletter"
                    onClick={handleClose}
                    className="flex items-center rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-foreground"
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    {t("admin.newsletter")}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/admin/GuaranteeSection"
                    onClick={handleClose}
                    className="flex items-center rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-foreground"
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    {t(
                      "admin.dashboard.sections.contentManagement.guaranteeSection"
                    )}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/admin/featuresSection"
                    onClick={handleClose}
                    className="flex items-center rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-foreground"
                  >
                    <Star className="h-4 w-4 mr-2" />
                    {t(
                      "admin.dashboard.sections.contentManagement.featuresSection"
                    )}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/admin/gallery"
                    onClick={handleClose}
                    className="flex items-center rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-foreground"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    {t("admin.gallery.title")}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/admin/product-of-the-month"
                    onClick={handleClose}
                    className="flex items-center rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-foreground"
                  >
                    <Tag className="h-4 w-4 mr-2" />
                    {t("product.productOfTheMonth.title")}
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2 text-foreground">
                {t("admin.settings")}
              </h3>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/admin/settings"
                    onClick={handleClose}
                    className="flex items-center rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-foreground"
                  >
                    <SettingsIcon className="h-4 w-4 mr-2" />
                    {t("admin.storeSettings")}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/admin/delivery"
                    onClick={handleClose}
                    className="flex items-center rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-foreground"
                  >
                    <Tag className="h-4 w-4 mr-2" />
                    {t("admin.deliverySettings")}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/admin/privacy-policy"
                    onClick={handleClose}
                    className="flex items-center rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-foreground"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    {t("admin.privacyPolicy")}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/admin/settings/hero"
                    onClick={handleClose}
                    className="flex items-center rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-foreground"
                  >
                    <PenTool className="h-4 w-4 mr-2" />
                    {t("admin.heroSection")}
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDrawer;
