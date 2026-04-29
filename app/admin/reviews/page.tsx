"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AdminReviews() {
    const [reviews, setReviews] = useState<any[]>([]);

    const getReviews = async () => {
        const { data, error } = await supabase
            .from("reviews")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) {
            console.error(error);
            return;
        }

        setReviews(data || []);
    };

    useEffect(() => {
        getReviews();
    }, []);

    const updateStatus = async (id: string, status: string) => {
        const { error } = await supabase
            .from("reviews")
            .update({ status })
            .eq("id", id);

        if (error) {
            alert("Hata ❌");
            return;
        }

        getReviews();
    };

    return (
        <div className="space-y-6">

            <h1 className="text-3xl font-bold text-white">Yorum Yönetimi</h1>

            <div className="space-y-6">

                {reviews.map((r) => (
                    <div
                        key={r.id}
                        className="bg-zinc-900 border border-white/10 rounded-2xl overflow-hidden overflow-hidden shadow-lg hover:shadow-green-500/10 hover:border-green-500/30 transition-all"
                    >

                        {/* ÜST */}
                        <div className="p-6 flex justify-between items-start gap-4">

                            {/* SOL */}
                            <div className="space-y-2">

                                <h3 className="text-lg font-semibold">
                                    {r.name}
                                </h3>

                                {/* ⭐ YILDIZ */}
                                <div className="text-yellow-400 text-sm">
                                    {"★".repeat(r.rating)}
                                    {"☆".repeat(5 - r.rating)}
                                </div>

                                {/* TARİH */}
                                <p className="text-xs text-gray-500">
                                    {new Date(r.created_at).toLocaleDateString("tr-TR")}
                                </p>
                            </div>

                            {/* STATUS */}
                            <div>
                                <span className={`
                                    px-3 py-1 text-xs rounded-full font-semibold
                                    ${r.status === "approved" && "bg-green-600"}
                                    ${r.status === "pending" && "bg-yellow-500 text-black"}
                                    ${r.status === "rejected" && "bg-red-600"}
                                `}>
                                    {r.status === "approved" && "Onaylı"}
                                    {r.status === "pending" && "Bekliyor"}
                                    {r.status === "rejected" && "Reddedildi"}
                                </span>
                            </div>

                        </div>

                        {/* YORUM */}
                        <div className="px-6 pb-6 text-gray-300 leading-relaxed border-t border-white/10 pt-4">
                            {r.comment}
                        </div>

                        {/* ALT BUTON BAR */}
                        <div className="grid grid-cols-2">

                            <button
                                onClick={() => updateStatus(r.id, "approved")}
                                className="bg-green-600 py-4 font-semibold hover:bg-green-700 transition"
                            >
                                ✔ Onayla
                            </button>

                            <button
                                onClick={() => updateStatus(r.id, "rejected")}
                                className="bg-red-600 py-4 font-semibold hover:bg-red-700 transition"
                            >
                                ✖ Reddet
                            </button>

                        </div>

                    </div>
                ))}

            </div>
        </div>
    );
}