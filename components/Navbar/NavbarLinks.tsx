import React from "react";
import Link from "next/link";
import { Session } from "next-auth";
import { useTranslation } from "@/providers/language/LanguageContext";
import { AiOutlineHome } from "react-icons/ai";
import { BsInfoCircle } from "react-icons/bs";
import { FaBlogger } from "react-icons/fa";
import { FaShop } from "react-icons/fa6";
import { MdContactSupport } from "react-icons/md";
import { RiAdminLine } from "react-icons/ri";
import LoadingSkeleton from "@/components/ui/LoadingSkeleton";

interface NavbarLinksProps {
  session: Session | null;
  setAdmin: (value: boolean) => void;
}

const NavbarLinks = ({ session, setAdmin }: NavbarLinksProps) => {
  const { t, isLoading } = useTranslation();

  return (
    <>
      <Link href="/" className="navbar-button">
        {isLoading ? (
          <LoadingSkeleton width="w-20" height="h-4" />
        ) : (
          <span className="navbar-button-text">{t("navigation.home")}</span>
        )}
        <AiOutlineHome className="navbar-button-icon" />
      </Link>

      <Link href="/products" className="navbar-button">
        {isLoading ? (
          <LoadingSkeleton width="w-20" height="h-4" />
        ) : (
          <span className="navbar-button-text">{t("navigation.products")}</span>
        )}
        <FaShop className="navbar-button-icon" />
      </Link>

      <Link href="/blog" className="navbar-button">
        {isLoading ? (
          <LoadingSkeleton width="w-20" height="h-4" />
        ) : (
          <span className="navbar-button-text">{t("navigation.blog")}</span>
        )}
        <FaBlogger className="navbar-button-icon" />
      </Link>

      <Link href="/about" className="navbar-button">
        {isLoading ? (
          <LoadingSkeleton width="w-20" height="h-4" />
        ) : (
          <span className="navbar-button-text">{t("navigation.about")}</span>
        )}
        <BsInfoCircle className="navbar-button-icon" />
      </Link>

      <Link href="/contact" className="navbar-button">
        {isLoading ? (
          <LoadingSkeleton width="w-20" height="h-4" />
        ) : (
          <span className="navbar-button-text">{t("navigation.contact")}</span>
        )}
        <MdContactSupport className="navbar-button-icon" />
      </Link>

      {session?.user?.admin && (
        <button
          onClick={() => setAdmin(true)}
          className="navbar-button admin-panel-button"
          title={t("navigation.adminPanel")}
        >
          {isLoading ? (
            <LoadingSkeleton width="w-20" height="h-4" />
          ) : (
            <span className="navbar-button-text">
              {t("navigation.adminPanel")}
            </span>
          )}
          <RiAdminLine className="navbar-button-icon" />
        </button>
      )}
    </>
  );
};

export default NavbarLinks;
