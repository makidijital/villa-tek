"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

import {
  MapPin,
  Store,
  Utensils,
  Plane,
  Bus,
  Building2,
  HeartPulse,
  Waves,
} from "lucide-react";

// 🔥 icon map
const ICONS: any = {
  market: Store,
  restaurant: Utensils,
  airport: Plane,
  bus: Bus,
  center: Building2,
  hospital: HeartPulse,
  beach: Waves,
  location: MapPin,
};

export default function Details() {
  const [details, setDetails] = useState<any>(null);
  const [distances, setDistances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getData = async () => {
      // 1️⃣ VILLA ID çek
      const { data: villaData } = await supabase
        .from("villa")
        .select("id")
        .limit(1);

      if (!villaData || villaData.length === 0) {
        setLoading(false);
        return;
      }

      const villaId = villaData[0].id;

      // 2️⃣ DETAILS çek
      const { data: detailsData } = await supabase
        .from("villa_details")
        .select("*")
        .eq("villa_id", villaId)
        .single();

      // 3️⃣ DISTANCES çek
      const { data: distanceData } = await supabase
        .from("villa_distances")
        .select("*")
        .eq("villa_id", villaId);

      setDetails(detailsData);
      setDistances(distanceData || []);
      setLoading(false);
    };

    getData();
  }, []);

  if (loading) {
    return <p className="text-white text-center py-20">Yükleniyor...</p>;
  }

  return (
    <section className="bg-black text-white py-16 px-4">

      <div className="max-w-7xl mx-auto space-y-12">
        {/* ÜST GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">

          {/* SOL - AÇIKLAMA (DAR) */}
          <div className="md:col-span-1 max-w-xl">
            <h2 className="text-3xl font-bold mb-4">
              Villa Hakkında
            </h2>

            <p className="text-gray-300 leading-relaxed text-lg">
              {details?.description || "Açıklama bulunamadı"}
            </p>
          </div>

          {/* SAĞ - MESAFELER (GENİŞ) */}
          <div className="md:col-span-2">
            <h3 className="text-2xl font-semibold mb-6">
              Mesafeler
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {distances.length > 0 ? (
                distances.map((item, i) => {
                  const Icon = ICONS[item.icon] || MapPin;

                  return (
                    <div
                      key={i}
                      className="flex items-center gap-4 bg-zinc-900 p-4 rounded-xl hover:bg-zinc-800 transition h-full"
                    >
                      {/* ICON */}
                      <div className="bg-green-600/20 p-2 rounded-lg">
                        <Icon className="w-5 h-5 text-green-400" />
                      </div>

                      {/* TITLE */}
                      <span className="text-white font-medium">
                        {item.title}
                      </span>

                      {/* VALUE */}
                      <span className="ml-auto text-gray-300 font-semibold">
                        {item.value}
                      </span>
                    </div>
                  );
                })
              ) : (
                <p className="text-gray-500 col-span-2 text-center">
                  Mesafe yok
                </p>
              )}
            </div>
          </div>

        </div>

        {/* ALT - HARİTA */}
        <div>
          <h3 className="text-2xl font-semibold mb-6">
            Konum
          </h3>

          <div className="rounded-xl overflow-hidden">
            <iframe
              src={
                details?.location ||
                "https://www.google.com/maps?q=Kaş,Kalkan&output=embed"
              }
              className="w-full h-[400px]"
              loading="lazy"
            />
          </div>

        </div>

      </div>
    </section>
  );
}