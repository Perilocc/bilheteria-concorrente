import { Bilheteria } from "./bilheteria.ts";
import { Evento } from "./dominio.ts";
import { criarPagamentoFalso } from "./pagamento.ts";
import { criarServidor } from "./servidor.ts";
import { registrarVisualizador } from "./visualizador.ts";

const PORT = 3000;

const evento = new Evento(1, "Show de Rock", 100, 50);
const bilheteria = new Bilheteria({
    eventos: [evento],
    pagar: criarPagamentoFalso({ latenciaMs: 120, taxaDeFalha: 0.15 }),
    limitePagamentoMs: 3000
});

const app = criarServidor(bilheteria);
registrarVisualizador(app, bilheteria, () => {
    for (let i = 1; i <= 50; i++) {
        try {
            evento.liberar([i]);
        } catch {
            // poltrona já estava livre
        }
    }
});

app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
    console.log(`Visualizador ao vivo: http://localhost:${PORT}/visual`);
});
