import { supabase } from "@/lib/supabase";

export async function getSettings() {
  const { data } = await supabase.from("settings").select("*");

  const obj: any = {};
  data?.forEach((item) => {
    obj[item.key] = item.value;
  });

  return obj;
}