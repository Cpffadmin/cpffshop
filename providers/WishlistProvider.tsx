"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { SWRConfig } from "swr";
import axios from "axios";

const fetcher = (url: string) => axios.get(url).then((res) => res.data);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig 
      value={{
        fetcher,
        revalidateOnFocus: false,
        revalidateOnReconnect: true,
        dedupingInterval: 1000,
        refreshInterval: 0,
        focusThrottleInterval: 5000,
      }}
    >
      {children}
    </SWRConfig>
  );
}
