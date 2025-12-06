import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { supabase } from "@/lib/supabaseClient"; // Importa o cliente Supabase

interface KiwifyWebhookPayload {
  order_id?: string;
  order_status?: string;
  product_id?: string;
  customer_email?: string;
  customer_name?: string;
  approved_date?: string;
  [key: string]: any;
}

export async function POST(request: NextRequest) {
  try {
    // --- ANÁLISE CRÍTICA ---
    // O armazenamento das compras não pode ser em memória (como um 'Set' ou array).
    // Funções serverless são efêmeras e perdem o estado. Usaremos o Supabase
    // como nossa fonte da verdade para persistir os dados de quem pagou.
    //
    // FLUXO DESTE WEBHOOK:
    // 1. Recebe a notificação da Kiwify.
    // 2. Valida a assinatura para garantir que a requisição é legítima.
    // 3. Se o status for 'paid' (pago), insere ou atualiza o registro do cliente
    //    na tabela 'compras' do Supabase.
    // 4. Se o status for 'refunded' (reembolsado), remove o registro da tabela.
    //
    // PRÉ-REQUISITO: Crie uma tabela 'compras' no Supabase com as colunas:
    // - id (int, primary key)
    // - email (text, unique)
    // - order_id (text)
    // - customer_name (text, nullable)
    // - combo_gerado (boolean, default: false)
    // - created_at (timestamp, default: now())
    // - updated_at (timestamp, default: now())

    const body = (await request.json()) as KiwifyWebhookPayload;

    // -----------------------------
    // 1) VALIDAÇÃO OPCIONAL DE ASSINATURA
    // -----------------------------
    const signature = request.headers.get("x-kiwify-signature");
    const webhookSecret = process.env.KIWIFY_WEBHOOK_SECRET;

    if (webhookSecret && signature) {
      const expectedSignature = crypto
        .createHmac("sha256", webhookSecret)
        .update(JSON.stringify(body))
        .digest("hex");

      if (signature !== expectedSignature) {
        console.error("❌ Assinatura inválida do webhook Kiwify");
        return NextResponse.json(
          { error: "Assinatura inválida" },
          { status: 401 }
        );
      }
    }

    // -----------------------------
    // 2) LOG DO EVENTO RECEBIDO
    // -----------------------------
    console.log("📩 Webhook Kiwify recebido (bruto):", body);

    // Alguns webhooks de teste da Kiwify podem usar outros campos de email.
    const emailRaw =
      body.customer_email ||
      body.email ||
      body.buyer_email ||
      (body.customer && body.customer.email) ||
      "";

    if (!emailRaw) {
      // Não vamos quebrar se o teste não mandar e-mail
      console.log(
        "ℹ️ Webhook de teste sem e-mail no payload. Nada para salvar como compra aprovada."
      );
      return NextResponse.json({
        success: true,
        message: "Webhook recebido (sem email no payload de teste).",
        status: body.order_status ?? "unknown",
      });
    }

    const email = emailRaw.toLowerCase().trim();
    const status = (body.order_status || "").toLowerCase();

    console.log("📩 Processando evento:", {
      order_id: body.order_id,
      status: status,
      email,
      name: body.customer_name,
    });

    // -----------------------------
    // 3) COMPRA APROVADA
    // -----------------------------
    if (status === "paid" || status === "approved" || status === "compra_aprovada") {
      // INSERE/ATUALIZA O REGISTRO NO SUPABASE
      // Usamos 'upsert' para o caso de o mesmo e-mail comprar novamente ou
      // um webhook chegar duplicado. Ele insere se não existir, ou atualiza se existir.
      // O importante é garantir que o acesso esteja liberado.
      const { data, error } = await supabase
        .from("compras")
        .upsert(
          {
            customer_email: email,  // ✅ CORRETO
            order_id: body.order_id,
            customer_name: body.customer_name || "",
            aprovado: true,  // ✅ Marca como aprovado quando paid
            product_id: body.product_id || "",
            status: "paid",
          },
          { onConflict: "customer_email" }  // ← TAMBÉM MUDA AQUI
        )
        .select();

      if (error) {
        console.error("❌ Erro ao salvar compra no Supabase:", error);
        throw new Error(`Erro ao salvar no Supabase: ${error.message}`);
      }

      console.log("✅ Compra aprovada e salva no Supabase:", data);

      return NextResponse.json({
        success: true,
        message: "Compra processada e acesso liberado com sucesso via Supabase",
        order_id: body.order_id,
        email,
      });
    }

    // -----------------------------
    // 4) REEMBOLSO / CANCELAMENTO
    // -----------------------------
    if (
      status === "refunded" ||
      status === "cancelled" ||
      status === "reembolso" ||
      status === "compra_cancelada"
    ) {
      // REMOVE O REGISTRO DO SUPABASE
      // Se o usuário pediu reembolso, o acesso dele deve ser revogado.
      const { error } = await supabase
        .from("compras")
        .delete()
        .eq("email", email);

      if (error) {
        console.error("❌ Erro ao remover compra do Supabase:", error);
        // Não lançamos um erro aqui para a Kiwify não ficar reenviando,
        // mas logamos para monitoramento.
      }

      console.log("⚠️ Acesso removido do Supabase (reembolso/cancelamento):", email);

      return NextResponse.json({
        success: true,
        message: "Acesso removido com sucesso do Supabase",
        order_id: body.order_id,
      });
    }

    // -----------------------------
    // 5) OUTROS STATUS
    // -----------------------------
    console.log("ℹ️ Status recebido (sem ação especial):", status);
    return NextResponse.json({
      success: true,
      message: "Webhook recebido",
      status,
      email,
    });
  } catch (error) {
    console.error("❌ Erro ao processar webhook Kiwify:", error);
    return NextResponse.json(
      { error: "Erro ao processar webhook Kiwify" },
      { status: 500 }
    );
  }
}
