import { supabase } from "@/lib/supabase";
import crypto from "crypto";

export async function GET() {
  try {
    // 🔥 VILLA + ICAL URL + MODE
    const { data: villa } = await supabase
      .from("villa")
      .select("id, ical_url, ical_mode")
      .limit(1)
      .single();

    if (!villa?.ical_url) {
      return Response.json({
        success: false,
        error: "iCal link yok",
      });
    }

    const url = villa.ical_url;
    const mode = villa.ical_mode || "auto";

    // 🔥 ICAL ÇEK
    const res = await fetch(url);

    if (!res.ok) throw new Error("iCal çekilemedi");

    const text = await res.text();

    // 🔥 HASH
    const createHash = (start: string, end: string) => {
      return crypto
        .createHash("md5")
        .update(start + "-" + end)
        .digest("hex");
    };

    // 🔥 PARSE
    const events = text.split("BEGIN:VEVENT").slice(1);

    const parsed = events
      .map((e) => {
        const start = e.match(/DTSTART.*:(\d+)/)?.[1];
        const end = e.match(/DTEND.*:(\d+)/)?.[1];

        const format = (d: string) =>
          `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`;

        if (!start || !end) return null;

        const start_date = format(start);
        let end_date = format(end);

        // 🔥 MODE KONTROLÜ
        if (mode === "checkout") {
          const endObj = new Date(end_date);
          endObj.setDate(endObj.getDate() - 1);

          end_date = `${endObj.getFullYear()}-${String(
            endObj.getMonth() + 1
          ).padStart(2, "0")}-${String(endObj.getDate()).padStart(2, "0")}`;
        }

        return {
          start_date,
          end_date,
          hash: createHash(start_date, end_date),
        };
      })
      .filter(
        (item): item is {
          start_date: string;
          end_date: string;
          hash: string;
        } => item !== null
      );

    // 🔥 DB'DEKİ ICAL KAYITLARI
    const { data: existing } = await supabase
      .from("external_reservations")
      .select("id, hash")
      .eq("villa_id", villa.id)
      .eq("source", "ical");

    const existingHashes = (existing || []).map((e) => e.hash);
    const incomingHashes = parsed.map((p) => p.hash);

    // 🔥 SİLİNECEKLER
    const toDelete = (existing || []).filter(
      (e) => !incomingHashes.includes(e.hash)
    );

    // 🔥 EKLENECEKLER
    const toInsert = parsed.filter(
      (p) => !existingHashes.includes(p.hash)
    );

    // 🔥 DELETE
    let deleted = 0;

    for (let item of toDelete) {
      const { error } = await supabase
        .from("external_reservations")
        .delete()
        .eq("id", item.id);

      if (!error) deleted++;
    }

    // 🔥 INSERT
    let inserted = 0;

    for (let item of toInsert) {
      const { error } = await supabase
        .from("external_reservations")
        .insert([
          {
            villa_id: villa.id,
            start_date: item.start_date,
            end_date: item.end_date,
            source: "ical",
            note: "iCal import",
            hash: item.hash,
          },
        ]);

      if (!error) inserted++;
    }

    return Response.json({
      success: true,
      total_from_ical: parsed.length,
      inserted,
      deleted,
    });

  } catch (err) {
    console.error("ICAL IMPORT ERROR:", err);

    return Response.json({
      success: false,
      error: "Bir hata oluştu",
    });
  }
}