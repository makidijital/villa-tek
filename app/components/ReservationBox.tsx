"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { DateRange } from "react-date-range";
import { tr } from "date-fns/locale";

export default function ReservationBox() {
    const [periods, setPeriods] = useState<any[]>([]);
    const [villaId, setVillaId] = useState<string | null>(null);

    const [fees, setFees] = useState({
        cleaning_fee: 0,
        deposit: 0,
        cleaning_threshold: 0,
    });

    const [range, setRange] = useState<any[]>([]);

    const [reservations, setReservations] = useState<any[]>([]);
    const [disabledDates, setDisabledDates] = useState<Date[]>([]);

    const [form, setForm] = useState({
        name: "",
        phone: "",
        email: "",
        identity: "",
        country: "",
        city: "",
        address: "",
        note: "",
        guests: "",
    });

    const [currency, setCurrency] = useState("TRY");

    const [rates, setRates] = useState<any>({
        TRY: 1,
        USD: 1,
        EUR: 1,
        GBP: 1,
    });

    const [totalPrice, setTotalPrice] = useState(0);
    const [cleaningFee, setCleaningFee] = useState(0);

    const [isMobile, setIsMobile] = useState<boolean | null>(null);

    const [prepaymentPercent, setPrepaymentPercent] = useState(0);

    const handleChange = (e: any) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const formatMoney = (price: number) => {
        const symbols: any = {
            TRY: "₺",
            EUR: "€",
            USD: "$",
            GBP: "£",
        };

        let value = price;

        if (currency !== "TRY") {
            value = price / rates[currency];
        }

        return `${symbols[currency]}${value.toLocaleString(undefined, {
            maximumFractionDigits: 0,
        })}`;
    };

    // 🔥 LOCAL FORMAT
    const formatDateLocal = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");

        return `${year}-${month}-${day}`;
    };

    const isBackToBackBlocked = (date: Date) => {
        const dateStr = formatDateLocal(date);

        const next = new Date(date);
        next.setDate(next.getDate() + 1);
        const nextStr = formatDateLocal(next);

        let isEnd = false;
        let nextIsStart = false;

        for (let r of reservations) {
            if (dateStr === r.end_date) {
                isEnd = true;
            }

            if (nextStr === r.start_date) {
                nextIsStart = true;
            }
        }

        return isEnd && nextIsStart;
    };

    const isDayBlocked = (date: Date) => {
        const dateStr = formatDateLocal(date);

        let hasStart = false;
        let hasEnd = false;
        let hasMiddle = false;

        for (let r of reservations) {
            if (dateStr >= r.start_date && dateStr <= r.end_date) {

                // 🟡 waiting + 🔴 approved + external hepsi dahil

                if (dateStr === r.start_date) hasStart = true;
                else if (dateStr === r.end_date) hasEnd = true;
                else hasMiddle = true;
            }
        }

        // ❌ full dolu gün
        if (hasMiddle) return true;

        // ❌ aynı gün birleşim (start + end)
        if (hasStart && hasEnd) return true;

        // ❌ ardışık birleşim (24 → 25 gibi)
        if (isBackToBackBlocked(date)) return true;

        return false;
    };

    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);

        setRange([
            {
                startDate: new Date(),
                endDate: new Date(),
                key: "selection",
            },
        ]);
    }, []);

    useEffect(() => {
        const saved = localStorage.getItem("currency");
        if (saved) setCurrency(saved);
    }, []);

    useEffect(() => {
        fetch("/api/rates")
            .then((res) => res.json())
            .then((data) => setRates(data));
    }, []);

    useEffect(() => {
        const updateCurrency = () => {
            const saved = localStorage.getItem("currency");
            if (saved) setCurrency(saved);
        };

        window.addEventListener("currencyChange", updateCurrency);

        return () => {
            window.removeEventListener("currencyChange", updateCurrency);
        };
    }, []);

    const getDateStatus = (dateStr: string) => {
        for (let r of reservations) {
            if (dateStr >= r.start_date && dateStr <= r.end_date) {

                // 🟡 BEKLİYOR
                if (r.status === "waiting") {
                    if (dateStr === r.start_date) return "waiting-start";
                    if (dateStr === r.end_date) return "waiting-end";
                    return "waiting";
                }

                // 🔴 ONAYLI
                if (r.status === "approved") {
                    if (dateStr === r.start_date) return "start";
                    if (dateStr === r.end_date) return "end";
                    return "middle";
                }
            }
        }

        return "free";
    };

    const getDayParts = (dateStr: string) => {
        let left: any = null;
        let right: any = null;
        let middle: any = null;

        for (let r of reservations) {
            if (dateStr >= r.start_date && dateStr <= r.end_date) {

                if (dateStr === r.start_date) right = r;
                else if (dateStr === r.end_date) left = r;
                else middle = r;
            }
        }

        return { left, right, middle };
    };

    const getColor = (r: any) => {
        if (!r) return "";

        if (r.status === "approved") return "bg-red-500";
        if (r.status === "waiting") return "bg-yellow-400";

        return "";
    };

    const checkin = range[0]?.startDate
        ? formatDateLocal(new Date(range[0].startDate))
        : "";

    const checkout = range[0]?.endDate
        ? formatDateLocal(new Date(range[0].endDate))
        : "";

    // 🔥 DATA ÇEK
    useEffect(() => {
        const getData = async () => {
            try {
                // 🔥 VILLA
                const { data: villa } = await supabase
                    .from("villa")
                    .select("id")
                    .limit(1);

                if (!villa || villa.length === 0) return;

                const vId = villa[0].id;
                setVillaId(vId);

                // 🔥 RESERVATIONS
                const { data: resData } = await supabase
                    .from("reservations")
                    .select("start_date, end_date, status")
                    .eq("villa_id", vId);

                const { data: extData } = await supabase
                    .from("external_reservations")
                    .select("start_date, end_date, source");

                const merged = [
                    ...(resData || []),

                    ...(extData || []).map((e: any) => ({
                        ...e,
                        status: "approved", // 🔥 external = dolu
                    })),
                ];

                setReservations(merged);

                // 🔥 DISABLED DATES (SADECE APPROVED)
                const disabled: Date[] = [];

                resData?.forEach((r) => {
                    let current = new Date(r.start_date);

                    while (current <= new Date(r.end_date)) {
                        const dateStr = formatDateLocal(current);

                        if (
                            dateStr !== r.start_date &&
                            dateStr !== r.end_date
                        ) {
                            disabled.push(new Date(current));
                        }

                        current.setDate(current.getDate() + 1);
                    }
                });

                setDisabledDates(disabled);

                // 🔥 PRICES
                const { data: priceData, error } = await supabase
                    .from("villa_prices")
                    .select("*")
                    .eq("villa_id", vId)
                    .order("start_date", { ascending: true });

                if (error) {
                    console.error("PRICE ERROR:", error);
                    return;
                }

                setPeriods(priceData || []);

                if (priceData && priceData.length > 0) {
                    setFees({
                        cleaning_fee: Number(priceData[0].cleaning_fee || 0),
                        deposit: Number(priceData[0].deposit || 0),
                        cleaning_threshold: Number(
                            priceData[0].cleaning_threshold || 0
                        ),
                    });
                }

                // 🔥 SETTINGS (ÖN ÖDEME %)
                const { data: settingsData } = await supabase
                    .from("settings")
                    .select("*");

                const settingsObj: any = {};
                settingsData?.forEach((item) => {
                    settingsObj[item.key] = item.value;
                });

                setPrepaymentPercent(
                    Number(settingsObj.prepayment_percent || 0)
                );

            } catch (err) {
                console.error("GENEL HATA:", err);
            }
        };

        getData();
    }, []);
    // 👇 BURAYA EKLE
    useEffect(() => {
        const checkScreen = () => {
            setIsMobile(window.innerWidth < 768);
        };

        checkScreen();
        window.addEventListener("resize", checkScreen);

        return () => window.removeEventListener("resize", checkScreen);
    }, []);

    // 🔥 GECE HESABI
    const nights = mounted && checkin && checkout
        ? Math.max(
            0,
            Math.ceil(
                (new Date(checkout).getTime() -
                    new Date(checkin).getTime()) /
                (1000 * 60 * 60 * 24)
            )
        )
        : 0;
    const prepaymentAmount =
        totalPrice > 0
            ? (totalPrice * prepaymentPercent) / 100
            : 0;

    // 🔥 TARİHE GÖRE FİYAT
    const getPriceForDate = (date: string) => {
        return periods.find(
            (p) => date >= p.start_date && date <= p.end_date
        );
    };

    useEffect(() => {
        if (!checkin || !checkout) {
            setTotalPrice(0);
            setCleaningFee(0);
            return;
        }

        let total = 0;
        let cleaning = 0;

        let current = new Date(checkin);

        for (let i = 0; i < nights; i++) {
            const dateStr = formatDateLocal(current);

            const period = periods.find(
                (p) => dateStr >= p.start_date && dateStr <= p.end_date
            );

            if (period) {
                total += Number(period.price || 0);
            }

            current.setDate(current.getDate() + 1);
        }

        // 🔥 TEMİZLİK
        if (
            fees.cleaning_threshold === 0 ||
            nights < fees.cleaning_threshold
        ) {
            cleaning = fees.cleaning_fee;
            total += cleaning;
        }

        setTotalPrice(total);
        setCleaningFee(cleaning);

    }, [range, periods, fees]);

    const createReservation = async () => {
        // ❌ villa yok
        if (!villaId) {
            alert("Villa bulunamadı ❌");
            return;
        }

        // ❌ tarih yok
        if (!checkin || !checkout) {
            alert("Tarih seç ❌");
            return;
        }

        // ❌ zorunlu alanlar
        if (
            !form.name ||
            !form.phone ||
            !form.email ||
            !form.identity ||
            !form.country ||
            !form.city ||
            !form.address
        ) {
            alert("Lütfen tüm zorunlu alanları doldurun ❌");
            return;
        }

        // ❌ telefon kontrol
        if (form.phone.length < 10) {
            alert("Telefon numarası geçersiz ❌");
            return;
        }

        // ❌ email kontrol
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(form.email)) {
            alert("E-posta geçersiz ❌");
            return;
        }

        // 🔥 ÇAKIŞMA KONTROLÜ (ÖNCE!)
        const conflict = reservations.some((r: any) => {
            const status = r.status?.toLowerCase().trim();

            if (status !== "approved") return false;

            return (
                checkin < r.end_date &&
                checkout > r.start_date
            );
        });

        if (conflict) {
            alert("Bu tarihler dolu ❌");
            return;
        }

        // 🔥 DB INSERT
        const { error } = await supabase.from("reservations").insert([
            {
                villa_id: villaId,
                start_date: checkin,
                end_date: checkout,
                total_price: totalPrice,
                cleaning_fee: cleaningFee,

                // 🔥 BURAYI EKLE
                prepayment_amount: prepaymentAmount,

                status: "waiting",

                name: form.name,
                phone: form.phone,
                email: form.email,
                identity: form.identity,
                country: form.country,
                city: form.city,
                address: form.address,
                note: form.note,
                guests: form.guests,
            },
        ]);

        // ❌ GERÇEK HATA MESAJI
        if (error) {
            console.error("SUPABASE ERROR:", error);
            alert(error.message); // 🔥 GERÇEK HATA
            return;
        }

        // ✅ başarı
        alert("Talebiniz alındı ✅");

        // 🔄 form temizle
        setForm({
            name: "",
            phone: "",
            email: "",
            identity: "",
            country: "",
            city: "",
            address: "",
            note: "",
            guests: "",
        });

    };

    return (
        <div className="grid lg:grid-cols-[1fr_1.4fr] gap-6">

            {/* 🔥 SOL → FORM */}
            <div className="bg-zinc-900 p-4 md:p-6 rounded-2xl space-y-5 w-full">

                <h2 className="text-2xl font-bold text-white">
                    Rezervasyon Yap
                </h2>

                {/* BİLGİ */}
                <div className="text-gray-400 text-sm space-y-1">
                    {nights > 0 && <p>{nights} gece</p>}

                    {nights > 0 && (
                        fees.cleaning_threshold > 0 &&
                            nights >= fees.cleaning_threshold ? (
                            <p className="text-green-400">
                                Temizlik ücretsiz 🎉
                            </p>
                        ) : (
                            <p>
                                Temizlik: {formatMoney(cleaningFee)}
                            </p>
                        )
                    )}

                    <p>Depozito: {formatMoney(fees.deposit)} (dahil değil)</p>

                    {/* 🔥 YENİ EKLEDİK */}
                    {nights > 0 && (
                        <p className="text-yellow-400">
                            Ön ödeme (%{prepaymentPercent}): {formatMoney(prepaymentAmount)}
                        </p>
                    )}
                </div>

                {/* TOPLAM */}
                <div className="text-3xl font-bold text-green-400">
                    {formatMoney(nights > 0 ? totalPrice : 0)}
                </div>

                {/* 🔥 YENİ (EN ÖNEMLİ GÖRÜNEN YER) */}
                {nights > 0 && (
                    <div className="text-lg text-white">
                        Şimdi ödenecek:{" "}
                        <span className="text-green-400 font-bold">
                            {formatMoney(prepaymentAmount)}
                        </span>
                    </div>
                )}

                <div className="bg-zinc-800 p-4 rounded-xl space-y-3">

                    <input name="name" placeholder="Ad Soyad"
                        value={form.name} onChange={handleChange}
                        className="w-full p-2 rounded bg-zinc-900 text-white" />

                    <input name="phone" placeholder="Telefon"
                        value={form.phone} onChange={handleChange}
                        className="w-full p-2 rounded bg-zinc-900 text-white" />

                    <input name="email" placeholder="E-posta"
                        value={form.email} onChange={handleChange}
                        className="w-full p-2 rounded bg-zinc-900 text-white" />

                    <input name="identity" placeholder="TC Kimlik / Pasaport"
                        value={form.identity} onChange={handleChange}
                        className="w-full p-2 rounded bg-zinc-900 text-white" />

                    <input name="country" placeholder="Ülke"
                        value={form.country} onChange={handleChange}
                        className="w-full p-2 rounded bg-zinc-900 text-white" />

                    <input name="city" placeholder="Şehir"
                        value={form.city} onChange={handleChange}
                        className="w-full p-2 rounded bg-zinc-900 text-white" />

                    <input name="address" placeholder="Adres"
                        value={form.address} onChange={handleChange}
                        className="w-full p-2 rounded bg-zinc-900 text-white" />

                    <textarea name="note" placeholder="Not"
                        value={form.note} onChange={handleChange}
                        className="w-full p-2 rounded bg-zinc-900 text-white" />

                    <textarea name="guests" placeholder="Diğer Misafirler (isimler)"
                        value={form.guests} onChange={handleChange}
                        className="w-full p-2 rounded bg-zinc-900 text-white" />

                    {mounted && (
                        <button
                            disabled={nights === 0}
                            onClick={createReservation}
                            className={`w-full p-3 rounded-lg font-semibold ${nights === 0
                                ? "bg-gray-600 cursor-not-allowed"
                                : "bg-green-600"
                                }`}
                        >
                            Talep Gönder
                        </button>
                    )}

                </div>
            </div>

            {/* 🔥 SAĞ → TAKVİM */}
            <div className="bg-zinc-900 p-6 rounded-2xl space-y-5">

                <h2 className="text-2xl font-bold text-white">
                    Tarih Seç
                </h2>

                <div className="bg-zinc-800 p-2 md:p-4 rounded-xl flex justify-center">

                    {/* 🔥 WRAPPER (EN KRİTİK) */}
                    <div className="w-full max-w-[720px]">

                        {mounted && (
                            <DateRange
                                editableDateInputs={true}

                                onChange={(item: any) => {
                                    const start = item.selection.startDate;
                                    const end = item.selection.endDate;

                                    if (!start || !end) return;

                                    let current = new Date(start);
                                    let blocked = false;

                                    while (current <= end) {
                                        if (isDayBlocked(current)) {
                                            blocked = true;
                                            break;
                                        }
                                        current.setDate(current.getDate() + 1);
                                    }

                                    if (blocked) {
                                        // ❌ seçimi iptal et (hiç güncelleme)
                                        return;
                                    }

                                    // ✅ temiz seçim
                                    setRange([item.selection]);
                                }}

                                moveRangeOnFirstSelection={false}
                                ranges={range}

                                months={isMobile === null ? 1 : isMobile ? 1 : 4}
                                direction="horizontal"

                                locale={tr}
                                rangeColors={["#22c55e"]}
                                disabledDates={disabledDates}
                                disabledDay={(date) => isDayBlocked(date)}

                                dayContentRenderer={(date: Date) => {
                                    const dateStr = formatDateLocal(date);

                                    const period = periods.find(
                                        (p) => dateStr >= p.start_date && dateStr <= p.end_date
                                    );

                                    // 🔥 SPLIT LOGIC
                                    let left: any = null;
                                    let right: any = null;
                                    let middle: any = null;

                                    for (let r of reservations) {
                                        if (dateStr >= r.start_date && dateStr <= r.end_date) {

                                            if (dateStr === r.start_date) right = r;
                                            else if (dateStr === r.end_date) left = r;
                                            else middle = r;
                                        }
                                    }

                                    // 🔥 COLOR
                                    const getColor = (r: any) => {
                                        if (!r) return "";
                                        if (r.status === "approved") return "bg-red-500";
                                        if (r.status === "waiting") return "bg-yellow-400";
                                        return "";
                                    };

                                    return (
                                        <div className="relative flex flex-col items-center justify-center text-xs w-full h-full">

                                            {/* FULL */}
                                            {middle && (
                                                <div className={`absolute inset-0 ${getColor(middle)}`} />
                                            )}

                                            {/* SOL */}
                                            {left && (
                                                <div className={`absolute left-0 top-0 h-full w-1/2 ${getColor(left)}`} />
                                            )}

                                            {/* SAĞ */}
                                            {right && (
                                                <div className={`absolute right-0 top-0 h-full w-1/2 ${getColor(right)}`} />
                                            )}

                                            {/* GÜN */}
                                            <div className="relative z-10 font-semibold text-black">
                                                {date.getDate()}
                                            </div>

                                            {/* LABEL */}
                                            {middle && (
                                                <div className="relative z-10 text-[10px] text-white">
                                                    {middle.status === "waiting" ? "Bekliyor" : "Dolu"}
                                                </div>
                                            )}

                                            {/* 💰 FİYAT */}
                                            {!middle && !left && !right && period && (
                                                <div className="relative z-10 text-[10px] text-gray-400 font-semibold">
                                                    {formatMoney(Number(period.price))}
                                                </div>
                                            )}
                                        </div>
                                    );
                                }} />
                        )}

                    </div>
                </div>
            </div>

        </div>
    );
}