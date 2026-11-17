import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { temDireitoMeiaEntrada } from "../src/regras";


describe("Regras de meia-entrada", () => {
    it("deve conceder meia-entrada para estudante", () => {
        const comprador = {
            id: "1",
            nome: "João",
            estudante: true
        };

        assert.equal(temDireitoMeiaEntrada(comprador), true);
    });

    it("não deve conceder meia-entrada para não estudante", () => {
        const comprador = {
            id: "2",
            nome: "Maria",
            estudante: false
        };

        assert.equal(temDireitoMeiaEntrada(comprador), false);
    });
});