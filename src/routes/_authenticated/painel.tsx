import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  CheckCircle2,
  Download,
  ExternalLink,
  FolderOpen,
  Loader2,
  LogOut,
  Paperclip,
  Save,
  Send,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import {
  CONFIRMACOES,
  CONTATO,
  DRIVE_URL,
  PERGUNTAS,
  PRAZO_LABEL,
} from "@/lib/case";
import { BarraContagem, useTempoRestante } from "@/components/contagem-regressiva";

export const Route = createFileRoute("/_authenticated/painel")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Minha entrega · Segunda fase SanFran iLab" },
      {
        name: "description",
        content: "Responda as perguntas do case e envie seus materiais complementares.",
      },
      { property: "og:title", content: "Minha entrega · Segunda fase SanFran iLab" },
      {
        property: "og:description",
        content: "Área do candidato para responder e revisar a entrega da segunda fase.",
      },
    ],
  }),
  component: Painel,
});

type Respostas = {
  q1: string;
  q2: string;
  q3: string;
  q4: string;
  q5: string;
  usou_ia: boolean | null;
  ia_detalhes: string;
  link_complementar: string;
  arquivo_path: string | null;
  arquivo_nome: string | null;
  finalizada: boolean;
  enviada_em: string | null;
};

const VAZIO: Respostas = {
  q1: "",
  q2: "",
  q3: "",
  q4: "",
  q5: "",
  usou_ia: null,
  ia_detalhes: "",
  link_complementar: "",
  arquivo_path: null,
  arquivo_nome: null,
  finalizada: false,
  enviada_em: null,
};

const TIPOS_ACEITOS = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
];

