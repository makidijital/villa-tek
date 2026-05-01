"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AdminUsersPage() {
  const [admins, setAdmins] = useState<any[]>([]);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  // 🔐 aktif kullanıcı
  const [currentUser, setCurrentUser] = useState<string | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getSession();
      setCurrentUser(data.session?.user?.email || null);
    };

    getUser();
    getAdmins();
  }, []);

  // 📥 admin liste
  const getAdmins = async () => {
    const { data } = await supabase
      .from("admins")
      .select("*")
      .order("created_at", { ascending: false });

    setAdmins(data || []);
  };

  // ➕ admin ekle
  const addAdmin = async () => {
    if (!email) return;

    setLoading(true);

    const { error } = await supabase.from("admins").insert([
      {
        email,
        role: "admin",
      },
    ]);

    if (!error) {
      setEmail("");
      getAdmins();
    } else {
      alert("Hata: " + error.message);
    }

    setLoading(false);
  };

  // ❌ admin sil
  const deleteAdmin = async (id: string, adminEmail: string) => {
    if (adminEmail === currentUser) {
      alert("Kendini silemezsin!");
      return;
    }

    const confirmDelete = confirm("Silmek istediğine emin misin?");
    if (!confirmDelete) return;

    await supabase.from("admins").delete().eq("id", id);
    getAdmins();
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Admin Yönetimi</h1>

      {/* EKLE */}
      <div className="flex gap-2 mb-6">
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="admin@email.com"
          className="flex-1 p-3 rounded bg-black border border-white/10"
        />

        <button
          onClick={addAdmin}
          disabled={loading}
          className="bg-green-600 hover:bg-green-500 px-4 rounded"
        >
          Ekle
        </button>
      </div>

      {/* LİSTE */}
      <div className="space-y-2">
        {admins.map((admin) => (
          <div
            key={admin.id}
            className="flex justify-between items-center p-3 bg-black border border-white/10 rounded"
          >
            <div>
              <div className="font-medium">{admin.email}</div>
              <div className="text-xs text-gray-400">
                {admin.role}
              </div>
            </div>

            <button
              onClick={() => deleteAdmin(admin.id, admin.email)}
              className="text-red-500 text-sm hover:text-red-400"
            >
              Sil
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}