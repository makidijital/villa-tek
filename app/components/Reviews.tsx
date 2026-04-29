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

            // 🔥 villa id yoksa otomatik çek
            if (!vId) {
                const { data: villa } = await supabase
                    .from("villa")
                    .select("id")
                    .limit(1);

                if (!villa || villa.length === 0) {
                    setLoading(false);
                    return;
                }

                vId = villa[0].id;
            }

            const { data, error } = await supabase
                .from("reviews")
                .select("*")
                .eq("villa_id", vId)
                .eq("status", "approved") // 🔥 SADECE ONAYLI
                .order("created_at", { ascending: false });

            if (error) {
                console.error("Yorum çekme hatası:", error);
                setLoading(false);
                return;
            }

            const list = data || [];
            setReviews(list);

            // ⭐ ORTALAMA
            if (list.length > 0) {
                const total = list.reduce(
                    (acc, r) => acc + Number(r.rating || 0),
                    0
                );

                setAvgRating(Number((total / list.length).toFixed(1)));
            } else {
                setAvgRating(0);
            }

            setLoading(false);
        };

        getReviews();
    }, [villaId]);

    return (
        <div className="space-y-6">

            {/* ⭐ ORTALAMA */}
            {!loading && reviews.length > 0 && (
                <div className="text-center">
                    <div className="text-3xl font-bold text-yellow-400">
                        ⭐ {avgRating} / 5
                    </div>
                    <p className="text-gray-400 text-sm">
                        {reviews.length} yorum
                    </p>
                </div>
            )}

            {/* 🔄 LOADING */}
            {loading && (
                <p className="text-gray-400 text-center">
                    Yorumlar yükleniyor...
                </p>
            )}

            {/* ❌ BOŞ */}
            {!loading && reviews.length === 0 && (
                <p className="text-gray-400 text-center">
                    Henüz yorum yok
                </p>
            )}

            {/* ✅ YORUMLAR */}
            {reviews.map((r) => {
                const rating = Math.min(5, Math.max(1, Number(r.rating || 0)));

                return (
                    <div
                        key={r.id}
                        className="bg-zinc-800 p-5 rounded-2xl hover:bg-zinc-700 transition"
                    >
                        <div className="flex justify-between items-center">

                            <h3 className="text-white font-semibold">
                                {r.name}
                            </h3>

                            {/* ⭐ YILDIZ */}
                            <div className="text-yellow-400 text-sm">
                                {"★".repeat(rating)}
                                {"☆".repeat(5 - rating)}
                            </div>
                        </div>

                        <p className="text-gray-300 mt-3 leading-relaxed">
                            {r.comment}
                        </p>

                        <p className="text-xs text-gray-500 mt-3">
                            {new Date(r.created_at).toLocaleDateString("tr-TR")}
                        </p>
                    </div>
                );
            })}
        </div>
    );
}