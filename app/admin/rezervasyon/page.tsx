"use client";

import { CreditCard, CheckCircle, XCircle, Trash2, Calendar } from "lucide-react";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { DateRange } from "react-date-range";
import { tr } from "date-fns/locale";

export default function AdminReservationPage() {
    const [reservations, setReservations] = useState<any[]>([]);
    const [calendarReservations, setCalendarReservations] = useState<any[]>([]);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [loadingId, setLoadingId] = useState<string | null>(null);

    const [periods, setPeriods] = useState<any[]>([]); // 🔥 EKLENDİ
    const [fees, setFees] = useState({
        cleaning_fee: 0,
        cleaning_threshold: 0,
    }); // 🔥 EKLENDİ

    const [manualPrice, setManualPrice] = useState<number | null>(null);

    const [prepaymentPercent, setPrepaymentPercent] = useState(0);

    const [prepaymentOverride, setPrepaymentOverride] = useState<number | null>(null);

    const [editRange, setEditRange] = useState<any>([
        {
            startDate: new Date(),
            endDate: new Date(),
            key: "selection",
        },
    ]);

    // ✅ TARİH FORMAT
    const formatDateLocal = (date: Date) => {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, "0");
        const d = String(date.getDate()).padStart(2, "0");
        return `${y}-${m}-${d}`;
    };

    // ✅ TAKVİM STATUS
    const getDateStatus = (dateStr: string) => {
        for (let r of calendarReservations) {
            if (dateStr >= r.start_date && dateStr <= r.end_date) {

                if (r.id === editingId) return "free";

                if (r.status === "waiting") {
                    if (dateStr === r.start_date) return "waiting-start";
                    if (dateStr === r.end_date) return "waiting-end";
                    return "waiting";
                }

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

       for (let r of calendarReservations) {
            if (r.id === editingId) continue;

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
        if (r.status === "manual") return "bg-blue-500";
        if (r.status === "ical") return "bg-purple-500";

        return "";
    };

    // ✅ DATA ÇEK
    const getReservations = async () => {

        const { data: res } = await supabase
            .from("reservations")
            .select("*");

        const { data: ext } = await supabase
            .from("external_reservations")
            .select("*");

        // 🔥 external normalize
        const externalNormalized = (ext || []).map((e: any) => ({
            ...e,
            status: e.source === "manual" ? "manual" : "ical",
            id: `ext-${e.id}`,
        }));

        // ✅ LİSTE (SADECE GERÇEK)
        setReservations(res || []);

        // ✅ TAKVİM (HER ŞEY)
        setCalendarReservations([
            ...(res || []),
            ...externalNormalized,
        ]);
    };
    const isDayDisabled = (date: Date) => {
        const dateStr = formatDateLocal(date);

        const { left, right, middle } = getDayParts(dateStr);

        // ❌ FULL dolu günler
        if (middle) return true;

        // ❌ iki rezervasyon birleşmiş (yarım yarım)
        if (left && right) return true;

        // ✅ sadece tek taraf doluysa (giriş/çıkış) izin ver
        return false;
    };

    // 🔥 FİYAT ÇEK
    const getPrices = async () => {
        const { data } = await supabase
            .from("villa_prices")
            .select("*")
            .order("start_date", { ascending: true });

        setPeriods(data || []);

        if (data && data.length > 0) {
            setFees({
                cleaning_fee: Number(data[0].cleaning_fee || 0),
                cleaning_threshold: Number(data[0].cleaning_threshold || 0),
            });
        }
    };

    const getSettings = async () => {
        const { data } = await supabase.from("settings").select("*");

        const obj: any = {};
        data?.forEach((item) => {
            obj[item.key] = item.value;
        });

        setPrepaymentPercent(Number(obj.prepayment_percent || 0));
    };

    useEffect(() => {
        getReservations();
        getPrices();
        getSettings(); // 🔥 EKLEDİK
    }, []);

    // ✅ ONAYLA
    const approve = async (reservation: any) => {

        // 🔒 ÖDEME KONTROLÜ
        if (!Boolean(reservation.prepayment_paid)) {
            alert("Ön ödeme alınmadan onay verilemez ❌");
            return;
        }

        setLoadingId(reservation.id);

        try {
            const start = reservation.start_date;
            const end = reservation.end_date;

            // 1️⃣ SEÇİLENİ APPROVED YAP
            const { error: approveError } = await supabase
                .from("reservations")
                .update({ status: "approved" })
                .eq("id", reservation.id);

            if (approveError) {
                console.error(approveError);
                alert("Onaylama hatası ❌");
                setLoadingId(null);
                return;
            }

            // 2️⃣ ÇAKIŞAN WAITING'LERİ İPTAL ET
            const { error: cancelError } = await supabase
                .from("reservations")
                .update({ status: "cancelled" })
                .neq("id", reservation.id)
                .eq("status", "waiting")
                .lt("start_date", end)
                .gt("end_date", start);

            if (cancelError) {
                console.error(cancelError);
                alert("Çakışan rezervasyonlar iptal edilemedi ❌");
            }

            // 🔄 YENİLE
            getReservations();

        } catch (err) {
            console.error("GENEL HATA:", err);
            alert("Bir hata oluştu ❌");
        }

        setLoadingId(null);
    };

    // ❌ REDDET
    const reject = async (id: string) => {
        setLoadingId(id);

        await supabase
            .from("reservations")
            .update({ status: "cancelled" })
            .eq("id", id);

        setLoadingId(null);
        getReservations();
    };

    const deleteReservation = async (id: string) => {
        const confirmDelete = confirm("Bu rezervasyonu silmek istediğine emin misin?");

        if (!confirmDelete) return;

        setLoadingId(id);

        await supabase
            .from("reservations")
            .delete()
            .eq("id", id);

        setLoadingId(null);
        getReservations();
    };

    // 🔥 TARİH + FİYAT GÜNCELLE
    const updateDates = async (id: string) => {
        const start = editRange[0].startDate;
        const end = editRange[0].endDate;

        if (!start || !end) {
            alert("Tarih seç ❌");
            return;
        }

        const startStr = formatDateLocal(start);
        const endStr = formatDateLocal(end);

        if (startStr > endStr) {
            alert("Hatalı tarih ❌");
            return;
        }

        // 🔥 ÇAKIŞMA
        const { data: conflicts } = await supabase
            .from("reservations")
            .select("*")
            .eq("status", "approved");

        const hasConflict = conflicts?.some((r: any) => {
            if (r.id === id) return false;
            return !(endStr <= r.start_date || startStr >= r.end_date);
        });

        if (hasConflict) {
            alert("Çakışan rezervasyon var ❌");
            return;
        }

        // 🔥 GECE
        const nights = Math.max(
            0,
            Math.ceil(
                (new Date(endStr).getTime() - new Date(startStr).getTime()) /
                (1000 * 60 * 60 * 24)
            )
        );

        // 🔥 FİYAT BUL
        const getPriceForDate = (date: string) => {
            return periods.find(
                (p) => date >= p.start_date && date <= p.end_date
            );
        };

        let totalPrice = 0;
        let cleaningFee = 0;

        if (nights > 0) {
            let current = new Date(startStr);

            for (let i = 0; i < nights; i++) {
                const dateStr = formatDateLocal(current);
                const period = getPriceForDate(dateStr);

                if (period) {
                    totalPrice += Number(period.price || 0);
                }

                current.setDate(current.getDate() + 1);
            }

            // 🔥 TEMİZLİK
            if (
                fees.cleaning_threshold === 0 ||
                nights < fees.cleaning_threshold
            ) {
                cleaningFee = fees.cleaning_fee;
                totalPrice += cleaningFee;
            }
        }

        // 🔥 MANUEL FİYAT OVERRIDE
        let finalPrice = totalPrice;

        if (manualPrice && manualPrice > 0) {
            finalPrice = manualPrice;
            cleaningFee = 0;
        }

        // ✅ 🔥 ÖN ÖDEME HESABI (EKLEDİK)
        const percent = prepaymentOverride ?? prepaymentPercent ?? 0;
        const prepaymentAmount = Math.round((finalPrice * percent) / 100);

        setLoadingId(id);

        // ✅ 🔥 DB UPDATE (KRİTİK)
        const { error } = await supabase
            .from("reservations")
            .update({
                start_date: startStr,
                end_date: endStr,
                total_price: finalPrice,
                cleaning_fee: cleaningFee,
                prepayment_amount: prepaymentAmount,
                prepayment_override: prepaymentOverride, // 🔥 EKLE
            })
            .eq("id", id);

        if (error) {
            console.error(error);
            alert("Güncelleme hatası ❌");
        }

        setLoadingId(null);
        setEditingId(null);
        getReservations();
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-white">Rezervasyonlar</h1>

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

            {reservations.map((r) => {

                // 🔥 external kontrol (YENİ EKLENDİ)
                const isExternal = r.status === "manual" || r.status === "ical";

                // 🔥 CANLI FİYAT HESAP
                let previewTotal = r.total_price;
                let previewCleaning = r.cleaning_fee;

                const percent = r.prepayment_override ?? prepaymentPercent ?? 0;
                let previewPrepayment = Math.round((previewTotal * percent) / 100);

                // 🔥 EDIT MODU HESAPLAMA
                if (editingId === r.id && !isExternal) {
                    const start = editRange[0]?.startDate;
                    const end = editRange[0]?.endDate;

                    const percent = prepaymentOverride ?? prepaymentPercent ?? 0;

                    previewPrepayment = Math.round((previewTotal * percent) / 100);

                    if (start && end) {
                        const startStr = formatDateLocal(start);
                        const endStr = formatDateLocal(end);

                        const nights = Math.max(
                            0,
                            Math.ceil(
                                (new Date(endStr).getTime() - new Date(startStr).getTime()) /
                                (1000 * 60 * 60 * 24)
                            )
                        );

                        let total = 0;
                        let cleaning = 0;

                        let current = new Date(startStr);

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

                        if (
                            fees.cleaning_threshold === 0 ||
                            nights < fees.cleaning_threshold
                        ) {
                            cleaning = fees.cleaning_fee;
                            total += cleaning;
                        }

                        if (manualPrice && manualPrice > 0) {
                            previewTotal = manualPrice;
                            previewCleaning = 0;
                        } else {
                            previewTotal = total;
                            previewCleaning = cleaning;
                        }
                    }
                }

                const status = r.status?.toLowerCase().trim();

                const isPaid = Boolean(r.prepayment_paid);
                const isApproved = status === "approved";

                const canApprove = isPaid && !isApproved && !isExternal;
                const canReject = !isPaid && !isApproved && !isExternal;

                return (
                    <div
                        key={r.id}
                        className={`bg-zinc-900 border rounded-2xl overflow-hidden shadow-lg transition-all
    ${r.prepayment_paid
                                ? "border-green-500/40 shadow-green-500/20"
                                : "border-zinc-700 hover:border-zinc-500"}
`}>

                        {/* TOP */}
                        <div className="flex justify-between items-start p-5 border-b border-zinc-800">

                            {/* SOL */}
                            <div>
                                <h2 className="text-xl font-bold text-white">{r.name}</h2>

                                <span className="flex items-center gap-2 text-gray-300 text-sm">
                                    <Calendar size={16} className="text-green-400" />
                                    {r.start_date} → {r.end_date}
                                </span>
                            </div>

                            {/* SAĞ */}
                            <div className="text-right">

                                {/* STATUS */}
                                <span
                                    className={`px-3 py-1 text-xs rounded-full font-semibold
    ${r.status === "approved" && "bg-green-600 text-white"}
    ${r.status === "waiting" && `bg-yellow-400 text-black ${!r.prepayment_paid ? "animate-pulse" : ""}`}
    ${r.status === "cancelled" && "bg-red-600 text-white"}`}
                                >
                                    {r.status === "waiting" && "Bekliyor"}
                                    {r.status === "approved" && "Onaylandı"}
                                    {r.status === "cancelled" && "Reddedildi"}
                                </span>

                                {/* 🔥 HESAPLAR */}
                                {(() => {
                                    const percent = r.prepayment_override ?? prepaymentPercent ?? 0;

                                    const safeTotal = previewTotal || 0;
                                    const previewPrepayment = Math.round((safeTotal * percent) / 100);

                                    const remainingAmount = Math.max(
                                        0,
                                        safeTotal - previewPrepayment
                                    );

                                    return (
                                        <>
                                            {/* TOPLAM */}
                                            <p className="text-green-400 text-2xl font-bold mt-2">
                                                ₺{safeTotal}
                                            </p>

                                            {/* MINI FINANCE CARDS */}
                                            <div className="grid grid-cols-2 gap-2 mt-3">

                                                {/* ÖN ÖDEME */}
                                                <div className="bg-zinc-800 px-3 py-2 rounded-xl">
                                                    <p className="text-[10px] text-gray-400">Ön ödeme</p>
                                                    <p className="text-yellow-400 font-bold text-sm">
                                                        ₺{previewPrepayment}
                                                    </p>
                                                    <p className="text-[10px] text-gray-500">
                                                        %{percent} {r.prepayment_override ? "Özel" : "Genel"}
                                                    </p>
                                                </div>

                                                {/* KALAN */}
                                                <div className="bg-zinc-800 px-3 py-2 rounded-xl">
                                                    <p className="text-[10px] text-gray-400">Kalan</p>
                                                    <p className="text-white font-bold text-sm">
                                                        ₺{remainingAmount}
                                                    </p>
                                                </div>

                                            </div>

                                            {/* TEMİZLİK */}
                                            <p className="text-xs mt-2">
                                                Temizlik:
                                                <span
                                                    className={`ml-1 font-semibold ${previewCleaning > 0
                                                        ? "text-yellow-400"
                                                        : "text-green-400"
                                                        }`}
                                                >
                                                    {previewCleaning > 0
                                                        ? `₺${previewCleaning}`
                                                        : "Ücretsiz"}
                                                </span>
                                            </p>

                                            {/* MANUEL */}
                                            {manualPrice && editingId === r.id && (
                                                <span className="inline-block mt-2 px-2 py-1 text-xs rounded-full bg-blue-500/20 text-blue-400">
                                                    Manuel fiyat aktif
                                                </span>
                                            )}
                                        </>
                                    );
                                })()}

                            </div>
                        </div>

                        {/* TARİH */}
                        <div className="px-5 py-4 border-b border-zinc-800">

                            {editingId === r.id ? (
                                <div className="bg-zinc-800/80 backdrop-blur p-4 rounded-2xl mt-2 border border-zinc-700">

                                    {/* HEADER */}
                                    <div className="flex justify-between items-center mb-3">
                                        <p className="text-sm text-gray-300 font-semibold">
                                            Tarih & Fiyat Düzenle
                                        </p>

                                        <span className="text-xs text-gray-500">
                                            {r.start_date} → {r.end_date}
                                        </span>
                                    </div>

                                    {/* TAKVİM */}
                                    <DateRange
                                        ranges={editRange}
                                        onChange={(item: any) => setEditRange([item.selection])}
                                        months={2}
                                        direction="horizontal"
                                        locale={tr}
                                        rangeColors={["#22c55e"]}
                                        disabledDay={(date) => isDayDisabled(date)}

                                        dayContentRenderer={(date: Date) => {
                                            const dateStr = formatDateLocal(date);

                                            const { left, right, middle } = getDayParts(dateStr);

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

                                                            {middle.status === "waiting" && "Bekliyor"}

                                                            {middle.status === "approved" && "Dolu"}

                                                            {middle.status === "manual" && "Dolu (Manuel)"}

                                                            {middle.status === "ical" && "Dolu (iCal)"}

                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        }} />

                                    {/* INPUTLAR */}
                                    <div className="grid grid-cols-2 gap-2 mt-4">

                                        <input
                                            type="number"
                                            placeholder="Manuel fiyat (₺)"
                                            className="w-full p-2 rounded-lg bg-zinc-900 text-white border border-zinc-700 focus:border-blue-500 outline-none"
                                            onChange={(e) => setManualPrice(Number(e.target.value))}
                                        />

                                        <input
                                            type="number"
                                            placeholder="Ön ödeme %"
                                            className="w-full p-2 rounded-lg bg-zinc-900 text-white border border-zinc-700 focus:border-yellow-500 outline-none"
                                            value={prepaymentOverride ?? ""}
                                            onChange={(e) =>
                                                setPrepaymentOverride(
                                                    e.target.value === "" ? null : Number(e.target.value)
                                                )
                                            }
                                        />

                                    </div>

                                    {/* INFO */}
                                    {prepaymentOverride !== null && (
                                        <div className="mt-2 text-xs text-yellow-400 bg-yellow-400/10 px-2 py-1 rounded-md inline-block">
                                            Özel ön ödeme aktif (%{prepaymentOverride})
                                        </div>
                                    )}

                                    {/* ACTIONS */}
                                    <div className="flex gap-2 mt-4">

                                        <button
                                            onClick={() => updateDates(r.id)}
                                            className="flex-1 bg-blue-600 hover:bg-blue-500 py-2 rounded-xl text-white font-semibold transition"
                                        >
                                            Kaydet
                                        </button>

                                        <button
                                            onClick={() => setEditingId(null)}
                                            className="flex-1 bg-zinc-700 hover:bg-zinc-600 py-2 rounded-xl text-gray-300 font-semibold transition"
                                        >
                                            İptal
                                        </button>

                                    </div>

                                </div>
                            ) : (
                                <div className="flex justify-between items-center">

                                    <span className="flex items-center gap-2 text-gray-300 text-sm">
                                        <Calendar size={16} className="text-green-400" />
                                        {r.start_date} → {r.end_date}
                                    </span>

                                    <button
                                        onClick={() => {
                                            setEditingId(r.id);
                                            setManualPrice(null);
                                            setPrepaymentOverride(r.prepayment_override ?? null);

                                            setEditRange([
                                                {
                                                    startDate: new Date(r.start_date),
                                                    endDate: new Date(r.end_date),
                                                    key: "selection",
                                                },
                                            ]);
                                        }}
                                        className="text-blue-400 text-xs hover:text-blue-300 transition"
                                    >
                                        Değiştir
                                    </button>

                                </div>
                            )}

                        </div>

                        {/* DETAY */}
                        <div className="p-5 grid grid-cols-2 md:grid-cols-3 gap-4 text-sm text-gray-300">
                            <div><span className="text-gray-500">E-posta</span><br />{r.email || "-"}</div>
                            <div><span className="text-gray-500">Telefon</span><br />{r.phone || "-"}</div>
                            <div><span className="text-gray-500">Kimlik</span><br />{r.identity || "-"}</div>

                            <div><span className="text-gray-500">Ülke</span><br />{r.country || "-"}</div>
                            <div><span className="text-gray-500">Şehir</span><br />{r.city || "-"}</div>
                            <div><span className="text-gray-500">Adres</span><br />{r.address || "-"}</div>
                        </div>

                        {/* NOT */}
                        {r.note && (
                            <div className="mx-5 mb-3 p-3 rounded-lg bg-yellow-400/10 border border-yellow-400/30 text-yellow-300 text-sm">
                                Notlar: {r.note}
                            </div>
                        )}

                        {/* MİSAFİR */}
                        {r.guests && (
                            <div className="mx-5 mb-4 p-3 rounded-lg bg-zinc-800 text-gray-300 text-sm">
                                Diğer Kişiler: {r.guests}
                            </div>
                        )}

                        {/* ACTIONS */}
                        <div className="flex border-t border-zinc-800">

                            {/* 💰 ÖN ÖDEME DURUMU */}
                            <button
                                disabled={loadingId === r.id}
                                onClick={async () => {
                                    setLoadingId(r.id);

                                    const isPaid = Boolean(r.prepayment_paid);

                                    const { error } = await supabase
                                        .from("reservations")
                                        .update({
                                            prepayment_paid: !isPaid,
                                        })
                                        .eq("id", r.id);

                                    if (error) {
                                        console.error(error);
                                        alert("Güncelleme hatası ❌");
                                    }

                                    setLoadingId(null);
                                    getReservations();
                                }}
                                className={`flex-1 py-4 font-semibold transition flex items-center justify-center gap-2
      ${Boolean(r.prepayment_paid)
                                        ? "bg-green-700 hover:bg-green-600 text-white"
                                        : "bg-gray-700 hover:bg-gray-600 text-white"}
      ${loadingId === r.id && "opacity-50 cursor-not-allowed"}`}
                            >
                                {loadingId === r.id ? (
                                    "..."
                                ) : Boolean(r.prepayment_paid) ? (
                                    <>
                                        <CheckCircle size={18} />
                                        Ödeme Alındı
                                    </>
                                ) : (
                                    <>
                                        <CreditCard size={18} />
                                        Ödeme Geldiyse Tıkla
                                    </>
                                )}
                            </button>

                            {/* ✔ ONAYLA */}
                            {/* ✔ ONAYLA */}
                            {!isExternal && (
                                <button
                                    disabled={!canApprove || loadingId === r.id}
                                    onClick={() => approve(r)}
                                    className={`flex-1 py-4 font-semibold text-white transition flex items-center justify-center gap-2
        ${!Boolean(r.prepayment_paid)
                                            ? "bg-gray-600 cursor-not-allowed"
                                            : "bg-green-600 hover:bg-green-500"}
        ${loadingId === r.id && "opacity-50"}`}
                                >
                                    <CheckCircle size={18} />
                                    Onayla
                                </button>
                            )}

                            {/* ✖ REDDET */}
                            {canReject && !isExternal && (
                                <button
                                    disabled={loadingId === r.id || !canReject}
                                    onClick={() => reject(r.id)}
                                    className={`flex-1 py-4 font-semibold transition flex items-center justify-center gap-2
        ${!canReject ? "bg-gray-600 cursor-not-allowed" : "bg-yellow-500 hover:bg-yellow-400 text-black"}
        ${loadingId === r.id && "opacity-50"}`}
                                >
                                    <XCircle size={18} />
                                    Reddet
                                </button>
                            )}

                            {/* 🗑 SİL */}
                            <button
                                disabled={loadingId === r.id || isExternal}
                                onClick={() => {
                                    if (isExternal) return;
                                    deleteReservation(r.id);
                                }}
                                className="flex-1 bg-red-700 hover:bg-red-600 py-4 text-white font-semibold transition disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                <Trash2 size={18} />
                                Sil
                            </button>

                        </div>

                    </div>
                );
            })}
        </div>
    );
}