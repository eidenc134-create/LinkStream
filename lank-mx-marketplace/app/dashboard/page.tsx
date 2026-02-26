"use client";
import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

export default function Dashboard() {
  const [email, setEmail] = useState("");

  useEffect(() => {
    (async () => {
      const supabase = supabaseBrowser();
      const { data } = await supabase.auth.getUser();
      setEmail(data.user?.email ?? "");
    })();
  }, []);

  async function logout() {
    const supabase = supabaseBrowser();
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  return (
    <main>
      <h2>Dashboard</h2>
      <p>Usuario: {email || "—"}</p>
      <p>
        <a href="/listings">Ver planes</a> · <a href="/seller/dashboard">Panel vendedor</a>
      </p>
      <button onClick={logout}>Salir</button>
    </main>
  );
}
