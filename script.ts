import { KATALOG_NASTROJU, INastroj } from './data.js';

/**
 * Abstraktní třída reprezentující obecný formát školní výuky na ZUŠ
 */
abstract class Vyuka {
    private _id: number;
    protected _obor: string;
    protected _zakladniSazba: number;
    protected _tydenniDotace: number;

    constructor(id: number, obor: string, sazba: number, dotace: number) {
        if (dotace <= 0) throw new Error("Hodinová dotace musí být kladné číslo.");
        if (obor.trim() === "") throw new Error("Název oboru nesmí být prázdný.");

        this._id = id;
        this._obor = obor;
        this._zakladniSazba = sazba;
        this._tydenniDotace = dotace;
    }

    public get id(): number {
        return this._id;
    }

    abstract vypocitejSkolne(): number;
    
    public ziskejInfo(): string {
        return `[Třída ID: ${this._id}] ${this._obor} (${this._tydenniDotace}h týdně)`;
    }
}

// 1. Třída pro individuální výuku (jeden učitel - jeden žák)
class IndividualniVyuka extends Vyuka {
    private _jeRozsireneStudium: boolean;

    constructor(id: number, obor: string, sazba: number, dotace: number, jeRozsirene: boolean) {
        super(id, obor, sazba, dotace);
        this._jeRozsireneStudium = jeRozsirene;
    }

    public vypocitejSkolne(): number {
        let skolne = this._tydenniDotace * this._zakladniSazba;
        if (this._jeRozsireneStudium) {
            skolne *= 1.15; // Příplatek za náročnější program II. stupně
        }
        return Math.round(skolne);
    }   
    
    public override ziskejInfo(): string {
        const stupen = this._jeRozsireneStudium ? "II. stupeň (Rozšířené)" : "I. stupeň (Základní)";
        return `${super.ziskejInfo()} - Individuální forma (${stupen})`;
    }
}

// 2. Třída pro kolektivní výuku (např. Výtvarný obor, Taneční obor, Hudební nauka)
class KolektivniVyuka extends Vyuka {
    private _pocetZakuVeTride: number; 
    private readonly POPLATEK_ZA_MATERIAL: number = 50; // Pomůcky, notový materiál apod.

    constructor(id: number, obor: string, sazba: number, dotace: number, pocetZaku: number) {
        super(id, obor, sazba, dotace);
        if (pocetZaku < 3) throw new Error("Kolektivní výuka musí mít alespoň 3 žáky.");
        this._pocetZakuVeTride = pocetZaku;
    }

    public vypocitejSkolne(): number {
        // Kolektivní výuka mívá základní dotaci levnější (např. 80 % individuální)
        const kolektivniSazba = this._zakladniSazba * 0.8;
        return Math.round((this._tydenniDotace * kolektivniSazba) + (this._pocetZakuVeTride * this.POPLATEK_ZA_MATERIAL));
    }

    public override ziskejInfo(): string {
        return `${super.ziskejInfo()} - Kolektivní forma (Žáků ve třídě: ${this._pocetZakuVeTride})`;
    }
}

// 3. Třída pro komorní výuku (např. čtyřruční hra, komorní soubory, duo)
class KomorniVyuka extends Vyuka {
    private _koeficientKomorniHry: number = 1.4;

    constructor(id: number, obor: string, sazba: number, dotace: number) {
        super(id, obor, sazba, dotace);
    }

    public vypocitejSkolne(): number {
        const zaklad = this._zakladniSazba * this._tydenniDotace; 
        return Math.round(zaklad * this._koeficientKomorniHry);
    }

    public override ziskejInfo(): string {
        return `${super.ziskejInfo()} - Komorní výuka (Duo)`;
    }
}

// ============================================================================
// --- GLOBÁLNÍ STAV A PROPOJENÍ S UI ---
// ============================================================================

const skolniMatrika: Vyuka[] = [];

const form = document.getElementById('lekce-form') as HTMLFormElement;
const htmlKontejner = document.getElementById('vypis-lekci') as HTMLElement;
const typSelect = document.getElementById('typ') as HTMLSelectElement;
const nastrojSelect = document.getElementById('nastroj') as HTMLSelectElement;

const blockPocetZaku = document.getElementById('block-pocet-zaku') as HTMLElement;
const blockPokrocily = document.getElementById('block-pokrocily') as HTMLElement;

function inicializujNastroje(): void {
    if (!nastrojSelect) return;
    KATALOG_NASTROJU.forEach((nastroj: INastroj) => {
        const option = document.createElement('option');
        option.value = nastroj.id.toString();
        // Načítáme z původního souboru, ale prezentujeme jako ŠVP obor
        option.textContent = `${nastroj.nazev} (Základ: ${nastroj.cenaZaHodinu} Kč)`;
        nastrojSelect.appendChild(option);
    });
}

if (typSelect) {
    typSelect.addEventListener('change', () => {
        const volba = typSelect.value;
        if (blockPocetZaku) blockPocetZaku.style.display = (volba === 'workshop') ? 'block' : 'none';
        if (blockPokrocily) blockPokrocily.style.display = (volba === 'individualni') ? 'block' : 'none';
        
        const inputZaci = document.getElementById('pocetZaku') as HTMLInputElement;
        if (inputZaci) inputZaci.required = (volba === 'workshop');
    });
}

