// Built-in texts; saved rows replace the default rows entirely, including deleted ones.
import en from "@/i18n/locales/en.json";
import cs from "@/i18n/locales/cs.json";

const DICTIONARIES = { en, cs };
const CODES = Object.keys(DICTIONARIES);

const isEmpty = (text) => !text?.trim();

// `titles`, `columnLabels` and each row's `texts` hold every language; `title`, `columnLabel` and `text` the current one.
// Rows with an empty text are dropped.
export function resolvePreventiveCheckups(stored, locale) {
  const defaults = (code) => DICTIONARIES[code].services.preventiveCheckups;

  const titles = { ...stored?.title };
  const columnLabels = { ...stored?.columnLabel };
  for (const code of CODES) {
    titles[code] ??= defaults(code).title;
    columnLabels[code] ??= defaults(code).columnLabel;
  }

  const sourceRows =
    stored?.rows ??
    defaults(locale).rows.map((_, index) => Object.fromEntries(CODES.map((code) => [code, defaults(code).rows[index]])));

  const rows = sourceRows
    .map((source) => {
      const texts = { ...source };
      for (const code of CODES) texts[code] ??= "";
      return { text: texts[locale], texts };
    })
    .filter((row) => !isEmpty(row.text));

  return { title: titles[locale], titles, columnLabel: columnLabels[locale], columnLabels, rows };
}

// Shape sent to the API: every text carries all known languages.
export function toPayload(checkups, locale) {
  return {
    title: { ...checkups.titles, [locale]: checkups.title },
    columnLabel: { ...checkups.columnLabels, [locale]: checkups.columnLabel },
    rows: checkups.rows
      .filter((row) => !isEmpty(row.text))
      .map((row) => ({ ...row.texts, [locale]: row.text })),
  };
}
