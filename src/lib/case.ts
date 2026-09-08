export const DRIVE_URL =
  "https://drive.google.com/drive/folders/17eJOtLW3E6e0SLHpC4QVEwg50cVBY_Aw?usp=sharing";

export const CONTATO = "lucascardososilva@usp.br";

/** Prazo final para edições: 20/09/2026, 23h59 (horário de Brasília). */
export const PRAZO = new Date("2026-09-21T02:59:00Z");

export const PRAZO_LABEL = "20/09/2026, 23h59";

export type Pergunta = {
  id: "q1" | "q2" | "q3" | "q4" | "q5";
  etapa: string;
  titulo: string;
  enunciado: string;
  ajuda?: string;
  limite: number;
};

export const PERGUNTAS: Pergunta[] = [
  {
    id: "q1",
    etapa: "Observação",
    titulo: "O que você observou nos materiais?",
    enunciado:
      "Apresente até três informações que considera importantes para compreender o caso. Explique em qual documento ou dado encontrou cada informação.",
    ajuda: "Não é necessário resumir todos os documentos.",
    limite: 1500,
  },
  {
    id: "q2",
    etapa: "Desafio",
    titulo: "Qual problema você decidiu resolver?",
    enunciado:
      "Explique quem enfrenta esse problema, o que essa pessoa precisa fazer atualmente, qual dificuldade encontra e por que vale a pena resolvê-la.",
    limite: 2000,
  },
  {
    id: "q3",
    etapa: "Hipótese testável",
    titulo: "Qual é a sua hipótese e como você a testaria?",
    enunciado:
      "Escreva uma suposição que possa estar certa ou errada e explique um teste simples para verificá-la.",
    ajuda:
      "Modelo opcional: “Acreditamos que ____. Para verificar, faríamos ____. A hipótese ganharia força se ____.”",
    limite: 1500,
  },
  {
    id: "q4",
    etapa: "Solução",
    titulo: "Como uma solução com inteligência artificial ou dados poderia ajudar?",
    enunciado:
      "Explique quem utilizaria a solução, quais informações entrariam, o que a ferramenta faria e qual resultado entregaria.",
    ajuda: "Não é necessário explicar tecnicamente como programá-la.",
    limite: 2500,
  },
  {
    id: "q5",
    etapa: "Aplicação prática",
    titulo: "Como sua solução funcionaria no caso analisado?",
    enunciado:
      "Mostre o que a solução encontraria ou organizaria, qual próximo passo sugeriria e quais dúvidas ou decisões ainda precisariam de uma pessoa.",
    limite: 2000,
  },
];

export const CONFIRMACOES = [
  "Li e revisei minhas respostas.",
  "Confirmo que sou responsável pela entrega e pelas fontes utilizadas.",
  `Entendo que poderei revisar minha entrega até ${PRAZO_LABEL} e que depois disso ela não poderá mais ser alterada.`,
];

