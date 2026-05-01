"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [show, setShow] = useState(false);
  const router = useRouter();

  const login = async () => {
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert(error.message);
      setLoading(false);
      return;
    }

    router.push("/admin");
  };

  return (
    <div className="h-screen flex items-center justify-center bg-black text-white relative overflow-hidden">

      {/* Glow */}
      <div className="absolute w-[600px] h-[600px] bg-green-500/10 blur-[150px] rounded-full top-[-100px] left-[-100px]" />
      <div className="absolute w-[500px] h-[500px] bg-emerald-500/10 blur-[140px] rounded-full bottom-[-120px] right-[-120px]" />

      {/* Card */}
      <div className="relative w-full max-w-md p-8 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-xl space-y-6">

        {/* Brand */}
        <div className="text-center space-y-1">
          <h1 className="text-3xl font-bold tracking-wide bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">
            Maki Dijital
          </h1>
          <p className="text-sm text-zinc-400">
            Yönetim paneline giriş yap
          </p>
        </div>

        {/* Email */}
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 w-5 h-5" />

          <input
            placeholder="Email adresiniz"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 pl-10 rounded-xl bg-white/5 border border-white/10 focus:border-green-500 outline-none transition"
          />
        </div>

        {/* Password */}
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 w-5 h-5" />

          <input
            type={show ? "text" : "password"}
            placeholder="Şifreniz"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 pl-10 pr-10 rounded-xl bg-white/5 border border-white/10 focus:border-green-500 outline-none transition"
          />

          <button
            onClick={() => setShow(!show)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
          >
            {show ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        {/* Button */}
        <button
          onClick={login}
          disabled={loading}
          className="w-full py-3 rounded-xl font-semibold bg-gradient-to-r from-green-500 to-emerald-600 hover:opacity-90 transition active:scale-95 disabled:opacity-60"
        >
          {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
        </button>

        {/* Footer */}
        <p className="text-xs text-center text-zinc-500">
          © {new Date().getFullYear()} Maki Dijital
        </p>

      </div>
    </div>
  );
}