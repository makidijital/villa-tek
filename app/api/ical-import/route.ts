import { supabase } from "@/lib/supabase";

export async function GET() {
    try {
        // 🔥 ICAL LINK
        const url = "https://villadirekt.de/ical-export.php?villa=1171";

        // 🔥 ICAL ÇEK
        const res = await fetch(url);

        if (!res.ok) {
            throw new Error("iCal çekilemedi");
        }

        const text = await res.text();

        // 🔥 EVENT PARSE
        const events = text.split("BEGIN:VEVENT").slice(1);

        const parsed = events
            .map((e) => {
                const start = e.match(/DTSTART.*:(\d+)/)?.[1];
                const end = e.match(/DTEND.*:(\d+)/)?.[1];

                const format = (d: string) =>
                    `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`;

                if (!start || !end) return null;

                return {
                    start_date: format(start),
                    end_date: format(end),
                };
            })
            .filter(
                (item): item is { start_date: string; end_date: string } =>
                    item !== null
            );

        let inserted = 0;

        // 🔥 DB INSERT (EXTERNAL TABLE)
        for (let item of parsed) {
            // 🔁 DUPLICATE KONTROL
            const { data: existing } = await supabase
                .from("external_reservations")
                .select("id")
                .eq("start_date", item.start_date)
                .eq("end_date", item.end_date)
                .maybeSingle();

            if (existing) continue;

            // ✅ INSERT
            const { error } = await supabase
                .from("external_reservations")
                .insert([
                    {
                        villa_id: null, // ileride bağlayabiliriz
                        start_date: item.start_date,
                        end_date: item.end_date,
                        source: "villadirekt",
                        note: "iCal import",
                    },
                ]);

            if (!error) inserted++;
            else console.error("INSERT ERROR:", error);
        }

        return Response.json({
            success: true,
            total_from_ical: parsed.length,
            inserted,
        });

    } catch (err) {
        console.error("ICAL IMPORT ERROR:", err);

        return Response.json({
            success: false,
            error: "Bir hata oluştu",
        });
    }
}