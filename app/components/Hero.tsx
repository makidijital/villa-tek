"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Gallery from "./Gallery";

export default function Hero() {
  const [villa, setVilla] = useState<any>(null);
  const [settings, setSettings] = useState<any>({});
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [coverImage, setCoverImage] = useState<string | null>(null);

  const getYoutubeId = (url: string) => {
    const regExp = /(?:v=|youtu.be\/)([^&]+)/;
    const match = url.match(regExp);
    return match ? match[1] : null;
  };

  useEffect(() => {
    const getData = async () => {
      const { data: villaData } = await supabase
        .from("villa")
        .select("*")
        .limit(1);

      if (villaData?.length) setVilla(villaData[0]);

      const { data: settingsData } = await supabase
        .from("settings")
        .select("*");

      const obj: any = {};
      settingsData?.forEach((item) => {
        obj[item.key] = item.value;
      });

      setSettings(obj);
    };

    getData();
  }, []);

  useEffect(() => {
    const getCover = async () => {
      if (!villa?.id) return;

      const { data } = await supabase
        .from("villa_images")
        .select("image_url")
        .eq("villa_id", villa.id)
        .order("order_no", { ascending: true })
        .limit(1);

      if (data?.length) setCoverImage(data[0].image_url);
    };

    getCover();
  }, [villa?.id]);

  if (!villa) return null;

  const youtubeId = getYoutubeId(villa.video_url) || "";

  const title = settings.homepage_title || villa.title;
  const subtitle = settings.homepage_description || villa.subtitle;

  return (
    <section className="relative min-h-screen w-full">

      {/* 🎬 MEDIA */}
      {villa.video_url &&
      (villa.video_url.includes("youtube") ||
        villa.video_url.includes("youtu.be")) ? (
        <iframe
          className="absolute w-full h-full object-cover pointer-events-none scale-110"
          src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&mute=1&loop=1&playlist=${youtubeId}&controls=0`}
          title="YouTube video"
          allow="autoplay; fullscreen"
        />
      ) : villa.video_url ? (
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute w-full h-full object-cover scale-110"
        >
          <source src={villa.video_url} type="video/mp4" />
        </video>
      ) : coverImage ? (
        <img
          src={coverImage}
          className="absolute w-full h-full object-cover"
          alt="villa görsel"
        />
      ) : (
        <div className="absolute w-full h-full bg-zinc-900" />
      )}

      {/* OVERLAY */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/40 to-black/90" />

      {/* 🔥 CONTENT */}
      <div className="relative z-10 flex items-center justify-center min-h-screen px-4">

        <div className="w-full max-w-2xl text-center backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-10 shadow-2xl">

          {/* TITLE */}
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold mb-4 leading-tight">
            {title}
          </h1>

          {/* SUBTITLE */}
          <p className="text-sm sm:text-base md:text-lg text-gray-300 mb-6">
            {subtitle}
          </p>

          {/* FEATURES */}
          <div className="flex justify-center gap-6 sm:gap-10 mb-6 text-center">

            <div>
              <p className="text-xl sm:text-2xl md:text-3xl font-bold">
                {villa.guest}
              </p>
              <p className="text-xs text-gray-400 ">Kişi</p>
            </div>

            <div>
              <p className="text-xl sm:text-2xl md:text-3xl font-bold">
                {villa.bedroom}
              </p>
              <p className="text-xs text-gray-400">Oda</p>
            </div>

            <div>
              <p className="text-xl sm:text-2xl md:text-3xl font-bold">
                {villa.bathroom}
              </p>
              <p className="text-xs text-gray-400">Banyo</p>
            </div>

          </div>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row gap-3">

            <a
              href="#reservation"
              className="flex-1 text-center bg-red-600 hover:bg-red-500 transition py-3 rounded-xl text-base font-semibold shadow-lg hover:scale-[1.02]"
            >
              Rezervasyon Yap
            </a>

            <button
              onClick={() => setGalleryOpen(true)}
              className="flex-1 text-center border border-white/20 hover:bg-white/10 transition py-3 rounded-xl text-base font-medium"
            >
              Tüm Resimleri Gör
            </button>

          </div>

        </div>

      </div>

      {/* 📸 GALERİ */}
      {galleryOpen && (
        <Gallery onClose={() => setGalleryOpen(false)} />
      )}

      {/* 🔥 SCROLL INDICATOR */}
      <div className="absolute bottom-6 w-full flex justify-center text-white/60 text-xs animate-bounce">
        ↓ Aşağı kaydır
      </div>

    </section>
  );
}