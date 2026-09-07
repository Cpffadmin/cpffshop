"use client";

import Image from "next/image";
import { Minus, Plus } from "lucide-react";
import { useTranslation } from "@/providers/language/LanguageContext";
import { cn } from "@/lib/utils";

import type { QuickOrderProduct } from "./types";

interface QuickOrderCardProps {
  product: QuickOrderProduct;
  quantity: number;
  onQuantityChange: (product: QuickOrderProduct, quantity: number) => void;
  onOpenSpecifications: (productId: string) => void;
  isNew?: boolean;
}

export default function QuickOrderCard({
  product,
  quantity,
  onQuantityChange,
  onOpenSpecifications,
  isNew = false,
}: QuickOrderCardProps) {
  const { t, language } = useTranslation();

  const label =
    product.displayNames?.[language] ||
    product.displayNames?.en ||
    product.name;
  // Secondary English line helps only when reading Chinese names; in English it
  // just repeats the title.
  const englishName = product.displayNames?.en || product.name;
  const subtitle = englishName === label ? null : englishName;
  const isOutOfStock = product.stock <= 0;

  return (
    <div
      className={cn(
        "relative flex flex-col overflow-hidden rounded-lg border bg-card transition-colors",
        quantity > 0 ? "border-primary" : "border-border"
      )}
    >
      {isNew && (
        <span className="absolute left-2 top-2 z-10 rounded-full bg-yellow-400 px-2 py-0.5 text-xs font-bold text-neutral-900">
          {t("quick-order.newBadge")}
        </span>
      )}

      <div className="relative aspect-square w-full">
        <Image
          src={product.image}
          alt={label}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          className="object-cover"
          loading="lazy"
        />
      </div>

      <div className="flex flex-1 flex-col gap-1 p-2">
        <p className="text-sm font-semibold leading-tight text-foreground line-clamp-2">
          {label}
        </p>
        {subtitle && (
          <p className="text-xs text-muted-foreground line-clamp-1">
            {subtitle}
          </p>
        )}
        <p className="mt-auto pt-1 text-sm font-bold text-foreground">
          ${product.price.toFixed(2)}
        </p>

        {isOutOfStock ? (
          <p className="py-1 text-center text-xs font-medium text-red-500">
            {t("product.stock.outOfStock")}
          </p>
        ) : product.hasSpecifications ? (
          <button
            type="button"
            onClick={() => onOpenSpecifications(product._id)}
            className="rounded-md bg-primary px-2 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {t("quick-order.chooseOptions")}
          </button>
        ) : (
          <div className="flex items-center justify-between gap-1">
            <button
              type="button"
              onClick={() => onQuantityChange(product, quantity - 1)}
              disabled={quantity === 0}
              aria-label={t("common.previous")}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-foreground transition-opacity disabled:opacity-30"
            >
              <Minus className="h-4 w-4" />
            </button>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              value={quantity}
              onChange={(event) =>
                onQuantityChange(product, parseInt(event.target.value, 10) || 0)
              }
              aria-label={t("cart.quantity")}
              className="h-8 w-full min-w-0 rounded-md border border-border bg-background text-center text-sm text-foreground"
            />
            <button
              type="button"
              onClick={() => onQuantityChange(product, quantity + 1)}
              aria-label={t("common.next")}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground transition-opacity disabled:opacity-30"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
