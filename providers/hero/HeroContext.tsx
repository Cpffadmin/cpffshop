"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import axios from "axios";
import toast from "react-hot-toast";

export interface HeroSection {
  _id: string;
  title: string;
  description: string;
  creditText: string;
  media: {
    videoUrl: string;
    posterUrl: string;
    mediaType: "video" | "image";
  };
  buttons: {
    primary: {
      text: string;
      link: string;
    };
    secondary: {
      text: string;
      link: string;
    };
  };
  isActive: boolean;
  order: number;
}

interface HeroContextType {
  heroSections: HeroSection[];
  isLoading: boolean;
  error: string | null;
  updateHeroSection: (
    sectionId: string,
    updates: Partial<HeroSection>
  ) => Promise<void>;
  updateVideo: (sectionId: string, videoUrl: string) => Promise<void>;
  updatePoster: (sectionId: string, posterUrl: string) => Promise<void>;
  addHeroSection: (section: Omit<HeroSection, "_id">) => Promise<void>;
  removeHeroSection: (sectionId: string) => Promise<void>;
  setActiveSection: (sectionId: string) => Promise<void>;
  reorderSections: (newOrder: string[]) => Promise<void>;
}

const defaultContext: HeroContextType = {
  heroSections: [],
  isLoading: false,
  error: null,
  updateHeroSection: async () => {},
  updateVideo: async () => {},
  updatePoster: async () => {},
  addHeroSection: async () => {},
  removeHeroSection: async () => {},
  setActiveSection: async () => {},
  reorderSections: async () => {},
};

export const HeroContext = createContext<HeroContextType>(defaultContext);

export const useHero = () => {
  const context = useContext(HeroContext);
  if (!context) {
    throw new Error("useHero must be used within a HeroProvider");
  }
  return context;
};

interface HeroProviderProps {
  children: ReactNode;
}

export const HeroProvider = ({ children }: HeroProviderProps) => {
  const [heroSections, setHeroSections] = useState<HeroSection[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchHeroSections();
  }, []);

  const fetchHeroSections = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get("/api/hero-sections");
      setHeroSections(response.data);
      setError(null);
    } catch (err) {
      setError("Failed to fetch hero sections");
      toast.error("Failed to fetch hero sections");
    } finally {
      setIsLoading(false);
    }
  };

  const updateHeroSection = async (
    sectionId: string,
    updates: Partial<HeroSection>
  ) => {
    setIsLoading(true);
    try {
      const response = await axios.patch(
        `/api/hero-sections/${sectionId}`,
        updates
      );
      setHeroSections((prev) =>
        prev.map((section) =>
          section._id === sectionId ? { ...section, ...response.data } : section
        )
      );
      toast.success("Hero section updated successfully");
    } catch (err) {
      toast.error("Failed to update hero section");
    } finally {
      setIsLoading(false);
    }
  };

  const updateVideo = async (sectionId: string, videoUrl: string) => {
    const currentSection = heroSections.find((s) => s._id === sectionId);
    await updateHeroSection(sectionId, {
      media: {
        videoUrl: videoUrl.replace("http:", "https:"),
        posterUrl: currentSection?.media.posterUrl || "",
        mediaType: "video",
      },
    });
  };

  const updatePoster = async (sectionId: string, posterUrl: string) => {
    const currentSection = heroSections.find((s) => s._id === sectionId);
    await updateHeroSection(sectionId, {
      media: {
        videoUrl: currentSection?.media.videoUrl || "",
        posterUrl: posterUrl.replace("http:", "https:"),
        mediaType: currentSection?.media.videoUrl ? "video" : "image",
      },
    });
  };

  const addHeroSection = async (section: Omit<HeroSection, "_id">) => {
    setIsLoading(true);
    try {
      const response = await axios.post("/api/hero-sections", section);
      setHeroSections((prev) => [...prev, response.data]);
      toast.success("New hero section added successfully");
    } catch (err) {
      toast.error("Failed to add hero section");
    } finally {
      setIsLoading(false);
    }
  };

  const removeHeroSection = async (sectionId: string) => {
    setIsLoading(true);
    try {
      await axios.delete(`/api/hero-sections/${sectionId}`);
      setHeroSections((prev) =>
        prev.filter((section) => section._id !== sectionId)
      );
      toast.success("Hero section removed successfully");
    } catch (err) {
      toast.error("Failed to remove hero section");
    } finally {
      setIsLoading(false);
    }
  };

  const setActiveSection = async (sectionId: string) => {
    setIsLoading(true);
    try {
      await axios.post(`/api/hero-sections/${sectionId}/activate`);
      setHeroSections((prev) =>
        prev.map((section) => ({
          ...section,
          isActive: section._id === sectionId,
        }))
      );
      toast.success("Active hero section updated successfully");
    } catch (err) {
      toast.error("Failed to update active section");
    } finally {
      setIsLoading(false);
    }
  };

  const reorderSections = async (newOrder: string[]) => {
    setIsLoading(true);
    try {
      await axios.post("/api/hero-sections/reorder", { order: newOrder });
      setHeroSections((prev) => {
        const orderMap = new Map(newOrder.map((id, index) => [id, index]));
        return [...prev].sort(
          (a, b) => (orderMap.get(a._id) ?? 0) - (orderMap.get(b._id) ?? 0)
        );
      });
      toast.success("Hero sections reordered successfully");
    } catch (err) {
      toast.error("Failed to reorder sections");
    } finally {
      setIsLoading(false);
    }
  };

  const contextValue: HeroContextType = {
    heroSections,
    isLoading,
    error,
    updateHeroSection,
    updateVideo,
    updatePoster,
    addHeroSection,
    removeHeroSection,
    setActiveSection,
    reorderSections,
  };

  return (
    <HeroContext.Provider value={contextValue}>{children}</HeroContext.Provider>
  );
};
