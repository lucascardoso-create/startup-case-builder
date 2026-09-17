# Melhorias mobile e painel administrativo privado

## Objetivo
Tornar a experiência confortável em celulares e criar uma área de acompanhamento exclusiva para `lucascardososilva@usp.br`, sem expor respostas ou arquivos aos demais candidatos.

## O que será alterado

### Experiência mobile
- Reorganizar o contador superior para caber em telas estreitas, com números e textos legíveis.
- Ajustar cabeçalhos, botões, blocos de apresentação e espaçamentos da página inicial e do login.
- Adaptar o formulário: cartões mais compactos, títulos sem cortes, seletores e ações em largura total quando necessário.
- Manter o estado de salvamento visível no celular e evitar barras, textos ou botões fora da tela.
- Corrigir a diferença do contador entre carregamento inicial e navegador, eliminando o erro visual atual.

### Painel administrativo
- Criar uma página privada de resultados com resumo de participantes, rascunhos e entregas finalizadas.
- Exibir por candidato: e-mail, situação, última atualização, respostas, uso de IA, complemento e arquivo enviado.
- Permitir abrir o arquivo por um link temporário e protegido.
- Oferecer busca e filtros simples para localizar candidatos e separar finalizados de rascunhos.
- Mostrar o acesso ao painel somente para a conta administradora.

### Proteção dos dados
- Registrar a permissão administrativa em uma tabela separada de funções, vinculada à conta de Lucas.
- Validar a permissão no servidor em todas as consultas e solicitações de arquivos; esconder um botão não será tratado como proteção.
- Manter os candidatos limitados às próprias respostas pelas regras já existentes.
- Não enviar a lista completa de resultados ao navegador de contas comuns, inclusive por chamadas manuais na aba de inspeção.

## Validação
- Conferir página inicial, login e formulário em celular e desktop, verificando cortes e sobreposições.
- Testar a área administrativa com a conta autorizada.
- Confirmar que uma conta comum e uma chamada direta não conseguem acessar resultados nem arquivos de terceiros.
