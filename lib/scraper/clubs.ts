import type { ClubConfig } from "./types";

export const CLUBS: ClubConfig[] = [
  {
    name: "Ushuaïa Ibiza",
    urls: ["https://theushuaiaexperience.com/en/club"],
    aiHints:
      "Events are listed as cards with artist names, dates, and ticket links. Look for event titles, dates in European format, and any lineup/description info.",
  },
  {
    name: "Hï Ibiza",
    urls: ["https://hiibiza.com/events-calendar"],
    aiHints:
      "Calendar-style event listing. Events have artist/show names, dates, and ticket URLs. May use JavaScript-rendered content — check for JSON data in script tags or __NUXT__ data.",
  },
  {
    name: "Amnesia",
    urls: ["https://amnesia.es/en/calendar/ibiza/2026/all"],
    aiHints:
      "Calendar page with event cards. Each event has a title (party/artist name), date, and possibly a ticket link. Dates may be in DD/MM/YYYY or similar European format.",
  },
  {
    name: "Pacha",
    urls: ["https://pacha.com/events"],
    aiHints:
      "Event listing page. Look for event names, dates, venue confirmation (should be Pacha Ibiza specifically), and ticket links. May have JSON-LD or structured data.",
  },
  {
    name: "Chinois Ibiza",
    urls: [
      "https://clubchinoisibiza.com/events",
      "https://www.ibiza-spotlight.com/night/club_chinois_ibiza",
    ],
    aiHints:
      "Smaller club — may have fewer events. If primary URL fails, fallback is ibiza-spotlight which lists events in a different format. Look for event names and dates.",
  },
  {
    name: "Cova Santa",
    urls: [
      "https://covasanta.com/en/events.html",
      "https://www.ibiza-spotlight.com/night/cova-santa-ibiza",
    ],
    aiHints:
      "Restaurant/venue with occasional events. May have fewer listings. Fallback is ibiza-spotlight. Look for event/party names and dates.",
  },
  {
    name: "UNVRS",
    urls: ["https://unvrs.com/events-calendar"],
    aiHints:
      "Newer venue (formerly Privilege/Space). Event calendar page. Look for party names, DJ lineups, dates, and ticket URLs.",
  },
];
