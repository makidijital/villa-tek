"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  Phone,
  MessageCircle,
  Mail,
  MapPin,
} from "lucide-react";

export default function ContactBox() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const getData = async () => {
      const { data, error } = await supabase
        .from("contact")
        .select("*")
        .limit(1);

      if (!error && data && data.length > 0) {
        setData(data[0]);
      }
    };

    getData();
  }, []);

  if (!data) return null;

  return (
    <div className="bg-zinc-900 p-6 rounded-2xl space-y-4 border border-white/5">

      {/* TELEFON */}
      {data.phone && (
        <a
          href={`tel:${data.phone}`}
          className="flex items-center gap-3 bg-zinc-800 p-3 rounded-lg hover:bg-zinc-700 transition"
        >
          <Phone className="w-5 h-5 text-green-400" />
          <span>{data.phone}</span>
        </a>
      )}

      {/* WHATSAPP */}
      {data.whatsapp && (
        <a
          href={`https://wa.me/${data.whatsapp.replace(/\D/g, "")}`}
          target="_blank"
          className="flex items-center gap-3 bg-green-600 p-3 rounded-lg text-white hover:bg-green-500 transition"
        >
          <MessageCircle className="w-5 h-5" />
          <span>WhatsApp ile Yaz</span>
        </a>
      )}

      {/* EMAIL */}
      {data.email && (
        <a
          href={`mailto:${data.email}`}
          className="flex items-center gap-3 bg-zinc-800 p-3 rounded-lg hover:bg-zinc-700 transition"
        >
          <Mail className="w-5 h-5 text-blue-400" />
          <span>{data.email}</span>
        </a>
      )}

      {/* ADRES */}
      {data.address && (
        <div className="flex items-start gap-3 bg-zinc-800 p-3 rounded-lg text-gray-300">
          <MapPin className="w-5 h-5 text-red-400 mt-1" />
          <span>{data.address}</span>
        </div>
      )}

    </div>
  );
}