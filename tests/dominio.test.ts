import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { Evento } from "../src/dominio";


describe("Classe Evento", () => {
    function criarEvento(): Evento {
        return new Evento("Show de Rock", [
            { id: "1", tipo: "INTEIRA", precoBase: 100 },
            { id: "2", tipo: "MEIA", precoBase: 50 }
        ]);
    }

    it("deve iniciar com todos os ingressos disponíveis", () => {
        const evento = criarEvento();
        assert.equal(evento.quantidadeDisponivel, 2);
    });

    it("deve reservar um ingresso disponível", () => {
        const evento = criarEvento();
        const resultado = evento.reservar("1");

        assert.equal(resultado, true);
        assert.equal(evento.quantidadeDisponivel, 1);
    });

    it("não deve permitir reservar o mesmo ingresso duas vezes", () => {
        const evento = criarEvento();
        evento.reservar("1");

        const resultado = evento.reservar("1");

        assert.equal(resultado, false);
        assert.equal(evento.quantidadeDisponivel, 1);
    });

    it("deve confirmar a venda de um ingresso reservado", () => {
        const evento = criarEvento();
        evento.reservar("1");

        const resultado = evento.confirmarVenda("1");

        assert.equal(resultado, true);
        assert.equal(evento.quantidadeDisponivel, 1);
    });

    it("deve liberar um ingresso quando a reserva for cancelada", () => {
        const evento = criarEvento();
        evento.reservar("1");

        evento.liberarReserva("1");

        assert.equal(evento.quantidadeDisponivel, 2);
    });

    it("não deve permitir vender um ingresso sem reserva", () => {
        const evento = criarEvento();
        const resultado = evento.confirmarVenda("1");

        assert.equal(resultado, false);
        assert.equal(evento.quantidadeDisponivel, 2);
    });
});
