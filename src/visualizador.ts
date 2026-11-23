import { EventEmitter } from "node:events";
import type { Express, Request, Response } from "express";
import type { Bilheteria } from "./bilheteria.ts";
import { ErroDeNegocio } from "./dominio.ts";
import type { Pedido } from "./tipos.ts";

export type EventoVisual =
    | { tipo: "reservando"; eventoId: number; poltronas: number[] }
    | { tipo: "vendida"; eventoId: number; poltronas: number[]; total: number; reservaId: number }
    | { tipo: "liberada"; eventoId: number; poltronas: number[]; motivo: string }
    | { tipo: "ocupada"; eventoId: number; poltronas: number[] }
    | { tipo: "erro"; eventoId: number; status: number; mensagem: string };

export function registrarVisualizador(app: Express, bilheteria: Bilheteria, onReset?: () => void) {
    const emissor = new EventEmitter();
    emissor.setMaxListeners(100);

    const reservarOriginal = bilheteria.reservar.bind(bilheteria);
    bilheteria.reservar = async (pedido: Pedido) => {
        const poltronas = Array.isArray(pedido?.ingressos) ? pedido.ingressos.map((p) => p.poltrona) : [];

        if (poltronas.length > 0) {
            emissor.emit("evento", {
                tipo: "reservando",
                eventoId: pedido.eventoId,
                poltronas
            } satisfies EventoVisual);
        }

        try {
            const comprovante = await reservarOriginal(pedido);
            emissor.emit("evento", {
                tipo: "vendida",
                eventoId: pedido.eventoId,
                poltronas,
                total: comprovante.total,
                reservaId: comprovante.reservaId
            } satisfies EventoVisual);
            return comprovante;
        } catch (erro) {
            if (erro instanceof ErroDeNegocio) {
                if (erro.status === 409) {
                    emissor.emit("evento", {
                        tipo: "ocupada",
                        eventoId: pedido.eventoId,
                        poltronas
                    } satisfies EventoVisual);
                } else if (erro.status === 502) {
                    emissor.emit("evento", {
                        tipo: "liberada",
                        eventoId: pedido.eventoId,
                        poltronas,
                        motivo: erro.message
                    } satisfies EventoVisual);
                } else {
                    emissor.emit("evento", {
                        tipo: "erro",
                        eventoId: pedido.eventoId,
                        status: erro.status,
                        mensagem: erro.message
                    } satisfies EventoVisual);
                }
            } else {
                emissor.emit("evento", {
                    tipo: "liberada",
                    eventoId: pedido.eventoId,
                    poltronas,
                    motivo: erro instanceof Error ? erro.message : "Erro inesperado"
                } satisfies EventoVisual);
            }
            throw erro;
        }
    };

    app.get("/visual/stream", (req: Request, res: Response) => {
        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");
        res.flushHeaders();

        const enviar = (ev: EventoVisual) => {
            res.write(`data: ${JSON.stringify(ev)}\n\n`);
        };

        emissor.on("evento", enviar);
        req.on("close", () => {
            emissor.off("evento", enviar);
        });
    });

    app.post("/visual/reset", (_req: Request, res: Response) => {
        onReset?.();
        res.json({ ok: true });
    });

    app.get("/visual", (_req: Request, res: Response) => {
        res.type("html").send(HTML_DASHBOARD);
    });
}

