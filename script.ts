import { KATALOG_NASTROJU, INastroj } from './data';

/**
 * Abstraktní třída reprezentující obecnou lekci
 */
abstract class Lekce {
    // Zapouzdření: private pro id, protected pro ostatní, aby k nim mohli potomci
    private _id: number;
    protected _nastroj: string;
    protected _zakladniCena: number;
    protected _pocetHodin: number;

    constructor(id: number, nastroj: string, cena: number, hodiny: number) {
        // Validace dat
        if (hodiny <= 0) throw new Error("Počet hodin musí být kladné číslo.");
        if (nastroj.trim() === "") throw new Error("Název nástroje nesmí být prázdný.");

        this._id = id;
        this._nastroj = nastroj;
        this._zakladniCena = cena;
        this._pocetHodin = hodiny;
    }
}