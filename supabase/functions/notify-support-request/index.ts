import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@4.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[NOTIFY-SUPPORT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) {
      throw new Error("RESEND_API_KEY is not set");
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: authError } = await supabaseClient.auth.getUser(token);
    if (authError) throw new Error(`Authentication error: ${authError.message}`);

    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Parse request body
    const { message, messageId } = await req.json();
    logStep("Request data", { messageId, messagePreview: message?.substring(0, 50) });

    // Initialize Resend
    const resend = new Resend(resendKey);

    // Admin email
    const adminEmail = "learnbuddyco@proton.me";

    // Send notification email
    const { error: emailError } = await resend.emails.send({
      from: "Learn Buddy <onboarding@resend.dev>",
      to: [adminEmail],
      subject: "🆘 Nova Solicitação de Ajuda - Learn Buddy",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .message-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b; }
            .btn { display: inline-block; background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎓 Learn Buddy</h1>
              <p>Nova Solicitação de Suporte</p>
            </div>
            <div class="content">
              <p>Olá Admin!</p>
              <p>Um usuário enviou uma mensagem no chat de suporte e precisa de ajuda.</p>
              
              <div class="message-box">
                <p><strong>📧 Email do Usuário:</strong> ${user.email}</p>
                <p><strong>🆔 ID do Usuário:</strong> ${user.id}</p>
                <p><strong>📅 Data/Hora:</strong> ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}</p>
                <p><strong>💬 Mensagem:</strong></p>
                <blockquote style="background: #f5f5f5; padding: 15px; border-radius: 6px; margin: 10px 0;">
                  ${message}
                </blockquote>
              </div>
              
              <p>Por favor, acesse o painel de suporte para responder a esta solicitação.</p>
              
              <a href="https://studdybuddy.com.br/support-admin" class="btn">Acessar Suporte Admin</a>
              
              <div class="footer">
                <p>Este é um email automático do Learn Buddy.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (emailError) {
      logStep("Email send error", { error: emailError });
      throw new Error(`Failed to send email: ${JSON.stringify(emailError)}`);
    }

    logStep("Email sent successfully");

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: "Erro ao processar solicitação de suporte." }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
