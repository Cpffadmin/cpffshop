/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import FeaturedProduct from "@/components/HomepageComponents/FeaturedProduct";
import BestSellingWatches from "@/components/HomepageComponents/BestSelling";
import GallerySlider from "@/components/HomepageComponents/GallerySlider";
import NewsletterComponent from "@/components/HomepageComponents/NewsletterComponent";
import Image from "next/image";
import { useSession } from "next-auth/react";
import DynamicHeroVideo from "@/components/HomepageComponents/DynamicHeroVideo";
import ProductOfTheMonth from "@/components/HomepageComponents/ProductOfTheMonth";

export default function Home() {
  const { data: session } = useSession();
  return (
    <div className="app-global-container mt-0">
      <DynamicHeroVideo />
      <BestSellingWatches />
      <FeaturedProduct />
      <GallerySlider />
      <ProductOfTheMonth />
      <NewsletterComponent />
    </div>
  );
}
