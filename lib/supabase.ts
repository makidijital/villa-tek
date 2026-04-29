import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://rjxjipqvwawbaospospg.supabase.co";
const supabaseKey = "sb_publishable_kfqDjnde22x_T02ID0bkfw_vo9xSWV2";

export const supabase = createClient(supabaseUrl, supabaseKey);