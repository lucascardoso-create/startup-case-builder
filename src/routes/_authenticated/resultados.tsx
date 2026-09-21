import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Download,
  FileDown,
  FileText,
  Loader2,
  LogOut,
  Search,
  Users,
} from "lucide-react";

import { toast } from "sonner";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { obterArquivoAdmin, listarResultados } from "@/lib/admin.functions";
import { PERGUNTAS } from "@/lib/case";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/resultados")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Resultados · Administração SanFran iLab" },
      { name: "description", content: "Painel privado de acompanhamento das entregas da segunda fase." },
      { property: "og:title", content: "Resultados · Administração SanFran iLab" },
      { property: "og:description", content: "Painel privado de acompanhamento das entregas." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Resultados,
});

type Resultado = Awaited<ReturnType<typeof listarResultados>>[number];
type Filtro = "todos" | "finalizados" | "rascunhos" | "sem_resposta";

function formatarData(valor: string | null | undefined) {
  if (!valor) return "—";
  return new Date(valor).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function Resultados() {
  const navigate = useNavigate();
  const carregar = useServerFn(listarResultados);
  const abrirArquivo = useServerFn(obterArquivoAdmin);
  const [resultados, setResultados] = useState<Resultado[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [arquivoAbrindo, setArquivoAbrindo] = useState<string | null>(null);

  useEffect(() => {
    let ativo = true;
    carregar()
      .then((dados) => {
        if (ativo) setResultados(dados);
      })
      .catch(() => {
        toast.error("Você não tem permissão para acessar esta área.");
        navigate({ to: "/painel", replace: true });
      })
      .finally(() => {
        if (ativo) setCarregando(false);
      });
    return () => {
      ativo = false;
    };
  }, [carregar, navigate]);

  const resumo = useMemo(() => {
    const responderam = resultados.filter((item) => item.entrega).length;
    const finalizados = resultados.filter((item) => item.entrega?.finalizada).length;
    return { total: resultados.length, responderam, finalizados, rascunhos: responderam - finalizados };
  }, [resultados]);

  const visiveis = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return resultados.filter((item) => {
      const corresponde = !termo || item.email.toLowerCase().includes(termo) || item.nome?.toLowerCase().includes(termo);
      if (!corresponde) return false;
      if (filtro === "finalizados") return item.entrega?.finalizada === true;
      if (filtro === "rascunhos") return Boolean(item.entrega && !item.entrega.finalizada);
      if (filtro === "sem_resposta") return !item.entrega;
      return true;
    });
  }, [busca, filtro, resultados]);

  function baixar(nomeArquivo: string, conteudo: string, tipo: string) {
    const url = URL.createObjectURL(new Blob([conteudo], { type: tipo }));
    const link = document.createElement("a");
    link.href = url;
    link.download = nomeArquivo;
    link.click();
    URL.revokeObjectURL(url);
  }

  function exportarJson() {
    const dados = visiveis.map((item) => ({
      nome: item.nome,
      email: item.email,
      situacao: item.entrega?.finalizada ? "finalizado" : item.entrega ? "rascunho" : "sem_resposta",
      atualizado_em: item.entrega?.updated_at ?? null,
      enviado_em: item.entrega?.enviada_em ?? null,
      usou_ia: item.entrega?.usou_ia ?? null,
      detalhes_ia: item.entrega?.ia_detalhes ?? "",
      complemento: item.entrega?.link_complementar ?? "",
      arquivo: item.entrega?.arquivo_nome ?? null,
      respostas: PERGUNTAS.map((pergunta) => ({
        etapa: pergunta.etapa,
        pergunta: pergunta.titulo,
        enunciado: pergunta.enunciado,
        resposta: item.entrega?.[pergunta.id] ?? "",
      })),
    }));
    baixar(
      `resultados-sanfran-ilab-${new Date().toISOString().slice(0, 10)}.json`,
      JSON.stringify({ gerado_em: new Date().toISOString(), candidatos: dados }, null, 2),
      "application/json",
    );
    toast.success("Arquivo exportado para análise.");
  }

  function exportarCsv() {
    const escapar = (valor: unknown) => `"${String(valor ?? "").replace(/"/g, '""')}"`;
    const cabecalho = [
      "nome",
      "email",
      "situacao",
      "atualizado_em",
      "enviado_em",
      "usou_ia",
      "detalhes_ia",
      "complemento",
      "arquivo",
      ...PERGUNTAS.map((pergunta) => pergunta.etapa),
    ];
    const linhas = visiveis.map((item) =>
      [
        item.nome,
        item.email,
        item.entrega?.finalizada ? "finalizado" : item.entrega ? "rascunho" : "sem_resposta",
        item.entrega?.updated_at ?? "",
        item.entrega?.enviada_em ?? "",
        item.entrega?.usou_ia === null || item.entrega?.usou_ia === undefined
          ? ""
          : item.entrega.usou_ia
            ? "sim"
            : "nao",
        item.entrega?.ia_detalhes ?? "",
        item.entrega?.link_complementar ?? "",
        item.entrega?.arquivo_nome ?? "",
        ...PERGUNTAS.map((pergunta) => item.entrega?.[pergunta.id] ?? ""),
      ]
        .map(escapar)
        .join(","),
    );
    baixar(
      `resultados-sanfran-ilab-${new Date().toISOString().slice(0, 10)}.csv`,
      [cabecalho.map(escapar).join(","), ...linhas].join("\n"),
      "text/csv;charset=utf-8",
    );
    toast.success("Planilha exportada para análise.");
  }

  async function onAbrirArquivo(entregaId: string) {
    setArquivoAbrindo(entregaId);
    try {
      const { url } = await abrirArquivo({ data: { entregaId } });
      window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      toast.error("Não foi possível abrir o arquivo.");
    } finally {
      setArquivoAbrindo(null);
    }
  }

  async function sair() {
    await supabase.auth.signOut();
    navigate({ to: "/entrar", replace: true });
  }


  if (carregando) {
    return <main className="grid min-h-screen place-items-center bg-background"><Loader2 className="h-7 w-7 animate-spin text-primary" /></main>;
  }

  return (
    <main className="min-h-screen bg-background pb-16 text-foreground">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <p className="font-display text-lg">SanFran iLab</p>
            <p className="text-xs text-muted-foreground">Administração · Resultados</p>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm"><Link to="/painel"><ArrowLeft className="mr-1 h-4 w-4" /> Minha entrega</Link></Button>
            <Button variant="ghost" size="sm" onClick={sair}><LogOut className="mr-1 h-4 w-4" /> Sair</Button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 pt-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase text-primary">Acompanhamento privado</p>
            <h1 className="mt-2 text-4xl uppercase">Resultados da segunda fase</h1>
            <p className="mt-3 max-w-2xl text-muted-foreground">Consulte o progresso, as respostas e os materiais enviados pelos candidatos.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={exportarJson} disabled={visiveis.length === 0}>
              <FileDown className="mr-1 h-4 w-4" /> Exportar para IA (JSON)
            </Button>
            <Button variant="outline" onClick={exportarCsv} disabled={visiveis.length === 0}>
              <FileDown className="mr-1 h-4 w-4" /> Exportar planilha (CSV)
            </Button>
          </div>
        </div>


        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Candidatos", valor: resumo.total, icon: Users },
            { label: "Responderam", valor: resumo.responderam, icon: FileText },
            { label: "Finalizados", valor: resumo.finalizados, icon: CheckCircle2 },
            { label: "Rascunhos", valor: resumo.rascunhos, icon: Clock3 },
          ].map(({ label, valor, icon: Icon }) => (
            <div key={label} className="rounded-lg border border-border bg-card p-5">
              <div className="flex items-center justify-between"><p className="text-sm text-muted-foreground">{label}</p><Icon className="h-4 w-4 text-primary" /></div>
              <p className="mt-2 font-display text-3xl">{valor}</p>
            </div>
          ))}
        </section>

        <section className="mt-8">
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
            <div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={busca} onChange={(e) => setBusca(e.target.value)} className="pl-9" placeholder="Buscar por nome ou e-mail" /></div>
            <div className="flex flex-wrap gap-2">
              {([ ["todos", "Todos"], ["finalizados", "Finalizados"], ["rascunhos", "Rascunhos"], ["sem_resposta", "Sem resposta"] ] as const).map(([valor, label]) => (
                <Button key={valor} size="sm" variant={filtro === valor ? "default" : "outline"} onClick={() => setFiltro(valor)}>{label}</Button>
              ))}
            </div>
          </div>

          <div className="mt-5 rounded-lg border border-border bg-card px-5">
            {visiveis.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">Nenhum candidato encontrado.</p>
            ) : (
              <Accordion type="single" collapsible>
                {visiveis.map((item) => (
                  <AccordionItem key={item.email} value={item.email}>
                    <AccordionTrigger className="gap-4 no-underline hover:no-underline">
                      <div className="grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)_auto] items-center gap-4 pr-2 text-left">
                        <div className="min-w-0"><p className="truncate font-medium">{item.nome || "Nome não informado"}</p><p className="truncate text-xs font-normal text-muted-foreground">{item.email}</p></div>
                        <Badge variant={item.entrega?.finalizada ? "default" : item.entrega ? "secondary" : "outline"}>{item.entrega?.finalizada ? "Finalizado" : item.entrega ? "Rascunho" : "Sem resposta"}</Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      {!item.entrega ? (
                        <p className="rounded-md bg-secondary p-4 text-sm text-muted-foreground">Este candidato ainda não iniciou uma resposta.</p>
                      ) : (
                        <div className="space-y-6 pt-2">
                          <div className="grid gap-3 text-sm sm:grid-cols-3"><div><p className="text-xs text-muted-foreground">Última atualização</p><p className="mt-1 font-medium">{formatarData(item.entrega.updated_at)}</p></div><div><p className="text-xs text-muted-foreground">Envio final</p><p className="mt-1 font-medium">{formatarData(item.entrega.enviada_em)}</p></div><div><p className="text-xs text-muted-foreground">Uso de IA</p><p className="mt-1 font-medium">{item.entrega.usou_ia === null ? "Não informado" : item.entrega.usou_ia ? "Sim" : "Não"}</p></div></div>
                          <div className="space-y-4">{PERGUNTAS.map((pergunta) => <div key={pergunta.id}><p className="text-xs font-bold uppercase text-primary">{pergunta.etapa}</p><p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed">{item.entrega?.[pergunta.id] || "Sem resposta"}</p></div>)}</div>
                          {item.entrega.usou_ia && <div><p className="text-xs font-bold uppercase text-primary">Detalhes do uso de IA</p><p className="mt-1 whitespace-pre-wrap text-sm">{item.entrega.ia_detalhes || "Sem detalhes"}</p></div>}
                          {item.entrega.link_complementar && <div><p className="text-xs font-bold uppercase text-primary">Complemento</p><p className="mt-1 whitespace-pre-wrap text-sm">{item.entrega.link_complementar}</p></div>}
                          {item.entrega.arquivo_nome && <div className="flex items-center justify-between gap-3 rounded-md bg-secondary p-4"><div className="min-w-0"><p className="text-xs text-muted-foreground">Arquivo enviado</p><p className="truncate text-sm font-medium">{item.entrega.arquivo_nome}</p></div><Button size="sm" onClick={() => onAbrirArquivo(item.entrega!.id)} disabled={arquivoAbrindo === item.entrega.id}>{arquivoAbrindo === item.entrega.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Download className="mr-1 h-4 w-4" /> Abrir</>}</Button></div>}
                        </div>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}