import type { ConfigBilheteria, EventoInfo, Pedido } from "./tipos.ts";
import { DadosInvalidosErro, NaoEncontradoErro } from "./dominio.ts";

export class Bilheteria {
    #eventos: ConfigBilheteria["eventos"];
    #pagar: ConfigBilheteria["pagar"];
    #limitePagamentoMs: number;

    constructor(config: ConfigBilheteria) {
        this.#eventos = config.eventos;
        this.#pagar = config.pagar;
        this.#limitePagamentoMs = config.limitePagamentoMs;
    }

    listarEventos(): EventoInfo[] {
        return this.#eventos.map(evento => evento.info());
    }

    async reservar(pedido: Pedido): Promise<void> {
        if ( !pedido.ingressos || pedido.ingressos.length === 0) {
            throw new DadosInvalidosErro("O pedido precisa ter pelo menos 1 ingresso.");
        }

        const evento = this.#eventos.find(
            evento => evento.id === pedido.eventoId
        );

        if (!evento) {
            throw new NaoEncontradoErro("Evento não encontrado.");
        }

        const poltronas = pedido.ingressos.map(
            pessoa => pessoa.poltrona
        );

        evento.reservar(poltronas);
    }
}

export function criarBilheteria(config: ConfigBilheteria): Bilheteria {
    return new Bilheteria(config);
}