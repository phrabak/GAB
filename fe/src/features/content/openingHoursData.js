// Built-in schedule; saved days replace the defaults of the same office and day key, including deleted rows.
import en from "@/i18n/locales/en.json";
import cs from "@/i18n/locales/cs.json";

const DICTIONARIES = { en, cs };

const DEFAULT_OFFICES = [
  {
    id: "1",
    days: [
      {
        key: "mon",
        rows: [
          ["8 – 10 hod.", "infantCare"],
          ["10 – 12 hod.", "sickPatients"],
          ["13 – 14 hod.", "infantCare"],
          ["14 – 15 hod.", "vaccination"],
        ],
      },
      {
        key: "tue",
        rows: [
          ["8 – 10 hod.", "infantCare"],
          ["10 – 12 hod.", "sickPatients"],
          ["13 – 14 hod.", "infantCare"],
          ["14 – 15 hod.", "vaccination"],
        ],
      },
      {
        key: "wed",
        rows: [
          ["8 – 10 hod.", "infantCare"],
          ["10 – 12 hod.", "sickPatients"],
          ["15 – 16 hod.", "infantCare"],
          ["16 – 18 hod.", "vaccination"],
        ],
      },
      {
        key: "thu",
        rows: [
          ["8 – 10 hod.", "infantCare"],
          ["10 – 12 hod.", "sickPatients"],
          ["13 – 14 hod.", "infantCare"],
          ["14 – 15 hod.", "vaccination"],
        ],
      },
      {
        key: "fri",
        rows: [
          ["8 – 10 hod.", "infantCare"],
          ["10 – 12 hod.", "sickPatients"],
          ["12 – 13 hod.", "assessment"],
        ],
      },
    ],
  },
  {
    id: "2",
    days: [
      {
        key: "mon",
        rows: [
          ["8 – 10 hod.", "infantCare"],
          ["10 – 12 hod.", "sickPatients"],
          ["13 – 17 hod.", "assessment"],
        ],
      },
      {
        key: "tue",
        rows: [
          ["8 – 10 hod.", "infantCare"],
          ["10 – 12 hod.", "sickPatients"],
        ],
      },
      {
        key: "wed",
        rows: [
          ["8 – 10 hod.", "infantCare"],
          ["10 – 12 hod.", "sickPatients"],
          ["13 – 15 hod.", "vaccination"],
        ],
      },
      {
        key: "thu",
        rows: [
          ["8 – 10 hod.", "infantCare"],
          ["10 – 12 hod.", "sickPatients"],
          ["13 – 15 hod.", "vaccination"],
        ],
      },
      {
        key: "fri",
        rows: [
          ["8 – 10 hod.", "infantCare"],
          ["10 – 12 hod.", "sickPatients"],
        ],
      },
    ],
  },
];

// Merges the saved data over the defaults. A saved day wins entirely; `services` holds the texts of every language.
// Rows with an empty time and service are dropped.
const isEmptyRow = (time, service) => !time?.trim() && !service?.trim();

export function resolveOffices(stored, locale, t) {
  return DEFAULT_OFFICES.map((office) => {
    const storedOffice = stored?.offices?.find((o) => o.id === office.id);
    return {
      id: office.id,
      days: office.days.map((day) => {
        const storedDay = storedOffice?.days?.find((d) => d.key === day.key);
        const sourceRows = storedDay ? storedDay.rows : day.rows;
        return {
          key: day.key,
          label: t(`openingHours.days.${day.key}`),
          rows: sourceRows.map((sourceRow, index) => {
            const storedRow = storedDay ? sourceRow : undefined;
            const defaultRow = day.rows[index];
            const services = { ...storedRow?.services };
            for (const code of Object.keys(DICTIONARIES)) {
              services[code] ??= defaultRow ? DICTIONARIES[code].openingHours.services[defaultRow[1]] : "";
            }
            return {
              time: storedRow ? storedRow.time : sourceRow[0],
              service: services[locale],
              services,
            };
          }).filter((row) => !isEmptyRow(row.time, row.service)),
        };
      }),
    };
  });
}

// Blood-draw notice and emergency-service rows; saved rows replace the defaults entirely.
// `notices`, `days` and `times` hold the texts of every language, `notice`, `day` and `time` the current one.
const DEFAULT_BLOOD_DRAW_ROWS = [
  ["weekdays", "weekdaysTime"],
  ["weekend", "weekendTime"],
];

export function resolveBloodDraw(stored, locale) {
  const codes = Object.keys(DICTIONARIES);
  const saved = stored?.bloodDraw;

  const notices = { ...saved?.notice };
  for (const code of codes) notices[code] ??= DICTIONARIES[code].openingHours.bloodDrawNotice;

  const sourceRows = saved ? saved.rows : DEFAULT_BLOOD_DRAW_ROWS;
  const rows = sourceRows
    .map((sourceRow, index) => {
      const defaultRow = DEFAULT_BLOOD_DRAW_ROWS[index];
      const days = { ...(saved ? sourceRow.day : undefined) };
      const times = { ...(saved ? sourceRow.time : undefined) };
      for (const code of codes) {
        const lspp = DICTIONARIES[code].openingHours.lspp;
        days[code] ??= defaultRow ? lspp[defaultRow[0]] : "";
        times[code] ??= defaultRow ? lspp[defaultRow[1]] : "";
      }
      return { day: days[locale], time: times[locale], days, times };
    })
    .filter((row) => !isEmptyRow(row.day, row.time));

  return { notice: notices[locale], notices, rows };
}

// Shape sent to the API: every row carries its time and the service texts of all known languages.
export function toPayload(offices, locale, bloodDraw) {
  return {
    offices: offices.map((office) => ({
      id: office.id,
      days: office.days.map((day) => ({
        key: day.key,
        rows: day.rows
          .filter((row) => !isEmptyRow(row.time, row.service))
          .map((row) => ({
            time: row.time,
            services: { ...row.services, [locale]: row.service },
          })),
      })),
    })),
    bloodDraw: {
      notice: { ...bloodDraw.notices, [locale]: bloodDraw.notice },
      rows: bloodDraw.rows
        .filter((row) => !isEmptyRow(row.day, row.time))
        .map((row) => ({
          day: { ...row.days, [locale]: row.day },
          time: { ...row.times, [locale]: row.time },
        })),
    },
  };
}
