// Import katalogu nastroju ze souboru dat
import { KATALOG_NASTROJU } from './data.js';
// ABSTRAKTNI TRIDA VYUKA
// Tato trida je zakladem pro vsechny typy vyuky (individualni, kolektivni, komorna)
// Obsahuje spolecne vlastnosti a abstraktni metodu pro vypocet skolneho
class Vyuka {
    _id;
    _obor;
    _tydenniDotace;
    // Konstruktor overi, ze tydenna dotace je pozitivni
    constructor(id, obor, tydenniDotace) {
        if (tydenniDotace <= 0)
            throw new Error("Hodinová dotace musí být větší než 0.");
        this._id = id;
        this._obor = obor;
        this._tydenniDotace = tydenniDotace;
    }
    // Gettery pro pristup k privatnim vlastnostem
    get id() { return this._id; }
    get obor() { return this._obor; }
    // Vraci informacni retezec o typu vyuky a poctu hodin
    ziskejInfo() {
        return `${this._obor.nazev} (${this._tydenniDotace}h týdně)`;
    }
}
// ODVOZENE TRIDY VYUKY
// Kazda podtrida reprezentuje jiny typ vyuky a vypocitava skolne podle svych pravidel
// Toto je implementace dedicnosti a polymorfismu v TypeScriptu 
// INDIVIDUALNI VYUKA
// Vyuka jeden na jednoho. Umoznuje priplatek pro pokrocile zaky.
// Vypocet: (hodiny * cena za hodinu) * 1.15 pokud je pokrocily (15% priplatek)
class IndividualniVyuka extends Vyuka {
    _jePokrocily;
    constructor(id, obor, tydenniDotace, jePokrocily) {
        super(id, obor, tydenniDotace);
        this._jePokrocily = jePokrocily;
    }
    // Vypocitava skolne s potencialnim priplatkem pro pokrocile zaky
    vypocitejSkolne() {
        let zaklad = this._tydenniDotace * this._obor.cenaZaHodinu;
        if (this._jePokrocily)
            zaklad *= 1.15; // II. stupen priplatek 15%
        return Math.round(zaklad);
    }
}
// KOLEKTIVNI VYUKA (WORKSHOP)
// Vyuka pro skupiny - minimalne 3 zaci jsou povinni.
// Cena za hodinu je snizena na 80% + flat fee 50 Kc na zaka
// Vypocet: (hodiny * cena za hodinu * 0.8) + (pocet zaku * 50)
class KolektivniVyuka extends Vyuka {
    _pocetZaku;
    constructor(id, obor, tydenniDotace, pocetZaku) {
        super(id, obor, tydenniDotace);
        if (pocetZaku < 3)
            throw new Error("Kolektivní výuka musí mít minimálně 3 žáky.");
        this._pocetZaku = pocetZaku;
    }
    // Vypocitava skolne se slevou na hodinu a poplatkem za zaky
    vypocitejSkolne() {
        const zaklad = this._tydenniDotace * (this._obor.cenaZaHodinu * 0.8);
        return Math.round(zaklad + (this._pocetZaku * 50));
    }
}
// KOMORNI VYUKA (DUO)
// Vyuka pro dva zaky spolecne - jsou vysoke naklady
// Vypocet: (hodiny * cena za hodinu) * 1.4 (40% priplatek)
class KomorniVyuka extends Vyuka {
    constructor(id, obor, tydenniDotace) {
        super(id, obor, tydenniDotace);
    }
    // Vypocitava skolne s priplatkem pro duo vyuku
    vypocitejSkolne() {
        return Math.round((this._obor.cenaZaHodinu * this._tydenniDotace) * 1.4);
    }
}
// GLOBALNI STAV A SELEKTORY
// Skolni matrika - pole pro ukladani vsech vytvoreneych lekci (jednotlivych vyuk)
const skolniMatrika = [];
// HTML elementy - reference na dulezite prvky stranky
const form = document.getElementById('lekce-form');
const htmlKontejner = document.getElementById('vypis-lekci');
const typSelect = document.getElementById('typ');
const nastrojSelect = document.getElementById('nastroj');
const katalogGrid = document.getElementById('katalog-grid');
// Blok pro skryvani a zobrazovani specifickych poli formulare
const blockPocetZaku = document.getElementById('block-pocet-zaku');
const blockPokrocily = document.getElementById('block-pokrocily');
// INICIALIZACE APLIKACE
// Tato funkce se spousti pri nacitani stranky
// Naplni vybery dostupnych oboru a vykresli katalog nastroju
function inicializujAplikaci() {
    // Kontrola ze select element existuje
    if (!nastrojSelect)
        return;
    // Vycisti obsah selectu a prida defaultni volbu
    nastrojSelect.innerHTML = '<option value="" disabled selected>Vyberte předmět/obor...</option>';
    // Vycisti katalogGrid
    if (katalogGrid)
        katalogGrid.innerHTML = '';
    // Iteruje skrze vsechny dostupne nastroje z katalogu
    KATALOG_NASTROJU.forEach(nastroj => {
        // Vytvori option prvek pro select
        const option = document.createElement('option');
        option.value = nastroj.id.toString();
        option.textContent = `${nastroj.nazev} (${nastroj.cenaZaHodinu} Kč/h)`;
        nastrojSelect.appendChild(option);
        // Vytvori a prida kartu nastroje do katalogi gridu
        if (katalogGrid) {
            const card = document.createElement('div');
            card.className = 'dash-card';
            card.innerHTML = `
                <h3>${nastroj.nazev}</h3>
                <p style="font-size: 1.25rem; font-weight:600; color:#3b82f6; margin: 0.5rem 0;">${nastroj.cenaZaHodinu} Kč / hodina</p>
               
            `;
            katalogGrid.appendChild(card);
        }
    });
}
// DYNAMICKE ZOBRAZOVANI/SKRYVANI POLI FORMULARE
// Podle zvoleneho typu vyuky se zobrazi pouze relevantni pole
// Napriklad: kolektivni vyuka potrebuje pocet zaku, individualni potrebuje volbu pokrocilosti
if (typSelect) {
    typSelect.addEventListener('change', () => {
        const val = typSelect.value;
        // Zobraz pocet zaku pouze pro kolektivni (workshop)
        blockPocetZaku.style.display = (val === 'workshop') ? 'block' : 'none';
        // Zobraz pokrocily switch pouze pro individualni
        blockPokrocily.style.display = (val === 'individualni') ? 'block' : 'none';
    });
}
// VYKRESLOVANI SEZNAMU LEKCI
// Tato funkce vykresli všechny zapsane lekce jako karty
// Kazda karta ukazuje typ vyuky, predmet, pocet hodin a vypoctene skolne
function renderMatriky() {
    if (!htmlKontejner)
        return;
    // Vycisti obsah kontejneru
    htmlKontejner.innerHTML = '';
    // Pokud neni zadna lekce - zobraz prazdnou zpravu
    if (skolniMatrika.length === 0) {
        htmlKontejner.innerHTML = '<p style="grid-column: 1/-1; text-align:center; color:#64748b; padding:2rem;">Zatím nebyly zapsány žádné vyučovací hodiny.</p>';
        return;
    }
    // Iteruje vsechny lekce a vykresli pro kazdu kartu
    skolniMatrika.forEach(vyuka => {
        const card = document.createElement('div');
        card.className = 'dash-card';
        // Stanovi badge text podle typu lekce
        let badgeText = ' Individuální';
        if (vyuka instanceof KolektivniVyuka)
            badgeText = ' Kolektivní';
        if (vyuka instanceof KomorniVyuka)
            badgeText = ' Komorní (Duo)';
        // Vytvori HTML obsah karty s vypoctenym skolnym
        card.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
                <span style="font-weight:700; color:#1e293b;">Lekce #${vyuka.id}</span>
                <span style="background:#f1f5f9; font-size:0.8rem; padding:0.25rem 0.5rem; border-radius:6px;">${badgeText}</span>
            </div>
            <h3 style="margin-bottom:0.25rem;">${vyuka.obor.nazev}</h3>
            <p style="font-size:0.9rem; color:#64748b; margin-bottom:1rem;">${vyuka.ziskejInfo()}</p>
            <div style="border-top: 1px solid #1351a3; padding-top:0.75rem; display:flex; justify-content:space-between; align-items:center;">
                <span style="font-size:0.85rem; color:#475569;">Vypočtené školné:</span>
                <span style="font-size:1.2rem; font-weight:700; color:#10b981;">${vyuka.vypocitejSkolne()} Kč</span>
            </div>
        `;
        htmlKontejner.appendChild(card);
    });
}
// OBSLUHA ODEVZDANI FORMULARE
// Tato funkce se spousti kdyz uzivatel odesle formular pro vytvoreni nove lekce
if (form) {
    form.addEventListener('submit', (e) => {
        // Zabrani vychozimu chovani formulare (obnoveni strany)
        e.preventDefault();
        try {
            // Ziska vsechny vstupni hodnoty z formulare
            const idInput = document.getElementById('id');
            const hodinyInput = document.getElementById('hodiny');
            const id = parseInt(idInput.value);
            const nastrojId = parseInt(nastrojSelect.value);
            const hodiny = parseInt(hodinyInput.value);
            const typ = typSelect.value;
            // Kontrola ze ID lekce jiz v systemu neexistuje
            if (skolniMatrika.some(v => v.id === id)) {
                throw new Error(`Třída s ID kódem ${id} již v systému existuje.`);
            }
            // Hleda vybrany nastroj v katalogu
            const vybranyObor = KATALOG_NASTROJU.find(n => n.id === nastrojId);
            if (!vybranyObor)
                throw new Error("Vyberte platný obor.");
            // Vytvari spravny typ lekce podle volby uzivatele
            let novaVyuka;
            if (typ === 'individualni') {
                // Individualni vyuka - ziska informaci o pokrocilosti
                const jePokrocily = document.getElementById('jePokrocily').checked;
                novaVyuka = new IndividualniVyuka(id, vybranyObor, hodiny, jePokrocily);
            }
            else if (typ === 'workshop') {
                // Kolektivni vyuka - ziska pocet zaku
                const pocetZaku = parseInt(document.getElementById('pocetZaku').value);
                novaVyuka = new KolektivniVyuka(id, vybranyObor, hodiny, pocetZaku);
            }
            else {
                // Komorni vyuka (duo)
                novaVyuka = new KomorniVyuka(id, vybranyObor, hodiny);
            }
            // Prida novou lekci do skolni matrik
            skolniMatrika.push(novaVyuka);
            // Resetuje formulrr a skryje prislusne pole
            form.reset();
            blockPocetZaku.style.display = 'none';
            blockPokrocily.style.display = 'block';
            // Prekresli seznam lekci s novou hodinou
            renderMatriky();
        }
        catch (err) {
            // Zobrazi chybovu zpravu pri problemu
            alert(err.message);
        }
    });
}
// SPA ROUTING - PREPINANI KARTY BEZ OBNOVENI STRANKY
// Umoznuje uzivateli pohodlne prepinat mezi jednotlivymi kartami aplikace
// (Katalog, Pridat lekci, Seznam lekci) bez nutnosti obnovit celou stranku
// Ziska reference na vsechny navigacni prvky a kartami s obsahem
const navItems = document.querySelectorAll('.nav-item');
const tabContents = document.querySelectorAll('.tab-content');
const dashBtns = document.querySelectorAll('.dash-btn');
// Funkce pro prepnuti karty - skryje vsechny karty a zobrazi jen vybranou
function switchTab(targetTabId) {
    // Skryje vsechny karty
    tabContents.forEach(tab => tab.classList.add('hidden'));
    // Odstrani aktivni tridu z navigacnich prvku
    navItems.forEach(item => item.classList.remove('active'));
    // Zobrazi vybranou kartu
    const targetTab = document.getElementById(targetTabId);
    if (targetTab)
        targetTab.classList.remove('hidden');
    // Oznaci prislusny navigacni prvek jako aktivni
    const activeNav = document.querySelector(`[data-tab="${targetTabId}"]`);
    if (activeNav)
        activeNav.classList.add('active');
}
// Prirazeni event listeneru na navigacni prvky
navItems.forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        const target = item.getAttribute('data-tab');
        if (target)
            switchTab(target);
    });
});
// Prirazeni event listeneru na tlacitka v obsahu (dashboard tlacitka)
dashBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const target = btn.getAttribute('data-target');
        if (target)
            switchTab(target);
    });
});
// SPUSTENI APLIKACE
// Volá inicializacní funkce pro naplneni katalogu a vykresli pocatecni stav
inicializujAplikaci();
renderMatriky();
