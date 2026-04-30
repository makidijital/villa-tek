export const dynamic = "force-dynamic";
import Schema from "@/app/components/Schema";

import Header from "@/app/components/Header";
import Hero from "@/app/components/Hero";
import Details from "@/app/components/Details";
import Price from "@/app/components/Price";
import ReservationBox from "@/app/components/ReservationBox";
import Reviews from "@/app/components/Reviews";
import AddReview from "@/app/components/AddReview";
import ContactBox from "@/app/components/ContactBox";

import { createClient } from "@supabase/supabase-js";

// 🔥 SERVER CLIENT
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// 🔥 SETTINGS ÇEK
async function getSettings() {
  const { data } = await supabase.from("settings").select("*");

  const obj: any = {};
  data?.forEach((item) => {
    obj[item.key] = item.value;
  });

  return obj;
}

export default async function Home() {
  const settings = await getSettings(); // 🔥 EN KRİTİK

  return (
    <>
      {/* 🔥 SEO SCHEMA */}
      <Schema settings={settings} />

      {/* HEADER */}
      <Header />

      {/* HERO */}
      <Hero />

      {/* DETAYLAR */}
      <section id="details" className="bg-black">
        <Details />
      </section>

      {/* FİYATLAR */}
      <section id="price" className="bg-zinc-950 py-24 px-6">
        <Price />
      </section>

      {/* REZERVASYON */}
      <section
        id="reservation"
        className="bg-zinc-900 py-24 px-6 text-white"
      >
        <div className="max-w-7xl mx-auto">
          <ReservationBox />
        </div>
      </section>

      {/* YORUMLAR */}
      <section
        id="reviews"
        className="bg-zinc-950 py-24 px-6 text-white"
      >
        <div className="max-w-4xl mx-auto space-y-10">
          <h2 className="text-4xl font-bold text-center">
            Yorumlar
          </h2>

          <AddReview />
          <Reviews />
        </div>
      </section>

      {/* İLETİŞİM */}
      <section
        id="contact"
        className="bg-zinc-900 py-24 px-6 text-white"
      >
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h2 className="text-4xl font-bold">
            İletişim
          </h2>

          <p className="text-gray-400">
            Bizimle hızlıca iletişime geçebilirsiniz
          </p>

          <div className="flex justify-center">
            <ContactBox />
          </div>
        </div>
      </section>
    </>
  );
}