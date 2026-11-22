import { supabase } from "./supabase";
import type { ExchangeRate } from "./types";

// Live USD -> currencyCode. Null on any failure; never invent a rate.
export async function fetchRate(currencyCode: string): Promise<ExchangeRate | null> {
  try {
    const { data, error } = await supabase().functions.invoke(
      `convert-currency?to=${encodeURIComponent(currencyCode)}`,
      { method: "GET" },
    );
    if (error || data?.rateFromUsd == null) return null;
    return {
      currencyCode: data.currencyCode ?? currencyCode,
      rateFromUsd: Number(data.rateFromUsd),
      fetchedAt: data.fetchedAt ?? new Date().toISOString(),
    };
  } catch (e) {
    console.warn(`Currency rate fetch failed for ${currencyCode}:`, e);
    return null;
  }
}
