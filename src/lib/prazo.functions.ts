import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { PRAZO } from "@/lib/case";

/** Prazo do candidato logado (padrão, ou estendido individualmente). */
export const obterMeuPrazo = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const email = String((context.claims as { email?: string }).email ?? "").toLowerCase();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("candidatos")
      .select("prazo_estendido")
      .eq("email", email)
      .maybeSingle();
    const extra = (data as { prazo_estendido?: string | null } | null)?.prazo_estendido;
    const prazo = extra && new Date(extra) > PRAZO ? new Date(extra) : PRAZO;
    return { prazo: prazo.toISOString() };
  });
