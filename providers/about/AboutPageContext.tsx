"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import { useStore } from "@/providers/store/StoreContext";

// Types for About Page data structure
interface MultiLangValue {
  en: string;
  "zh-TW": string;
}

interface AboutPageStory {
  title: MultiLangValue;
  content: MultiLangValue;
  image: string;
}

interface AboutPageValue {
  title: MultiLangValue;
  description: MultiLangValue;
  icon: string;
}

interface AboutPageTeamMember {
  name: MultiLangValue;
  role: MultiLangValue;
  image: string;
  description: MultiLangValue;
}

interface AboutPageValues {
  title: MultiLangValue;
  items: AboutPageValue[];
}

interface AboutPageTeam {
  title: MultiLangValue;
  members: AboutPageTeamMember[];
}

export interface AboutPage {
  title: MultiLangValue;
  subtitle: MultiLangValue;
  bannerImage: string;
  story: AboutPageStory;
  values: AboutPageValues;
  team: AboutPageTeam;
}

interface AboutPageContextType {
  aboutSettings: AboutPage | null;
  isLoading: boolean;
  error: string | null;
  updateAboutSettings: (newSettings: Partial<AboutPage>) => Promise<void>;
  updateStoryImage: (imageUrl: string) => Promise<void>;
  updateBannerImage: (imageUrl: string) => Promise<void>;
  updateTeamMemberImage: (
    imageUrl: string,
    memberIndex: number
  ) => Promise<void>;
  updateTeamMember: (
    memberIndex: number,
    member: AboutPageTeamMember
  ) => Promise<void>;
  addValue: (value: AboutPageValue) => Promise<void>;
  updateValue: (valueIndex: number, value: AboutPageValue) => Promise<void>;
  removeValue: (index: number) => Promise<void>;
  addTeamMember: (member: AboutPageTeamMember) => Promise<void>;
  removeTeamMember: (index: number) => Promise<void>;
}

const defaultContext: AboutPageContextType = {
  aboutSettings: null,
  isLoading: false,
  error: null,
  updateAboutSettings: async () => {},
  updateStoryImage: async () => {},
  updateBannerImage: async () => {},
  updateTeamMemberImage: async () => {},
  updateTeamMember: async () => {},
  addValue: async () => {},
  updateValue: async () => {},
  removeValue: async () => {},
  addTeamMember: async () => {},
  removeTeamMember: async () => {},
};

export const AboutPageContext =
  createContext<AboutPageContextType>(defaultContext);

export const useAboutPage = () => {
  const context = useContext(AboutPageContext);
  if (!context) {
    throw new Error("useAboutPage must be used within an AboutPageProvider");
  }
  return context;
};

export const AboutPageProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { settings, refreshSettings } = useStore();
  const [aboutSettings, setAboutSettings] = useState<AboutPage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (settings?.aboutPage) {
      setAboutSettings(settings.aboutPage);
      setIsLoading(false);
    }
  }, [settings]);

  const updateAboutSettings = async (newSettings: Partial<AboutPage>) => {
    setIsLoading(true);
    setError(null);
    try {
      console.log("Updating about settings:", newSettings); // Debug log

      // Update local state immediately for better UX
      const updatedSettings = { ...aboutSettings, ...newSettings };
      setAboutSettings(updatedSettings as AboutPage);

      // Update the settings in the database
      const response = await axios.post("/api/store-settings", {
        aboutPage: updatedSettings,
      });

      console.log("Server response:", response.data); // Debug log

      if (response.data?.aboutPage) {
        // Update local state with the response
        setAboutSettings(response.data.aboutPage);

        // Refresh the store settings to ensure consistency
        await refreshSettings();
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (err) {
      console.error("Failed to update about page settings:", err);
      setError("Failed to update about page settings");
      // Revert local state on error
      if (settings?.aboutPage) {
        setAboutSettings(settings.aboutPage);
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateStoryImage = async (imageUrl: string) => {
    if (!aboutSettings) return;
    await updateAboutSettings({
      story: { ...aboutSettings.story, image: imageUrl },
    });
  };

  const updateBannerImage = async (imageUrl: string) => {
    await updateAboutSettings({ bannerImage: imageUrl });
  };

  const updateTeamMemberImage = async (
    imageUrl: string,
    memberIndex: number
  ) => {
    if (!aboutSettings) return;
    const newMembers = [...aboutSettings.team.members];
    newMembers[memberIndex] = { ...newMembers[memberIndex], image: imageUrl };
    await updateAboutSettings({
      team: { ...aboutSettings.team, members: newMembers },
    });
  };

  const updateTeamMember = async (
    memberIndex: number,
    member: AboutPageTeamMember
  ) => {
    if (!aboutSettings) return;
    const newMembers = [...aboutSettings.team.members];
    newMembers[memberIndex] = member;
    await updateAboutSettings({
      team: { ...aboutSettings.team, members: newMembers },
    });
  };

  const addTeamMember = async (member: AboutPageTeamMember) => {
    if (!aboutSettings) return;
    const newMembers = [...aboutSettings.team.members, member];
    await updateAboutSettings({
      team: { ...aboutSettings.team, members: newMembers },
    });
  };

  const removeTeamMember = async (memberIndex: number) => {
    if (!aboutSettings) return;
    const newMembers = aboutSettings.team.members.filter(
      (_, index) => index !== memberIndex
    );
    await updateAboutSettings({
      team: { ...aboutSettings.team, members: newMembers },
    });
  };

  const addValue = async (value: AboutPageValue) => {
    if (!aboutSettings) return;
    const newValues = [...aboutSettings.values.items, value];
    await updateAboutSettings({
      values: { ...aboutSettings.values, items: newValues },
    });
  };

  const updateValue = async (valueIndex: number, value: AboutPageValue) => {
    if (!aboutSettings) return;
    const newValues = [...aboutSettings.values.items];
    newValues[valueIndex] = value;
    await updateAboutSettings({
      values: { ...aboutSettings.values, items: newValues },
    });
  };

  const removeValue = async (valueIndex: number) => {
    if (!aboutSettings) return;
    const newValues = aboutSettings.values.items.filter(
      (_, index) => index !== valueIndex
    );
    await updateAboutSettings({
      values: { ...aboutSettings.values, items: newValues },
    });
  };

  return (
    <AboutPageContext.Provider
      value={{
        aboutSettings,
        isLoading,
        error,
        updateAboutSettings,
        updateStoryImage,
        updateBannerImage,
        updateTeamMemberImage,
        updateTeamMember,
        addTeamMember,
        removeTeamMember,
        addValue,
        updateValue,
        removeValue,
      }}
    >
      {children}
    </AboutPageContext.Provider>
  );
};
