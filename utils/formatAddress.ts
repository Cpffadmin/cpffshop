interface MultilingualString {
  en?: string | null;
  "zh-TW"?: string | null;
}

interface AddressComponents {
  room?: MultilingualString | null;
  floor?: MultilingualString | null;
  building?: MultilingualString | null;
  street?: MultilingualString | null;
  district?: MultilingualString | null;
  city?: MultilingualString | null;
  state?: MultilingualString | null;
  country?: MultilingualString | null;
  postalCode?: MultilingualString | null;
}

/**
 * Formats address in English style (smallest to largest unit)
 * Example: "Room 123, 7/F, Building A, 1 Example Street, District, City"
 */
export function formatEnglishAddress(address: AddressComponents): string {
  const components: string[] = [];

  // Add components in English order (small to large)
  if (address.room?.en) components.push(`Room ${address.room.en}`);
  if (address.floor?.en) components.push(`${address.floor.en}/F`);
  if (address.building?.en) components.push(address.building.en);
  if (address.street?.en) components.push(address.street.en);
  if (address.district?.en) components.push(address.district.en);
  if (address.city?.en) components.push(address.city.en);
  if (address.state?.en) components.push(address.state.en);
  if (address.country?.en) components.push(address.country.en);
  if (address.postalCode?.en) components.push(address.postalCode.en);

  return components.join(", ");
}

/**
 * Formats address in Traditional Chinese style (largest to smallest unit)
 * Example: "香港特別行政區 九龍區 示例區 示例街1號 A座 7樓 123室"
 */
export function formatChineseAddress(address: AddressComponents): string {
  const components: string[] = [];

  // Add components in Chinese order (large to small)
  if (address.country?.["zh-TW"]) components.push(address.country["zh-TW"]);
  if (address.state?.["zh-TW"]) components.push(address.state["zh-TW"]);
  if (address.city?.["zh-TW"]) components.push(address.city["zh-TW"]);
  if (address.district?.["zh-TW"]) components.push(address.district["zh-TW"]);
  if (address.street?.["zh-TW"]) components.push(address.street["zh-TW"]);
  if (address.building?.["zh-TW"]) components.push(address.building["zh-TW"]);
  if (address.floor?.["zh-TW"]) components.push(address.floor["zh-TW"]);
  if (address.room?.["zh-TW"]) components.push(address.room["zh-TW"]);
  if (address.postalCode?.["zh-TW"])
    components.push(address.postalCode["zh-TW"]);

  // Join with spaces for Chinese formatting
  return components.join(" ");
}

/**
 * Formats address in both languages
 */
export function formatAddress(address: AddressComponents): {
  en: string;
  "zh-TW": string;
} {
  return {
    en: formatEnglishAddress(address),
    "zh-TW": formatChineseAddress(address),
  };
}

/**
 * Validates if an address has the minimum required fields in both languages
 */
export function isValidAddress(address: AddressComponents): boolean {
  // Define minimum required fields for a valid address
  const requiredFields = ["street", "district", "city"] as const;

  return requiredFields.every(
    (field) => address[field]?.en?.trim() && address[field]?.["zh-TW"]?.trim()
  );
}
