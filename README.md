# Bilheteria concorrente

Projeto final de Paradigmas de Linguagens de Programação. Enunciado completo no Blackboard.

Os arquivos de `src/` que vocês escrevem já existem, vazios; o `tipos.ts` e o `servidor.ts` vêm prontos. O que vai em cada um está no passo
indicado do enunciado:

| Arquivo | Passo do enunciado |
| :--- | :--- |
| `src/tipos.ts` (pronto) | 1: os tipos |
| `src/regras.ts` | 2: meia-entrada |
| `src/preco.ts` | 3: preço (funcional) |
| `src/dominio.ts` | 4: evento e erros (orientado a objetos) |
| `src/bilheteria.ts` | 5: a venda, onde a concorrência aparece |
| `src/servidor.ts` (pronto) e `src/main.ts` | 6: ligar o servidor |

Não alterem `src/pagamento.ts`, `src/servidor.ts`, `src/bench.ts` nem `testes/`: a correção usa os originais.

Para começar, sigam o `GUIA.md`. Depois dele, os comandos são:

```bash
npm install
npm test          # correção automática: mostra os pontos
npm start         # serviço em http://localhost:3000
npm run bench     # com o serviço no ar: 200 pedidos simultâneos no evento 1, dois por poltrona
```

Exemplo de pedido:

```bash
curl -X POST localhost:3000/reservas -H 'Content-Type: application/json' \
  -d '{"eventoId":1,"ingressos":[{"nome":"Ana","idade":20,"estudante":true,"pcd":false,"poltrona":7}]}'
```

---

## Preencham (avaliado no vídeo)

**Link do vídeo:** 

### Integrantes

| Nome | Usuário do GitHub | Parte principal |
| :--- | :--- | :--- |
| Júlio César | juliowccs | |
| João Gabriel | jg0briel | |
| Perilo de Oliveira | Perilocc | |

### Decisões

1. **Concorrência.** Como vocês garantem que duas pessoas não ficam com a mesma poltrona? Onde estava o
   `await` perigoso?

   A reserva é realizada antes da chamada de pagamento assincrona, assim quando uma solicitação chega, as poltronas são marcadas como ocupadas antes que o código execute o await do pagamento.
   O `await` perigoso seria se fosse executado antes da reseva das poltronas
   , assim eles teriam duas ou mais solicitações simultâneas aguardando a resposta da operadora.

2. **OO.** O que o `Evento` esconde e por quê? Por que o `reservar` é tudo ou nada? Por que os erros são uma hierarquia de classes?

   A classe `Evento` encapsula o controle das poltronas vendidas, impedindo que outras partes do sistema alterem diretamente esse estado.

   O método reservar trabalha com a estratégia tudo ou nada: primeiro valida todas as poltronas solicitadas e somente depois realiza a reserva. Assim, evita que um pedido seja parcialmente aceito.

   Porque uma vez os erros sendo uma hierarquia de classe ela facilita o tratamento dos erros e permite associar cada situação ao seu respectivo código HTTP.

3. **Funcional.** O que ganhamos com `preco.ts` puro? Como vocês testariam ele sem subir o servidor?

   Ele calcula os valores dos ingressos, aplicar meia-entrada e adicionar a taxa de serviço.
   Utilizando map e reduce para evitar alterações nos dados recebidos, tornar os calculos mais organizados e com eles é possível testar as funções diretamenteo sem precisar iniciar o servidor ou realizar requisições HTTP.

4. **Se fosse em outro paradigma.** Escolham uma das partes e expliquem como ficaria em outro
   paradigma, e se ficaria melhor ou pior.
5. **Concorrente × paralelo.** O Node roda o JavaScript numa linha só: os pedidos de vocês são
   concorrentes, não paralelos. O que mudaria se a venda rodasse em vários núcleos ao mesmo tempo?

### Resultados do bench

| Cenário | Pedidos | Tempo (ms) | Vendidos | Poltrona ocupada | Falha de pagamento |
| :--- | ---: | ---: | ---: | ---: | ---: |
| Padrão (`main.ts`) | 200 | 270 | 48 | 150 | 2 |

O bench ocupa as poltronas do evento 1: para rodar de novo, parem o `npm start` (Ctrl+C) e subam outra
vez.

O que os números mostram: 

O teste demonstrou que o sistema conseguiu processar 200 solicitações em aproximadamente 270 milissegundos, com uma vazão aproximada de 740 pedidos por segundo.

Das 200 solicitações realizadas, 48 foram concluídas com sucesso, 150 foram recusadas porque as poltronas já estavam ocupadas e 2 tiveram falha no pagamento.
