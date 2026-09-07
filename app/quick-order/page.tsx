"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import useSWR from "swr";
import axios from "axios";
import { toast } from "react-hot-toast";
import {
  ArrowLeft,
  BookmarkPlus,
  ClipboardList,
  LayoutGrid,
  List,
  PackagePlus,
  Pencil,
  Save,
  Search,
  ShoppingCart,
  Trash2,
} from "lucide-react";
import { useTranslation } from "@/providers/language/LanguageContext";
import { useCart } from "@/providers/cart/CartContext";
import { useCartUI } from "@/components/ui/CartUIContext";
import { useUser } from "@/providers/user/UserContext";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SpecificationsModal } from "@/components/ui/SpecificationsModal";
import CategoryMenu from "@/components/ui/CategoryMenu";
import { MultiLangInput } from "@/components/MultiLangInput/MultiLangInput";
import {
  hasAnyName,
  templateLabel,
  templateNames,
  type TemplateNames,
} from "@/lib/orderTemplates";
import { useConfirm } from "@/components/ui/confirm-provider";
import QuickOrderCard from "@/components/quick-order/QuickOrderCard";
import QuickOrderRow from "@/components/quick-order/QuickOrderRow";
import type { QuickOrderProduct } from "@/components/quick-order/types";
import type { AddToCartItem, OrderTemplate, Product } from "@/types";
import { cn } from "@/lib/utils";

type Layout = "rows" | "cards";

const ALL_CATEGORIES = "All Categories";

const EMPTY_NAMES: TemplateNames = { en: "", "zh-TW": "" };

const QUANTITIES_STORAGE_KEY = "quick-order-quantities";
const ADD_HINT_STORAGE_KEY = "quick-order-add-hint-seen";

const fetcher = (url: string) => axios.get(url).then((res) => res.data);

// Prefer the API's reason over a generic message — it names the actual problem
// (validation, stale schema, connection) instead of hiding it.
const apiErrorMessage = (error: unknown, fallback: string) => {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as
      | { error?: string; detail?: string }
      | undefined;
    return data?.detail || data?.error || fallback;
  }
  return fallback;
};

const readStoredQuantities = (): Record<string, number> => {
  if (typeof window === "undefined") return {};
  try {
    const parsed = JSON.parse(
      window.localStorage.getItem(QUANTITIES_STORAGE_KEY) || "{}"
    );
    if (!parsed || typeof parsed !== "object") return {};
    return Object.fromEntries(
      Object.entries(parsed).filter(
        ([, quantity]) => typeof quantity === "number" && quantity > 0
      )
    ) as Record<string, number>;
  } catch {
    return {};
  }
};

