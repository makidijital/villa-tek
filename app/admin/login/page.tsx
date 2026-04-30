"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const login = async () => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert(error.message);
      return;
    }

    router.push("/admin");
  };

  return (
    <div className="h-screen flex items-center justify-center bg-black text-white">

      <div className="bg-zinc-900 p-8 rounded-2xl w-full max-w-md space-y-4">

        <h1 className="text-2xl font-bold text-center">
          Admin Giriş
        </h1>

        <input
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-3 rounded bg-zinc-800"
        />

        <input
          type="password"
          placeholder="Şifre"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-3 rounded bg-zinc-800"
        />

        <button
          onClick={login}
          className="w-full bg-green-600 py-3 rounded-lg"
        >
          Giriş Yap
        </button>

      </div>
    </div>
  );
}