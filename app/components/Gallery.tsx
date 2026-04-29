"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

export default function Gallery({ onClose }: any) {
  const [images, setImages] = useState<any[]>([]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const getImages = async () => {
      const { data: villa } = await supabase
        .from("villa")
        .select("id")
        .limit(1);

      if (!villa || villa.length === 0) return;

      const { data } = await supabase
        .from("villa_images")
        .select("*")
        .eq("villa_id", villa[0].id)
        .order("order_no", { ascending: true });

      setImages(data || []);
    };

    getImages();
  }, []);

  const next = () => {
    setIndex((prev) => (prev + 1) % images.length);
  };

  const prev = () => {
    setIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  if (images.length === 0) {
    return (
      <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center text-white">
        Görsel yok
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">

      {/* HEADER */}
      <div className="flex justify-between items-center p-6 text-white">
        <h2 className="text-lg">Galeri</h2>

        <button onClick={onClose}>
          <X size={28} />
        </button>
      </div>

      {/* MAIN IMAGE */}
      <div className="flex-1 flex items-center justify-center relative">

        {/* LEFT */}
        <button
          onClick={prev}
          className="absolute left-4 text-white bg-black/40 p-2 rounded-full"
        >
          <ChevronLeft size={32} />
        </button>

        {/* IMAGE */}
        <img
          src={images[index].image_url}
          className="max-h-[80vh] max-w-[90vw] object-contain rounded-lg"
        />

        {/* RIGHT */}
        <button
          onClick={next}
          className="absolute right-4 text-white bg-black/40 p-2 rounded-full"
        >
          <ChevronRight size={32} />
        </button>
      </div>

      {/* THUMBNAILS */}
      <div className="p-4 overflow-x-auto">
        <div className="flex gap-3">
          {images.map((img, i) => (
            <img
              key={img.id}
              src={img.image_url}
              onClick={() => setIndex(i)}
              className={`h-20 w-32 object-cover rounded cursor-pointer border-2 ${
                i === index ? "border-green-500" : "border-transparent"
              }`}
            />
          ))}
        </div>
      </div>

    </div>
  );
}