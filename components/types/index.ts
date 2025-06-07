import { Session } from "next-auth";
import { ChangeEvent, Dispatch, SetStateAction } from "react";

export interface CustomUser {
  id: string;
  name: string;
  email: string;
  role: string;
  image?: string;
}

export interface SearchResult {
  id: string;
  name: string;
  type: string;
  url: string;
}

export interface SearchDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface ProductDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
}

export interface AdminDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface NavbarLinksProps {
  isAdmin: boolean;
  isAuthenticated: boolean;
}

export interface UserSectionProps {
  user: CustomUser | null;
  isAdmin: boolean;
  isAuthenticated: boolean;
}

export interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  isAdmin: boolean;
  isAuthenticated: boolean;
  user: CustomUser | null;
}

export interface ProductData {
  user?: string;
  name: string;
  displayNames: {
    en: string;
    "zh-TW": string;
  };
  description: string;
  descriptions: {
    en: string;
    "zh-TW": string;
  };
  brand: string;
  images: string[];
  price: number;
  originalPrice: number;
  stock: number;
  category: string;
  specifications: Array<{
    key: string;
    value: string | number | { en: string; "zh-TW": string };
    type: "text" | "number" | "select";
    displayNames?: {
      en: string;
      "zh-TW": string;
    };
    description?: string;
    options?: string[];
    required?: boolean;
  }>;
}

export interface Category {
  _id: string;
  name: string;
  displayNames: {
    en: string;
    "zh-TW": string;
  };
  description?: string;
  specifications?: Specification[];
}

export interface Brand {
  _id: string;
  name: string;
  displayNames: {
    en: string;
    "zh-TW": string;
  };
  descriptions: {
    en: string;
    "zh-TW": string;
  };
  isActive: boolean;
}

export interface Specification {
  key: string;
  type: "text" | "number" | "select";
  displayNames: {
    en: string;
    "zh-TW": string;
  };
  description?: string;
  options?: string[];
  required?: boolean;
}
