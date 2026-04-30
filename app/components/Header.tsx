"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Menu, X } from "lucide-react";

export default function Header() {
  const [active, setActive] = useState("");
  const [logo, setLogo] = useState("");
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const menu = [
    { name: "Detaylar", id: "details" },
    { name: "Fiyatlar", id: "price" },
    { name: "Rezervasyon", id: "reservation" },
    { name: "Yorumlar", id: "reviews" },
    { name: "İletişim", id: "contact" },
  ];

  // 🔥 LOGO
  useEffect(() => {
    const getLogo = async () => {
      const { data } = await supabase.from("settings").select("*");

      const obj: any = {};
      data?.forEach((item) => {
        obj[item.key] = item.value;
      });

      setLogo(obj.logo_url || "");
    };

    getLogo();
  }, []);

  // 🔥 SCROLL EFFECT (header koyulaşır)
  useEffect(() => {
    const handle = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handle);
    return () => window.removeEventListener("scroll", handle);
  }, []);

  // 🔥 ACTIVE MENU
  useEffect(() => {
    const handleScroll = () => {
      menu.forEach((item) => {
        const el = document.getElementById(item.id);
        if (!el) return;

        const rect = el.getBoundingClientRect();
        if (rect.top <= 120 && rect.bottom >= 120) {
          setActive(item.id);
        }
      });
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    setOpen(false);
    document.getElementById(id)?.scrollIntoView({
      behavior: "smooth",
    });
  };

  return (
    <>
      {/* HEADER */}
      <header
        className={`fixed top-0 w-full z-50 transition-all duration-300 
        ${
          scrolled
            ? "bg-black/90 backdrop-blur border-b border-white/10"
            : "bg-black/40 backdrop-blur"
        }`}
      >
        <div className="max-w-6xl mx-auto flex justify-between items-center px-4 sm:px-6 py-3">

          {/* LOGO */}
          <div
            onClick={() => scrollToSection("details")}
            className="cursor-pointer flex items-center"
          >
            {logo ? (
              <div className="bg-black/60 px-3 py-1 rounded-lg backdrop-blur">
                <img
                  src={logo}
                  className="h-8 sm:h-10 object-contain drop-shadow-[0_2px_6px_rgba(0,0,0,0.8)]"
                  alt="logo"
                />
              </div>
            ) : (
              <span className="text-white font-bold text-lg">
                Villa
              </span>
            )}
          </div>

          {/* DESKTOP MENU */}
          <nav className="hidden md:flex gap-8 text-sm">
            {menu.map((item) => (
              <button
                key={item.id}
                onClick={() => scrollToSection(item.id)}
                className={`transition ${
                  active === item.id
                    ? "text-red-400"
                    : "text-white/80 hover:text-red-400"
                }`}
              >
                {item.name}
              </button>
            ))}
          </nav>

          {/* MOBILE BUTTON */}
          <button
            onClick={() => setOpen(!open)}
            className="md:hidden text-white"
          >
            {open ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </header>

      {/* MOBILE MENU */}
      <div
        className={`fixed inset-0 z-40 bg-black/95 flex flex-col items-center justify-center gap-8 text-xl transition-all duration-300
        ${open ? "opacity-100 visible" : "opacity-0 invisible"}`}
      >
        {menu.map((item) => (
          <button
            key={item.id}
            onClick={() => scrollToSection(item.id)}
            className={`${
              active === item.id
                ? "text-red-400"
                : "text-white"
            }`}
          >
            {item.name}
          </button>
        ))}
      </div>
    </>
  );
}