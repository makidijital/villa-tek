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
    <section className="max-w-7xl mx-auto px-6 py-20 text-white">

      {/* HEADER */}
      <div className="mb-10 flex justify-between items-center">

        <div>
          <h2 className="text-3xl font-bold mb-2">Fiyatlar</h2>
          <p className="text-gray-400">
            Sezonlara göre gecelik fiyatlar
          </p>
        </div>

        {/* 🔥 CURRENCY SELECT */}
        <select
          value={currency}
          onChange={(e) => {
            const value = e.target.value;

            setCurrency(value);
            localStorage.setItem("currency", value);

            // 🔥 EKLE (EN KRİTİK)
            window.dispatchEvent(new Event("currencyChange"));
          }}
          className="bg-zinc-900 border border-zinc-700 px-4 py-2 rounded-xl text-white"
        >
          <option value="TRY">₺ TRY</option>
          <option value="EUR">€ EUR</option>
          <option value="USD">$ USD</option>
          <option value="GBP">£ GBP</option>
        </select>

      </div>

      {/* LİSTE */}
      <div className="space-y-4">

        {periods.map((item, i) => (
          <div
            key={i}
            className="flex items-center justify-between bg-zinc-900 hover:bg-zinc-800 transition p-5 rounded-2xl border border-zinc-800"
          >

            {/* SOL */}
            <div className="flex items-center gap-4">

              <div className="bg-zinc-800 p-3 rounded-xl">
                <CalendarDays className="w-5 h-5 text-gray-300" />
              </div>

              <div>
                <p className="font-semibold">
                  {formatDate(item.start_date)} – {formatDate(item.end_date)}
                </p>

                <p className="text-sm text-gray-400">
                  Konaklama
                </p>

                <p className="text-xs text-gray-500">
                  Günlük · Gecelik
                </p>
              </div>

            </div>

            {/* SAĞ */}
            <div className="text-right">
              <p className="text-2xl font-bold text-white">
                {formatMoney(Number(item.price))}
              </p>
              <p className="text-sm text-gray-400">
                gecelik
              </p>
            </div>

          </div>
        ))}

      </div>

      {/* DİĞER FİYATLAR */}
      <div className="mt-12">

        <h3 className="text-xl font-semibold mb-4 text-gray-300">
          Diğer Fiyatlar
        </h3>

        {/* DEPOZİTO */}
        <div className="bg-orange-500/10 border border-orange-500/30 p-5 rounded-2xl flex justify-between items-center">

          <div className="flex items-center gap-4">
            <div className="bg-orange-500/20 p-3 rounded-xl">
              <CalendarDays className="w-5 h-5 text-orange-400" />
            </div>

            <div>
              <p className="font-semibold">Hasar Depozitosu</p>
              <p className="text-sm text-gray-400">
                Tek seferlik ücret
              </p>
            </div>
          </div>

          <div className="text-right">
            <p className="text-xl font-bold text-orange-400">
              {formatMoney(fees.deposit)}
            </p>
            <p className="text-sm text-gray-400">
              tek seferlik
            </p>
          </div>

        </div>

        {/* TEMİZLİK */}
        <div className="mt-4 bg-blue-500/10 border border-blue-500/30 p-5 rounded-2xl flex justify-between items-center">

          <div className="flex items-center gap-4">
            <div className="bg-blue-500/20 p-3 rounded-xl">
              <CalendarDays className="w-5 h-5 text-blue-400" />
            </div>

            <div>
              <p className="font-semibold">Temizlik Ücreti</p>
              <p className="text-sm text-gray-400">
                Tek seferlik ücret
              </p>
            </div>
          </div>

          <div className="text-right">
            <p className="text-xl font-bold text-blue-400">
              {formatMoney(fees.cleaning_fee)}
            </p>
            <p className="text-sm text-gray-400">
              tek seferlik
            </p>
          </div>

        </div>

      </div>

    </section>
  );
}