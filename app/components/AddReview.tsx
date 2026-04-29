"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function AddReview() {
    const [villaId, setVillaId] = useState<string | null>(null);

    const [form, setForm] = useState({
        name: "",
        rating: 5,
        comment: "",
    });

    const [loading, setLoading] = useState(false);

    // 🔥 villa id çek
    useEffect(() => {
        const getVilla = async () => {
            const { data, error } = await supabase
                .from("villa")
                .select("id")
                .limit(1);

            if (error) {
                console.error("Villa çekme hatası:", error);
                return;
            }

            if (data && data.length > 0) {
                setVillaId(data[0].id);
            }
        };

        getVilla();
    }, []);

    const handleSubmit = async () => {
        // ❌ villa yok
        if (!villaId) {
            alert("Villa bulunamadı ❌");
            return;
        }

        // ❌ boş alan
        if (!form.name || !form.comment) {
            alert("Lütfen tüm alanları doldurun ❌");
            return;
        }

        setLoading(true);

        const { error } = await supabase.from("reviews").insert([
            {
                villa_id: villaId,
                name: form.name,
                rating: Number(form.rating),
                comment: form.comment,
                status: "pending", // 🔥 MODERASYON
            },
        ]);

        setLoading(false);

        if (error) {
            console.error("Yorum ekleme hatası:", error);
            alert("Hata oluştu ❌");
            return;
        }

        alert("Yorumunuz alındı, onay sonrası yayınlanacaktır ✅");

        // 🔄 temizle
        setForm({
            name: "",
            rating: 5,
            comment: "",
        });

        // 🔥 opsiyonel (istersen kaldırırız sonra)
        window.location.reload();
    };

    return (
        <div className="bg-zinc-800 p-6 rounded-2xl space-y-4">

            <h3 className="text-xl font-semibold text-white">
                Yorum Yap
            </h3>

            {/* İSİM */}
            <input
                placeholder="Adınız"
                value={form.name}
                onChange={(e) =>
                    setForm({ ...form, name: e.target.value })
                }
                className="w-full p-2 rounded bg-zinc-900 text-white outline-none"
            />

            {/* ⭐ YILDIZ */}
            <div className="flex gap-2 text-2xl">
                {[1, 2, 3, 4, 5].map((star) => (
                    <button
                        key={star}
                        type="button"
                        onClick={() =>
                            setForm({ ...form, rating: star })
                        }
                    >
                        {star <= form.rating ? "⭐" : "☆"}
                    </button>
                ))}
            </div>

            {/* YORUM */}
            <textarea
                placeholder="Yorumunuz"
                value={form.comment}
                onChange={(e) =>
                    setForm({ ...form, comment: e.target.value })
                }
                className="w-full p-2 rounded bg-zinc-900 text-white outline-none"
            />

            {/* BUTTON */}
            <button
                onClick={handleSubmit}
                disabled={loading}
                className={`w-full p-3 rounded-lg font-semibold transition ${
                    loading
                        ? "bg-gray-600 cursor-not-allowed"
                        : "bg-green-600 hover:bg-green-500"
                }`}
            >
                {loading ? "Gönderiliyor..." : "Yorum Gönder"}
            </button>

        </div>
    );
}