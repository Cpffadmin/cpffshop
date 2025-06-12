import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { connectToDatabase, waitForConnection } from "@/utils/database";
import User from "@/utils/models/User";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";

interface UserDocument extends mongoose.Document {
  _id: string;
  name: string;
  email: string;
  password?: string;
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

declare module "next-auth" {
  interface Session {
    user: {
      _id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
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
  interface User {
    _id: string;
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
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "select_account",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            console.error("Missing credentials");
            throw new Error("Please provide both email and password");
          }

          await connectToDatabase();

          // Wait for connection to be ready with timeout
          const isConnected = await waitForConnection();
          if (!isConnected) {
            throw new Error("Database connection timeout");
          }

          console.log("Attempting to find user with email:", credentials.email);

          const userDoc = (await User.findOne({
            email: credentials.email,
          })) as UserDocument | null;
          if (!userDoc) {
            console.error("User not found:", credentials.email);
            throw new Error("Invalid credentials");
          }

          const user = userDoc.toObject();
          console.log("User found:", { id: user._id, email: user.email });

          if (!user.password) {
            console.error("User has no password (might be OAuth user)");
            throw new Error("Invalid credentials");
          }

          const isCorrectPassword = await bcrypt.compare(
            credentials.password,
            user.password
          );

          if (!isCorrectPassword) {
            console.error("Password mismatch for user:", credentials.email);
            throw new Error("Invalid credentials");
          }

          console.log("Authentication successful for user:", credentials.email);
          return {
            id: user._id.toString(),
            _id: user._id.toString(),
            name: user.name,
            email: user.email,
            admin: user.admin,
            profileImage: user.profileImage,
            role: user.role,
            notificationPreferences: user.notificationPreferences,
            phone: user.phone,
            address: user.address,
          };
        } catch (error) {
          console.error("Authorization error:", error);
          throw error;
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      try {
        await connectToDatabase();

        // Wait for connection to be ready with timeout
        const isConnected = await waitForConnection();
        if (!isConnected) {
          throw new Error("Database connection timeout");
        }

        const email = user.email;

        // Check if user exists in our database
        let dbUser = await User.findOne({ email });

        if (!dbUser) {
          // If user doesn't exist, create new user
          dbUser = await User.create({
            email: user.email,
            name: user.name,
            profileImage: user.image,
            admin: false, // Default to false
            role: "user", // Default role
            notificationPreferences: {},
            phone: user.phone,
            address: user.address,
          });
        }

        // Update user object with database values
        user.admin = dbUser.admin;
        user._id = dbUser._id.toString();
        user.role = dbUser.role;
        user.profileImage = dbUser.profileImage;
        user.notificationPreferences = dbUser.notificationPreferences;
        user.phone = dbUser.phone;
        user.address = dbUser.address;

        return true;
      } catch (error) {
        console.error("SignIn callback error:", error);
        return false;
      }
    },
    async jwt({ token, user, trigger, session }) {
      try {
        if (trigger === "update") {
          return { ...token, ...session.user };
        }

        if (user) {
          return {
            ...token,
            _id: user._id,
            admin: user.admin,
            profileImage: user.profileImage,
            role: user.role,
            notificationPreferences: user.notificationPreferences,
            phone: user.phone,
            address: user.address,
          };
        }
        return token;
      } catch (error) {
        console.error("JWT callback error:", error);
        return token;
      }
    },
    async session({ session, token }) {
      try {
        return {
          ...session,
          user: {
            ...session.user,
            _id: token._id,
            admin: token.admin,
            profileImage: token.profileImage,
            role: token.role,
            notificationPreferences: token.notificationPreferences,
            phone: token.phone,
            address: token.address,
          },
        };
      } catch (error) {
        console.error("Session callback error:", error);
        return session;
      }
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
};
