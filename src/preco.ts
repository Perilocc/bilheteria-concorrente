import type { Ingresso } from "./tipos";

export function criarMultiplicador(fator: number) {
    return (valor: number): number => valor * fator;
}

const calcularInteira = criarMultiplicador(1);
const calcularMeia = criarMultiplicador(0.5);

export function calcularPrecos(ingressos: Ingresso[]): number[] {
    return ingressos.map(ingresso => {
        if (ingresso.tipo === "MEIA") {
            return calcularMeia(ingresso.precoBase);
        }

        return calcularInteira(ingresso.precoBase);
    });
}

export function calcularTotal(ingressos: Ingresso[]): number {
    const precos = calcularPrecos(ingressos);

    const subtotal = precos.reduce(
        (acumulador, preco) => acumulador + preco,
        0
    );

    return Number(criarMultiplicador(1.1)(subtotal).toFixed(2));
}