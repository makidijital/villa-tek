"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Gallery from "./Gallery";

export default function Hero() {
  const [data, setData] = useState<any>(null);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [coverImage, setCoverImage] = useState<string | null>(null);

  const getYoutubeId = (url: string) => {
    const regExp = /(?:v=|youtu.be\/)([^&]+)/;
    const match = url.match(regExp);
    return match ? match[1] : null;
  };

  // 🔥 VILLA DATA
  useEffect(() => {
    const getData = async () => {
      const { data } = await supabase
        .from("villa")
        .select("*")
        .limit(1);

      if (data && data.length > 0) {
        setData(data[0]);
      }
    };

    getData();
  }, []);

  // 🔥 COVER IMAGE (ilk görsel)
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

  if (!data) return null;

  const youtubeId = getYoutubeId(data.video_url) || "";

  return (
    <section className="relative h-screen w-full">

      {/* 🎬 MEDIA (VIDEO / IMAGE) */}
      {data.video_url &&
      (data.video_url.includes("youtube") ||
        data.video_url.includes("youtu.be")) ? (

        <iframe
          className="absolute w-full h-full object-cover pointer-events-none"
          src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&mute=1&loop=1&playlist=${youtubeId}&controls=0&showinfo=0&modestbranding=1`}
          title="YouTube video"
          allow="autoplay; fullscreen"
        />

      ) : data.video_url ? (

        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute w-full h-full object-cover"
        >
          <source src={data.video_url} type="video/mp4" />
        </video>

      ) : coverImage ? (

        <img
          src={coverImage}
          className="absolute w-full h-full object-cover"
          alt="villa görsel"
        />

      ) : (

        <div className="absolute w-full h-full bg-zinc-900"></div>

      )}

      {/* OVERLAY */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/40 to-black/80"></div>

      {/* CONTENT */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-4 text-white">

        {/* TITLE */}
        <h1 className="text-5xl md:text-7xl font-bold mb-6">
          {data.title}
        </h1>

        {/* SUBTITLE */}
        <p className="text-lg md:text-xl mb-8 text-gray-300">
          {data.subtitle}
        </p>

        {/* FEATURES */}
        <div className="flex gap-10 mb-8">

          <div className="text-center">
            <p className="text-3xl font-bold">{data.guest}</p>
            <p className="text-sm text-gray-300">Kişi</p>
          </div>

          <div className="text-center">
            <p className="text-3xl font-bold">{data.bedroom}</p>
            <p className="text-sm text-gray-300">Yatak Odası</p>
          </div>

          <div className="text-center">
            <p className="text-3xl font-bold">{data.bathroom}</p>
            <p className="text-sm text-gray-300">Banyo</p>
          </div>

        </div>

        {/* BUTTONS */}
        <div className="flex gap-4 flex-wrap justify-center">

          <a
            href="#reservation"
            className="bg-green-600 hover:bg-green-500 transition px-8 py-3 rounded text-lg"
          >
            Rezervasyon Yap
          </a>

          <button
            onClick={() => setGalleryOpen(true)}
            className="border border-white/40 hover:bg-white/10 transition px-8 py-3 rounded text-lg"
          >
            Tüm Resimleri Göster
          </button>

        </div>

      </div>

      {/* 📸 GALERİ */}
      {galleryOpen && (
        <Gallery onClose={() => setGalleryOpen(false)} />
      )}

    </section>
  );
}