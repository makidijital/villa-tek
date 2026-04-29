"use client";

import { useEffect, useState } from "react";

export default function Header() {
  const [active, setActive] = useState<string>("");

  const menu = [
    { name: "Detaylar", id: "details" },
    { name: "Fiyatlar", id: "price" },
    { name: "Rezervasyon", id: "reservation" },
    { name: "Yorumlar", id: "reviews" },
    { name: "İletişim", id: "contact" },
  ];

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      menu.forEach((item) => {
        const el = document.getElementById(item.id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 100 && rect.bottom >= 100) {
            setActive(item.id);
          }
        }
      });
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className="fixed top-0 w-full z-50 bg-black/60 backdrop-blur border-b border-white/10">
      <div className="max-w-6xl mx-auto flex justify-between items-center px-6 py-4">

        <div
          onClick={() => scrollToSection("details")}
          className="text-xl font-bold tracking-wider cursor-pointer"
        >
          VILLA
        </div>

        <nav className="flex gap-8 text-sm">
          {menu.map((item) => (
            <button
              key={item.id}
              onClick={() => scrollToSection(item.id)}
              className={`transition ${
                active === item.id
                  ? "text-green-400"
                  : "hover:text-green-400"
              }`}
            >
              {item.name}
            </button>
          ))}
        </nav>

      </div>
    </header>
  );
}