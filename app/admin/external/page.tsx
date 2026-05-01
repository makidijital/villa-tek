"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { DateRange } from "react-date-range";
import { tr } from "date-fns/locale";

export default function ExternalPage() {

    const [reservations, setReservations] = useState<any>(new Map());

    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const [range, setRange] = useState<any[]>([
        {
            startDate: new Date(),
            endDate: new Date(),
            key: "selection",
        },
    ]);

    const [form, setForm] = useState({
        note: "",
    });

    const getAllData = async () => {
        // 🔴 NORMAL REZERVASYON
        const { data: res } = await supabase
            .from("reservations")
            .select("start_date, end_date, status");

        // 🟣 + 🟢 HARİCİLER
        const { data: ext } = await supabase
            .from("external_reservations")
            .select("start_date, end_date, source");

        // 🔥 NORMALIZE (EN KRİTİK KISIM)
        const normalizedRes = (res || []).map((r: any) => ({
            ...r,
            source: "internal", // 🔥 artık hepsinde source var
        }));

        const normalizedExt = (ext || []).map((e: any) => ({
            ...e,
            status: e.source === "manual" ? "manual" : "ical", // 🔥 ADMIN İLE AYNI
        }));

        const all = [...normalizedRes, ...normalizedExt];

        const map = new Map();

        all.forEach((r) => {

            // 🔥 BURAYA EKLE
            if (!r.status && r.source) {
                r.status = r.source;
            }

            let current = new Date(r.start_date);

            while (current <= new Date(r.end_date)) {
                const key = formatDB(current);

                if (!map.has(key)) map.set(key, []);
                map.get(key).push(r);

                current.setDate(current.getDate() + 1);
            }
        });

        setReservations(map);
    };

    useEffect(() => {
        const init = async () => {
            await getData();
            await getAllData();
        };

        init();
    }, []);

    const getDateMeta = (dateStr: string) => {
        const list = reservations.get(dateStr) || [];

        let left: any = null;   // çıkış
        let right: any = null;  // giriş
        let middle: any = null; // full

        for (let r of list) {

            if (dateStr === r.start_date && dateStr === r.end_date) {
                middle = r;
            }
            else if (dateStr === r.start_date) {
                right = r; // giriş
            }
            else if (dateStr === r.end_date) {
                left = r; // çıkış
            }
            else {
                middle = r;
            }
        }

        return { left, right, middle };
    };

    const isBlocked = (date: Date) => {
        const dateStr = formatDB(date);
        const meta = getDateMeta(dateStr);

        // 1️⃣ full dolu
        if (meta.middle && !meta.left && !meta.right) return true;

        // 2️⃣ aynı gün hem giriş hem çıkış varsa (kritik)
        if (meta.left && meta.right) return true;

        return false;
    };

    // 🔥 DATA
    const getData = async () => {
        setLoading(true);

        const { data, error } = await supabase
            .from("external_reservations")
            .select("*")
            .order("start_date", { ascending: true });

        if (error) console.error(error);

        setData(data || []);
        setLoading(false);
    };

    // 🔥 FORMAT
    const formatDB = (d: Date) =>
        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
            d.getDate()
        ).padStart(2, "0")}`;

    const formatDate = (date: string) =>
        new Date(date).toLocaleDateString("tr-TR", {
            day: "numeric",
            month: "long",
            year: "numeric",
        });

    // 🔥 EKLE
    const addManual = async () => {
        const start = range[0]?.startDate;
        const end = range[0]?.endDate;

        if (!start || !end) {
            alert("Tarih seç ❌");
            return;
        }

        const formatDB = (d: Date) =>
            `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
                d.getDate()
            ).padStart(2, "0")}`;

        const start_date = formatDB(start);
        const end_date = formatDB(end);

        if (start_date > end_date) {
            alert("Hatalı tarih ❌");
            return;
        }

        // 🔥 HASH OLUŞTUR (EN KRİTİK)
        const hash = `${start_date}_${end_date}`;

        // 🔥 TÜM BLOKLARI ÇEK
        const { data: external } = await supabase
            .from("external_reservations")
            .select("start_date, end_date");

        const { data: reservations } = await supabase
            .from("reservations")
            .select("start_date, end_date")
            .eq("status", "approved");

        const all = [...(external || []), ...(reservations || [])];

        // 🔥 ÇAKIŞMA
        const conflict = all.some((r: any) => {
            return (
                start_date < r.end_date &&
                end_date > r.start_date
            );
        });

        if (conflict) {
            alert("Bu tarih aralığı dolu ❌");
            return;
        }

        // 🔥 villa id al
        const { data: villa } = await supabase
            .from("villa")
            .select("id")
            .limit(1);

        const villaId = villa?.[0]?.id;

        if (!villaId) {
            alert("Villa bulunamadı ❌");
            return;
        }

        // 🔥 INSERT
        const { error } = await supabase
            .from("external_reservations")
            .insert([
                {
                    villa_id: villaId,
                    start_date,
                    end_date,
                    source: "manual",
                    note: form.note,
                    hash: hash, // 🔥 BURASI ÖNEMLİ
                },
            ]);

        if (error) {
            alert(error.message);
            return;
        }

        alert("Eklendi ✅");

        setForm({ note: "" });

        await getData();
        await getAllData();
    };

    // 🔥 SİL
    const deleteItem = async (id: string) => {
        const ok = confirm("Silmek istiyor musun?");
        if (!ok) return;

        await supabase
            .from("external_reservations")
            .delete()
            .eq("id", id);

        await getData();
        await getAllData(); // 🔥 EKLE
    };

    // 🔥 ICAL
    const syncIcal = async () => {
        setLoading(true);

        await fetch("/api/ical-import");

        await getData();
        await getAllData();

        setLoading(false); // 🔥 EKLE
    };

    return (
        <div className="space-y-8">

            {/* HEADER */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold">
                        Harici Rezervasyonlar
                    </h1>
                    <p className="text-gray-400 text-sm">
                        iCal + Manuel bloklar
                    </p>
                    <div className="flex gap-3 text-xs flex-wrap">

                        <div className="flex items-center gap-1">
                            <div className="w-3 h-3 bg-red-500 rounded-sm" />
                            <span className="text-gray-400">Onaylı</span>
                        </div>

                        <div className="flex items-center gap-1">
                            <div className="w-3 h-3 bg-yellow-400 rounded-sm" />
                            <span className="text-gray-400">Bekliyor</span>
                        </div>

                        <div className="flex items-center gap-1">
                            <div className="w-3 h-3 bg-blue-500 rounded-sm" />
                            <span className="text-gray-400">Manuel blok</span>
                        </div>

                        <div className="flex items-center gap-1">
                            <div className="w-3 h-3 bg-purple-500 rounded-sm" />
                            <span className="text-gray-400">iCal</span>
                        </div>

                    </div>
                </div>

                <button
                    onClick={syncIcal}
                    className="bg-green-600 px-4 py-2 rounded text-sm hover:bg-green-500 transition"
                >
                    iCal Senkronize Et
                </button>
            </div>

            {/* 🔥 TAKVİM + FORM */}
            <div className="bg-zinc-800 p-5 rounded-xl space-y-4">

                <h2 className="font-semibold text-lg">
                    Manuel Blok Ekle
                </h2>

                {/* TAKVİM */}
                <div className="bg-zinc-900 p-3 rounded-xl">
                    <DateRange
                        editableDateInputs={true}
                        onChange={(item: any) => {
                            setRange([item.selection]);
                        }}
                        moveRangeOnFirstSelection={false}
                        ranges={range}
                        months={2}
                        direction="horizontal"
                        locale={tr}
                        rangeColors={["#22c55e"]}
                        disabledDay={(date: Date) => isBlocked(date)}

                        dayContentRenderer={(date: Date) => {
                            const dateStr = formatDB(date);
                            const meta = getDateMeta(dateStr);

                            const getColor = (r: any) => {
                                if (!r) return "";

                                if (r.status === "approved") return "bg-red-500";
                                if (r.status === "waiting") return "bg-yellow-400";
                                if (r.status === "manual") return "bg-blue-500";
                                if (r.status === "ical") return "bg-purple-500";

                                return "";
                            };

                            return (
                                <div className="relative w-full h-full flex flex-col items-center justify-center text-xs">

                                    {/* SOL → çıkış */}
                                    {meta.left && (
                                        <div className={`absolute left-0 top-0 h-full w-1/2 ${getColor(meta.left)} rounded-l-md`} />
                                    )}

                                    {/* SAĞ → giriş */}
                                    {meta.right && (
                                        <div className={`absolute right-0 top-0 h-full w-1/2 ${getColor(meta.right)} rounded-r-md`} />
                                    )}

                                    {/* FULL */}
                                    {meta.middle && !meta.left && !meta.right && (
                                        <div className={`absolute inset-0 ${getColor(meta.middle)} rounded-md`} />
                                    )}

                                    {/* GÜN */}
                                    <span className="relative z-10 font-semibold text-black">
                                        {date.getDate()}
                                    </span>

                                    {/* 🔥 SADECE ORTA GÜNLER */}
                                    {meta.middle && (
                                        <div className="relative z-10 text-[10px] text-white">

                                            {meta.middle.status === "waiting" && "Bekliyor"}

                                            {meta.middle.status === "approved" && "Dolu"}

                                            {meta.middle.status === "manual" && "Dolu (Manuel)"}

                                            {meta.middle.status === "ical" && "Dolu (iCal)"}

                                        </div>
                                    )}

                                </div>
                            );
                        }}
                    />
                </div>

                {/* NOT */}
                <input
                    type="text"
                    name="note"
                    placeholder="Not (opsiyonel)"
                    value={form.note}
                    onChange={(e) =>
                        setForm({ ...form, note: e.target.value })
                    }
                    className="p-2 rounded bg-zinc-900 text-white w-full"
                />

                <button
                    onClick={addManual}
                    className="bg-green-600 px-4 py-2 rounded hover:bg-green-500 transition"
                >
                    Ekle
                </button>

            </div>

            {/* 🔥 LİSTE */}
            <div className="space-y-4">

                {loading && (
                    <p className="text-gray-400">Yükleniyor...</p>
                )}

                {!loading && data.length === 0 && (
                    <p className="text-gray-500">
                        Kayıt yok
                    </p>
                )}

                {data.map((item) => (
                    <div
                        key={item.id}
                        className="bg-zinc-800 p-5 rounded-xl border border-zinc-700 flex justify-between items-center"
                    >
                        {/* SOL */}
                        <div>
                            <p className="font-semibold text-white">
                                {formatDate(item.start_date)} → {formatDate(item.end_date)}
                            </p>

                            {item.note && (
                                <p className="text-xs text-gray-500 mt-1">
                                    {item.note}
                                </p>
                            )}
                        </div>

                        {/* SAĞ */}
                        <div className="text-right space-y-2">

                            <span
                                className={`px-3 py-1 text-xs rounded-full font-semibold ${item.source === "manual"
                                    ? "bg-blue-600"
                                    : "bg-purple-600"
                                    }`}
                            >
                                {item.source === "manual" ? "Manuel" : "iCal"}
                            </span>

                            <p className="text-xs text-gray-400">
                                {new Date(item.created_at).toLocaleDateString("tr-TR")}
                            </p>

                            <button
                                onClick={() => deleteItem(item.id)}
                                className="text-red-400 text-xs hover:underline"
                            >
                                Sil
                            </button>

                        </div>

                    </div>
                ))}

            </div>

        </div>
    );
}