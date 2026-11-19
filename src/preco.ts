import type { Ingresso, Pessoa } from "./tipos.ts";

export function valorDoIngresso(precoBase: number) {
    return (tipo: Ingresso["tipo"]): number => {
        if (tipo === "meia") {
            return Math.round(precoBase * 0.5 * 100) / 100;
        }

        return precoBase;
    };
}

export function aplicarTaxa(percentual: number) {
    return (valor: number): number => {
        return Math.round(valor * (1 + percentual) * 100) / 100;
    };
}

export function montarIngressos(
    precoBase: number,
    pessoas: Pessoa[],
    temDireitoAMeia: (pessoa: Pessoa) => boolean
): Ingresso[] {
    return pessoas.map(pessoa => {
        const tipo = temDireitoAMeia(pessoa) ? "meia" : "inteira";

        return {
            nome: pessoa.nome,
            poltrona: pessoa.poltrona,
            tipo,
            valor: valorDoIngresso(precoBase)(tipo)
        };
    });
}

export function calcularTotal(ingressos: Ingresso[]): number {
    const subtotal = ingressos.reduce(
        (acumulador, ingresso) => acumulador + ingresso.valor,
        0
    );

    return aplicarTaxa(0.1)(subtotal);
}