const HTML_DASHBOARD = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Bilheteria Concorrente — Ao Vivo</title>
  <style>
    :root {
      --bg: #08090b;
      --card: #0e1014;
      --border: #232730;
      --text: #e2e8f0;
      --muted: #64748b;
      --livre: #334155;
      --pagando: #f59e0b;
      --vendida: #22c55e;
      --liberada: #ef4444;
      --accent: #f59e0b;
    }
    * { box-sizing: border-box; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }
    body { margin: 0; padding: 20px; background: var(--bg); color: var(--text); }
    .container { max-width: 1020px; margin: 0 auto; }
    header {
      display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 12px;
      margin-bottom: 16px; padding: 12px 16px; background: var(--card); border: 1px solid var(--border);
    }
    h1 { margin: 0; font-size: 1.05rem; letter-spacing: 0.08em; text-transform: uppercase; }
    .badge {
      display: inline-block; margin-left: 8px; padding: 2px 6px; font-size: 0.72rem;
      background: rgba(34, 197, 94, 0.12); border: 1px solid rgba(34, 197, 94, 0.4); color: #4ade80;
    }
    .controls { display: flex; gap: 8px; align-items: center; }
    input[type="number"] {
      width: 84px; padding: 7px 10px; border-radius: 2px; border: 1px solid var(--border);
      background: #08090b; color: var(--text); font-weight: 700; font-size: 0.85rem;
    }
    button {
      background: #f8fafc; color: #08090b; border: 1px solid #f8fafc; padding: 7px 14px;
      border-radius: 2px; font-weight: 700; font-size: 0.8rem; text-transform: uppercase;
      letter-spacing: 0.05em; cursor: pointer; transition: opacity .15s;
    }
    button:hover { opacity: 0.85; }
    button:disabled { opacity: 0.4; cursor: not-allowed; }
    #btn-limpar { background: transparent; color: var(--text); border: 1px solid var(--border); }
    .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 10px; margin-bottom: 16px; }
    .stat { background: var(--card); padding: 12px 14px; border: 1px solid var(--border); }
    .stat .label { font-size: 0.7rem; color: var(--muted); text-transform: uppercase; letter-spacing: 0.08em; }
    .stat .value { font-size: 1.5rem; font-weight: 700; margin-top: 6px; }
    .legend { display: flex; gap: 16px; flex-wrap: wrap; margin-bottom: 12px; font-size: 0.78rem; color: var(--muted); text-transform: uppercase; }
    .legend span { display: inline-flex; align-items: center; gap: 6px; }
    .dot { width: 10px; height: 10px; border-radius: 1px; display: inline-block; }
    .grid {
      display: flex; flex-direction: column; gap: 10px;
      background: var(--card); padding: 20px; border: 1px solid var(--border);
    }
    .screen-wrap {
      display: flex; flex-direction: column; align-items: center; margin-bottom: 14px;
    }
    .screen-bar {
      width: 72%; height: 2px;
      background: linear-gradient(90deg, transparent, #64748b, transparent);
      box-shadow: 0 4px 16px rgba(100, 116, 139, 0.35);
    }
    .screen-label {
      margin-top: 8px; font-size: 0.68rem; letter-spacing: 0.25em; color: var(--muted); text-transform: uppercase;
    }
    .seat-row {
      display: flex; align-items: center; justify-content: center; gap: 12px;
    }
    .row-label {
      width: 18px; text-align: center; font-size: 0.75rem; font-weight: 700; color: var(--muted);
    }
    .row-seats {
      display: flex; align-items: center; gap: 6px;
    }
    .aisle { width: 18px; }
    .seat {
      position: relative; width: 32px; height: 26px;
      display: flex; align-items: center; justify-content: center;
      border-radius: 3px 3px 2px 2px; font-weight: 700; font-size: 0.68rem;
      background: #14171d; border: 1px solid #2d333f; color: #64748b;
      transition: transform 0.12s, background 0.15s, border-color 0.15s;
    }
    .seat::before, .seat::after {
      content: ""; position: absolute; bottom: 2px; width: 3px; height: 12px;
      background: inherit; border: 1px solid rgba(255,255,255,0.08);
    }
    .seat::before { left: -3px; }
    .seat::after { right: -3px; }
    .seat.pagando {
      background: rgba(245, 158, 11, 0.2); border-color: var(--pagando); color: #fbbf24;
      transform: scale(1.08);
    }
    .seat.vendida {
      background: rgba(34, 197, 94, 0.18); border-color: var(--vendida); color: #4ade80;
    }
    .seat.liberada {
      background: rgba(239, 68, 68, 0.22); border-color: var(--liberada); color: #f87171;
      transform: scale(0.92);
    }
    .history { margin-top: 16px; background: var(--card); padding: 14px 16px; border: 1px solid var(--border); }
    .history h2 {
      margin: 0 0 12px 0; font-size: 0.78rem; color: var(--text); text-transform: uppercase;
      letter-spacing: 0.08em; border-left: 2px solid var(--accent); padding-left: 8px;
    }
    .history-list { display: flex; flex-direction: column; gap: 6px; }
    .history-item {
      display: flex; flex-wrap: wrap; justify-content: space-between; gap: 8px;
      padding: 8px 10px; border: 1px solid #1b1f27; background: #08090b; font-size: 0.8rem;
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div>
        <h1>Bilheteria Concorrente</h1>
        <small id="status-sse" style="color: var(--muted)">Conectando ao stream...</small>
      </div>
      <div class="controls">
        <input id="input-pedidos" type="number" value="100" min="1" max="1000" title="Número de pedidos simultâneos" />
        <button id="btn-simular">Simular pedidos</button>
        <button id="btn-limpar" style="background: #334155;">Limpar bilheteria</button>
      </div>
    </header>

    <div class="stats">
      <div class="stat"><div class="label">Disponíveis</div><div class="value" id="cnt-disp">-</div></div>
      <div class="stat"><div class="label">Vendidas (201)</div><div class="value" id="cnt-201" style="color: #60a5fa">0</div></div>
      <div class="stat"><div class="label">Ocupadas (409)</div><div class="value" id="cnt-409" style="color: #facc15">0</div></div>
      <div class="stat"><div class="label">Falha/Timeout (502)</div><div class="value" id="cnt-502" style="color: #f87171">0</div></div>
    </div>

    <div class="legend">
      <span><i class="dot" style="background: var(--livre)"></i> Livre</span>
      <span><i class="dot" style="background: var(--pagando)"></i> Pagando</span>
      <span><i class="dot" style="background: var(--vendida)"></i> Vendida</span>
      <span><i class="dot" style="background: var(--liberada)"></i> Devolvida (erro)</span>
    </div>

    <div class="grid" id="grid"></div>

    <div class="history">
      <h2>Histórico de simulações</h2>
      <div class="history-list" id="history-list">
        <div style="color: var(--muted); font-size: 0.85rem;">Nenhuma simulação executada ainda.</div>
      </div>
    </div>
  </div>

  <script>
    const grid = document.getElementById("grid");
    const statusSse = document.getElementById("status-sse");
    const btnSimular = document.getElementById("btn-simular");
    const btnLimpar = document.getElementById("btn-limpar");
    const inputPedidos = document.getElementById("input-pedidos");
    const historyList = document.getElementById("history-list");
    const cntDisp = document.getElementById("cnt-disp");
    const cnt201 = document.getElementById("cnt-201");
    const cnt409 = document.getElementById("cnt-409");
    const cnt502 = document.getElementById("cnt-502");

    let capacidade = 50;
    let eventoId = 1;
    let stats = { 201: 0, 409: 0, 502: 0 };
    let simCount = 0;
    const seats = new Map();

    function renderGrid(cap) {
      grid.innerHTML = \`
        <div class="screen-wrap">
          <div class="screen-bar"></div>
          <div class="screen-label">Palco / Tela</div>
        </div>
      \`;
      seats.clear();
      const porFileira = 10;
      const totalFileiras = Math.ceil(cap / porFileira);

      for (let f = 0; f < totalFileiras; f++) {
        const letra = String.fromCharCode(65 + f);
        const rowEl = document.createElement("div");
        rowEl.className = "seat-row";

        const labelLeft = document.createElement("span");
        labelLeft.className = "row-label";
        labelLeft.textContent = letra;

        const labelRight = document.createElement("span");
        labelRight.className = "row-label";
        labelRight.textContent = letra;

        const seatsWrap = document.createElement("div");
        seatsWrap.className = "row-seats";

        for (let c = 0; c < porFileira; c++) {
          const num = f * porFileira + c + 1;
          if (num > cap) break;
          if (c === 5) {
            const aisle = document.createElement("div");
            aisle.className = "aisle";
            seatsWrap.appendChild(aisle);
          }
          const el = document.createElement("div");
          el.className = "seat";
          el.textContent = num;
          el.title = \`Fileira \${letra} · Poltrona \${num}\`;
          seatsWrap.appendChild(el);
          seats.set(num, el);
        }

        rowEl.appendChild(labelLeft);
        rowEl.appendChild(seatsWrap);
        rowEl.appendChild(labelRight);
        grid.appendChild(rowEl);
      }
    }

    async function carregarEvento() {
      const lista = await fetch("/eventos").then((r) => r.json());
      if (lista.length > 0) {
        eventoId = lista[0].id;
        capacidade = lista[0].capacidade;
        cntDisp.textContent = lista[0].disponivel;
        renderGrid(capacidade);
      }
    }

    function setSeatState(poltrona, state) {
      const el = seats.get(poltrona);
      if (!el) return;
      el.className = "seat " + state;
    }

    const es = new EventSource("/visual/stream");
    es.onopen = () => { statusSse.textContent = "Conectado em tempo real"; };
    es.onerror = () => { statusSse.textContent = "Desconectado — tentando reconectar..."; };
    es.onmessage = (msg) => {
      const ev = JSON.parse(msg.data);
      if (ev.tipo === "reservando") {
        ev.poltronas.forEach((p) => {
          const el = seats.get(p);
          if (el && !el.classList.contains("vendida")) setSeatState(p, "pagando");
        });
      } else if (ev.tipo === "vendida") {
        stats[201]++;
        cnt201.textContent = stats[201];
        ev.poltronas.forEach((p) => setSeatState(p, "vendida"));
        cntDisp.textContent = Math.max(0, Number(cntDisp.textContent) - ev.poltronas.length);
      } else if (ev.tipo === "ocupada") {
        stats[409]++;
        cnt409.textContent = stats[409];
      } else if (ev.tipo === "liberada") {
        stats[502]++;
        cnt502.textContent = stats[502];
        ev.poltronas.forEach((p) => {
          setSeatState(p, "liberada");
          setTimeout(() => {
            const el = seats.get(p);
            if (el && el.classList.contains("liberada")) setSeatState(p, "");
          }, 450);
        });
      }
    };

    btnSimular.addEventListener("click", async () => {
      const totalPedidos = Math.max(1, Math.min(1000, Number(inputPedidos.value) || 100));
      btnSimular.disabled = true;
      const inicio = performance.now();
      const snapshot = { ...stats };

      const reqs = Array.from({ length: totalPedidos }, (_, i) =>
        fetch("/reservas", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            eventoId,
            ingressos: [{
              nome: "cliente" + i,
              idade: 20 + (i % 50),
              estudante: i % 3 === 0,
              pcd: false,
              poltrona: (i % capacidade) + 1,
            }],
          }),
        }).catch(() => null)
      );
      await Promise.all(reqs);
      const ms = Math.round(performance.now() - inicio);

      if (simCount === 0) historyList.innerHTML = "";
      simCount++;
      const d201 = stats[201] - snapshot[201];
      const d409 = stats[409] - snapshot[409];
      const d502 = stats[502] - snapshot[502];

      const item = document.createElement("div");
      item.className = "history-item";
      item.innerHTML = \`
        <strong>#\${simCount} — \${totalPedidos} pedidos (\${ms} ms)</strong>
        <span>
          <span style="color:#60a5fa">201: \${d201}</span> ·
          <span style="color:#facc15">409: \${d409}</span> ·
          <span style="color:#f87171">502: \${d502}</span>
        </span>
      \`;
      historyList.prepend(item);
      btnSimular.disabled = false;
    });

    btnLimpar.addEventListener("click", async () => {
      btnLimpar.disabled = true;
      await fetch("/visual/reset", { method: "POST" });
      stats = { 201: 0, 409: 0, 502: 0 };
      cnt201.textContent = "0";
      cnt409.textContent = "0";
      cnt502.textContent = "0";
      await carregarEvento();
      btnLimpar.disabled = false;
    });

    carregarEvento();
  </script>
</body>
</html>`;
