export type TipoIngresso = "INTEIRA" | "MEIA";

export interface Comprador {
    id: string;
    nome: string;
    estudante: boolean;
}

export interface Ingresso {
    id: string;
    tipo: TipoIngresso;
    precoBase: number;
}

export interface Pedido {
    id: string;
    comprador: Comprador;
    ingressos: Ingresso[];
}
