"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AdminPage() {
  const [villaCount, setVillaCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getData = async () => {
      const { data, error } = await supabase
        .from("villa")
        .select("*");

      if (!error) {
        setVillaCount(data.length);
      }

      setLoading(false);
    };

    getData();
  }, []);

  if (loading) {
    return <p className="text-white">Yükleniyor...</p>;
  }

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-bold text-white">
          Dashboard
        </h1>
        <p className="text-gray-400">
          Genel sistem durumu
        </p>
      </div>

      {/* CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">

        {/* VILLA */}
        <div className="bg-zinc-900 p-6 rounded-xl">
          <p className="text-gray-400">Toplam Villa</p>
          <h2 className="text-3xl font-bold text-white mt-2">
            {villaCount}
          </h2>
        </div>

        {/* REZERVASYON */}
        <div className="bg-zinc-900 p-6 rounded-xl">
          <p className="text-gray-400">Rezervasyon</p>
          <h2 className="text-3xl font-bold text-white mt-2">
            0
          </h2>
        </div>

        {/* SON GÜNCELLEME */}
        <div className="bg-zinc-900 p-6 rounded-xl">
          <p className="text-gray-400">Son Güncelleme</p>
          <h2 className="text-lg text-white mt-2">
            Bugün
          </h2>
        </div>

      </div>

    </div>
  );
}