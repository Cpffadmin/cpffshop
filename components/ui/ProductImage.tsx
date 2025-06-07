import Image from "next/image";
import { useState } from "react";

interface ProductImageProps {
  src?: string;
  alt?: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
}

export function ProductImage({
  src,
  alt = "Product Image",
  className = "",
  sizes = "100vw",
  priority = false,
}: ProductImageProps) {
  const [error, setError] = useState(false);

  // Use a default watch image from our public directory as fallback
  const fallbackImage = "/watch1.jpg";

  return (
    <Image
      fill
      src={error ? fallbackImage : src || fallbackImage}
      alt={alt}
      className={`object-cover rounded ${className}`}
      sizes={sizes}
      priority={priority}
      onError={() => setError(true)}
    />
  );
}