export default function QuickOrderPage() {
  const { t, language } = useTranslation();
  const { addItems } = useCart();
  const { openCart } = useCartUI();
  const { userData, refreshUserData } = useUser();
  const confirm = useConfirm();

  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [search, setSearch] = useState("");
  // "All Categories" is CategoryMenu's sentinel for "no filter".
  const [categoryId, setCategoryId] = useState(ALL_CATEGORIES);
  const [specProduct, setSpecProduct] = useState<Product | null>(null);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [listNames, setListNames] = useState<TemplateNames>(EMPTY_NAMES);
  const [isSaving, setIsSaving] = useState(false);
  const [renameTarget, setRenameTarget] = useState<OrderTemplate | null>(null);
  const [renameNames, setRenameNames] = useState<TemplateNames>(EMPTY_NAMES);

  // "My list" and "All products" are separate views rather than one filtered
  // grid: the whole point of the page is to reorder a short list, and mixing it
  // into ~300 cards is what made the list impossible to find.
  const [view, setView] = useState<"list" | "browse">("browse");
  // Rows on phones (a card per product means endless scrolling), cards on
  // desktop where there is room for photos. Starts at "rows" so the first client
  // render matches the server, then the effect below upgrades wide screens.
  const [listLayout, setListLayout] = useState<Layout>("rows");
  const [browseLayout, setBrowseLayout] = useState<Layout>("rows");
  const layoutChosenRef = useRef(false);
  const [activeListId, setActiveListId] = useState<string | null>(null);
  const [chooserOpen, setChooserOpen] = useState(false);
  const [addHintSeen, setAddHintSeen] = useState(true);
  const chooserPromptedRef = useRef(false);

  const { data, error, isLoading } = useSWR<{ products: QuickOrderProduct[] }>(
    "/api/products/quick-list",
    fetcher,
    { revalidateOnFocus: false, revalidateOnReconnect: false }
  );

  const products = useMemo(() => data?.products ?? [], [data]);

  // Restore after mount so the markup matches the server render.
  useEffect(() => {
    setQuantities(readStoredQuantities());
    try {
      setAddHintSeen(
        window.localStorage.getItem(ADD_HINT_STORAGE_KEY) === "1"
      );
    } catch {
      setAddHintSeen(true);
    }
  }, []);

  // Follows the viewport until the customer picks a layout themselves, after
  // which their choice wins for the rest of the visit.
  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 768px)");

    const apply = () => {
      if (layoutChosenRef.current) return;
      const preset: Layout = desktop.matches ? "cards" : "rows";
      setListLayout(preset);
      setBrowseLayout(preset);
    };

    apply();
    desktop.addEventListener("change", apply);
    return () => desktop.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        QUANTITIES_STORAGE_KEY,
        JSON.stringify(quantities)
      );
    } catch {
      // Private mode / storage disabled — quantities just won't survive a reload.
    }
  }, [quantities]);

  // Saved lists ride along on /api/userData, which is already fetched and
  // cached for the session, so the form needs no extra request to show them.
  const templates = useMemo<OrderTemplate[]>(
    () => userData?.orderTemplates ?? [],
    [userData]
  );

  const activeTemplate = useMemo(
    () => templates.find((template) => template._id === activeListId) ?? null,
    [templates, activeListId]
  );

  // Ask which list to start from instead of guessing, but only once per visit.
  useEffect(() => {
    if (chooserPromptedRef.current || isLoading || templates.length === 0) {
      return;
    }
    chooserPromptedRef.current = true;
    setChooserOpen(true);
  }, [templates, isLoading]);

  const visibleProducts = useMemo(() => {
    const term = search.trim().toLowerCase();
    return products.filter((product) => {
      if (
        categoryId !== ALL_CATEGORIES &&
        product.category?._id !== categoryId
      ) {
        return false;
      }
      if (!term) return true;
      return [
        product.displayNames?.en,
        product.displayNames?.["zh-TW"],
        product.name,
      ]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(term));
    });
  }, [products, search, categoryId]);

  const savedIds = useMemo(
    () =>
      new Set(
        (activeTemplate?.items ?? []).map((item) => String(item.product))
      ),
    [activeTemplate]
  );

  // The list view shows the saved rows plus anything picked up while browsing,
  // so what you are about to order is on one screen.
  const listProducts = useMemo(() => {
    if (!activeTemplate) return [];
    return products.filter(
      (product) =>
        savedIds.has(product._id) || (quantities[product._id] || 0) > 0
    );
  }, [activeTemplate, products, savedIds, quantities]);

  const unsavedIds = useMemo(() => {
    if (!activeTemplate) return [];
    const catalogue = new Set(products.map((product) => product._id));
    const saved = new Map(
      activeTemplate.items
        .map((item) => [String(item.product), item.quantity] as const)
        .filter(([id]) => catalogue.has(id))
    );

    // Rows missing from the catalogue are ignored: loading skips them, so
    // counting them would leave the list permanently unsaved.
    const ids = new Set([...saved.keys(), ...Object.keys(quantities)]);
    return [...ids].filter(
      (id) => (saved.get(id) ?? 0) !== (quantities[id] ?? 0)
    );
  }, [activeTemplate, products, quantities]);

  // An empty sheet is not an edit waiting to be saved — clearing the quantities
  // or sending them to the cart must never look like the saved list is at risk.
  const hasUnsavedChanges =
    Object.keys(quantities).length > 0 && unsavedIds.length > 0;

  // Native prompt only; a router-level guard would need to intercept every Link
  // on the page for little gain over the visible unsaved-changes bar.
  useEffect(() => {
    if (!hasUnsavedChanges) return;

    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [hasUnsavedChanges]);

  const labelOf = (template: OrderTemplate) => templateLabel(template, language);

  const confirmDiscard = async () => {
    if (!hasUnsavedChanges || !activeTemplate) return true;
    return confirm({
      title: t("quick-order.discardTitle"),
      description: t("quick-order.discardConfirm", {
        name: labelOf(activeTemplate),
        count: unsavedIds.length,
      }),
      confirmText: t("quick-order.discard"),
      cancelText: t("common.cancel"),
    });
  };

  // Quantity is not capped to stock, matching the rest of the cart — a bulk
  // order sheet must be able to ask for more than the counter currently shows.
  const setQuantity = (product: QuickOrderProduct, quantity: number) => {
    const next = Math.max(quantity, 0);
    setQuantities((current) => {
      const updated = { ...current };
      if (next <= 0) {
        delete updated[product._id];
      } else {
        updated[product._id] = next;
      }
      return updated;
    });
  };

  const selected = useMemo(
    () =>
      products
        .filter((product) => (quantities[product._id] || 0) > 0)
        .map((product) => ({
          product,
          quantity: quantities[product._id],
        })),
    [products, quantities]
  );

  const totalUnits = selected.reduce((sum, line) => sum + line.quantity, 0);
  const totalPrice = selected.reduce(
    (sum, line) => sum + line.product.price * line.quantity,
    0
  );

  const templateItems = () =>
    selected.map(({ product, quantity }) => ({
      product: product._id,
      quantity,
    }));

  const openList = (template: OrderTemplate) => {
    const inCatalogue = new Set(products.map((product) => product._id));
    const restored: Record<string, number> = {};
    let missing = 0;

    template.items.forEach((item) => {
      const id = String(item.product);
      if (inCatalogue.has(id)) {
        restored[id] = item.quantity;
      } else {
        missing += 1;
      }
    });

    setQuantities(restored);
    setActiveListId(template._id);
    setView("list");
    setSearch("");
    setCategoryId(ALL_CATEGORIES);
    setChooserOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });

    if (missing > 0) {
      toast(t("quick-order.listMissingItems", { count: missing }));
    }
  };

  const chooseList = async (template: OrderTemplate) => {
    if (template._id !== activeListId && !(await confirmDiscard())) return;
    openList(template);
  };

  // Browsing keeps whatever is already in the sheet: nothing is discarded just
  // by choosing to shop without a list.
  const chooseBrowse = () => {
    setChooserOpen(false);
    setView("browse");
  };

  const goBrowse = () => {
    setView("browse");
    setAddHintSeen(true);
    try {
      window.localStorage.setItem(ADD_HINT_STORAGE_KEY, "1");
    } catch {
      // Hint will simply blink again next time.
    }
  };

  const saveList = async () => {
    if (!hasAnyName(listNames)) return;

    setIsSaving(true);
    try {
      const response = await axios.post("/api/order-templates", {
        displayNames: listNames,
        items: templateItems(),
      });
      await refreshUserData();
      // Continue with what was just created, so the next save updates it
      // instead of silently piling up near-identical lists.
      const created = response.data?.templates?.at(-1);
      if (created?._id) {
        setActiveListId(String(created._id));
        setView("list");
      }
      setSaveDialogOpen(false);
      setListNames(EMPTY_NAMES);
      toast.success(t("quick-order.listSaved"));
    } catch (error) {
      toast.error(apiErrorMessage(error, t("quick-order.listSaveFailed")));
    } finally {
      setIsSaving(false);
    }
  };

  // No confirmation: the button names the list and the unsaved count is on
  // screen, so the click is already deliberate.
  const updateActiveList = async () => {
    if (!activeTemplate || selected.length === 0) return;

    setIsSaving(true);
    try {
      await axios.put("/api/order-templates", {
        id: activeTemplate._id,
        items: templateItems(),
      });
      await refreshUserData();
      toast.success(
        t("quick-order.listUpdated", { name: labelOf(activeTemplate) })
      );
    } catch (error) {
      toast.error(apiErrorMessage(error, t("quick-order.listSaveFailed")));
    } finally {
      setIsSaving(false);
    }
  };

  const openRename = (template: OrderTemplate) => {
    setRenameTarget(template);
    setRenameNames(templateNames(template));
  };

  const renameList = async () => {
    if (!renameTarget || !hasAnyName(renameNames)) return;

    setIsSaving(true);
    try {
      await axios.put("/api/order-templates", {
        id: renameTarget._id,
        displayNames: renameNames,
      });
      await refreshUserData();
      setRenameTarget(null);
      toast.success(t("quick-order.listRenamed"));
    } catch (error) {
      toast.error(apiErrorMessage(error, t("quick-order.listSaveFailed")));
    } finally {
      setIsSaving(false);
    }
  };

  const deleteList = async (template: OrderTemplate) => {
    const confirmed = await confirm({
      title: t("common.delete"),
      description: t("quick-order.deleteConfirm", { name: labelOf(template) }),
      confirmText: t("common.delete"),
      cancelText: t("common.cancel"),
    });
    if (!confirmed) return;

    try {
      await axios.delete(`/api/order-templates?id=${template._id}`);
      await refreshUserData();
      if (template._id === activeListId) {
        setActiveListId(null);
        setView("browse");
      }
      toast.success(t("quick-order.listDeleted"));
    } catch (error) {
      toast.error(apiErrorMessage(error, t("quick-order.listSaveFailed")));
    }
  };

  const openSpecifications = async (productId: string) => {
    try {
      const response = await axios.get(`/api/product/${productId}`);
      if (response.data?.product) {
        setSpecProduct(response.data.product);
      }
    } catch {
      toast.error(t("quick-order.loadError"));
    }
  };

  // Clears the quantities only. The saved list stays open and untouched — this
  // button resets what you are about to order, it does not throw the list away.
  const clearSheet = async () => {
    if (!(await confirmDiscard())) return;
    setQuantities({});
  };

  const handleAddAll = async () => {
    if (selected.length === 0) {
      toast.error(t("quick-order.nothingSelected"));
      return;
    }

    // Adding to the cart empties the sheet, which would drop unsaved list edits.
    if (!(await confirmDiscard())) return;

    const cartItems: AddToCartItem[] = selected.map(({ product, quantity }) => ({
      _id: product._id,
      name: product.name,
      displayNames: product.displayNames,
      images: [product.image],
      price: product.price,
      quantity,
    }));

    if (!addItems(cartItems)) return;

    // The lines now live in the cart, so clear the sheet to avoid adding twice.
    // Checkout stays the customer's decision — this form is an alternative way
    // to fill the cart, not a separate ordering flow. The list stays open and
    // saved: ordering from a list is not the same as spending it.
    setQuantities({});
    openCart();
  };

  const productList = (items: QuickOrderProduct[], layout: Layout) => {
    // Only a product actually being ordered is "new to this list"; otherwise the
    // whole catalogue would carry the badge.
    const isNew = (id: string) =>
      Boolean(activeTemplate) &&
      !savedIds.has(id) &&
      (quantities[id] || 0) > 0;

    if (layout === "rows") {
      // `grid-cols-1` rather than an implicit track: Tailwind's numbered columns
      // are `minmax(0, 1fr)`, which lets the rows shrink.
      return (
        <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
          {items.map((product) => (
            <QuickOrderRow
              key={product._id}
              product={product}
              quantity={quantities[product._id] || 0}
              onQuantityChange={setQuantity}
              onOpenSpecifications={openSpecifications}
              isNew={isNew(product._id)}
            />
          ))}
        </div>
      );
    }

    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {items.map((product) => (
          <QuickOrderCard
            key={product._id}
            product={product}
            quantity={quantities[product._id] || 0}
            onQuantityChange={setQuantity}
            onOpenSpecifications={openSpecifications}
            isNew={isNew(product._id)}
          />
        ))}
      </div>
    );
  };

  const layoutToggle = (layout: Layout, onChange: (next: Layout) => void) => (
    <div className="flex flex-shrink-0 gap-1 rounded-md border border-border p-0.5">
      {(
        [
          ["rows", List],
          ["cards", LayoutGrid],
        ] as const
      ).map(([value, Icon]) => (
        <button
          key={value}
          type="button"
          onClick={() => {
            layoutChosenRef.current = true;
            onChange(value);
          }}
          aria-label={t(
            value === "rows" ? "quick-order.listLayout" : "quick-order.cardLayout"
          )}
          title={t(
            value === "rows" ? "quick-order.listLayout" : "quick-order.cardLayout"
          )}
          className={cn(
            "rounded p-1.5 transition-colors",
            layout === value
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-accent/70"
          )}
        >
          <Icon className="h-4 w-4" />
        </button>
      ))}
    </div>
  );

  return (
    <div className="app-background min-h-screen pb-28">
      <div className="container mx-auto px-4 py-6">
        <Breadcrumb
          items={[
            {
              label: t("quick-order.title"),
              href: "/quick-order",
              icon: ClipboardList,
              current: true,
            },
          ]}
        />

        <h1 className="text-2xl md:text-3xl font-bold text-foreground">
          {t("quick-order.title")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("quick-order.subtitle")}
        </p>

        {activeTemplate && (
          <div className="mt-4 flex gap-1 rounded-lg border border-border bg-card p-1">
            <button
              type="button"
              onClick={() => setView("list")}
              className={cn(
                "flex-1 truncate rounded-md px-3 py-2 text-sm font-medium transition-colors",
                view === "list"
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground hover:bg-accent/70"
              )}
            >
              {labelOf(activeTemplate)}
            </button>
            <button
              type="button"
              onClick={goBrowse}
              className={cn(
                "flex-1 truncate rounded-md px-3 py-2 text-sm font-medium transition-colors",
                view === "browse"
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground hover:bg-accent/70"
              )}
            >
              {t("quick-order.allProducts")}
            </button>
          </div>
        )}

        {view === "list" && activeTemplate ? (
          <>
            <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1">
              <p className="text-sm text-muted-foreground">
                {t("quick-order.listSummary", { count: listProducts.length })}
                {hasUnsavedChanges && (
                  <span className="ml-2 font-medium text-primary">
                    {t("quick-order.notSavedYet", {
                      count: unsavedIds.length,
                    })}
                  </span>
                )}
              </p>
              <div className="ml-auto flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => openRename(activeTemplate)}
                  className="flex items-center gap-1 text-sm text-primary underline-offset-2 hover:underline"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  {t("quick-order.rename")}
                </button>
                <button
                  type="button"
                  onClick={() => openList(activeTemplate)}
                  className="text-sm text-primary underline-offset-2 hover:underline"
                >
                  {t("quick-order.reloadList")}
                </button>
                {templates.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setChooserOpen(true)}
                    className="text-sm text-primary underline-offset-2 hover:underline"
                  >
                    {t("quick-order.switchList")}
                  </button>
                )}
                {layoutToggle(listLayout, setListLayout)}
              </div>
            </div>

            {hasUnsavedChanges && (
              <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg border border-primary/40 bg-primary/10 px-3 py-2">
                <p className="text-sm text-foreground">
                  {t("quick-order.unsavedHint", {
                    name: labelOf(activeTemplate),
                  })}
                </p>
                <div className="ml-auto flex gap-2">
                  <Button size="sm" onClick={updateActiveList} disabled={isSaving}>
                    <Save className="mr-1 h-4 w-4" />
                    {t("quick-order.addToList", {
                      name: labelOf(activeTemplate),
                    })}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSaveDialogOpen(true)}
                  >
                    {t("quick-order.saveAsNewList")}
                  </Button>
                </div>
              </div>
            )}

            <div className="mt-4">
              {listProducts.length === 0 ? (
                <p className="py-10 text-center text-muted-foreground">
                  {t("quick-order.emptyList")}
                </p>
              ) : (
                productList(listProducts, listLayout)
              )}
            </div>

            <button
              type="button"
              onClick={goBrowse}
              className={cn(
                "mt-5 flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-primary px-4 py-4 text-base font-semibold text-primary transition-colors hover:bg-primary/10",
                !addHintSeen && "quick-order-blink"
              )}
            >
              <PackagePlus className="h-5 w-5" />
              {t("quick-order.addProducts")}
            </button>
          </>
        ) : (
          <>
            {activeTemplate ? (
              <div className="mt-4 flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card px-3 py-2">
                <p className="text-sm text-muted-foreground">
                  {t("quick-order.addingTo", { name: labelOf(activeTemplate) })}
                </p>
                <button
                  type="button"
                  onClick={() => setView("list")}
                  className="ml-auto flex items-center gap-1 text-sm text-primary underline-offset-2 hover:underline"
                >
                  <ArrowLeft className="h-4 w-4" />
                  {t("quick-order.backToList")}
                </button>
              </div>
            ) : (
              // Always reachable: the arrival chooser only shows once, so without
              // this a saved list would look like it had vanished.
              templates.length > 0 && (
                <button
                  type="button"
                  onClick={() => setChooserOpen(true)}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-primary px-4 py-3 text-sm font-medium text-primary transition-colors hover:bg-primary/10"
                >
                  <ClipboardList className="h-4 w-4" />
                  {t("quick-order.myLists", { count: templates.length })}
                </button>
              )
            )}

            <div className="sticky top-14 z-20 -mx-4 mt-4 space-y-3 px-4 py-3 app-background md:top-[var(--navbar-height)]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder={t("quick-order.searchPlaceholder")}
                  className="pl-9"
                />
              </div>
              {/* Same control as /products: a dropdown on mobile instead of a
                  chip row running off the screen edge. */}
              <CategoryMenu
                selectedCategory={categoryId}
                onCategorySelect={setCategoryId}
                hintWhenUnfiltered={false}
              />
              {!isLoading && !error && visibleProducts.length > 0 && (
                <div className="flex items-center gap-3">
                  <p className="text-sm text-muted-foreground">
                    {t("quick-order.showingCount", {
                      count: visibleProducts.length,
                    })}
                  </p>
                  <div className="ml-auto">
                    {layoutToggle(browseLayout, setBrowseLayout)}
                  </div>
                </div>
              )}
            </div>

            {isLoading ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {[...Array(10)].map((_, index) => (
                  <div
                    key={index}
                    className="h-56 animate-pulse rounded-lg bg-muted"
                  />
                ))}
              </div>
            ) : error ? (
              <p className="py-10 text-center text-muted-foreground">
                {t("quick-order.loadError")}
              </p>
            ) : visibleProducts.length === 0 ? (
              <p className="py-10 text-center text-muted-foreground">
                {t("quick-order.empty")}
              </p>
            ) : (
              productList(visibleProducts, browseLayout)
            )}
          </>
        )}
      </div>

      {selected.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/95 backdrop-blur">
          {/* Totals sit above the buttons on narrow screens; side by side they
              squeezed the price until it was clipped. */}
          <div className="container mx-auto flex flex-col gap-2 px-4 py-2 sm:flex-row sm:items-center sm:gap-3 sm:py-3">
            <div className="min-w-0 sm:flex-1">
              <p className="truncate text-xs text-muted-foreground sm:text-sm">
                {t("quick-order.selectedLines", { count: selected.length })} ·{" "}
                {t("quick-order.selectedUnits", { count: totalUnits })} ·{" "}
                <span className="font-bold text-foreground">
                  {t("quick-order.total")}: ${totalPrice.toFixed(2)}
                </span>
              </p>
            </div>
            <div className="flex items-center gap-2">
            {userData && activeTemplate && (
              <button
                type="button"
                onClick={updateActiveList}
                disabled={isSaving || !hasUnsavedChanges}
                title={t("quick-order.updateListNamed", {
                  name: labelOf(activeTemplate),
                })}
                className="flex items-center gap-2 rounded-md border border-primary px-3 py-2 text-sm text-primary transition-colors hover:bg-primary/10 disabled:opacity-40"
              >
                <Save className="h-4 w-4" />
                <span className="hidden sm:inline">
                  {t("quick-order.updateList")}
                </span>
              </button>
            )}
            {userData && (
              <button
                type="button"
                onClick={() => setSaveDialogOpen(true)}
                title={
                  activeTemplate
                    ? t("quick-order.saveAsNewList")
                    : t("quick-order.saveAsList")
                }
                className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm text-foreground transition-colors hover:bg-accent/70"
              >
                <BookmarkPlus className="h-4 w-4" />
                <span className="hidden sm:inline">
                  {activeTemplate
                    ? t("quick-order.saveAsNewList")
                    : t("quick-order.saveAsList")}
                </span>
              </button>
            )}
            <button
              type="button"
              onClick={clearSheet}
              className="rounded-md border border-border px-3 py-2 text-sm text-foreground transition-colors hover:bg-accent/70"
            >
              {t("quick-order.clear")}
            </button>
            <button
              type="button"
              onClick={handleAddAll}
              className="flex flex-1 items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 sm:flex-none"
            >
              <ShoppingCart className="h-4 w-4" />
              {t("quick-order.addAllToCart")}
            </button>
            </div>
          </div>
        </div>
      )}

      <Dialog open={chooserOpen} onOpenChange={setChooserOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("quick-order.chooserTitle")}</DialogTitle>
            <DialogDescription>
              {t("quick-order.chooserHint")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {templates.map((template) => (
              <div key={template._id} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => chooseList(template)}
                  className="flex flex-1 items-center justify-between rounded-lg border border-border bg-card px-3 py-3 text-left transition-colors hover:border-primary hover:bg-primary/5"
                >
                  <span className="font-medium text-foreground">
                    {labelOf(template)}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {t("quick-order.listItemCount", {
                      count: template.items.length,
                    })}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => openRename(template)}
                  title={t("quick-order.rename")}
                  aria-label={t("quick-order.rename")}
                  className="rounded-md p-2 text-muted-foreground transition-colors hover:text-foreground"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => deleteList(template)}
                  title={t("common.delete")}
                  aria-label={t("common.delete")}
                  className="rounded-md p-2 text-muted-foreground transition-colors hover:text-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
          <Button variant="outline" onClick={chooseBrowse}>
            {t("quick-order.browseAll")}
          </Button>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(renameTarget)}
        onOpenChange={(open) => {
          if (!open) setRenameTarget(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("quick-order.rename")}</DialogTitle>
            <DialogDescription>
              {t("quick-order.renameHint", {
                name: renameTarget ? labelOf(renameTarget) : "",
              })}
            </DialogDescription>
          </DialogHeader>
          <MultiLangInput
            value={renameNames}
            onChange={setRenameNames}
            placeholder={{
              en: t("quick-order.listNamePlaceholderEn"),
              "zh-TW": t("quick-order.listNamePlaceholderZh"),
            }}
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setRenameTarget(null)}>
              {t("common.cancel")}
            </Button>
            <Button
              onClick={renameList}
              disabled={isSaving || !hasAnyName(renameNames)}
            >
              {t("common.save")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {activeTemplate
                ? t("quick-order.saveAsNewList")
                : t("quick-order.saveAsList")}
            </DialogTitle>
            <DialogDescription>
              {t("quick-order.saveListHint", { count: selected.length })}
            </DialogDescription>
          </DialogHeader>
          {/* Both languages up front: the list is labelled in whichever language
              the shop is being viewed in, so a Chinese-only name would read as
              Chinese in English mode. Either field alone is accepted. */}
          <MultiLangInput
            value={listNames}
            onChange={setListNames}
            placeholder={{
              en: t("quick-order.listNamePlaceholderEn"),
              "zh-TW": t("quick-order.listNamePlaceholderZh"),
            }}
          />
          <p className="text-xs text-muted-foreground">
            {t("quick-order.listNameBothHint")}
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setSaveDialogOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button
              onClick={saveList}
              disabled={
                isSaving || !hasAnyName(listNames) || selected.length === 0
              }
            >
              {t("common.save")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {specProduct && (
        <SpecificationsModal
          product={specProduct}
          isOpen={Boolean(specProduct)}
          onClose={() => setSpecProduct(null)}
        />
      )}
    </div>
  );
}
