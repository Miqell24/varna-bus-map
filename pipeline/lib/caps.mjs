// ALL-CAPS Bulgarian stop names → normal mixed case.
//
// Varna's feed shouts 606 of its 616 stop names ("ЦЕНТРАЛНА ПОЩА / АПТ.
// САНИТА / TSENTRALNA POSHTA (SANITA)") while the street names on the map
// come from OSM in proper case, and the two sit next to each other. This is
// the Athens greek.mjs recipe retold in Bulgarian: harvest a dictionary of
// properly-written word forms out of the OSM extract the build already reads,
// then rewrite each shouted name word by word through it.
//
// Bulgarian is not Spanish about capitals: a compound name capitalises only
// its FIRST word and any proper noun inside it — "Централна поща",
// "Македонски дом", but "Янко Михайлов". Plain title case would capitalise
// every word, so the dictionary does the real work here: OSM writes "поща"
// and "дом" lowercase and "Михайлов" capitalised, and the rewrite keeps
// whatever case the dictionary hands back. Only the first word is forced to
// a capital, because a name has to start with one.

const norm = (s) => s.toUpperCase();
const UPPER = /[А-ЯЁЪЬA-Z]/;
const LOWER = /[а-яёъьa-z]/;
// One word = one run of letters, Cyrillic or Latin (Varna mixes both).
const WORD = /[А-Яа-яЁёЪъЬьA-Za-z]+/g;

// A dictionary of properly-cased word forms, harvested from every name in the
// OSM extracts. Words that appear in several spellings keep the commonest one.
export function buildNameDict(osmDocs) {
  const seen = new Map(); // folded word → Map(spelling → count)
  for (const doc of osmDocs) {
    for (const e of doc.elements || []) {
      const name = e.tags && e.tags.name;
      if (!name || !LOWER.test(name)) continue; // caps names teach us nothing
      for (const w of name.match(WORD) || []) {
        if (w.length < 3) continue;
        const k = norm(w);
        let m = seen.get(k);
        if (!m) seen.set(k, (m = new Map()));
        m.set(w, (m.get(w) || 0) + 1);
      }
    }
  }
  const dict = new Map();
  for (const [k, m] of seen) {
    let best = null, bestN = -1;
    for (const [w, n] of m) if (n > bestN) { best = w; bestN = n; }
    dict.set(k, best);
  }
  return dict;
}

// Prepositions and conjunctions go lowercase anywhere but the front of a name.
const PREPS = new Set(['НА', 'ЗА', 'ОТ', 'ДО', 'ПРИ', 'КЪМ', 'И', 'С', 'СЪС',
  'СРЕЩУ', 'КРАЙ', 'ПОД', 'НАД', 'ПРЕД', 'ЗАД', 'ПО', 'В', 'ВЪВ']);

const titleWord = (w) => w.charAt(0) + w.slice(1).toLowerCase();
const capWord = (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();

// Rewrite one name, WORD BY WORD: a word that already carries a lowercase
// letter is left exactly as it is — that covers the ten names this feed
// already writes properly.
export function cyrillicTitleCase(name, dict, acronyms) {
  if (!name || !UPPER.test(name) || LOWER.test(name)) return name;
  const toks = name.split(/(\s+)/);
  let wi = -1, prevWord = '';
  return toks.map((tok) => {
    if (!tok || /^\s+$/.test(tok)) return tok;
    wi++;
    const prev = prevWord;
    prevWord = norm(tok).replace(/[^А-ЯЁЪЬA-Z]/g, '') || prevWord;
    if (!UPPER.test(tok)) return tok; // digits, punctuation
    const first = wi === 0;
    return tok.replace(WORD, (w) => {
      if (acronyms && acronyms.has(w)) return w;
      const k = norm(w);
      const known = dict && dict.get(k);
      // prepositions first: НА, ЗА, ДО are two letters and would otherwise be
      // caught by the initialism guard below and left shouting
      if (!first && PREPS.has(k)) return w.toLowerCase();
      // short all-caps runs the dictionary has never seen ARE initialisms —
      // ЖП (железопътна), КК (курортен комплекс), ДКЦ, МОЛ — and they shout
      // on the pole too
      if (!known && w.length <= 3) return w;
      if (/^[IVX]+$/.test(w) && w.length >= 2) return w; // roman numerals
      // the dictionary's own case is the answer — Bulgarian keeps "поща"
      // lowercase inside a name and "Михайлов" capitalised
      const out = known ? titleWord(known) : capWord(w);
      return first ? out.charAt(0).toUpperCase() + out.slice(1) : out;
    });
  }).join('');
}
