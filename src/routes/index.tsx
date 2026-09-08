import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, FolderOpen, Clock } from "lucide-react";

import { Button } from "@/components/ui/button";
import logoAsset from "@/assets/ilab-logo.png.asset.json";
import { DRIVE_URL, PRAZO_LABEL, CONTATO } from "@/lib/case";
import { BarraContagem } from "@/components/contagem-regressiva";


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Segunda fase · SanFran iLab — Escola de Startups Jurídicas da USP" },
      {
        name: "description",
        content:
          "Ambiente oficial da prova da segunda fase do processo seletivo da SanFran iLab. Acesse o case, responda ao formulário e envie seus materiais complementares.",
      },
      {
        property: "og:title",
        content: "Segunda fase · SanFran iLab",
      },
      {
        property: "og:description",
        content:
          "Acesse o case, responda ao formulário e envie seus materiais complementares até 14/09/2026.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <BarraContagem />

      <header className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-4 sm:flex sm:justify-between sm:px-6 sm:py-6">
        <div className="flex min-w-0 items-center gap-3">
          <img
            src={logoAsset.url}
            alt="SanFran iLab"
            width={830}
            height={1233}
            className="h-9 w-auto shrink-0 sm:h-10"
          />
          <div className="min-w-0 leading-tight">
            <p className="truncate font-display text-base sm:text-lg">SanFran iLab</p>
            <p className="truncate text-[11px] text-muted-foreground sm:text-xs">
              Escola de Startups Jurídicas da USP
            </p>
          </div>
        </div>
        <Button asChild size="sm" className="shrink-0 sm:size-default">
          <Link to="/entrar">Entrar</Link>
        </Button>
      </header>

      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 pb-12 pt-4 sm:px-6 sm:pb-16 sm:pt-6 md:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-accent px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-accent-foreground sm:text-xs">
              Processo seletivo · Edital 2026.2
            </p>
            <h1 className="mt-5 text-4xl uppercase leading-[0.95] sm:text-6xl md:text-7xl">
              Segunda fase
              <br />
              começa aqui
            </h1>
            <p className="mt-5 max-w-xl text-base text-muted-foreground sm:text-lg">
              Você chegou à etapa do case. Aqui você analisa os materiais, registra suas respostas
              e envia o que produziu. O acesso é restrito a quem foi aprovado na primeira fase.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Button asChild size="lg" className="w-full sm:w-auto">
                <Link to="/entrar">
                  Acessar a prova <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="w-full sm:w-auto">
                <a href={DRIVE_URL} target="_blank" rel="noreferrer">
                  <FolderOpen className="mr-1 h-4 w-4" /> Abrir os materiais do case
                </a>
              </Button>
            </div>
            <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4 shrink-0" /> Entregas e revisões até {PRAZO_LABEL}.
            </p>
          </div>

          <div className="relative flex justify-center">
            <div className="absolute inset-0 -z-10 rounded-[3rem] bg-primary/15" />
            <img
              src={logoAsset.url}
              alt="SanFran iLab"
              width={830}
              height={1233}
              className="w-40 drop-shadow-xl sm:w-56 md:w-72"
            />
          </div>
        </div>
      </section>


      <section className="bg-secondary/60 py-16">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-3xl uppercase">O desafio</h2>
          <p className="mt-3 max-w-3xl text-muted-foreground">
            Você não precisa saber programar nem conhecer modelos de negócios. Queremos compreender
            como você observa um problema, constrói uma hipótese que pode ser testada e imagina uma
            solução tecnológica possível.
          </p>

          <div className="mt-9 grid gap-5 md:grid-cols-3">
            {[
              {
                n: "1",
                t: "Leia o case",
                d: "Todos os documentos e dados estão na pasta compartilhada do Drive.",
              },
              {
                n: "2",
                t: "Responda o Módulo 1",
                d: "Cinco perguntas sobre observação, desafio, hipótese, solução e aplicação prática.",
              },
              {
                n: "3",
                t: "Complemente o Módulo 2",
                d: "Envie um PDF/PPTX e/ou um link com material que aprofunde sua análise.",
              },
            ].map((c) => (
              <div key={c.n} className="rounded-2xl border border-border bg-card p-6">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary font-display text-primary-foreground">
                  {c.n}
                </span>
                <h3 className="mt-4 text-xl">{c.t}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{c.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-4xl rounded-3xl bg-primary px-8 py-12 text-center text-primary-foreground">
          
          <h2 className="mt-4 text-4xl uppercase">Pronto para começar?</h2>
          <p className="mx-auto mt-3 max-w-xl opacity-90">
            Entre com o e-mail cadastrado na inscrição e a senha que você recebeu por mensagem.
          </p>
          <Button asChild size="lg" variant="secondary" className="mt-7">
            <Link to="/entrar">Entrar e responder o case</Link>
          </Button>
        </div>
      </section>

      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        <p>
          Dúvidas, troca ou perda de senha: fale diretamente com{" "}
          <a className="font-medium text-primary underline" href={`mailto:${CONTATO}`}>
            {CONTATO}
          </a>
          .
        </p>
      </footer>
    </main>
  );
}
