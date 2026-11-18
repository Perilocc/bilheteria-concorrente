# Projeto final — Bilheteria concorrente

**Paradigmas de Linguagens de Programação · A2 · 3,5 pontos · grupos de até 4 pessoas**

|                                   |                                   |
| :-------------------------------- | :-------------------------------- |
| Formação dos grupos               | até o fim da Aula 7               |
| Entrega do repositório e do vídeo | Blackboard, até a **data da sua turma** (está na atividade do Blackboard) |

## O problema

Abriu a venda de ingressos de um show. Em poucos segundos chegam centenas de pedidos, e muita gente quer
as mesmas poltronas. Cada pedido é cobrado numa operadora de pagamento de outra empresa, que demora, às vezes
falha e às vezes trava.

O sistema de vocês recebe esses pedidos e **não pode**:

- vender a mesma poltrona para duas pessoas;
- cobrar alguém que ficou sem poltrona;
- deixar um pedido parado esperando o pagamento de outro;
- ficar preso para sempre numa operadora travada.

Regras de negócio:

- As poltronas de cada evento são numeradas de 1 até a capacidade.
- Um pedido compra um ou mais ingressos para um evento, um por pessoa (uma família compra junta), e
  cada pessoa escolhe a sua poltrona.
- Estudante, pessoa com deficiência (PcD) e quem tem 60 anos ou mais paga **meia** (metade do preço).
- Sobre a soma dos ingressos entra uma **taxa de serviço de 10%**.

Cada parte do projeto usa um paradigma da disciplina: o preço é **funcional**, o evento é **orientado
a objetos** e a venda é **concorrente**.

## O que vocês recebem

O repositório modelo https://github.com/douglasmeneses/bilheteria-projeto-final, que vira o repositório do grupo:

| Arquivo | O que é |
| :--- | :--- |
| `src/regras.ts`, `preco.ts`, `dominio.ts`, `bilheteria.ts`, `main.ts` | vazios: são os que vocês escrevem |
| `src/tipos.ts` | pronto: todas as interfaces do projeto |
| `src/servidor.ts` | pronto: o servidor HTTP com Express |
| `package.json` e `tsconfig.json` | o projeto já configurado, com Express, `tsx` e TypeScript |
| `GUIA.md` | como instalar e um exemplo de servidor com Express |
| `src/pagamento.ts` | a operadora de pagamento falsa, que demora e falha |
| `src/bench.ts` | dispara 200 pedidos ao mesmo tempo contra o servidor e mede |
| `testes/` | os testes da correção automática |
| `README.md` | as perguntas que o grupo responde |

O `README.md` e os arquivos vazios são para preencher. **Os outros não devem ser alterados:** a correção usa os testes e o
`pagamento.ts` originais.

## O que vocês entregam

| Arquivo em `src/` | Paradigma | Pontos no `npm test` |
| :--- | :--- | ---: |
| `regras.ts` | — | 1 |
| `preco.ts` | Funcional | 3 |
| `dominio.ts` | Orientado a objetos | 3 |
| `bilheteria.ts` | A venda, onde a concorrência aparece | 7 |
| `main.ts` | — | — |

O `servidor.ts` vem pronto e vale 2 pontos: eles aparecem quando a bilheteria funciona.

Mais o `README.md` preenchido e um vídeo
explicando o projeto.

Os testes chamam as funções e classes **pelo nome**. Usem exatamente os nomes de arquivos, funções,
classes e campos deste enunciado.

## Passo a passo

Sigam na ordem. Cada passo termina com o `npm test`, que mostra os pontos que vocês já têm.

### Passo 0 — Criar o projeto

Sigam os passos 0 e 1 do `GUIA.md`.

**Confira:** `npm test` roda e mostra `0 de 16`.

### Passo 1 — Ler os tipos (`tipos.ts`, pronto)

O `tipos.ts` já vem com **todas** as interfaces do projeto. Não precisam escrever nada: leiam o
arquivo, porque os próximos passos usam estes nomes.

| Interface | O que é |
| :--- | :--- |
| `Pessoa` | quem vai usar o ingresso: `nome`, `idade`, `estudante`, `pcd` e a `poltrona` que escolheu |
| `Pedido` | o que chega do cliente: `eventoId` e `ingressos` (lista de `Pessoa`) |
| `Ingresso` | um por pessoa do pedido: `nome`, `poltrona`, `tipo` (`"inteira"` ou `"meia"`) e `valor` |
| `Comprovante` | o que o cliente recebe: `reservaId`, `eventoId`, `ingressos` (lista de `Ingresso`) e `total` |
| `EventoInfo` | os 5 campos que o `info()` do evento devolve: `id`, `nome`, `preco`, `capacidade` e `disponivel` |
| `ConfigBilheteria` | o que o `criarBilheteria` recebe (passo 5) |

