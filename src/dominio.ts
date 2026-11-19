export abstract class ErroDeNegocio extends Error {
    constructor(
        mensagem: string,
        public readonly status: number
    ) {
        super(mensagem);
        this.name = new.target.name;
    }
}

export class DadosInvalidosErro extends ErroDeNegocio {
    constructor(mensagem: string) {
        super(mensagem, 400);
    }
}

export class NaoEncontradoErro extends ErroDeNegocio {
    constructor(mensagem: string) {
        super(mensagem, 404);
    }
}

export class PoltronaOcupadaErro extends ErroDeNegocio {
    constructor(mensagem: string) {
        super(mensagem, 409);
    }
}

export class PagamentoErro extends ErroDeNegocio {
    constructor(mensagem: string) {
        super(mensagem, 502);
    }
}

export class Evento {
    #vendidas: number[] = [];

    constructor(
        public readonly id: number,
        public readonly nome: string,
        public readonly preco: number,
        public readonly capacidade: number,
    ) {}

    get disponivel(): number {
        return this.capacidade - this.#vendidas.length;
    }
    
    reservar(poltronas: number[]): void {
        if (poltronas.length === 0) {
            throw new DadosInvalidosErro("Nenhuma poltrona selecionada.");
        }

        const duplicadas = new Set(poltronas).size !== poltronas.length;
        if (duplicadas) {
            throw new DadosInvalidosErro("Poltronas duplicadas na reserva.");
        }

        const invalidas = poltronas.some(
            poltrona =>
            !Number.isInteger(poltrona) ||
            poltrona < 1 ||
            poltrona > this.capacidade
        );
        if (invalidas) {
            throw new DadosInvalidosErro("Poltronas além da capacidade no evento.");
        }

        const ocupadas = poltronas.some(
            poltrona => this.#vendidas.includes(poltrona)
        );
        if (ocupadas) {
            throw new PoltronaOcupadaErro("Uma ou mais poltronas já estão ocupadas.");
        }

        this.#vendidas = [...this.#vendidas, ...poltronas];
    }

    liberar(poltronas: number[]): void {
        const naoVendidas = poltronas.some(
            poltrona => !this.#vendidas.includes(poltrona)
        );

        if (naoVendidas) {
            throw new DadosInvalidosErro("A poltrona informada não está reservada.");
        }

        this.#vendidas = this.#vendidas.filter(
            poltrona => !poltronas.includes(poltrona)
        );
    }

    info() {
        return {
            id: this.id,
            nome: this.nome,
            preco: this.preco,
            capacidade: this.capacidade,
            disponivel: this.disponivel
        };
    }
}