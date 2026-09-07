import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Loader2, LogIn } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { prepararAcesso } from "@/lib/acesso.functions";
import { CONTATO } from "@/lib/case";

export const Route = createFileRoute("/entrar")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Entrar · Segunda fase SanFran iLab" },
      {
        name: "description",
        content:
          "Acesso restrito aos aprovados na primeira fase do processo seletivo da SanFran iLab.",
      },
      { property: "og:title", content: "Entrar · Segunda fase SanFran iLab" },
      {
        property: "og:description",
        content: "Área de acesso dos candidatos aprovados para a segunda fase.",
      },
    ],
  }),
  component: Entrar,
});

function Entrar() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/painel", replace: true });
    });
  }, [navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setCarregando(true);
    try {
      const limpo = email.trim().toLowerCase();
      const preparo = await prepararAcesso({ data: { email: limpo, senha } });
      if (!preparo.ok) {
        toast.error(
          preparo.motivo === "nao_autorizado"
            ? "Este e-mail não está na lista de aprovados da segunda fase."
            : "Não foi possível verificar seu acesso. Tente novamente.",
        );
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: limpo,
        password: senha,
      });
      if (error) {
        toast.error("E-mail ou senha incorretos.");
        return;
      }
      navigate({ to: "/painel", replace: true });
    } catch {
      toast.error("Algo deu errado. Tente novamente em instantes.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 py-12">
      <div className="w-full max-w-md">
        <Link
          to="/"
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Link>

        <div className="rounded-3xl border border-border bg-card p-8 shadow-sm">
          <h1 className="text-3xl uppercase">Acesso à prova</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Use o e-mail da sua inscrição e a senha que você recebeu.
          </p>

          <form onSubmit={onSubmit} className="mt-7 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                maxLength={255}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seunome@usp.br"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="senha">Senha</Label>
              <Input
                id="senha"
                type="password"
                autoComplete="current-password"
                required
                maxLength={200}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full" disabled={carregando}>
              {carregando ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <LogIn className="mr-1 h-4 w-4" /> Entrar
                </>
              )}
            </Button>
          </form>

          <p className="mt-6 rounded-xl bg-secondary p-4 text-sm text-secondary-foreground">
            Precisa trocar a senha ou esqueceu a sua? Fale diretamente com{" "}
            <a className="font-medium text-primary underline" href={`mailto:${CONTATO}`}>
              {CONTATO}
            </a>
            .
          </p>
        </div>
      </div>
    </main>
  );
}
