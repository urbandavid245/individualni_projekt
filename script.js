import { KATALOG_NASTROJU } from './data.js';
// abstraktni trida
class Vyuka {
    _id;
    _obor;
    _tydenniDotace;
    constructor(id, obor, tydenniDotace) {
        if (tydenniDotace <= 0)
            throw new Error("Hodinová dotace musí být větší než 0.");
        this._id = id;
        this._obor = obor;
        this._tydenniDotace = tydenniDotace;
    }
    get id() { return this._id; }
    get obor() { return this._obor; }
    ziskejInfo() {
        return `${this._obor.nazev} (${this._tydenniDotace}h týdně)`;
    }
}
//  odvozene tridy (dedicnost a polymorfismus) 
class IndividualniVyuka extends Vyuka {
    _jePokrocily;
    constructor(id, obor, tydenniDotace, jePokrocily) {
        super(id, obor, tydenniDotace);
        this._jePokrocily = jePokrocily;
    }
    vypocitejSkolne() {
        let zaklad = this._tydenniDotace * this._obor.cenaZaHodinu;
        if (this._jePokrocily)
            zaklad *= 1.15; // II. stupen priplatek 15%
        return Math.round(zaklad);
    }
}
class KolektivniVyuka extends Vyuka {
    _pocetZaku;
    constructor(id, obor, tydenniDotace, pocetZaku) {
        super(id, obor, tydenniDotace);
        if (pocetZaku < 3)
            throw new Error("Kolektivní výuka musí mít minimálně 3 žáky.");
        this._pocetZaku = pocetZaku;
    }
    vypocitejSkolne() {
        const zaklad = this._tydenniDotace * (this._obor.cenaZaHodinu * 0.8);
        return Math.round(zaklad + (this._pocetZaku * 50));
    }
}
class KomorniVyuka extends Vyuka {
    constructor(id, obor, tydenniDotace) {
        super(id, obor, tydenniDotace);
    }
    vypocitejSkolne() {
        return Math.round((this._obor.cenaZaHodinu * this._tydenniDotace) * 1.4);
    }
}
// globalni stav a selektory
const skolniMatrika = [];
const form = document.getElementById('lekce-form');
const htmlKontejner = document.getElementById('vypis-lekci');
const typSelect = document.getElementById('typ');
const nastrojSelect = document.getElementById('nastroj');
const katalogGrid = document.getElementById('katalog-grid');
const blockPocetZaku = document.getElementById('block-pocet-zaku');
const blockPokrocily = document.getElementById('block-pokrocily');
// aplneni vyberu oboru a statickeho katalogu
function inicializujAplikaci() {
    if (!nastrojSelect)
        return;
    nastrojSelect.innerHTML = '<option value="" disabled selected>Vyberte předmět/obor...</option>';
    if (katalogGrid)
        katalogGrid.innerHTML = '';
    KATALOG_NASTROJU.forEach(nastroj => {
        const option = document.createElement('option');
        option.value = nastroj.id.toString();
        option.textContent = `${nastroj.nazev} (${nastroj.cenaZaHodinu} Kč/h)`;
        nastrojSelect.appendChild(option);
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
// dynamicke skryvani formularovych poli 
if (typSelect) {
    typSelect.addEventListener('change', () => {
        const val = typSelect.value;
        blockPocetZaku.style.display = (val === 'workshop') ? 'block' : 'none';
        blockPokrocily.style.display = (val === 'individualni') ? 'block' : 'none';
    });
}
// rendering karet zapsanych lekci 
function renderMatriky() {
    if (!htmlKontejner)
        return;
    htmlKontejner.innerHTML = '';
    if (skolniMatrika.length === 0) {
        htmlKontejner.innerHTML = '<p style="grid-column: 1/-1; text-align:center; color:#64748b; padding:2rem;">Zatím nebyly zapsány žádné vyučovací hodiny.</p>';
        return;
    }
    skolniMatrika.forEach(vyuka => {
        const card = document.createElement('div');
        card.className = 'dash-card';
        let badgeText = ' Individuální';
        if (vyuka instanceof KolektivniVyuka)
            badgeText = ' Kolektivní';
        if (vyuka instanceof KomorniVyuka)
            badgeText = ' Komorní (Duo)';
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
// submit formulare
if (form) {
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        try {
            const idInput = document.getElementById('id');
            const hodinyInput = document.getElementById('hodiny');
            const id = parseInt(idInput.value);
            const nastrojId = parseInt(nastrojSelect.value);
            const hodiny = parseInt(hodinyInput.value);
            const typ = typSelect.value;
            if (skolniMatrika.some(v => v.id === id)) {
                throw new Error(`Třída s ID kódem ${id} již v systému existuje.`);
            }
            const vybranyObor = KATALOG_NASTROJU.find(n => n.id === nastrojId);
            if (!vybranyObor)
                throw new Error("Vyberte platný obor.");
            let novaVyuka;
            if (typ === 'individualni') {
                const jePokrocily = document.getElementById('jePokrocily').checked;
                novaVyuka = new IndividualniVyuka(id, vybranyObor, hodiny, jePokrocily);
            }
            else if (typ === 'workshop') {
                const pocetZaku = parseInt(document.getElementById('pocetZaku').value);
                novaVyuka = new KolektivniVyuka(id, vybranyObor, hodiny, pocetZaku);
            }
            else {
                novaVyuka = new KomorniVyuka(id, vybranyObor, hodiny);
            }
            skolniMatrika.push(novaVyuka);
            form.reset();
            blockPocetZaku.style.display = 'none';
            blockPokrocily.style.display = 'block';
            renderMatriky();
        }
        catch (err) {
            alert(err.message);
        }
    });
}
// SPA routing (prepinani oken bez obnoveni stranky)
const navItems = document.querySelectorAll('.nav-item');
const tabContents = document.querySelectorAll('.tab-content');
const dashBtns = document.querySelectorAll('.dash-btn');
function switchTab(targetTabId) {
    tabContents.forEach(tab => tab.classList.add('hidden'));
    navItems.forEach(item => item.classList.remove('active'));
    const targetTab = document.getElementById(targetTabId);
    if (targetTab)
        targetTab.classList.remove('hidden');
    const activeNav = document.querySelector(`[data-tab="${targetTabId}"]`);
    if (activeNav)
        activeNav.classList.add('active');
}
navItems.forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        const target = item.getAttribute('data-tab');
        if (target)
            switchTab(target);
    });
});
dashBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const target = btn.getAttribute('data-target');
        if (target)
            switchTab(target);
    });
});
// spusteni aplikace
inicializujAplikaci();
renderMatriky();
