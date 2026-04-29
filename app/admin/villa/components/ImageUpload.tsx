"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function ImageUpload({ villaId }: { villaId: string }) {
  const [images, setImages] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);

  // 🔥 SEO SLUG
  const slugify = (text: string) => {
    return text
      .toLowerCase()
      .replace(/ğ/g, "g")
      .replace(/ü/g, "u")
      .replace(/ş/g, "s")
      .replace(/ı/g, "i")
      .replace(/ö/g, "o")
      .replace(/ç/g, "c")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
  };

  // 🔥 WEBP CONVERT
const convertToWebP = (file: File): Promise<Blob> => {
  return new Promise((resolve) => {
    const img = document.createElement("img");
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);

      canvas.toBlob(
        (blob) => resolve(blob!),
        "image/webp",
        0.8
      );
    };

    img.src = URL.createObjectURL(file);
  });
};

  // 📥 GÖRSELLERİ ÇEK
  const getImages = async () => {
    const { data } = await supabase
      .from("villa_images")
      .select("*")
      .eq("villa_id", villaId)
      .order("order_no", { ascending: true });

    setImages(data || []);
  };

  useEffect(() => {
    if (villaId) getImages();
  }, [villaId]);

// 📤 MULTI UPLOAD (WEBP + SEO)
const handleUpload = async (files: FileList) => {
  if (!files) return;

  setUploading(true);

  for (let i = 0; i < files.length; i++) {
    try {
      const originalFile = files[i];

      // 🔥 WEBP'e çevir
      const webpBlob = await convertToWebP(originalFile);

      const file = new File([webpBlob], "image.webp", {
        type: "image/webp",
      });

      // 🔥 SEO isim
      const villaName = slugify("villa-in-love");
      const location = slugify("kalkan");

      const fileName = `${villaName}-${location}-${Date.now()}-${i}.webp`;
      const filePath = `public/${fileName}`;

      // 📤 UPLOAD
      const { error: uploadError } = await supabase.storage
        .from("villa-images")
        .upload(filePath, file);

      if (uploadError) {
        console.log("UPLOAD ERROR:", uploadError);
        continue;
      }

      // 🔗 URL
      const { data } = supabase.storage
        .from("villa-images")
        .getPublicUrl(filePath);

      // 💾 DB
      await supabase.from("villa_images").insert({
        villa_id: villaId,
        image_url: data.publicUrl,
        order_no: images.length + i,
      });

    } catch (err) {
      console.log("GENEL HATA:", err);
    }
  }

  setUploading(false);
  getImages();
};

  // 🖱️ DRAG DROP UPLOAD
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    handleUpload(e.dataTransfer.files);
  };

  // 🔄 SIRALAMA
  const moveImage = async (from: number, to: number) => {
    if (from === to) return;

    const updated = [...images];
    const [moved] = updated.splice(from, 1);
    updated.splice(to, 0, moved);

    setImages(updated);

    for (let i = 0; i < updated.length; i++) {
      await supabase
        .from("villa_images")
        .update({ order_no: i })
        .eq("id", updated[i].id);
    }
  };

  // 🗑️ FULL SİL (STORAGE + DB)
const deleteImage = async (img: any) => {
  try {
    // 🔥 URL → PATH güvenli parse
    const url = new URL(img.image_url);
    const path = url.pathname.replace(
      "/storage/v1/object/public/villa-images/",
      ""
    );

    console.log("SİLİNEN PATH:", path);

    // 🗑️ STORAGE
    const { error: storageError } = await supabase.storage
      .from("villa-images")
      .remove([path]);

    if (storageError) {
      console.log("STORAGE DELETE ERROR:", storageError);
      alert("Storage silinemedi ❌");
      return;
    }

    // 🗑️ DB
    const { error: dbError } = await supabase
      .from("villa_images")
      .delete()
      .eq("id", img.id);

    if (dbError) {
      console.log("DB DELETE ERROR:", dbError);
    }

    alert("Silindi ✅");
    getImages();

  } catch (err) {
    console.log("GENEL DELETE HATA:", err);
  }
};

  return (
    <div className="bg-zinc-900 p-4 rounded-xl space-y-4">
      <p className="text-white font-semibold text-lg">Görseller</p>

      {/* DROP AREA */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        className="border-2 border-dashed border-gray-600 p-6 text-center text-gray-400 rounded-lg hover:border-green-500 transition"
      >
        Sürükle bırak veya seç

        <input
          type="file"
          multiple
          onChange={(e) => handleUpload(e.target.files!)}
          className="mt-3"
        />
      </div>

      {uploading && (
        <p className="text-gray-400 text-sm">Yükleniyor...</p>
      )}

      {/* GRID */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {images.map((img, index) => (
          <div
            key={img.id}
            draggable
            onDragStart={(e) =>
              e.dataTransfer.setData("index", index.toString())
            }
            onDrop={(e) => {
              const from = Number(e.dataTransfer.getData("index"));
              moveImage(from, index);
            }}
            onDragOver={(e) => e.preventDefault()}
            className="relative group cursor-move"
          >
            <img
              src={img.image_url}
              className="w-full h-32 object-cover rounded-lg"
              alt="villa görsel"
            />

            {/* SİL */}
            <button
              onClick={() => deleteImage(img)}
              className="absolute top-2 right-2 bg-red-600 text-white px-2 py-1 text-xs rounded opacity-0 group-hover:opacity-100 transition"
            >
              Sil
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}