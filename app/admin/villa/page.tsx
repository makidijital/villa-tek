"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import ImageUpload from "./components/ImageUpload";

import { DateRange } from "react-date-range";
import { tr } from "date-fns/locale";

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

export default function VillaAdmin() {

  // 🔹 ANA DATA
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // 🔹 DETAYLAR
  const [details, setDetails] = useState<any>(null);

  // 🔹 MESAFELER
  const [distances, setDistances] = useState<any[]>([]);

  // 🔹 KAPAK GÖRSEL
  const [coverImage, setCoverImage] = useState<string | null>(null);

  const [openCalendar, setOpenCalendar] = useState<number | null>(null);
  const [tempRanges, setTempRanges] = useState<any>({});

  // 🔥 SEZONLAR (FİYAT PERİYODU)
  const [periods, setPeriods] = useState<any[]>([]);

  // 🔥 GENEL ÜCRETLER (TEKİL)
  const [fees, setFees] = useState({
    cleaning_fee: "",
    deposit: "",
    cleaning_threshold: "",
  });

  // 🔥 YOUTUBE ID
  const getYoutubeId = (url: string) => {
    const regExp = /(?:v=|youtu.be\/)([^&]+)/;
    const match = url.match(regExp);
    return match ? match[1] : null;
  };

  // 🔥 DATA ÇEK
  // 🔥 DATA ÇEK
  useEffect(() => {
    const getData = async () => {

      // 1️⃣ VILLA
      const { data: villaData } = await supabase
        .from("villa")
        .select("*")
        .limit(1);

      if (villaData && villaData.length > 0) {
        const villa = villaData[0];

        setData({
          ...villa,
          guest: String(villa.guest || ""),
          bedroom: String(villa.bedroom || ""),
          bathroom: String(villa.bathroom || ""),
        });

        // 2️⃣ DETAILS
        const { data: detailsData } = await supabase
          .from("villa_details")
          .select("*")
          .eq("villa_id", villa.id)
          .single();

        setDetails(
          detailsData || {
            description: "",
            location: "",
          }
        );

        // 3️⃣ DISTANCES
        const { data: distanceData } = await supabase
          .from("villa_distances")
          .select("*")
          .eq("villa_id", villa.id);

        setDistances(distanceData || []);

        // ✅ 4️⃣ PRICE (EN KRİTİK KISIM)
        const { data: priceData } = await supabase
          .from("villa_prices")
          .select("*")
          .eq("villa_id", villa.id)
          .order("start_date", { ascending: true });

        if (priceData) {

          // 🔥 SEZONLAR
          setPeriods(
            priceData.map((p) => ({
              id: p.id,
              start_date: p.start_date,
              end_date: p.end_date,
              price: String(p.price),
            }))
          );

          // 🔥 TEK SEFERLİK ÜCRETLER
          if (priceData.length > 0) {
            setFees({
              cleaning_fee: String(priceData[0].cleaning_fee || ""),
              deposit: String(priceData[0].deposit || ""),
              cleaning_threshold: String(priceData[0].cleaning_threshold || ""),
            });
          }
        }
      }

      setLoading(false);
    };

    getData();
  }, []);

  // 🔥 COVER IMAGE
  useEffect(() => {
    const getCover = async () => {
      if (!data?.id) return;

      const { data: coverData } = await supabase
        .from("villa_images")
        .select("image_url")
        .eq("villa_id", data.id)
        .order("order_no", { ascending: true })
        .limit(1);

      if (coverData && coverData.length > 0) {
        setCoverImage(coverData[0].image_url);
      }
    };

    getCover();
  }, [data?.id]);

  // 🔥 UPDATE
  const updateData = async () => {
    try {
      setSaving(true);

      if (!data?.id) {
        alert("Villa ID yok!");
        return;
      }

      // 1️⃣ VILLA
      const { error: villaError } = await supabase
        .from("villa")
        .update({
          ...data,
          guest: Number(data.guest || 0),
          bedroom: Number(data.bedroom || 0),
          bathroom: Number(data.bathroom || 0),
        })
        .eq("id", data.id);

      // 2️⃣ DETAILS
      const { error: detailsError } = await supabase
        .from("villa_details")
        .upsert(
          {
            villa_id: data.id,
            description: details?.description || "",
            location: details?.location || "",
          },
          { onConflict: "villa_id" }
        );

      // 3️⃣ DISTANCES RESET
      await supabase
        .from("villa_distances")
        .delete()
        .eq("villa_id", data.id);

      for (const item of distances) {
        if (!item.title || !item.value) continue;

        await supabase.from("villa_distances").insert({
          villa_id: data.id,
          title: item.title,
          value: item.value,
          icon: item.icon || "",
        });
      }

      // 4️⃣ PRICE RESET
      await supabase
        .from("villa_prices")
        .delete()
        .eq("villa_id", data.id);

      for (const p of periods) {
        if (!p.start_date || !p.end_date || !p.price) continue;

        const { error: priceError } = await supabase
          .from("villa_prices")
          .insert({
            villa_id: data.id,
            start_date: p.start_date,
            end_date: p.end_date,
            price: Number(p.price),

            // 🔥 EN ÖNEMLİ KISIM
            cleaning_fee: Number(fees?.cleaning_fee || 0),
            deposit: Number(fees?.deposit || 0),
            cleaning_threshold: Number(fees?.cleaning_threshold || 0),
          });

        if (priceError) {
          console.error("PRICE ERROR:", priceError);
        }
      }

      setSaving(false);

      if (villaError || detailsError) {
        alert("Bazı işlemler başarısız ❌");
        return;
      }

      alert("Her şey kaydedildi 🚀");

    } catch (err) {
      console.error("GENEL HATA:", err);
      alert("Büyük hata var ❌");
      setSaving(false);
    }
  };

  if (loading) return <p className="text-white">Yükleniyor...</p>;
  if (!data) return <p className="text-white">Veri yok</p>;

  return (
    <div className="space-y-6">

      <h1 className="text-3xl font-bold text-white">Villa</h1>
      {/* FORM */}
      <div className="bg-zinc-900 p-6 rounded-xl space-y-5">

        <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 md:p-8 overflow-hidden shadow-lg hover:shadow-green-500/10 hover:border-green-500/30 transition-all">
          <h2 className="text-xl font-semibold">
            Genel Bilgiler
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

            {/* VİLLA ADI */}
            <div className="space-y-2">
              <label className="text-xs text-gray-400 uppercase tracking-wide">
                Villa Adı
              </label>

              <input
                className="w-full p-3 rounded-xl bg-zinc-800 text-white border border-transparent 
        focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition"
                value={data.title || ""}
                onChange={(e) =>
                  setData({ ...data, title: e.target.value })
                }
                placeholder="Villa adı gir"
              />
            </div>

            {/* KİŞİ */}
            <div className="space-y-2">
              <label className="text-xs text-gray-400 uppercase tracking-wide">
                Kişi Sayısı
              </label>

              <input
                type="text"
                inputMode="numeric"
                className="w-full p-3 rounded-xl bg-zinc-800 text-white border border-transparent 
        focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition"
                value={data.guest}
                onChange={(e) =>
                  setData({
                    ...data,
                    guest: e.target.value.replace(/\D/g, ""),
                  })
                }
                placeholder="örn: 4"
              />
            </div>

            {/* YATAK */}
            <div className="space-y-2">
              <label className="text-xs text-gray-400 uppercase tracking-wide">
                Yatak Odası
              </label>

              <input
                type="text"
                inputMode="numeric"
                className="w-full p-3 rounded-xl bg-zinc-800 text-white border border-transparent 
        focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition"
                value={data.bedroom}
                onChange={(e) =>
                  setData({
                    ...data,
                    bedroom: e.target.value.replace(/\D/g, ""),
                  })
                }
                placeholder="örn: 2"
              />
            </div>

            {/* BANYO */}
            <div className="space-y-2">
              <label className="text-xs text-gray-400 uppercase tracking-wide">
                Banyo
              </label>

              <input
                type="text"
                inputMode="numeric"
                className="w-full p-3 rounded-xl bg-zinc-800 text-white border border-transparent 
        focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition"
                value={data.bathroom}
                onChange={(e) =>
                  setData({
                    ...data,
                    bathroom: e.target.value.replace(/\D/g, ""),
                  })
                }
                placeholder="örn: 2"
              />
            </div>

          </div>

        </div>

        {/* AÇIKLAMA BLOĞU */}
        <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 md:p-8 space-y-6 overflow-hidden shadow-lg hover:shadow-green-500/10 hover:border-green-500/30 transition-all">
          <h2 className="text-xl font-semibold">
            Açıklamalar
          </h2>
          {/* SUBTITLE */}
          <div className="space-y-2">
            <label className="text-xs text-gray-400 uppercase tracking-wide">
              Kısa Açıklama
            </label>

            <input
              className="w-full p-3 rounded-xl bg-zinc-800 text-white border border-transparent 
      focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition"
              value={data.subtitle || ""}
              onChange={(e) =>
                setData({ ...data, subtitle: e.target.value })
              }
              placeholder="Kısa, dikkat çekici açıklama yaz"
            />
          </div>

          {/* UZUN AÇIKLAMA */}
          <div className="space-y-2">
            <label className="text-xs text-gray-400 uppercase tracking-wide">
              Uzun Açıklama
            </label>

            <textarea
              rows={5}
              className="w-full p-4 rounded-xl bg-zinc-800 text-white border border-transparent 
      focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition resize-none"
              value={details?.description || ""}
              onChange={(e) =>
                setDetails({ ...details, description: e.target.value })
              }
              placeholder="Villa hakkında detaylı bilgi gir... (konum, manzara, özellikler vs.)"
            />

            {/* ALT İPUCU */}
            <p className="text-xs text-gray-500">
              Öneri: Konum, manzara, havuz, gizlilik gibi detayları yaz
            </p>
          </div>

        </div>

        <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 md:p-8 space-y-6 overflow-hidden shadow-lg hover:shadow-green-500/10 hover:border-green-500/30 transition-all">
          <h2 className="text-xl font-semibold">
            Medya
          </h2>
          <div className="grid md:grid-cols-2 gap-6 items-start">

            {/* SOL → INPUT */}
            <div className="space-y-2">
              <label className="text-xs text-gray-400 uppercase tracking-wide">
                Video URL
              </label>

              <input
                className="w-full p-3 rounded-xl bg-zinc-800 text-white border border-transparent 
        focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition"
                value={data.video_url || ""}
                onChange={(e) =>
                  setData({ ...data, video_url: e.target.value })
                }
                placeholder="YouTube linki veya .mp4 gir"
              />

              <p className="text-xs text-gray-500">
                YouTube veya direkt video linki ekleyebilirsin
              </p>
            </div>

            {/* SAĞ → PREVIEW */}
            <div className="space-y-2">
              <label className="text-xs text-gray-400 uppercase tracking-wide">
                Önizleme
              </label>

              <div className="w-full h-[260px] bg-zinc-800 rounded-xl overflow-hidden border border-white/10">

                {data.video_url ? (

                  data.video_url.includes("youtube") || data.video_url.includes("youtu.be") ? (
                    <iframe
                      className="w-full h-full"
                      src={`https://www.youtube.com/embed/${getYoutubeId(data.video_url)}?autoplay=1&mute=1`}
                      title="YouTube video"
                      allow="autoplay; encrypted-media"
                      allowFullScreen
                    />
                  ) : (
                    <video
                      src={data.video_url}
                      controls
                      className="w-full h-full object-cover"
                    />
                  )

                ) : coverImage ? (

                  <img
                    src={coverImage}
                    className="w-full h-full object-cover"
                    alt="villa görsel"
                  />

                ) : (

                  <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 text-sm">
                    🎬
                    <span>Video veya görsel yok</span>
                  </div>

                )}

              </div>
            </div>

          </div>
        </div>


        <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 md:p-8 space-y-6 overflow-hidden shadow-lg hover:shadow-green-500/10 hover:border-green-500/30 transition-all">

          {/* UPLOAD AREA */}
          <div className="border-2 border-dashed border-white/10 rounded-xl p-6 text-center hover:border-green-500 transition">

            <p className="text-gray-400 text-sm mb-3">
              Görselleri sürükle bırak veya yükle
            </p>

            <ImageUpload villaId={data.id} />

          </div>

        </div>

        {/* 💰 FİYAT & SEZONLAR */}
        <div className="bg-zinc-900 p-6 rounded-xl space-y-6">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 md:p-8 space-y-6 overflow-hidden shadow-lg hover:shadow-green-500/10 hover:border-green-500/30 transition-all">

            {/* HEADER */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

              <div>
                <h2 className="text-xl font-semibold">
                  Fiyat & Sezonlar
                </h2>
                <p className="text-sm text-gray-400">
                  Tarihe göre gecelik fiyat belirle
                </p>
              </div>

              <button
                onClick={() =>
                  setPeriods([
                    ...periods,
                    {
                      id: Date.now(),
                      start_date: "",
                      end_date: "",
                      price: "",
                    },
                  ])
                }
                className="bg-green-600 hover:bg-green-500 px-5 py-2.5 rounded-xl text-sm font-semibold transition"
              >
                + Sezon Ekle
              </button>

            </div>

            {/* 🔥 GENEL ÜCRETLER */}
            <div className="bg-zinc-800 border border-white/10 rounded-xl p-5">

              <h3 className="text-sm text-gray-300 mb-4">
                Genel Ücretler
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                {/* TEMİZLİK */}
                <div className="space-y-2">
                  <label className="text-xs text-gray-400 uppercase tracking-wide">
                    Temizlik Ücreti (₺)
                  </label>

                  <input
                    type="text"
                    inputMode="numeric"
                    className="w-full p-3 rounded-xl bg-zinc-900 text-white border border-transparent 
          focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition"
                    placeholder="örn: 1500"
                    value={fees.cleaning_fee}
                    onChange={(e) =>
                      setFees({
                        ...fees,
                        cleaning_fee: e.target.value.replace(/\D/g, ""),
                      })
                    }
                  />
                </div>

                {/* TEMİZLİK KOŞULU */}
                <div className="space-y-2">
                  <label className="text-xs text-gray-400 uppercase tracking-wide">
                    Temizlik Sınırı (gece)
                  </label>

                  <input
                    type="text"
                    inputMode="numeric"
                    className="w-full p-3 rounded-xl bg-zinc-900 text-white border border-transparent 
          focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition"
                    placeholder="örn: 7"
                    value={fees.cleaning_threshold || ""}
                    onChange={(e) =>
                      setFees({
                        ...fees,
                        cleaning_threshold: e.target.value.replace(/\D/g, ""),
                      })
                    }
                  />
                </div>

                {/* DEPOZİTO */}
                <div className="space-y-2">
                  <label className="text-xs text-gray-400 uppercase tracking-wide">
                    Depozito (₺)
                  </label>

                  <input
                    type="text"
                    inputMode="numeric"
                    className="w-full p-3 rounded-xl bg-zinc-900 text-white border border-transparent 
          focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition"
                    placeholder="örn: 5000"
                    value={fees.deposit}
                    onChange={(e) =>
                      setFees({
                        ...fees,
                        deposit: e.target.value.replace(/\D/g, ""),
                      })
                    }
                  />
                </div>

              </div>
            </div>

            {/* EMPTY */}
            {periods.length === 0 && (
              <div className="text-center py-10 text-gray-500 text-sm border border-dashed border-white/10 rounded-xl">
                Henüz sezon eklenmemiş
              </div>
            )}

          </div>

          {/* SEZON LİSTESİ */}
          <div className="space-y-4">

            {periods.map((item, i) => (
              <div
                key={item.id}
                className="bg-zinc-900 border border-white/10 rounded-2xl p-5 space-y-4 overflow-hidden shadow-lg hover:shadow-green-500/10 hover:border-green-500/30 transition-all"
              >

                {/* ÜST */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">

                  {/* TARİH SEÇ */}
                  <div
                    onClick={() =>
                      setOpenCalendar(openCalendar === item.id ? null : item.id)
                    }
                    className="cursor-pointer px-4 py-3 rounded-xl bg-zinc-800 border border-white/10 hover:border-green-500 transition"
                  >
                    <span className="text-sm text-gray-400 block">
                      Tarih Aralığı
                    </span>

                    <span className="text-white font-medium">
                      {item.start_date && item.end_date
                        ? `${item.start_date} → ${item.end_date}`
                        : "Tarih seç"}
                    </span>
                  </div>

                  {/* FİYAT */}
                  <div className="flex items-center gap-3">

                    <input
                      type="text"
                      inputMode="numeric"
                      className="w-[140px] p-3 rounded-xl bg-zinc-800 text-white border border-transparent 
            focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition"
                      placeholder="₺ / gece"
                      value={item.price}
                      onChange={(e) => {
                        const newData = [...periods];
                        newData[i].price = e.target.value.replace(/\D/g, "");
                        setPeriods(newData);
                      }}
                    />

                    <div className="text-sm text-gray-400 min-w-[70px] text-right">
                      {item.price ? `₺${item.price}` : "-"}
                    </div>

                    {/* SİL */}
                    <button
                      onClick={() =>
                        setPeriods(periods.filter((p) => p.id !== item.id))
                      }
                      className="text-red-500 hover:text-red-400 text-sm px-3 py-2"
                    >
                      ✖
                    </button>

                  </div>
                </div>

                {/* TAKVİM */}
                {openCalendar === item.id && (
                  <div className="bg-zinc-800 border border-white/10 p-4 rounded-xl">

                    <DateRange
                      ranges={[
                        tempRanges[item.id] || {
                          startDate: item.start_date
                            ? new Date(item.start_date)
                            : new Date(),
                          endDate: item.end_date
                            ? new Date(item.end_date)
                            : new Date(),
                          key: "selection",
                        },
                      ]}
                      onChange={(range: any) => {
                        const start = range.selection.startDate;
                        const end = range.selection.endDate;

                        const formatDateLocal = (date: Date) => {
                          const year = date.getFullYear();
                          const month = String(date.getMonth() + 1).padStart(2, "0");
                          const day = String(date.getDate()).padStart(2, "0");
                          return `${year}-${month}-${day}`;
                        };

                        setTempRanges((prev: any) => ({
                          ...prev,
                          [item.id]: range.selection,
                        }));

                        const newData = [...periods];
                        newData[i].start_date = formatDateLocal(start);
                        newData[i].end_date = formatDateLocal(end);
                        setPeriods(newData);

                        if (start && end && start.getTime() !== end.getTime()) {
                          setTimeout(() => {
                            setOpenCalendar(null);
                          }, 150);
                        }
                      }}
                      months={2}
                      direction="horizontal"
                      locale={tr}
                      rangeColors={["#22c55e"]}
                      moveRangeOnFirstSelection={false}
                    />

                  </div>
                )}

              </div>
            ))}

          </div>

        </div>
        {/* DETAILS */}
        <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 md:p-8 space-y-6 overflow-hidden shadow-lg hover:shadow-green-500/10 hover:border-green-500/30 transition-all">

          <h2 className="text-xl font-semibold">
            Konum
          </h2>

          <div className="grid md:grid-cols-2 gap-6 items-start">

            {/* SOL → INPUT */}
            <div className="space-y-2">
              <label className="text-xs text-gray-400 uppercase tracking-wide">
                Google Maps Link
              </label>

              <input
                className="w-full p-3 rounded-xl bg-zinc-800 text-white border border-transparent 
        focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition"
                value={details?.location || ""}
                onChange={(e) =>
                  setDetails({ ...details, location: e.target.value })
                }
                placeholder="https://www.google.com/maps?q=..."
              />

              <p className="text-xs text-gray-500">
                Google Maps paylaşım linkini buraya yapıştır
              </p>
            </div>

            {/* SAĞ → HARİTA PREVIEW */}
            <div className="space-y-2">
              <label className="text-xs text-gray-400 uppercase tracking-wide">
                Önizleme
              </label>

              <div className="w-full h-[260px] bg-zinc-800 rounded-xl overflow-hidden border border-white/10">

                {details?.location ? (
                  <iframe
                    src={details.location}
                    className="w-full h-full border-0"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                    📍 Konum yok
                  </div>
                )}

              </div>
            </div>

          </div>

        </div>

        <div className="bg-zinc-900 border border-white/10 p-6 rounded-2xl space-y-5 overflow-hidden shadow-lg hover:shadow-green-500/10 hover:border-green-500/30 transition-all">

          {/* HEADER */}
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-white">
              Mesafeler
            </h2>

            <button
              onClick={() =>
                setDistances([
                  ...distances,
                  { id: Date.now(), title: "", value: "", icon: "📍" },
                ])
              }
              className="bg-green-600 hover:bg-green-500 px-4 py-2 rounded-lg text-sm font-semibold transition"
            >
              + Ekle
            </button>
          </div>

          {/* EMPTY */}
          {distances.length === 0 && (
            <div className="text-center py-6 text-gray-500 text-sm border border-dashed border-white/10 rounded-lg">
              Henüz mesafe eklenmemiş
            </div>
          )}

          {/* LIST */}
          <div className="space-y-3">

            {distances.map((item, i) => (
              <div
                key={item.id}
                className="grid grid-cols-12 gap-3 items-center bg-zinc-800 p-3 rounded-xl border border-white/5"
              >

                {/* ICON */}
                <select
                  className="col-span-2 p-2 rounded-lg bg-zinc-900 text-white border border-transparent 
          focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition"
                  value={item.icon}
                  onChange={(e) => {
                    const newData = [...distances];
                    newData[i].icon = e.target.value;
                    setDistances(newData);
                  }}
                >
                  <option value="location">Konum</option>
                  <option value="market">Market</option>
                  <option value="restaurant">Restaurant</option>
                  <option value="beach">Plaj</option>
                  <option value="airport">Havalimanı</option>
                  <option value="bus">Otobüs</option>
                  <option value="center">Merkez</option>
                  <option value="hospital">Sağlık</option>
                </select>

                {/* TITLE */}
                <input
                  className="col-span-5 p-2 rounded-lg bg-zinc-900 text-white border border-transparent 
          focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition"
                  value={item.title}
                  onChange={(e) => {
                    const newData = [...distances];
                    newData[i].title = e.target.value;
                    setDistances(newData);
                  }}
                  placeholder="Market"
                />

                {/* VALUE */}
                <input
                  className="col-span-3 p-2 rounded-lg bg-zinc-900 text-white border border-transparent 
          focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition"
                  value={item.value}
                  onChange={(e) => {
                    const newData = [...distances];
                    newData[i].value = e.target.value;
                    setDistances(newData);
                  }}
                  placeholder="500m"
                />

                {/* DELETE */}
                <button
                  onClick={() =>
                    setDistances(distances.filter((d) => d.id !== item.id))
                  }
                  className="col-span-2 text-red-500 hover:text-red-400 text-sm font-medium transition"
                >
                  Sil
                </button>

              </div>
            ))}

          </div>

        </div>

        {/* BUTTON */}
        <button
          onClick={updateData}
          disabled={saving}
          className="w-full bg-green-600 hover:bg-green-500 transition p-4 rounded-xl font-semibold text-lg"
        >
          {saving ? "Kaydediliyor..." : "Kaydet"}
        </button>

      </div>
    </div>
  );
}