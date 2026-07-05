import { supabase } from "./supabase";

export async function getMarkets() {
  const { data, error } = await supabase
    .from("markets")
    .select("*");

  if (error) {
    console.error("Supabase Error:", error);
    return [];
  }

  return data;
}