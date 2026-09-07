"use client";

import Image from "next/image";
import { Minus, Plus } from "lucide-react";
import { useTranslation } from "@/providers/language/LanguageContext";
import { cn } from "@/lib/utils";
import type { QuickOrderProduct } from "./types";

interface QuickOrderRowProps {
  product: QuickOrderProduct;
  quantity: number;
  onQuantityChange: (product: QuickOrderProduct, quantity: number) => void;
  onOpenSpecifications: (productId: string) => void;
  isNew?: boolean;
}

// Compact row for the saved-list view: a reorder sheet is read line by line, so
// a full card per product would push a ten-item list off the screen.
export default function QuickOrderRow({
  product,
  quantity,
  onQuantityChange,
  onOpenSpecifications,
  isNew = false,
}: QuickOrderRowProps) {
  const { t, language } = useTranslation();

  const label =
    product.displayNames?.[language] ||
    product.displayNames?.en ||
    product.name;
  const isOutOfStock = product.stock <= 0;

  return (
    <div
      className={cn(
        // `min-w-0` is load-bearing: the truncated name below is `nowrap`, so as a
        // grid item this row would otherwise force the track as wide as the
        // longest product name and push the stepper off screen.
        "flex min-w-0 items-center gap-3 rounded-lg border bg-card p-2",
        quantity > 0 ? "border-primary" : "border-border"
      )}
    >
      <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-md">
        <Image
          src={product.image}
          alt={label}
          fill
          sizes="56px"
          className="object-cover"
          loading="lazy"
        />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-2">
          <p className="min-w-0 truncate text-sm font-semibold text-foreground">
            {label}
          </p>
          {isNew && (
            <span className="flex-shrink-0 rounded-full bg-yellow-400 px-1.5 text-xs font-bold text-neutral-900">
              {t("quick-order.newBadge")}
            </span>
          )}
        </div>
        <p className="text-sm font-bold text-foreground">
          ${product.price.toFixed(2)}
        </p>
      </div>

      {isOutOfStock ? (
        <p className="flex-shrink-0 text-xs font-medium text-red-500">
          {t("product.stock.outOfStock")}
        </p>
      ) : product.hasSpecifications ? (
        <button
          type="button"
          onClick={() => onOpenSpecifications(product._id)}
          className="flex-shrink-0 rounded-md bg-primary px-3 py-2 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          {t("quick-order.chooseOptions")}
        </button>
      ) : (
        <div className="flex flex-shrink-0 items-center gap-1">
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
            className="h-8 w-14 rounded-md border border-border bg-background text-center text-sm text-foreground"
          />
          <button
            type="button"
            onClick={() => onQuantityChange(product, quantity + 1)}
            aria-label={t("common.next")}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground transition-opacity"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
