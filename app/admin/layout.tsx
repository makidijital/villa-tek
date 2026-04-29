"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [settings, setSettings] = useState<any>({});

  useEffect(() => {
    getSettings();
  }, []);

  const getSettings = async () => {
    const { data } = await supabase.from("settings").select("*");

    const obj: any = {};
    data?.forEach((item) => {
      obj[item.key] = item.value;
    });

    setSettings(obj);
  };

  // 🔥 MENÜ (GÜNCEL)
  const menu = [
    { name: "Dashboard", href: "/admin" },
    { name: "Villa", href: "/admin/villa" },
    { name: "Rezervasyon", href: "/admin/rezervasyon" },

    // 🔥 YENİ EKLEDİK
    { name: "Harici Rezervasyonlar", href: "/admin/external" },

    { name: "Yorumlar", href: "/admin/reviews" },
    { name: "İletişim", href: "/admin/contact" },
    { name: "Genel Ayarlar", href: "/admin/settings" },
  ];

  return (
    <div className="flex min-h-screen bg-black text-white">

      {/* SIDEBAR */}
      <aside className="w-64 bg-black border-r border-white/10 p-6 flex flex-col justify-between">

        {/* ÜST */}
        <div>

          {/* LOGO + TITLE */}
          <div className="mb-8">
            {settings.logo_url ? (
              <img
                src={settings.logo_url}
                alt="logo"
                className="h-10 object-contain"
              />
            ) : (
              <h2 className="text-lg font-bold">
                {settings.site_title}
              </h2>
            )}
          </div>

          {/* NAV */}
          <nav className="flex flex-col gap-2">

            {menu.map((item) => {
              const isActive =
                item.href === "/admin"
                  ? pathname === "/admin"
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`p-3 rounded-lg transition font-medium ${
                    isActive
                      ? "bg-green-600"
                      : "hover:bg-white/10"
                  }`}
                >
                  {item.name}
                </Link>
              );
            })}

          </nav>
        </div>

        {/* ALT */}
        <div className="text-xs text-gray-500 mt-10">
          © {settings.site_title || "Villa Panel"}
        </div>

      </aside>

      {/* CONTENT */}
      <main className="flex-1 bg-zinc-900 p-6 md:p-10 overflow-auto">
        {children}
      </main>

    </div>
  );
}