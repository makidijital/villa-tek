import { NextResponse } from "next/server";
import { XMLParser } from "fast-xml-parser";

export async function GET() {
  try {
    const res = await fetch("https://www.tcmb.gov.tr/kurlar/today.xml", {
      next: { revalidate: 3600 }, // 🔥 1 saat cache
    });

    const xml = await res.text();

    const parser = new XMLParser({
      ignoreAttributes: false,
    });

    const json = parser.parse(xml);

    const currencies = json.Tarih_Date.Currency;

    const find = (code: string) =>
      currencies.find((c: any) => c["@_CurrencyCode"] === code);

    const usd = find("USD");
    const eur = find("EUR");
    const gbp = find("GBP");

    return NextResponse.json({
      TRY: 1,
      USD: Number(usd.ForexSelling),
      EUR: Number(eur.ForexSelling),
      GBP: Number(gbp.ForexSelling),
    });

  } catch (err) {
    console.error(err);

    // 🔥 fallback (çok kritik)
    return NextResponse.json({
      TRY: 1,
      USD: 32,
      EUR: 35,
      GBP: 40,
    });
  }
}