import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function exigirAdmin(context: {
  userId: string;
  supabase: {
    from: (table: "user_roles") => {
      select: (columns: string) => {
        eq: (column: string, value: string) => {
          eq: (column: string, value: string) => {
            maybeSingle: () => Promise<{ data: { role: string } | null; error: unknown }>;
          };
        };
      };
    };
  };
}) {
  const { data, error } = await context.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", context.userId)
    .eq("role", "admin")
    .maybeSingle();

  if (error || data?.role !== "admin") throw new Error("Forbidden");
}

export const verificarAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await exigirAdmin(context);
    return { admin: true };
  });

export const listarResultados = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await exigirAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [{ data: candidatos, error: erroCandidatos }, { data: entregas, error: erroEntregas }] =
      await Promise.all([
        supabaseAdmin.from("candidatos").select("email, nome").order("nome"),
        supabaseAdmin
          .from("entregas")
          .select(
            "id, user_id, email, q1, q2, q3, q4, q5, usou_ia, ia_detalhes, link_complementar, arquivo_path, arquivo_nome, finalizada, enviada_em, created_at, updated_at",
          )
          .order("updated_at", { ascending: false }),
      ]);

    if (erroCandidatos || erroEntregas) throw new Error("Não foi possível carregar os resultados.");

    const porEmail = new Map((entregas ?? []).map((entrega) => [entrega.email.toLowerCase(), entrega]));
    return (candidatos ?? []).map((candidato) => ({
      nome: candidato.nome,
      email: candidato.email,
      entrega: porEmail.get(candidato.email.toLowerCase()) ?? null,
    }));
  });

export const obterArquivoAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ entregaId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    await exigirAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: entrega, error } = await supabaseAdmin
      .from("entregas")
      .select("arquivo_path")
      .eq("id", data.entregaId)
      .maybeSingle();

    if (error || !entrega?.arquivo_path) throw new Error("Arquivo não encontrado.");
    const { data: arquivo, error: erroArquivo } = await supabaseAdmin.storage
      .from("complementares")
      .createSignedUrl(entrega.arquivo_path, 60);
    if (erroArquivo || !arquivo?.signedUrl) throw new Error("Não foi possível abrir o arquivo.");
    return { url: arquivo.signedUrl };
  });