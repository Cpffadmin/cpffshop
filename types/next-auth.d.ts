import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    _id: string;
    id: string;
    name?: string | null;
    email?: string | null;
    admin: boolean;
    profileImage: string;
    role: "admin" | "accounting" | "logistics" | "user";
    notificationPreferences: Record<string, boolean>;
    phone?: string;
    address?: {
      room: { en: string; "zh-TW": string };
      floor: { en: string; "zh-TW": string };
      building: { en: string; "zh-TW": string };
      street: { en: string; "zh-TW": string };
      city: { en: string; "zh-TW": string };
      state: { en: string; "zh-TW": string };
      country: { en: string; "zh-TW": string };
      postalCode: { en: string; "zh-TW": string };
      formattedAddress?: { en: string; "zh-TW": string };
    };
  }

  interface Session extends DefaultSession {
    user: {
      _id: string;
      id: string;
      name?: string | null;
      email?: string | null;
      admin: boolean;
      profileImage: string;
      role: "admin" | "accounting" | "logistics" | "user";
      notificationPreferences: Record<string, boolean>;
      phone?: string;
      address?: {
        room: { en: string; "zh-TW": string };
        floor: { en: string; "zh-TW": string };
        building: { en: string; "zh-TW": string };
        street: { en: string; "zh-TW": string };
        city: { en: string; "zh-TW": string };
        state: { en: string; "zh-TW": string };
        country: { en: string; "zh-TW": string };
        postalCode: { en: string; "zh-TW": string };
        formattedAddress?: { en: string; "zh-TW": string };
      };
    };
  }
}
