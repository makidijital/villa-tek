import { supabase } from "@/lib/supabase";

export async function GET() {
    const { data } = await supabase
        .from("reservations")
        .select("*")
        .eq("status", "approved");

    let ics = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Villa//Reservation//TR
`;

    data?.forEach((r) => {
        const start = r.start_date.replace(/-/g, "");
        const end = r.end_date.replace(/-/g, "");

        ics += `
BEGIN:VEVENT
DTSTART:${start}
DTEND:${end}
SUMMARY:${r.name}
END:VEVENT
`;
    });

    ics += "END:VCALENDAR";

    return new Response(ics, {
        headers: {
            "Content-Type": "text/calendar",
        },
    });
}