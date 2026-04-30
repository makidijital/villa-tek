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
      const { data: villaData } = await supabase
        .from("villa")
        .select("id")
        .limit(1);

      if (!villaData || villaData.length === 0) {
        setLoading(false);
        return;
      }

      const villaId = villaData[0].id;

      const { data: detailsData } = await supabase
        .from("villa_details")
        .select("*")
        .eq("villa_id", villaId)
        .single();

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
    return (
      <div className="py-24 text-center text-gray-400 animate-pulse">
        Yükleniyor...
      </div>
    );
  }

  return (
    <section className="bg-black text-white py-20 px-4">
      <div className="max-w-7xl mx-auto space-y-16">

        {/* 🔥 HEADER */}

        {/* 🔥 GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">

          {/* SOL - AÇIKLAMA */}
          <div className="lg:col-span-1">
            <div className="bg-gradient-to-b from-zinc-900 to-zinc-950 p-6 rounded-2xl border border-white/5 shadow-lg">
              <h3 className="text-2xl font-semibold mb-4">
                Villa Hakkında
              </h3>

              <p className="text-gray-300 leading-relaxed">
                {details?.description || "Açıklama bulunamadı"}
              </p>
            </div>
          </div>

          {/* SAĞ - MESAFELER */}
          <div className="lg:col-span-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {distances.length > 0 ? (
                distances.map((item, i) => {
                  const Icon = ICONS[item.icon] || MapPin;

                  return (
                    <div
                      key={i}
                      className="group flex items-center gap-4 bg-zinc-900/70 backdrop-blur p-5 rounded-xl border border-white/5 hover:border-red-500/40 hover:bg-zinc-800 transition-all duration-300"
                    >
                      {/* ICON */}
                      <div className="bg-red-600/20 group-hover:bg-red-500/30 transition p-3 rounded-xl">
                        <Icon className="w-5 h-5 text-red-400" />
                      </div>

                      {/* TEXT */}
                      <div>
                        <p className="text-white font-medium">
                          {item.title}
                        </p>
                        <p className="text-gray-400 text-sm">
                          Mesafe
                        </p>
                      </div>

                      {/* VALUE */}
                      <div className="ml-auto text-red-400 font-semibold">
                        {item.value}
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-gray-500 col-span-2 text-center">
                  Mesafe bilgisi bulunamadı
                </p>
              )}
            </div>
          </div>

        </div>

        {/* 🔥 MAP */}
        <div>
          <h3 className="text-2xl font-semibold mb-6 text-center">
            Konum
          </h3>

          <div className="rounded-2xl overflow-hidden border border-white/10 shadow-xl">
            <iframe
              src={
                details?.location ||
                "https://www.google.com/maps?q=Kaş,Kalkan&output=embed"
              }
              className="w-full h-[350px] md:h-[450px]"
              loading="lazy"
            />
          </div>
        </div>

      </div>
    </section>
  );
}