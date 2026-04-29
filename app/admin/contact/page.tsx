"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AdminContact() {
  const [data, setData] = useState<any>({
    phone: "",
    whatsapp: "",
    email: "",
    address: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const getData = async () => {
    setLoading(true);

    const { data: res, error } = await supabase
      .from("contact")
      .select("*")
      .limit(1);

    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }

    if (res && res.length > 0) {
      setData(res[0]);
    }

    setLoading(false);
  };

  useEffect(() => {
    getData();
  }, []);

  const saveData = async () => {
    setSaving(true);

    const { data: existing } = await supabase
      .from("contact")
      .select("id")
      .limit(1);

    let error;

    if (existing && existing.length > 0) {
      const res = await supabase
        .from("contact")
        .update(data)
        .eq("id", existing[0].id);

      error = res.error;
    } else {
      const res = await supabase
        .from("contact")
        .insert([data]);

      error = res.error;
    }

    setSaving(false);

    if (error) {
      alert("Hata oluştu ❌");
      console.error(error);
      return;
    }

    alert("Kaydedildi ✅");
    getData();
  };

  if (loading) {
    return (
      <div className="text-center text-gray-400">
        Yükleniyor...
      </div>
    );
  }

  return (
    <div className="space-y-8">

      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-bold text-white">
          İletişim Yönetimi
        </h1>
      </div>

      {/* 🔥 ANA KART */}
      <div className="bg-zinc-900 p-6 rounded-2xl border border-white/5 space-y-6 overflow-hidden shadow-lg hover:shadow-green-500/10 hover:border-green-500/30 transition-all">

        {/* GRID */}
        <div className="grid lg:grid-cols-3 gap-4">

          {/* TELEFON */}
          <div>
            <label className="text-xs text-gray-400 uppercase tracking-wide">
              Telefon
            </label>
            <input
              className="w-full p-3 mt-1 rounded-xl bg-zinc-800 text-white focus:ring-2 focus:ring-green-500 outline-none"
              value={data.phone || ""}
              onChange={(e) =>
                setData({ ...data, phone: e.target.value })
              }
              placeholder="0532..."
            />
          </div>

          {/* WHATSAPP */}
          <div>
            <label className="text-xs text-gray-400 uppercase tracking-wide">
              WhatsApp
            </label>
            <input
              className="w-full p-3 mt-1 rounded-xl bg-zinc-800 text-white focus:ring-2 focus:ring-green-500 outline-none"
              value={data.whatsapp || ""}
              onChange={(e) =>
                setData({ ...data, whatsapp: e.target.value })
              }
              placeholder="+90532..."
            />
          </div>

          {/* EMAIL */}
          <div>
            <label className="text-xs text-gray-400 uppercase tracking-wide">
              E-posta
            </label>
            <input
              className="w-full p-3 mt-1 rounded-xl bg-zinc-800 text-white focus:ring-2 focus:ring-green-500 outline-none"
              value={data.email || ""}
              onChange={(e) =>
                setData({ ...data, email: e.target.value })
              }
              placeholder="mail@gmail.com"
            />
          </div>

        </div>

        {/* ADRES BLOK */}
        <div>
          <label className="text-xs text-gray-400 uppercase tracking-wide">
            Adres
          </label>
          <textarea
            rows={4}
            className="w-full p-3 mt-1 rounded-xl bg-zinc-800 text-white focus:ring-2 focus:ring-green-500 outline-none"
            value={data.address || ""}
            onChange={(e) =>
              setData({ ...data, address: e.target.value })
            }
            placeholder="Kaş / Antalya..."
          />
        </div>

      </div>

      {/* 🔥 KAYDET BUTON */}
      <button
        onClick={saveData}
        disabled={saving}
        className="w-full bg-green-600 hover:bg-green-500 transition p-4 rounded-xl font-semibold text-lg"
      >
        {saving ? "Kaydediliyor..." : "Kaydet"}
      </button>

    </div>
  );
}