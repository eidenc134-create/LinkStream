"use client";
import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

export default function SellerOnboarding() {
  const [msg, setMsg] = useState("");

  useEffect(() => {
    (async () => {
      const supabase = supabaseBrowser();
      const { data } = await supabase.auth.getUser();
      if (!data.user) setMsg("Necesitas iniciar sesión primero.");
    })();
  }, []);

  return (
    <main>
      <h2>Quiero vender</h2>
      <ol>
        <li>Verifica tu perfil (KYC). (MVP: marca seller_verification=verified en profiles)</li>
        <li>Conecta Mercado Pago para cobrar.</li>
        <li>Publica planes con cupos.</li>
      </ol>
      <p><a href="/api/mp/oauth/start">Conectar Mercado Pago</a></p>
      {msg && <p style={{ color: "crimson" }}>{msg}</p>}
      <p><a href="/seller/dashboard">Ir al panel vendedor</a></p>
    </main>
  );
}
