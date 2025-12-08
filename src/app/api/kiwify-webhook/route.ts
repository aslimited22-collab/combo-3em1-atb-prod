import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { supabase } from "@/lib/supabaseClient";

interface KiwifyWebhookPayload {
  order_id?: string;
  order_status?: string;
  product_id?: string;
  customer_email?: string;
  customer_name?: string;
  approved_date?: string;
  Product?: {
    product_id: string;
    product_name: string;
  };
  Customer?: {
    full_name: string;
    first_name: string;
    email: string;
    mobile: string;
    CPF: string;
    city: string;
    state: string;
  };
  payment_method?: string;
  Subscription?: {
    id: string;
    status: string;
  };
  [key: string]: any;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as KiwifyWebhookPayload;

    // Validação opcional de assinatura
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

    console.log("📩 Webhook Kiwify recebido:", JSON.stringify(body, null, 2));

    // Extrai email
    const emailRaw =
      body.customer_email ||
      body.email ||
      body.Customer?.email ||
      "";

    if (!emailRaw) {
      console.log(
        "ℹ️ Webhook sem e-mail no payload. Nada para salvar."
      );
      return NextResponse.json({
        success: true,
        message: "Webhook recebido (sem email no payload de teste).",
      });
    }

    const email = emailRaw.toLowerCase().trim();
    const status = (body.order_status || "").toLowerCase();

    console.log("📍 Processando evento:", {
      order_id: body.order_id,
      status,
      email,
      name: body.Customer?.full_name || body.customer_name,
    });

    // ========== COMPRA APROVADA ==========
    if (status === "paid" || status === "approved" || status === "compra_aprovada") {
      // Monta os dados completos do cliente
      const customerData = {
        email: email,
        order_id: body.order_id,
        customer_email: email,
        customer_name: body.Customer?.full_name || body.customer_name || "",
        customer_first_name: body.Customer?.first_name || "",
        customer_mobile: body.Customer?.mobile || "",
        customer_cpf: body.Customer?.CPF || "",
        customer_city: body.Customer?.city || "",
        customer_state: body.Customer?.state || "",
        product_id: body.Product?.product_id || body.product_id || "",
        product_name: body.Product?.product_name || "",
        payment_method: body.payment_method || "",
        subscription_id: body.Subscription?.id || "",
        subscription_status: body.Subscription?.status || "",
        aprovado: true,
        combo_gerado: false,
      };

      const { data, error } = await supabase
        .from("compras")
        .upsert(customerData, { onConflict: "customer_email" })
        .select();

      if (error) {
        console.error("❌ Erro ao salvar compra no Supabase:", error);
        throw new Error(`Erro ao salvar no Supabase: ${error.message}`);
      }

      console.log("✅ Compra aprovada e salva no Supabase:", data);

      return NextResponse.json({
        success: true,
        message: "Compra processada e acesso liberado com sucesso",
        order_id: body.order_id,
        email,
      });
    }

    // ========== REEMBOLSO / CANCELAMENTO ==========
    if (
      status === "refunded" ||
      status === "cancelled" ||
      status === "reembolso" ||
      status === "compra_cancelada"
    ) {
      const { error } = await supabase
        .from("compras")
        .delete()
        .eq("customer_email", email);

      if (error) {
        console.error("❌ Erro ao remover compra do Supabase:", error);
      }

      console.log("⚠️ Acesso removido (reembolso/cancelamento):", email);

      return NextResponse.json({
        success: true,
        message: "Acesso removido com sucesso",
        order_id: body.order_id,
      });
    }

    // ========== OUTROS STATUS ==========
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