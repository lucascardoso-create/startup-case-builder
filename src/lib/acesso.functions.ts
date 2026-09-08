import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const schema = z.object({
  email: z.string().trim().email().max(255),
  senha: z.string().min(1).max(200),
});

/**
 * Primeiro acesso: valida e-mail + senha inicial contra a lista de aprovados
 * e cria a conta de autenticação caso ainda não exista.
 */
export const prepararAcesso = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => schema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const email = data.email.toLowerCase();

    const { data: candidato } = await supabaseAdmin
      .from("candidatos")
      .select("email, senha_hash")
      .eq("email", email)
      .maybeSingle();

    if (!candidato) {
      return { ok: false as const, motivo: "nao_autorizado" as const };
    }

    // Só guardamos a impressão digital (hash) da senha inicial, nunca a senha em si.
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(data.senha));
    const hash = Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    if (hash !== candidato.senha_hash) {
      // Senha não confere com a inicial: pode ser uma conta já criada. Deixamos o login decidir.
      return { ok: true as const };
    }

    // A conta pode já existir (acessos seguintes). Nesse caso não fazemos nada.
    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: data.senha,
      email_confirm: true,
    });

    if (error && !created) {
      const msg = error.message.toLowerCase();
      const jaExiste = msg.includes("already") || msg.includes("registered");
      if (!jaExiste) {
        console.error("[acesso] falha ao preparar conta", error.message);
        return { ok: false as const, motivo: "erro" as const };
      }
    }

    return { ok: true as const };
  });