function Painel() {
  const navigate = useNavigate();
  const inputArquivo = useRef<HTMLInputElement>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [subindo, setSubindo] = useState(false);
  const [form, setForm] = useState<Respostas>(VAZIO);
  const [confirmado, setConfirmado] = useState<boolean[]>(CONFIRMACOES.map(() => false));
  const [modo, setModo] = useState<"arquivo" | "texto">("arquivo");

  const { encerrado: prazoEncerrado } = useTempoRestante();
  const bloqueado = prazoEncerrado;

  useEffect(() => {
    let ativo = true;
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      const user = auth.user;
      if (!user || !ativo) return;
      setUserId(user.id);
      setEmail(user.email ?? "");

      const { data: entrega } = await supabase
        .from("entregas")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!ativo) return;
      if (entrega) {
        setForm({
          q1: entrega.q1,
          q2: entrega.q2,
          q3: entrega.q3,
          q4: entrega.q4,
          q5: entrega.q5,
          usou_ia: entrega.usou_ia,
          ia_detalhes: entrega.ia_detalhes,
          link_complementar: entrega.link_complementar,
          arquivo_path: entrega.arquivo_path,
          arquivo_nome: entrega.arquivo_nome,
          finalizada: entrega.finalizada,
          enviada_em: entrega.enviada_em,
        });
        if (!entrega.arquivo_path && entrega.link_complementar.trim()) setModo("texto");
        if (entrega.finalizada) setConfirmado(CONFIRMACOES.map(() => true));
      }
      setCarregando(false);
    })();
    return () => {
      ativo = false;
    };
  }, []);

  const faltando = useMemo(() => {
    const itens: string[] = [];
    for (const p of PERGUNTAS) {
      if (!form[p.id].trim()) itens.push(`Módulo 1 — ${p.etapa}`);
      else if (form[p.id].length > p.limite) itens.push(`${p.etapa}: acima do limite de caracteres`);
    }
    if (form.usou_ia === null) itens.push("Uso de inteligência artificial");
    if (form.usou_ia === true && !form.ia_detalhes.trim())
      itens.push("Detalhes sobre o uso de inteligência artificial");
    if (!form.link_complementar.trim() && !form.arquivo_path)
      itens.push("Módulo 2 — envie um arquivo ou escreva um complemento");
    return itens;
  }, [form]);

  async function salvar(finalizar: boolean) {
    if (!userId) return;
    if (finalizar) setEnviando(true);
    else setSalvando(true);
    try {
      const payload = {
        user_id: userId,
        email,
        q1: form.q1,
        q2: form.q2,
        q3: form.q3,
        q4: form.q4,
        q5: form.q5,
        usou_ia: form.usou_ia,
        ia_detalhes: form.ia_detalhes,
        link_complementar: form.link_complementar.trim(),
        arquivo_path: form.arquivo_path,
        arquivo_nome: form.arquivo_nome,
        finalizada: finalizar ? true : form.finalizada,
        enviada_em: finalizar ? new Date().toISOString() : form.enviada_em,
      };

      const { error } = await supabase
        .from("entregas")
        .upsert(payload, { onConflict: "user_id" });

      if (error) throw error;

      setForm((f) => ({
        ...f,
        finalizada: payload.finalizada,
        enviada_em: payload.enviada_em,
      }));
      toast.success(
        finalizar
          ? "Entrega registrada! Você ainda pode revisar até " + PRAZO_LABEL + "."
          : "Rascunho salvo.",
      );
    } catch {
      toast.error("Não foi possível salvar. Verifique sua conexão e tente novamente.");
    } finally {
      setSalvando(false);
      setEnviando(false);
    }
  }

  async function enviarArquivo(file: File) {
    if (!userId) return;
    if (!TIPOS_ACEITOS.includes(file.type)) {
      toast.error("Envie um arquivo PDF ou PPTX.");
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      toast.error("O arquivo precisa ter até 50 MB.");
      return;
    }
    setSubindo(true);
    try {
      const path = `${userId}/complementar-${Date.now()}-${file.name.replace(/[^\w.-]/g, "_")}`;
      const { error } = await supabase.storage.from("complementares").upload(path, file);
      if (error) throw error;
      if (form.arquivo_path) {
        await supabase.storage.from("complementares").remove([form.arquivo_path]);
      }
      setForm((f) => ({ ...f, arquivo_path: path, arquivo_nome: file.name }));
      toast.success("Arquivo anexado. Lembre de salvar a entrega.");
    } catch {
      toast.error("Não foi possível enviar o arquivo.");
    } finally {
      setSubindo(false);
      if (inputArquivo.current) inputArquivo.current.value = "";
    }
  }

  async function removerArquivo() {
    if (!form.arquivo_path) return;
    await supabase.storage.from("complementares").remove([form.arquivo_path]);
    setForm((f) => ({ ...f, arquivo_path: null, arquivo_nome: null }));
    toast.success("Arquivo removido. Lembre de salvar a entrega.");
  }

  async function baixarArquivo() {
    if (!form.arquivo_path) return;
    const { data } = await supabase.storage
      .from("complementares")
      .createSignedUrl(form.arquivo_path, 60);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank", "noopener");
  }

  async function sair() {
    await supabase.auth.signOut();
    navigate({ to: "/entrar", replace: true });
  }

  if (carregando) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const podeFinalizar = faltando.length === 0 && confirmado.every(Boolean) && !bloqueado;

  return (
    <main className="min-h-screen bg-background pb-24">
      <BarraContagem />
      <header className="border-b border-border bg-card">
        <div className="mx-auto grid max-w-4xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-4 sm:px-6">
          <div className="min-w-0">
            <p className="font-display text-base">SanFran iLab</p>
            <p className="truncate text-xs text-muted-foreground">{email}</p>
          </div>
          <Button variant="ghost" size="sm" className="shrink-0" onClick={sair}>
            <LogOut className="mr-1 h-4 w-4" /> Sair
          </Button>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <section className="mt-6 rounded-3xl bg-primary p-6 text-primary-foreground sm:mt-8 sm:p-8">
          <h1 className="text-3xl uppercase leading-none sm:text-4xl">
            Parabéns por chegar até aqui!
          </h1>
          <p className="mt-3 max-w-2xl text-sm opacity-90 sm:text-base">
            Você está entre os aprovados para a segunda fase. Agora é hora de mostrar como você
            pensa. Você não precisa saber programar nem conhecer modelos de negócios: queremos
            compreender como você observa um problema, constrói uma hipótese testável e imagina uma
            solução possível.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Button asChild variant="secondary" className="w-full sm:w-auto">
              <a href={DRIVE_URL} target="_blank" rel="noreferrer">
                <FolderOpen className="mr-1 h-4 w-4" /> Materiais do case
              </a>
            </Button>
            <span className="inline-flex items-center justify-center rounded-md bg-primary-foreground/15 px-3 py-2 text-sm">
              Revisões até {PRAZO_LABEL}
            </span>
          </div>
        </section>


        {form.finalizada && (
          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-primary/40 bg-accent p-5 text-accent-foreground">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
            <p className="text-sm">
              Sua entrega está registrada
              {form.enviada_em
                ? ` desde ${new Date(form.enviada_em).toLocaleString("pt-BR")}`
                : ""}
              . {bloqueado ? "O prazo encerrou e ela não pode mais ser alterada." : `Você ainda pode editar e salvar novamente até ${PRAZO_LABEL}.`}
            </p>
          </div>
        )}

        {bloqueado && !form.finalizada && (
          <div className="mt-6 rounded-2xl border border-destructive/40 bg-destructive/10 p-5 text-sm">
            O prazo de entrega encerrou em {PRAZO_LABEL}. Em caso de dúvida, fale com {CONTATO}.
          </div>
        )}

        {/* MÓDULO 1 */}
        <section className="mt-10">
          <div className="flex items-baseline gap-3">
            <span className="rounded-md bg-foreground px-2 py-1 font-display text-xs uppercase text-background">
              Módulo 1
            </span>
            <h2 className="text-2xl uppercase">Perguntas do case</h2>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Todas as perguntas são obrigatórias. O formulário é a resposta principal.
          </p>

          <div className="mt-6 space-y-6">
            {PERGUNTAS.map((p, i) => {
              const valor = form[p.id];
              const excedeu = valor.length > p.limite;
              return (
                <div key={p.id} className="rounded-2xl border border-border bg-card p-6">
                  <p className="text-xs font-bold uppercase tracking-wide text-primary">
                    Pergunta {i + 1} — {p.etapa}
                  </p>
                  <h3 className="mt-2 text-lg">{p.titulo}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{p.enunciado}</p>
                  {p.ajuda && (
                    <p className="mt-2 text-sm italic text-muted-foreground">{p.ajuda}</p>
                  )}
                  <Textarea
                    className="mt-4 min-h-40"
                    disabled={bloqueado}
                    value={valor}
                    onChange={(e) => setForm((f) => ({ ...f, [p.id]: e.target.value }))}
                    placeholder="Escreva sua resposta..."
                  />
                  <p
                    className={`mt-2 text-right text-xs ${excedeu ? "text-destructive" : "text-muted-foreground"}`}
                  >
                    {valor.length} / {p.limite} caracteres
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* USO DE IA */}
        <section className="mt-10 rounded-2xl border border-border bg-card p-6">
          <h2 className="text-xl uppercase">Uso de inteligência artificial</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            O uso de IA é permitido e estimulado. Você continua responsável pelas informações,
            fontes e conclusões apresentadas.
          </p>
          <p className="mt-4 font-medium">
            Você utilizou inteligência artificial na preparação da resposta?
          </p>
          <div className="mt-3 flex gap-3">
            {[
              { label: "Sim", v: true },
              { label: "Não", v: false },
            ].map((o) => (
              <Button
                key={o.label}
                type="button"
                disabled={bloqueado}
                variant={form.usou_ia === o.v ? "default" : "outline"}
                onClick={() => setForm((f) => ({ ...f, usou_ia: o.v }))}
              >
                {o.label}
              </Button>
            ))}
          </div>
          {form.usou_ia === true && (
            <div className="mt-4">
              <Label htmlFor="ia">
                Quais ferramentas você utilizou, para quê e como verificou ou modificou o resultado?
              </Label>
              <Textarea
                id="ia"
                className="mt-2 min-h-28"
                disabled={bloqueado}
                value={form.ia_detalhes}
                onChange={(e) => setForm((f) => ({ ...f, ia_detalhes: e.target.value }))}
              />
              <p
                className={`mt-2 text-right text-xs ${form.ia_detalhes.length > 800 ? "text-destructive" : "text-muted-foreground"}`}
              >
                {form.ia_detalhes.length} / 800 caracteres
              </p>
            </div>
          )}
        </section>

        {/* MÓDULO 2 */}
        <section className="mt-10">
          <div className="flex items-baseline gap-3">
            <span className="rounded-md bg-foreground px-2 py-1 font-display text-xs uppercase text-background">
              Módulo 2
            </span>
            <h2 className="text-2xl uppercase">Material complementar</h2>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Escolha uma forma de complementar sua entrega: envie um arquivo ou escreva um
            complemento em texto. Basta uma das duas.
          </p>

          <div className="mt-6 rounded-2xl border border-border bg-card p-6">
            <div className="inline-flex rounded-xl bg-secondary p-1">
              {[
                { v: "arquivo" as const, label: "Enviar arquivo" },
                { v: "texto" as const, label: "Escrever complemento" },
              ].map((o) => (
                <button
                  key={o.v}
                  type="button"
                  disabled={bloqueado}
                  onClick={() => setModo(o.v)}
                  className={`rounded-lg px-4 py-2 text-sm transition-colors ${
                    modo === o.v
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>

            {modo === "arquivo" ? (
              <div className="mt-6">
                <p className="text-sm text-muted-foreground">
                  PDF ou PPTX, até 7 páginas/slides e 50 MB.
                </p>
                {form.arquivo_nome ? (
                  <div className="mt-4 flex items-center gap-2 rounded-xl bg-secondary p-3 text-sm">
                    <Paperclip className="h-4 w-4 shrink-0" />
                    <span className="min-w-0 flex-1 truncate">{form.arquivo_nome}</span>
                    <Button size="icon" variant="ghost" onClick={baixarArquivo} title="Abrir">
                      <Download className="h-4 w-4" />
                    </Button>
                    {!bloqueado && (
                      <Button size="icon" variant="ghost" onClick={removerArquivo} title="Remover">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-muted-foreground">
                    Nenhum arquivo enviado ainda.
                  </p>
                )}
                <input
                  ref={inputArquivo}
                  type="file"
                  accept=".pdf,.pptx"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) enviarArquivo(f);
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  className="mt-4"
                  disabled={bloqueado || subindo}
                  onClick={() => inputArquivo.current?.click()}
                >
                  {subindo ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Paperclip className="mr-1 h-4 w-4" />
                      {form.arquivo_nome ? "Substituir arquivo" : "Escolher arquivo"}
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <div className="mt-6">
                <Label htmlFor="complemento">
                  Escreva aqui algo que você não teve oportunidade de dizer nas respostas. Pode
                  incluir links (apresentação, protótipo, vídeo, GitHub).
                </Label>
                <Textarea
                  id="complemento"
                  className="mt-2 min-h-40"
                  maxLength={3000}
                  disabled={bloqueado}
                  value={form.link_complementar}
                  onChange={(e) => setForm((f) => ({ ...f, link_complementar: e.target.value }))}
                  placeholder="Escreva seu complemento ou cole um link..."
                />
                <p className="mt-2 text-right text-xs text-muted-foreground">
                  {form.link_complementar.length} / 3000 caracteres
                </p>
                <p className="mt-3 flex items-start gap-2 rounded-lg bg-accent p-3 text-xs text-accent-foreground">
                  <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  Se incluir links, confira se estão liberados para visualização por qualquer
                  pessoa. Links privados não poderão ser avaliados.
                </p>
              </div>
            )}
          </div>
        </section>


        {/* CONFIRMAÇÕES */}
        <section className="mt-10 rounded-2xl border border-border bg-card p-6">
          <h2 className="text-xl uppercase">Antes de registrar</h2>
          <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl bg-secondary p-3 text-sm font-medium">
            <Checkbox
              className="mt-0.5"
              disabled={bloqueado}
              checked={confirmado.every(Boolean)}
              onCheckedChange={(v) => setConfirmado(CONFIRMACOES.map(() => v === true))}
            />
            <span>Marcar todas as confirmações</span>
          </label>
          <div className="mt-4 space-y-3">
            {CONFIRMACOES.map((c, i) => (
              <label key={c} className="flex cursor-pointer items-start gap-3 text-sm">
                <Checkbox
                  className="mt-0.5"
                  disabled={bloqueado}
                  checked={confirmado[i] ?? false}
                  onCheckedChange={(v) =>
                    setConfirmado((atual) => atual.map((x, j) => (j === i ? v === true : x)))
                  }
                />
                <span>{c}</span>
              </label>
            ))}
          </div>


          {faltando.length > 0 && (
            <div className="mt-5 rounded-xl bg-secondary p-4 text-sm">
              <p className="font-medium">Ainda falta preencher:</p>
              <ul className="mt-2 list-disc pl-5 text-muted-foreground">
                {faltando.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-6 flex flex-wrap gap-3">
            <Button
              variant="outline"
              disabled={bloqueado || salvando}
              onClick={() => salvar(false)}
            >
              {salvando ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Save className="mr-1 h-4 w-4" /> Salvar rascunho
                </>
              )}
            </Button>
            <Button disabled={!podeFinalizar || enviando} onClick={() => salvar(true)}>
              {enviando ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Send className="mr-1 h-4 w-4" />{" "}
                  {form.finalizada ? "Salvar alterações" : "Finalizar e registrar entrega"}
                </>
              )}
            </Button>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Dúvidas ou problemas de acesso: {CONTATO}
          </p>
        </section>
      </div>
    </main>
  );
}
