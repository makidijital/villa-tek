"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function SettingsPage() {
  const [settings, setSettings] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    getSettings();
  }, []);

  // 🔥 SETTINGS ÇEK
  const getSettings = async () => {
    const { data, error } = await supabase.from("settings").select("*");

    if (error) {
      console.log(error);
      return;
    }

    const obj: any = {};
    data?.forEach((item) => {
      obj[item.key] = item.value;
    });

    setSettings(obj);
  };

  // 🔥 LOGO UPLOAD + DB SAVE
  const handleLogoUpload = async (file: File) => {
    setUploading(true);

    try {
      const fileName = "logo.png";

      const { error: uploadError } = await supabase.storage
        .from("logo")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from("logo")
        .getPublicUrl(fileName);

      const url = data.publicUrl + `?t=${Date.now()}`;

      // ✅ STATE
      setSettings((prev: any) => ({
        ...prev,
        logo_url: url,
      }));

      // ✅ DB (DUPLICATE ENGEL)
      await supabase.from("settings").upsert(
        {
          key: "logo_url",
          value: url,
        },
        { onConflict: "key" }
      );
    } catch (err) {
      console.log(err);
      alert("Logo yüklenemedi ❌");
    }

    setUploading(false);
  };

  // 💾 SAVE (TOPLU)
  const handleSave = async () => {
    setLoading(true);

    try {
      const updates = Object.keys(settings).map((key) => ({
        key,
        value: settings[key],
      }));

      const { error } = await supabase
        .from("settings")
        .upsert(updates, { onConflict: "key" });

      if (error) throw error;

      alert("Kaydedildi 🔥");
    } catch (err) {
      console.log(err);
      alert("Kayıt hatası ❌");
    }

    setLoading(false);
  };

  return (
    <div className="p-6 md:p-10">
      {/* HEADER */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Site Ayarları</h1>
        <p className="text-gray-400 mt-1">
          Site genel ayarlarını buradan yönetebilirsin
        </p>
      </div>

      {/* CARD */}
      <div className="bg-zinc-800/50 border border-white/10 rounded-2xl p-6 space-y-6">
        {/* GRID */}
        <div className="grid md:grid-cols-3 gap-4">
          {/* TITLE */}
          <div>
            <label className="text-sm text-gray-400">SITE TITLE</label>
            <input
              className="w-full mt-1 bg-zinc-900 border border-white/10 p-3 rounded-lg"
              value={settings.site_title || ""}
              onChange={(e) =>
                setSettings((prev: any) => ({
                  ...prev,
                  site_title: e.target.value,
                }))
              }
            />
          </div>

          {/* PREPAYMENT */}
          <div>
            <label className="text-sm text-gray-400">
              ÖN ÖDEME (%)
            </label>
            <input
              type="number"
              className="w-full mt-1 bg-zinc-900 border border-white/10 p-3 rounded-lg"
              value={settings.prepayment_percent || ""}
              onChange={(e) =>
                setSettings((prev: any) => ({
                  ...prev,
                  prepayment_percent: e.target.value,
                }))
              }
            />
          </div>

          {/* LOGO */}
          <div>
            <label className="text-sm text-gray-400">LOGO</label>

            <input
              type="file"
              accept="image/*"
              className="w-full mt-2 text-sm"
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  handleLogoUpload(e.target.files[0]);
                }
              }}
            />

            {uploading && (
              <p className="text-xs text-gray-400 mt-2">
                Yükleniyor...
              </p>
            )}

            {settings.logo_url && settings.logo_url !== "" && (
              <img
                src={settings.logo_url}
                className="h-12 mt-2 bg-white rounded p-1"
              />
            )}
          </div>
        </div>

        {/* DESCRIPTION */}
        <div>
          <label className="text-sm text-gray-400">
            SITE DESCRIPTION
          </label>
          <textarea
            className="w-full mt-1 bg-zinc-900 border border-white/10 p-3 rounded-lg"
            rows={4}
            value={settings.site_description || ""}
            onChange={(e) =>
              setSettings((prev: any) => ({
                ...prev,
                site_description: e.target.value,
              }))
            }
          />
        </div>
      </div>

      {/* SAVE */}
      <button
        onClick={handleSave}
        disabled={loading}
        className="w-full mt-6 bg-green-600 hover:bg-green-700 transition text-white py-4 rounded-xl font-semibold text-lg disabled:opacity-50"
      >
        {loading ? "Kaydediliyor..." : "Kaydet"}
      </button>
    </div>
  );
}