**Cuidado:** os dois `ingressos` têm tipos diferentes. No `Pedido` é uma lista de `Pessoa` (quem
vai usar); no `Comprovante` é uma lista de `Ingresso` (o que foi vendido, com tipo e valor).

Se precisarem de outra interface, ela também vai no `tipos.ts`.

### Passo 2 — Meia-entrada (`regras.ts`)

`direitoAMeia(pessoa)` devolve `true` para estudante, PcD ou quem tem 60 anos ou mais, e `false`
para o resto.

**Confira:** `1 de 16`.

### Passo 3 — Preço (`preco.ts`, funcional)

Neste arquivo só entram funções. **Não usem** `let`, `var`, `for`, `while`, `forEach`, `push` nem
`class`: o teste lê o arquivo e tira o ponto. Arredondem em 2 casas decimais, com
`Math.round(valor * 100) / 100` (o `toFixed` devolve texto, não número), em dois lugares: no valor
da meia e **dentro** da função que o `aplicarTaxa` devolve. Sem isso, `aplicarTaxa(0.1)(100)` dá
`110.00000000000001`.

| Função | O que faz | Exemplo |
| :--- | :--- | :--- |
| `valorDoIngresso(precoBase)` | **Fábrica**, como o `criarMultiplicador` da Aula 7: devolve uma função que recebe o tipo e devolve o valor. Inteira = preço; meia = metade. | `valorDoIngresso(80)("meia")` dá `40` |
| `aplicarTaxa(percentual)` | Outra fábrica: devolve uma função que soma a taxa a um valor. | `aplicarTaxa(0.1)(100)` dá `110` |
| `montarIngressos(precoBase, pessoas, temDireitoAMeia)` | Usa `map` para criar um `Ingresso` por pessoa, na mesma ordem, com a poltrona dela. Quem decide se é meia é a função `temDireitoAMeia` recebida (o teste passa outras regras). | preço 100, Ana estudante na poltrona 4 e Beto na 5: Ana poltrona 4, meia, 50; Beto poltrona 5, inteira, 100 |
| `calcularTotal(ingressos)` | Soma os valores com `reduce` e aplica a taxa de 10% chamando o `aplicarTaxa`. | ingressos de 50 e 100 dão `165` |

**Confira:** `4 de 16`.

### Passo 4 — Evento e erros (`dominio.ts`, orientado a objetos)

**Os erros.** Uma classe abstrata `ErroDeNegocio`, filha de `Error`, com um campo `status` (o status
HTTP que o servidor vai responder). O construtor dela recebe a mensagem e o status. Ela tem quatro
filhas, e o construtor de cada filha recebe só a mensagem e chama `super(mensagem, <status>)`:

| Classe | `status` | Quando acontece |
| :--- | ---: | :--- |
| `DadosInvalidosErro` | 400 | pedido ou poltrona inválidos |
| `NaoEncontradoErro` | 404 | o evento não existe |
| `PoltronaOcupadaErro` | 409 | a poltrona já foi vendida |
| `PagamentoErro` | 502 | a operadora não aprovou o pagamento |

Exemplo: `new PoltronaOcupadaErro("já vendida").status` dá `409`.

**A classe `Evento`**, criada com `new Evento(id, nome, preco, capacidade)`. As poltronas vão de 1 até
a `capacidade`, e o evento começa com todas livres. A lista de poltronas vendidas é **privada**: quem
está fora da classe consegue ler `evento.disponivel` (quantas restam), mas não consegue mudar. Usem um
campo `#` com uma lista de números e um `get disponivel()`, como na Aula 4.

| Método | O que faz |
| :--- | :--- |
| `reservar(poltronas)` | Recebe uma lista de números e marca essas poltronas como vendidas. Lista vazia, poltrona que não existe (fora de 1 até a capacidade) ou repetida na mesma lista: `DadosInvalidosErro`. Alguma já vendida: `PoltronaOcupadaErro`. **Tudo ou nada:** se der erro, nenhuma poltrona da lista é marcada. |
| `liberar(poltronas)` | Devolve as poltronas para a venda. Poltrona que não estava vendida: `DadosInvalidosErro`. |
| `info()` | Devolve um objeto com os 5 campos do evento: `id`, `nome`, `preco`, `capacidade` e `disponivel`. |

Dica para o tudo ou nada: confiram todas as poltronas primeiro e só depois marquem.

**Confira:** `7 de 16`.

