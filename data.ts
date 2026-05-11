
export interface INastroj {
    id: number;
    nazev: string;
    cenaZaHodinu: number;
}

export const KATALOG_NASTROJU: INastroj[] = [
    { id: 1, nazev: "Klavír", cenaZaHodinu: 500 },
    { id: 2, nazev: "Kytara", cenaZaHodinu: 400 },
    { id: 3, nazev: "Bicí", cenaZaHodinu: 450 },
    { id: 4, nazev: "Zpěv", cenaZaHodinu: 420 }
];