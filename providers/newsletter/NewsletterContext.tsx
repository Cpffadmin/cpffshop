"use client";

import React, { createContext, useContext, useState } from "react";
import axios from "axios";

interface NewsletterContextType {
  subscribe: (email: string, source: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

const NewsletterContext = createContext<NewsletterContextType>({
  subscribe: async () => {},
  isLoading: false,
  error: null,
});

export const useNewsletter = () => {
  const context = useContext(NewsletterContext);
  if (!context) {
    throw new Error("useNewsletter must be used within a NewsletterProvider");
  }
  return context;
};

export const NewsletterProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const subscribe = async (email: string, source: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await axios.post("/api/newsletter/subscribe", { email, source });
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError("Failed to subscribe to newsletter");
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <NewsletterContext.Provider value={{ subscribe, isLoading, error }}>
      {children}
    </NewsletterContext.Provider>
  );
};