if (form) {
    form.addEventListener('submit', (e: Event) => {
        e.preventDefault();

        const idInput = (document.getElementById('id') as HTMLInputElement).value;
        const nastrojId = parseInt(nastrojSelect.value);
        const hodiny = parseInt((document.getElementById('hodiny') as HTMLInputElement).value);
        const typ = typSelect.value;

        const nastrojData = KATALOG_NASTROJU.find(n => n.id === nastrojId);
        if (!nastrojData) return;

        try {
            let novaVyuka: Vyuka;
            const unikatniId = parseInt(idInput);

            if (skolniMatrika.some(v => v.id === unikatniId)) {
                throw new Error("Třída nebo výuka s tímto ID kódem již v matrice existuje.");
            }

            if (typ === 'workshop') {
                const pocetZaku = parseInt((document.getElementById('pocetZaku') as HTMLInputElement).value);
                novaVyuka = new KolektivniVyuka(unikatniId, nastrojData.nazev, nastrojData.cenaZaHodinu, hodiny, pocetZaku);
            } else if (typ === 'duo') {
                novaVyuka = new KomorniVyuka(unikatniId, nastrojData.nazev, nastrojData.cenaZaHodinu, hodiny);
            } else {
                const jePokrocily = (document.getElementById('jePokrocily') as HTMLInputElement).checked;
                novaVyuka = new IndividualniVyuka(unikatniId, nastrojData.nazev, nastrojData.cenaZaHodinu, hodiny, jePokrocily);
            }

            skolniMatrika.push(novaVyuka);
            renderMatriky();
            form.reset();
            
            if (blockPocetZaku) blockPocetZaku.style.display = 'none';
            if (blockPokrocily) blockPokrocily.style.display = 'block';

        } catch (error: any) {
            alert("Chyba školní validace: " + error.message);
        }
    });
}

function renderMatriky(): void {
    if (!htmlKontejner) return;
    htmlKontejner.innerHTML = '';

    if (skolniMatrika.length === 0) {
        htmlKontejner.innerHTML = `<p style="color: #64748b; grid-column: 1/-1;">V tomto pololetí není evidována žádná aktivní výuka.</p>`;
        return;
    }

    skolniMatrika.forEach((vyuka: Vyuka) => {
        const info = vyuka.ziskejInfo();
        const skolne = vyuka.vypocitejSkolne();

        htmlKontejner.innerHTML += `
            <div class="lesson-card">
                <div class="lesson-info"><strong>Specifikace výuky</strong> ${info}</div>
                <div class="lesson-price">${skolne} Kč <span style="font-size:0.8rem; font-weight:400; color:#64748b;">(Školné)</span></div>
            </div>
        `;
    });
}

// ============================================================================
// --- MANAGEMENT STRÁNEK (TABY) A KATALOG OBORŮ ---
// ============================================================================

function renderKatalogOboru(): void {
    const katalogKontejner = document.getElementById('katalog-grid');
    if (!katalogKontejner) return;

    katalogKontejner.innerHTML = '';
    KATALOG_NASTROJU.forEach((nastroj: INastroj) => {
        katalogKontejner.innerHTML += `
            <div class="lesson-card">
                <div class="lesson-info">
                    <strong>Umělecký obor (ŠVP)</strong>
                    <span style="font-size: 1.2rem; font-weight: 700; color: #0f172a; display:block; margin-top:0.25rem;">${nastroj.nazev}</span>
                    <p style="margin-top: 0.5rem; color: #64748b; font-size: 0.9rem;">Výuka probíhá plně v souladu s rámcovým vzdělávacím programem MŠMT.</p>
                </div>
                <div class="lesson-price">${nastroj.cenaZaHodinu} Kč <span style="font-size:0.75rem; font-weight:400; color:#64748b;">/ základní sazba</span></div>
            </div>
        `;
    });
}

function prepniSekci(ciloveId: string): void {
    const vsechnySekce = document.querySelectorAll('.tab-content');
    const vsechnyPolozkyMenu = document.querySelectorAll('.nav-item');

    vsechnySekce.forEach(sekce => {
        if (sekce.id === ciloveId) {
            sekce.classList.remove('hidden');
        } else {
            sekce.classList.add('hidden');
        }
    });

    vsechnyPolozkyMenu.forEach(polozka => {
        if (polozka.getAttribute('data-tab') === ciloveId) {
            polozka.classList.add('active');
        } else {
            polozka.classList.remove('active');
        }
    });
}

function inicializujNavigaci(): void {
    const polozkyMenu = document.querySelectorAll('.nav-item');
    const tlacitkaNastenky = document.querySelectorAll('.dash-btn');

    polozkyMenu.forEach(polozka => {
        polozka.addEventListener('click', (e) => {
            e.preventDefault();
            const cil = polozka.getAttribute('data-tab');
            if (cil) prepniSekci(cil);
        });
    });

    tlacitkaNastenky.forEach(tlacitko => {
        tlacitko.addEventListener('click', () => {
            const cil = tlacitko.getAttribute('data-target');
            if (cil) prepniSekci(cil);
        });
    });
}

document.addEventListener('DOMContentLoaded', () => {
    inicializujNastroje();
    renderMatriky();
    renderKatalogOboru();
    inicializujNavigaci();
});