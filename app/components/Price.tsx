"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { CalendarDays } from "lucide-react";

export default function Price() {
  const [periods, setPeriods] = useState<any[]>([]);

  const [fees, setFees] = useState({
    cleaning_fee: 0,
    deposit: 0,
  });

  // 🔥 CURRENCY
  const [currency, setCurrency] = useState("TRY");

  useEffect(() => {
    const saved = localStorage.getItem("currency");
    if (saved) setCurrency(saved);
  }, []);

  // 🔥 TCMB RATES
  const [rates, setRates] = useState<any>({
    TRY: 1,
    USD: 1,
    EUR: 1,
    GBP: 1,
  });

  // 🔥 DATA ÇEK
  useEffect(() => {
    const getData = async () => {
      const { data: villa } = await supabase
        .from("villa")
        .select("id")
        .limit(1);

      if (!villa || villa.length === 0) return;

      const { data } = await supabase
        .from("villa_prices")
        .select("*")
        .eq("villa_id", villa[0].id)
        .order("start_date", { ascending: true });

      setPeriods(data || []);

      if (data && data.length > 0) {
        setFees({
          cleaning_fee: Number(data[0].cleaning_fee || 0),
          deposit: Number(data[0].deposit || 0),
        });
      }
    };

    getData();
  }, []);

  // 🔥 TCMB KUR ÇEK
  useEffect(() => {
    fetch("/api/rates")
      .then((res) => res.json())
      .then((data) => setRates(data));
  }, []);

  // 🔥 PARA FORMAT
  const formatMoney = (price: number) => {
    const symbols: any = {
      TRY: "₺",
      EUR: "€",
      USD: "$",
      GBP: "£",
    };

    let value = price;

    if (currency !== "TRY") {
      value = price / rates[currency]; // 🔥 KRİTİK
    }

    return `${symbols[currency]}${value.toLocaleString(undefined, {
      maximumFractionDigits: 0,
    })}`;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("tr-TR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16 text-white">

  {/* HEADER */}
  <div className="mb-10 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">

    <div>
      <h2 className="text-3xl font-bold mb-2">Fiyatlar</h2>
      <p className="text-gray-400">
        Sezonlara göre gecelik fiyatlar
      </p>
    </div>

    {/* 🔥 CURRENCY */}
    <div className="relative">
      <select
        value={currency}
        onChange={(e) => {
          const value = e.target.value;
          setCurrency(value);
          localStorage.setItem("currency", value);
          window.dispatchEvent(new Event("currencyChange"));
        }}
        className="appearance-none bg-zinc-900/80 backdrop-blur border border-zinc-700 px-4 py-2 pr-10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-red-500"
      >
        <option value="TRY">₺ TRY</option>
        <option value="EUR">€ EUR</option>
        <option value="USD">$ USD</option>
        <option value="GBP">£ GBP</option>
      </select>

      {/* ok icon */}
      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">
        ▼
      </span>
    </div>

  </div>

  {/* 🔥 PRICE CARDS */}
  <div className="grid gap-4">

    {periods.map((item, i) => (
      <div
        key={i}
        className="group flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-zinc-900/70 backdrop-blur p-5 rounded-2xl border border-white/5 hover:border-red-500/40 hover:bg-zinc-800 transition-all duration-300"
      >

        {/* LEFT */}
        <div className="flex items-center gap-4">

          <div className="bg-zinc-800 group-hover:bg-red-500/20 transition p-3 rounded-xl">
            <CalendarDays className="w-5 h-5 text-gray-300 group-hover:text-red-400" />
          </div>

          <div>
            <p className="font-semibold text-white">
              {formatDate(item.start_date)} – {formatDate(item.end_date)}
            </p>

            <p className="text-sm text-gray-400">
              Minimum konaklama uygulanabilir
            </p>
          </div>

        </div>

        {/* RIGHT */}
        <div className="text-left sm:text-right">
          <p className="text-2xl sm:text-3xl font-bold text-red-400">
            {formatMoney(Number(item.price))}
          </p>
          <p className="text-xs text-gray-400">
            gecelik fiyat
          </p>
        </div>

      </div>
    ))}

  </div>

  {/* 🔥 EXTRA FEES */}
  <div className="mt-14">

    <h3 className="text-xl font-semibold mb-6 text-gray-300">
      Ek Ücretler
    </h3>

    <div className="grid sm:grid-cols-2 gap-4">

      {/* DEPOSIT */}
      <div className="group bg-orange-500/10 border border-orange-500/20 hover:border-orange-400/40 p-5 rounded-2xl transition">

        <div className="flex items-center gap-4 mb-3">
          <div className="bg-orange-500/20 p-3 rounded-xl">
            <CalendarDays className="w-5 h-5 text-orange-400" />
          </div>

          <div>
            <p className="font-semibold">Hasar Depozitosu</p>
            <p className="text-xs text-gray-400">
              Çıkışta iade edilir
            </p>
          </div>
        </div>

        <p className="text-2xl font-bold text-orange-400">
          {formatMoney(fees.deposit)}
        </p>

      </div>

      {/* CLEANING */}
      <div className="group bg-blue-500/10 border border-blue-500/20 hover:border-blue-400/40 p-5 rounded-2xl transition">

        <div className="flex items-center gap-4 mb-3">
          <div className="bg-blue-500/20 p-3 rounded-xl">
            <CalendarDays className="w-5 h-5 text-blue-400" />
          </div>

          <div>
            <p className="font-semibold">Temizlik Ücreti</p>
            <p className="text-xs text-gray-400">
              Tek seferlik ödeme
            </p>
          </div>
        </div>

        <p className="text-2xl font-bold text-blue-400">
          {formatMoney(fees.cleaning_fee)}
        </p>

      </div>

    </div>

  </div>

  {/* 🔥 UX BOOST */}
  <div className="mt-10 text-center text-sm text-gray-500">
    Tüm fiyatlar sezona göre değişiklik gösterebilir
  </div>

</section>
  );
}