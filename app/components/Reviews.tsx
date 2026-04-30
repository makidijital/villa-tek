"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Reviews({ villaId }: { villaId?: string }) {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [avgRating, setAvgRating] = useState<number>(0);

  useEffect(() => {
    const getReviews = async () => {
      setLoading(true);

      let vId = villaId;

      if (!vId) {
        const { data: villa } = await supabase
          .from("villa")
          .select("id")
          .limit(1);

        if (!villa?.length) {
          setLoading(false);
          return;
        }

        vId = villa[0].id;
      }

      const { data } = await supabase
        .from("reviews")
        .select("*")
        .eq("villa_id", vId)
        .eq("status", "approved")
        .order("created_at", { ascending: false });

      const list = data || [];
      setReviews(list);

      if (list.length > 0) {
        const total = list.reduce(
          (acc, r) => acc + Number(r.rating || 0),
          0
        );
        setAvgRating(Number((total / list.length).toFixed(1)));
      }

      setLoading(false);
    };

    getReviews();
  }, [villaId]);

  return (
    <section className="max-w-6xl mx-auto px-4 py-16 text-white">

      {/* 🔥 HEADER */}
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold mb-3">
          Misafir Yorumları
        </h2>
        <p className="text-gray-400">
          Gerçek deneyimler, gerçek yorumlar
        </p>
      </div>

      {/* ⭐ ORTALAMA */}
      {!loading && reviews.length > 0 && (
        <div className="flex flex-col items-center mb-12">

          <div className="bg-gradient-to-r from-yellow-500/20 to-yellow-400/10 border border-yellow-400/20 rounded-2xl px-8 py-6 text-center shadow-lg">

            <div className="text-5xl font-bold text-yellow-400">
              {avgRating}
            </div>

            <div className="text-yellow-400 mt-2 text-lg">
              {"★".repeat(Math.round(avgRating))}
              {"☆".repeat(5 - Math.round(avgRating))}
            </div>

            <p className="text-gray-400 text-sm mt-2">
              {reviews.length} yorum
            </p>

          </div>
        </div>
      )}

      {/* LOADING */}
      {loading && (
        <p className="text-center text-gray-400">
          Yorumlar yükleniyor...
        </p>
      )}

      {/* EMPTY */}
      {!loading && reviews.length === 0 && (
        <p className="text-center text-gray-400">
          Henüz yorum yok
        </p>
      )}

      {/* 🔥 GRID */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">

        {reviews.map((r) => {
          const rating = Math.min(5, Math.max(1, Number(r.rating || 0)));

          return (
            <div
              key={r.id}
              className="bg-gradient-to-b from-zinc-900 to-black border border-white/5 rounded-2xl p-5 hover:scale-[1.02] hover:border-green-500/30 transition-all duration-300 shadow-xl"
            >

              {/* ÜST */}
              <div className="flex items-center justify-between mb-3">

                <div>
                  <p className="font-semibold text-white">
                    {r.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(r.created_at).toLocaleDateString("tr-TR")}
                  </p>
                </div>

                {/* ⭐ */}
                <div className="text-yellow-400 text-sm">
                  {"★".repeat(rating)}
                  {"☆".repeat(5 - rating)}
                </div>

              </div>

              {/* YORUM */}
              <p className="text-gray-300 leading-relaxed text-sm line-clamp-4">
                {r.comment}
              </p>

            </div>
          );
        })}
      </div>
    </section>
  );
}