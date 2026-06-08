import { KATALOG_NASTROJU, INastroj } from './data.js';

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

    if (pocetZaku < 3) throw new Error ("Workshop musí mít alespoň 3 žáky.");
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
// Třída pro Duo lekci (přesně pro 2 účastníky)
class DuoLekce extends Lekce {
    // Specifická vlastnost: koeficient ceny pro duo (např. +40 % k základní ceně)
    private _koeficientDuo: number = 1.4;

    constructor(id: number, nastroj: string, cena: number, hodiny: number) {
        // Nepotřebujeme zadávat počet žáků, u Duo lekce jsou z podstaty věci vždy 2
        super(id, nastroj, cena, hodiny);
    }

    public vypocitejKonecnouCenu(): number {
        // Cena se vypočítá jako: (základní cena * počet hodin) * 1.4
        // (Případně uprav "this._zakladniCena" podle toho, jak sis tu vlastnost v abstraktní třídě reálně pojmenoval)
        const zaklad = this._zakladniCena * this._pocetHodin; 
        return Math.round(zaklad * this._koeficientDuo);
    }

    public override ziskejInfo(): string {
        return `${super.ziskejInfo()} - Duo lekce (pro 2 osoby)`;
    }
}
// --- TESTOVÁNÍ A POLYMORFISMUS V KONZOLI ---

let seznamLekci: Lekce[] = [];

try {
    // Simulace výběru dat z číselníku (např. uživatel vybral Kytaru a Klavír)
    const dataKytara = KATALOG_NASTROJU.find(n => n.id === 2)!;
    const dataKlavir = KATALOG_NASTROJU.find(n => n.id === 1)!;
    const dataBici = KATALOG_NASTROJU.find(n => n.id === 3)!;

    // Vytvoření pole s mixem různých instancí (Polymorfismus)
    seznamLekci = [
        new IndividualniLekce(101, dataKytara.nazev, dataKytara.cenaZaHodinu, 2, true),
        new SkupinovyWorkshop(102, dataKlavir.nazev, dataKlavir.cenaZaHodinu, 3, 5),
        new DuoLekce(104, dataBici.nazev, dataBici.cenaZaHodinu, 2),
        new IndividualniLekce(103, dataBici.nazev, dataBici.cenaZaHodinu, 1, false)
    ];

    console.log("--- PŘEHLED NAPLÁNOVANÝCH LEKCÍ ---");

    // Procházení pole a volání metod bez ohledu na to, o jaký typ lekce jde
    seznamLekci.forEach(lekce => {
        console.log("-----------------------------------");
        console.log(lekce.ziskejInfo());
        console.log(`Celková cena: ${lekce.vypocitejKonecnouCenu()} Kč`);
    });
const kytaraData = KATALOG_NASTROJU.find(n => n.id === 101);

if (kytaraData) {
    // Přidáme novou Duo lekci do seznamu (např. na 2 hodiny)
    seznamLekci.push(new DuoLekce(kytaraData.id, kytaraData.nazev, kytaraData.cenaZaHodinu, 2));
}
} catch (error) {
    if (error instanceof Error) {
        console.error("Chyba při vytváření objektu:", error.message);
    }
}
// --- TVŮJ DOSAVADNÍ KÓD (TŘÍDY A VÝBĚR DAT) ZŮSTÁVÁ NAD TÍMTO ---

// 1. Najdeme prázdný HTML element, do kterého budeme vkládat data
const htmlKontejner = document.getElementById("vypis-lekci");

// Kontrola, jestli element v HTML opravdu existuje
if (htmlKontejner) {
    // Projdeme všechny lekce v poli
    seznamLekci.forEach(lekce => {
        // Získáme texty z našich OOP metod
        const info = lekce.ziskejInfo();
        const cena = lekce.vypocitejKonecnouCenu();

        // 2. Vytvoříme kousek HTML kódu pro každou kartičku
        // Používáme "backticks" (zpětné uvozovky ``) pro snadné vložení proměnných
        const kartaHTML = `
            <div class="lesson-card">
                <div class="lesson-info"><strong>Detail:</strong> ${info}</div>
                <div class="lesson-price">Celková cena: ${cena} Kč</div>
            </div>
        `;

        // 3. Vložíme vytvořenou kartičku do HTML stránky
        htmlKontejner.innerHTML += kartaHTML;
    });
} else {
    // Pojistka, kdyby náhodou někdo smazal ID v HTML
    console.error("Chyba: Nebyl nalezen kontejner s ID 'vypis-lekci'.");
}
const form = document.getElementById('lekce-form') as HTMLFormElement;
const kontejner = document.getElementById('vypis-lekci') as HTMLElement;

form.addEventListener('submit', (e) => {
    e.preventDefault(); // Zabrání přebití stránky

    // 1. Získání dat z formuláře
    const id = parseInt((document.getElementById('id') as HTMLInputElement).value);
    const nastroj = (document.getElementById('nastroj') as HTMLInputElement).value;
    const cena = parseInt((document.getElementById('cena') as HTMLInputElement).value);
    const hodiny = parseInt((document.getElementById('hodiny') as HTMLInputElement).value);
    const typ = (document.getElementById('typ') as HTMLSelectElement).value;
    const pocetZaku = parseInt((document.getElementById('pocetZaku') as HTMLInputElement).value);

    // 2. Vytvoření instance (OOP logika)
    let novaLekce: Lekce;
    if (typ === 'workshop') {
        novaLekce = new SkupinovyWorkshop(id, nastroj, cena, hodiny, pocetZaku);
    } else {
        novaLekce = new IndividualniLekce(id, nastroj, cena, hodiny);
    }

    // 3. Přidání do pole a okamžité překreslení
    seznamLekci.push(novaLekce);
    renderLekci(); 
    form.reset(); // Vyčistí formulář
});

// Funkce pro překreslení (zavolej ji pokaždé, když se změní seznamLekci)
function renderLekci() {
    kontejner.innerHTML = ''; // Vyčistí starý výpis
    seznamLekci.forEach(lekce => {
        const div = document.createElement('div');
        div.className = 'lesson-card';
        div.innerHTML = `
            <div class="lesson-info"><strong>Detail:</strong> ${lekce.ziskejInfo()}</div>
            <div class="lesson-price">Celková cena: ${lekce.vypocitejKonecnouCenu()} Kč</div>
        `;
        kontejner.appendChild(div);
    });
}