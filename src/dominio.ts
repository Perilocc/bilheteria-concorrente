import type { Ingresso } from "./tipos";

export class Evento {
    private ingressos: Map<string, Ingresso>;
    private reservados: Set<string>;
    private vendidos: Set<string>;

    constructor(
        public readonly nome: string,
        ingressos: Ingresso[]
    ) {
        this.ingressos = new Map();
        this.reservados = new Set();
        this.vendidos = new Set();

        for (const ingresso of ingressos) {
            if (this.ingressos.has(ingresso.id)) {
                throw new Error("Ingresso duplicado.");
            }

            this.ingressos.set(ingresso.id, { ...ingresso });
        }
    }

    listarDisponiveis(): Ingresso[] {
        return Array.from(this.ingressos.values())
            .filter(ingresso =>
                !this.reservados.has(ingresso.id) &&
                !this.vendidos.has(ingresso.id)
            )
            .map(ingresso => ({ ...ingresso }));
    }

    reservar(id: string): boolean {
        if (!this.ingressos.has(id)) {
            return false;
        }

        if (
            this.reservados.has(id) ||
            this.vendidos.has(id)
        ) {
            return false;
        }

        this.reservados.add(id);
        return true;
    }

    liberarReserva(id: string): boolean {
        return this.reservados.delete(id);
    }

    confirmarVenda(id: string): boolean {
        if (!this.reservados.has(id)) {
            return false;
        }

        this.reservados.delete(id);
        this.vendidos.add(id);

        return true;
    }

    get quantidadeDisponivel(): number {
        return this.listarDisponiveis().length;
    }
}
