// Trimmed product shape served by /api/products/quick-list.
export interface QuickOrderProduct {
  _id: string;
  name: string;
  displayNames?: { en: string; "zh-TW": string };
  price: number;
  image: string;
  stock: number;
  category: {
    _id: string;
    name: string;
    displayNames?: { en: string; "zh-TW": string };
  } | null;
  hasSpecifications: boolean;
}
