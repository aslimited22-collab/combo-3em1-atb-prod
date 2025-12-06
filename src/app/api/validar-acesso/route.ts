import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email é obrigatório" },
        { status: 400 }
      );
    }

    const emailLower = email.toLowerCase().trim();

    // ✅ CORREÇÃO: usar 'customer_email' em vez de 'email'
    const { data, error } = await supabase
      .from("compras")
      .select("*")
      .eq("customer_email", emailLower)
      .eq("aprovado", true)  // Garante que apenas compras aprovadas tem acesso
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 = "não encontrado" (esperado se o email não existe)
      console.error("❌ Erro ao consultar Supabase:", error);
      return NextResponse.json(
        { error: "Erro ao validar acesso" },
        { status: 500 }
      );
    }

    // Se chegou aqui sem erro e data não é null = acesso liberado
    const acesso = !!data;

    console.log(`📍 Validação para ${emailLower}:`, acesso ? "✅ Acesso liberado" : "❌ Sem acesso");

    return NextResponse.json({
      acesso,
      usuario: data ? {
        email: data.customer_email,
        nome: data.customer_name,
        order_id: data.order_id,
      } : null,
    });

  } catch (error) {
    console.error("❌ Erro ao validar acesso:", error);
    return NextResponse.json(
      { error: "Erro interno ao validar" },
      { status: 500 }
    );
  }
}