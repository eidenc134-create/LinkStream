"use client";
import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    const supabase = supabaseBrowser();
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return setMsg(error.message);
    if (data.user) await fetch("/api/profiles/init", { method: "POST" });
    window.location.href = "/dashboard";
  }

  return (
    <main>
      <h2>Crear cuenta</h2>
      <form onSubmit={onSubmit} style={{ display: "grid", gap: 8, maxWidth: 360 }}>
        <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input placeholder="Contraseña" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button type="submit">Crear</button>
      </form>
      {msg && <p style={{ color: "crimson" }}>{msg}</p>}
    </main>
  );
}
