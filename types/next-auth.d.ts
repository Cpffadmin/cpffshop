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
    };
  }
}
