"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const isLoginPage = pathname.startsWith("/admin/login");

  const [settings, setSettings] = useState<any>({});
  const [loading, setLoading] = useState(!isLoginPage);

  // 🔐 AUTH + ADMIN CHECK
  useEffect(() => {
    if (isLoginPage) return;

    const checkUser = async () => {
      const { data } = await supabase.auth.getSession();
      const user = data.session?.user;

      if (!user) {
        router.replace("/admin/login");
        return;
      }

      const { data: admin } = await supabase
        .from("admins")
        .select("email")
        .eq("email", user.email)
        .maybeSingle(); // 🔥 single yerine bu

      if (!admin) {
        router.replace("/");
        return;
      }

      setLoading(false);
    };

    checkUser();

    // 🔥 auth değişirse tekrar kontrol et
    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      checkUser();
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, [isLoginPage, router]);

  // ⚙️ SETTINGS
  useEffect(() => {
    if (isLoginPage) return;

    const getSettings = async () => {
      const { data } = await supabase.from("settings").select("*");

      const obj: any = {};
      data?.forEach((item) => {
        obj[item.key] = item.value;
      });

      setSettings(obj);
    };

    getSettings();
  }, [isLoginPage]);

  // ⏳ INACTIVITY TIMEOUT
  useEffect(() => {
    if (isLoginPage) return;

    let timeout: NodeJS.Timeout;

    const logout = async () => {
      await supabase.auth.signOut();
      router.replace("/admin/login");
    };

    const resetTimer = () => {
      clearTimeout(timeout);

      timeout = setTimeout(() => {
        logout();
      }, 1000 * 60 * 30);
    };

    const events = ["mousemove", "keydown", "click", "scroll"];

    events.forEach((event) => {
      window.addEventListener(event, resetTimer);
    });

    resetTimer();

    return () => {
      clearTimeout(timeout);
      events.forEach((event) => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, [isLoginPage, router]);

  // 🔥 LOGIN PAGE
  if (isLoginPage) {
    return <>{children}</>;
  }

  // 🔥 LOADING UI (boş ekran yerine)
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black text-white">
        <div className="animate-pulse text-sm text-gray-400">
          Yükleniyor...
        </div>
      </div>
    );
  }

  const menu = [
    { name: "Dashboard", href: "/admin" },
    { name: "Villa", href: "/admin/villa" },
    { name: "Rezervasyon", href: "/admin/rezervasyon" },
    { name: "Harici Rezervasyonlar", href: "/admin/external" },
    { name: "Yorumlar", href: "/admin/reviews" },
    { name: "İletişim", href: "/admin/contact" },
    { name: "Genel Ayarlar", href: "/admin/settings" },
    { name: "Kullanıcılar", href: "/admin/admins" }, // 🔥 EKLEDİK
  ];

  return (
    <div className="flex min-h-screen bg-black text-white">
      {/* SIDEBAR */}
      <aside className="w-64 bg-black border-r border-white/10 p-6 flex flex-col justify-between">
        <div>
          <div className="mb-8">
            {settings.logo_url ? (
              <img src={settings.logo_url} className="h-10 object-contain" />
            ) : (
              <h2 className="text-lg font-bold">
                {settings.site_title || "Villa Panel"}
              </h2>
            )}
          </div>

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
                    isActive ? "bg-green-600" : "hover:bg-white/10"
                  }`}
                >
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="space-y-3">
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              router.replace("/admin/login");
            }}
            className="w-full bg-red-600 hover:bg-red-500 transition p-2 rounded-lg text-sm"
          >
            Çıkış Yap
          </button>

          <div className="text-xs text-gray-500">
            © {settings.site_title || "Villa Panel"}
          </div>
        </div>
      </aside>

      {/* CONTENT */}
      <main className="flex-1 bg-zinc-900 p-6 md:p-10 overflow-auto">
        {children}
      </main>
    </div>
  );
}