### Passo 5 — A venda (`bilheteria.ts`, onde a concorrência aparece)

Criem uma classe `Bilheteria`, e uma função `criarBilheteria(config)` que devolve
`new Bilheteria(config)`. O `config` é um `ConfigBilheteria` (está no `tipos.ts`):

| Campo do `config` | O que é |
| :--- | :--- |
| `eventos` | lista de `Evento` |
| `pagar` | a função que cobra na operadora: `await pagar(total)` termina se aprovou e lança erro se falhou |
| `limitePagamentoMs` | quanto tempo esperar a operadora, em milissegundos |

Guardem os três campos e o contador do `reservaId` em campos `#`, como no `Evento`: ninguém de
fora deve conseguir mudar.

**Atenção a dois `reservar` diferentes.** O `evento.reservar(poltronas)` do passo 4 só marca
poltronas. O `bilheteria.reservar(pedido)` deste passo faz a venda inteira e usa o do evento.

A bilheteria tem dois métodos:

- `listarEventos()`: a lista com o `info()` de cada evento.
- `async reservar(pedido)`: faz a venda, nesta ordem:
  1. Confere o pedido: sem a lista `ingressos`, ou com ela vazia, `DadosInvalidosErro`. Procura o
     evento pelo `pedido.eventoId`; se não existe, `NaoEncontradoErro`.
  2. Pega as poltronas do pedido com `pedido.ingressos.map((pessoa) => pessoa.poltrona)` e marca
     com `evento.reservar(poltronas)`. Os erros de poltrona (`DadosInvalidosErro` e
     `PoltronaOcupadaErro`) saem daqui, antes de cobrar.
  3. Monta os ingressos com `montarIngressos(evento.preco, pedido.ingressos, direitoAMeia)` e o
     total com `calcularTotal(ingressos)`.
  4. Cobra o total com `await pagar(total)`.
  5. Devolve o `Comprovante`, com um `reservaId` diferente a cada compra (um contador que soma 1).

Construam em três partes, rodando o `npm test` a cada uma:

| Parte | O que acrescentar | `npm test` |
| :--- | :--- | ---: |
| A | Os 5 passos acima | 12 de 16 |
| B | **Pagamento recusado:** se o `pagar` lançar erro, devolver as poltronas com `evento.liberar(poltronas)` e lançar `PagamentoErro` | 13 de 16 |
| C | **Tempo limite:** copiem a função `comTempoLimite` abaixo para o `bilheteria.ts` e cobrem com `await comTempoLimite(pagar(total), limitePagamentoMs)`. Se o tempo acabar, é como na parte B | 14 de 16 |

A função da parte C. O `Promise.race` devolve o resultado de quem terminar primeiro: a cobrança ou
o relógio, que rejeita depois de `ms` milissegundos.

```ts
function comTempoLimite<T>(promessa: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const limite = new Promise<never>((_, rejeitar) => {
    timer = setTimeout(() => rejeitar(new Error("tempo esgotado")), ms);
  });
  // O finally desliga o relógio quando a cobrança termina antes.
  return Promise.race([promessa, limite]).finally(() => clearTimeout(timer));
}
```

**Onde está a concorrência.** São três trechos, e são eles que vocês explicam no vídeo:

1. as poltronas são marcadas **antes** do `await` do pagamento (passo 2 antes do 4);
2. o tempo limite (parte C);
3. a devolução das poltronas quando o pagamento falha (parte B).

Vocês não precisam de fila nem de trava: enquanto um pedido espera no `await`, o Node já atende os
outros. O teste dispara 200 pedidos ao mesmo tempo, quatro para cada uma de 50 poltronas, e confere
que saíram exatamente 50 vendas e 50 cobranças.

### Passo 6 — Ligar o servidor (`main.ts`)

O `servidor.ts` vem pronto: `criarServidor(bilheteria)` monta o app do Express com duas rotas,
`GET /eventos` (o `listarEventos()`) e `POST /reservas` (o `reservar(req.body)`, que responde 201
com o comprovante). Um `ErroDeNegocio` vira uma resposta com o `status` dele. Leiam o arquivo: ele
entra no vídeo (parte 7). O `GUIA.md` explica cada peça do Express.

O `main.ts` é de vocês. Ele cria três eventos (o de `id` 1 com 100 poltronas, que é o que o bench
usa; os outros dois ficam à escolha do grupo), a operadora com
`criarPagamentoFalso({ latenciaMs: 80, taxaDeFalha: 0.1 })`, a bilheteria com
`limitePagamentoMs: 500`, e chama `criarServidor(bilheteria).listen(3000)`.

