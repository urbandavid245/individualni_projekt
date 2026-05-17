import { KATALOG_NASTROJU, INastroj } from './data.ts';

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
        // Validuje data
        if (hodiny <= 0) throw new Error("Počet hodin musí být kladné číslo.");
        if (nastroj.trim() === "") throw new Error("Název nástroje nesmí být prázdný.");

        this._id = id;
        this._nastroj = nastroj;
        this._zakladniCena = cena;
        this._pocetHodin = hodiny;
    }
    //Abstraktni metoda kterou kazdy ten potomek musi aplikovat po svem 
    abstract vypocitejKonecnouCenu(): number;
    //Metoda pro prehledny vypis informaci
    public ziskejInfo(): string {
        return `[ID: ${this._id}] ${this._nastroj} (${this._pocetHodin}h)`;
    }
}
//Třída pro individuální výuku jeden na jednoho
class IndividualniLekce extends Lekce {
    private _jePokrocily:boolean;

    constructor(id:number, nastroj:string, cena: number, hodiny:number, jePokrocily:boolean){
        super(id, nastroj, cena, hodiny)
        this._jePokrocily = jePokrocily;
    }
public vypocitejKonecnouCenu(): number {
    let cena = this._pocetHodin * this._zakladniCena;
    if (this._jePokrocily) {
    cena *=1.15;
    }
    return Math.round(cena);
    }   
    
    public override ziskejInfo(): string {
        const uroven = this._jePokrocily ? "Pokročilý" : "Začátečník";
        return `${super.ziskejInfo()} - Individuální (${uroven})`;
    }
}
//Třída pro workshop
class SkupinovyWorkshop extends Lekce {
    private _pocetZaku:number; 
    private readonly POPLATEK_ZA_NOTY: number = 50;

    constructor(id:number, nastroj:string, cena: number, hodiny:number, pocetZaku:number){
    super(id,nastroj,cena,hodiny);

    if (pocetZaku >2) throw new Error ("Workshop musí mít alespoň 2 žáky.");
    this._pocetZaku = pocetZaku;
    }
    public vypocitejKonecnouCenu(): number {
         const zlevnenaSazba = this._zakladniCena * 0.8 
    return Math.round ((this._pocetHodin * zlevnenaSazba) + (this._pocetZaku + this.POPLATEK_ZA_NOTY))
    }
    public override ziskejInfo(): string {
        return `${super.ziskejInfo()} - Workshop (Počet žáků: ${this._pocetZaku})`;
    }

}

// --- TESTOVÁNÍ A POLYMORFISMUS V KONZOLI ---

try {
    // Simulace výběru dat z číselníku (např. uživatel vybral Kytaru a Klavír)
    const dataKytara = KATALOG_NASTROJU.find(n => n.id === 2)!;
    const dataKlavir = KATALOG_NASTROJU.find(n => n.id === 1)!;
    const dataBici = KATALOG_NASTROJU.find(n => n.id === 3)!;

    // Vytvoření pole s mixem různých instancí (Polymorfismus)
    const seznamLekci: Lekce[] = [
        new IndividualniLekce(101, dataKytara.nazev, dataKytara.cenaZaHodinu, 2, true),
        new SkupinovyWorkshop(102, dataKlavir.nazev, dataKlavir.cenaZaHodinu, 3, 5),
        new IndividualniLekce(103, dataBici.nazev, dataBici.cenaZaHodinu, 1, false)
    ];

    console.log("--- PŘEHLED NAPLÁNOVANÝCH LEKCÍ ---");

    // Procházení pole a volání metod bez ohledu na to, o jaký typ lekce jde
    seznamLekci.forEach(lekce => {
        console.log("-----------------------------------");
        console.log(lekce.ziskejInfo());
        console.log(`Celková cena: ${lekce.vypocitejKonecnouCenu()} Kč`);
    });

} catch (error) {
    if (error instanceof Error) {
        console.error("Chyba při vytváření objektu:", error.message);
    }
}