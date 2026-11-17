import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
    criarMultiplicador,
    calcularPrecos,
    calcularTotal
} from "../src/preco";

describe("Cálculo de preços", () => {
    const ingressos = [
        { id: "1", tipo: "INTEIRA" as const, precoBase: 100 },
        { id: "2", tipo: "MEIA" as const, precoBase: 100 },
        { id: "3", tipo: "INTEIRA" as const, precoBase: 200 }
    ];

    it("deve criar um multiplicador", () => {
        const dobro = criarMultiplicador(2);

        assert.equal(dobro(50), 100);
    });

    it("deve calcular corretamente os preços dos ingressos", () => {
        assert.deepEqual(
            calcularPrecos(ingressos),
            [100, 50, 200]
        );
    });

    it("deve calcular o total com taxa de 10%", () => {
        assert.equal(calcularTotal(ingressos), 385);
    });
});
