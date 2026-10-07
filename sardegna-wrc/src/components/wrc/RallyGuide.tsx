"use client";

import { Sheet } from "../ui/Sheet";

// Guida per chi va al rally per la prima volta: frasi brevi, niente gergo.

const STEPS: { title: string; text: string }[] = [
  {
    title: "Una prova è una strada chiusa",
    text: "La prova speciale (PS, sulle mappe ufficiali SS) è un tratto di strada chiuso al traffico dove le auto corrono una alla volta contro il cronometro.",
  },
  {
    title: "Le strade chiudono 3 ore prima",
    text: "Quest'anno ogni prova chiude circa 3 ore prima del passaggio della prima auto. Dopo la chiusura non si entra più, nemmeno a piedi: per questo si parte presto.",
  },
  {
    title: "Ingresso, parcheggio, due passi",
    text: "NAVIGA vi porta all'ingresso ufficiale per il pubblico. Da lì si seguono i cartelli fino al parcheggio e poi a piedi fino alla zona per guardare.",
  },
  {
    title: "Le auto passano una alla volta",
    text: "L'orario indicato è quello della prima auto. Le altre arrivano a pochi minuti di distanza: prima quelle del Mondiale, poi le altre categorie. Il passaggio di tutte dura a lungo, e spesso si sentono prima di vederle.",
  },
  {
    title: "Due passaggi: mattina e pomeriggio",
    text: "Quasi tutte le prove si corrono due volte. Restando nello stesso punto le vedete passare due volte, senza rincorrere le strade chiuse.",
  },
  {
    title: "Una giornata in campagna",
    text: "Le zone sono lontane dai paesi: portate cibo, acqua, crema solare e qualcosa per la pioggia. Si riparte solo quando la strada riapre, dopo l'ultima auto: mettete in conto un po' di coda.",
  },
];

const SAFETY = [
  "Guardate solo dalle zone segnalate per il pubblico o dalle vostre aree Pass Gold.",
  "Mai all'esterno delle curve né in punti più bassi della strada: se un'auto esce, va lì.",
  "Seguite sempre le indicazioni dei commissari.",
  "Non attraversate la strada durante la prova e non lasciate oggetti sul bordo.",
];

const WORDS: [string, string][] = [
  ["PS / SS", "Prova speciale: il tratto cronometrato a strada chiusa."],
  ["Shakedown", "La prova di collaudo del giovedì mattina: non conta per la classifica."],
  ["Power Stage", "L'ultima prova della domenica: dà punti extra, lì si decide il mondiale."],
  ["Service Park", "Il parco assistenza, dove i meccanici lavorano sulle auto: ad Alghero sul Lungomare Barcellona."],
  ["Parc Fermé", "L'area chiusa dove le auto restano la notte."],
  ["Ingresso (Access Point)", "Il punto ufficiale da cui il pubblico raggiunge una prova."],
  ["Area Experience", "Zona riservata ai possessori del Pass Gold, nei punti più spettacolari."],
  ["Strade chiuse", "Da quell'ora la strada della prova è chiusa a tutti."],
  ["Prima auto", "L'ora in cui passa la prima vettura."],
];

const MAP_COLORS: [string, string][] = [
  ["Linea rossa", "la prova"],
  ["Frecce gialle", "la strada di accesso per il pubblico"],
  ["Cerchi blu numerati", "le vostre aree Pass Gold (Experience)"],
  ["Cerchi gialli", "le zone per tutto il pubblico"],
  ["P verde", "parcheggio Experience, stampa e organizzazione"],
  ["P gialla", "parcheggio spettatori"],
];

export function RallyGuide({ onClose }: { onClose: () => void }) {
  return (
    <Sheet title="Primo rally? Come funziona" onClose={onClose}>
      <ol className="space-y-4">
        {STEPS.map((s, i) => (
          <li key={s.title} className="flex gap-3">
            <span className="tnum flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-[18px] font-extrabold text-accent-ink">
              {i + 1}
            </span>
            <div>
              <h3 className="text-[20px] font-extrabold leading-snug">{s.title}</h3>
              <p className="mt-0.5 text-[18px] leading-snug">{s.text}</p>
            </div>
          </li>
        ))}
      </ol>

      <section className="mt-8 rounded-2xl border-2 border-rally p-4">
        <h3 className="text-[20px] font-extrabold text-rally">Sicurezza</h3>
        <ul className="mt-2 space-y-2">
          {SAFETY.map((t) => (
            <li key={t} className="flex gap-2 text-[18px] leading-snug">
              <span aria-hidden className="font-extrabold text-rally">•</span>
              {t}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8">
        <h3 className="text-[20px] font-extrabold">Come leggere le mappe ufficiali</h3>
        <dl className="mt-2 divide-y divide-line rounded-2xl bg-surface">
          {MAP_COLORS.map(([k, v]) => (
            <div key={k} className="flex gap-3 px-4 py-3">
              <dt className="w-[42%] shrink-0 text-[17px] font-bold">{k}</dt>
              <dd className="text-[17px]">{v}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mt-8">
        <h3 className="text-[20px] font-extrabold">Parole da sapere</h3>
        <dl className="mt-2 divide-y divide-line rounded-2xl bg-surface">
          {WORDS.map(([k, v]) => (
            <div key={k} className="px-4 py-3">
              <dt className="text-[17px] font-extrabold">{k}</dt>
              <dd className="text-[17px] leading-snug text-muted">{v}</dd>
            </div>
          ))}
        </dl>
      </section>
    </Sheet>
  );
}

/** Pulsante che apre la guida: usato in WRC e nella Home dei giorni di rally. */
export function RallyGuideButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-2xl bg-surface-2 px-4 py-3 text-left"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-[20px] font-extrabold text-accent-ink">
        ?
      </span>
      <span>
        <span className="block text-[18px] font-extrabold">Primo rally? Come funziona</span>
        <span className="block text-[15px] font-semibold text-muted">2 minuti: orari, strade chiuse, sicurezza</span>
      </span>
    </button>
  );
}
