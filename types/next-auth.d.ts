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
      roomFlat: { en: string; "zh-TW": string };
      floor: { en: string; "zh-TW": string };
      blockNumber: { en: string; "zh-TW": string };
      blockName: { en: string; "zh-TW": string };
      buildingName: { en: string; "zh-TW": string };
      streetNumber: { en: string; "zh-TW": string };
      streetName: { en: string; "zh-TW": string };
      district: string;
      location: string;
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
        roomFlat: { en: string; "zh-TW": string };
        floor: { en: string; "zh-TW": string };
        blockNumber: { en: string; "zh-TW": string };
        blockName: { en: string; "zh-TW": string };
        buildingName: { en: string; "zh-TW": string };
        streetNumber: { en: string; "zh-TW": string };
        streetName: { en: string; "zh-TW": string };
        district: string;
        location: string;
      };
    };
  }
}