**Confira:** `16 de 16`. Depois, `npm start` num terminal e `npm run bench` noutro. O bench manda 200
pedidos, dois para cada poltrona do evento 1. Saem perto de 90 vendidos, 100 recusados por poltrona
ocupada (409, o segundo pedido de cada poltrona) e uns 10 erros de pagamento (502), porque a
operadora falsa falha 10% das vezes. Para rodar o bench de novo, parem o `npm start` (Ctrl+C) e
subam outra vez: as poltronas vendidas continuam vendidas enquanto ele está no ar.

### Passo 7 — README

Preencham o `README.md`: integrantes, as perguntas e a tabela do bench.

## Avaliação (3,5)

### Código: 2,5

`npm test` tem 16 pontos. Nota = 2,5 × pontos ÷ 16. Ela roda sobre o **último commit do repositório
até o prazo**, com os testes e o `pagamento.ts` originais (mexer nos testes não muda a nota).

### Vídeo: 1,0

O grupo grava **um vídeo só**, com a tela compartilhada, explicando o projeto. Não há apresentação em sala.

**Regras do vídeo**

- **Basta um integrante falar.** O grupo escolhe quem apresenta.
- **A tela mostra o código o tempo todo** em que ele está sendo explicado, com fonte grande o
  bastante para ler. Slide no lugar do código não conta.
- **Explicar é dizer o que cada trecho faz e por quê.** Ler o código em voz alta, ou ler um texto
  pronto, não conta como explicação.
- O vídeo é gravado com o código da entrega. No começo, mostrem o `git log -1` na tela.
- Link no YouTube (**não listado**) ou no Google Drive (**qualquer pessoa com o link pode ver**).
  Link que não abre vale 0.

**Roteiro obrigatório, nesta ordem.**

| # | Parte | O que tem que aparecer na tela e ser explicado |
| :--- | :--- | :--- |
| 1 | Abertura | Nome de cada integrante e o que cada um fez. `git log -1` na tela. |
| 2 | Projeto rodando | `npm test` com os pontos; `npm start`; um `GET /eventos` e um `POST /reservas` (com `curl` ou outra ferramenta) |
| 3 | OO: `dominio.ts` | A hierarquia de erros e por que cada erro guarda o próprio `status`; como o `Evento` impede que alguém de fora altere as poltronas, mostrando o que acontece se tentar; o tudo ou nada do `reservar` |
| 4 | Funcional: `preco.ts` | As duas fábricas de funções e o que elas devolvem; o `map` e o `reduce`; por que essas funções são puras e o que isso facilita |
| 5 | Concorrente: `bilheteria.ts` | O passo a passo do `reservar`; onde está o `await` e por que as poltronas são marcadas antes dele; tempo limite; devolução das poltronas quando o pagamento falha |
| 6 | Demonstração do erro | Mudar o código para marcar as poltronas só **depois** do pagamento, rodar o `npm test`, mostrar os testes que falham (gente cobrada por poltrona que já tinha dono), explicar por que aconteceu e desfazer |
| 7 | Servidor: `servidor.ts` | As rotas; como um `ErroDeNegocio` vira o status HTTP da resposta |
| 8 | Bench | O bench rodando e o que os números mostram |

**Critérios**

| Critério | Pontos |
| :--- | ---: |
| Partes 1, 2 e 8: projeto rodando e bench | 0,25 |
| Partes 3, 4 e 7: explicação do código OO, funcional e do servidor, com o porquê de cada paradigma | 0,25 |
| Partes 5 e 6: concorrência explicada e o erro demonstrado | 0,25 |
| `README.md` completo (perguntas respondidas e tabela do bench preenchida) | 0,25 |

## Entrega

1. Um integrante cria no GitHub um repositório **público e vazio** (sem README), clona o modelo e
   envia para o repositório do grupo:

   ```bash
   git clone https://github.com/douglasmeneses/bilheteria-projeto-final.git
   cd bilheteria-projeto-final
   git remote set-url origin https://github.com/usuario/repositorio-do-grupo.git
   git push -u origin main
   ```

   Depois adiciona os colegas como colaboradores, e cada um clona o repositório do grupo.
2. Cada um faz commits com a **própria conta**: a correção lista quem contribuiu. **Quem não tem
   commit no repositório fica com 0 no projeto** (código e vídeo).
3. Coloquem o link do vídeo no começo do `README.md`.
4. Até o prazo, **um** integrante envia no Blackboard o nome do grupo, o link do repositório, o
   link do vídeo e o nome completo e o RGM de cada integrante. Antes de enviar, abram os dois links
   numa janela anônima do navegador: se pedir login, a correção também não consegue abrir.
