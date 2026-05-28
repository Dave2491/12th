import type { Country, Badge } from "@/types";
import { getFlag } from "@/lib/flags";

export const COUNTRIES: Country[] = [
  // Hosts
  { code: "US",     name: "United States",          flag: getFlag("US"),     totalPoints: 0, fanCount: 0 },
  { code: "CA",     name: "Canada",                  flag: getFlag("CA"),     totalPoints: 0, fanCount: 0 },
  { code: "MX",     name: "Mexico",                  flag: getFlag("MX"),     totalPoints: 0, fanCount: 0 },

  // UEFA
  { code: "GB-ENG", name: "England",                 flag: getFlag("GB-ENG"), totalPoints: 0, fanCount: 0 },
  { code: "FR",     name: "France",                  flag: getFlag("FR"),     totalPoints: 0, fanCount: 0 },
  { code: "DE",     name: "Germany",                 flag: getFlag("DE"),     totalPoints: 0, fanCount: 0 },
  { code: "ES",     name: "Spain",                   flag: getFlag("ES"),     totalPoints: 0, fanCount: 0 },
  { code: "PT",     name: "Portugal",                flag: getFlag("PT"),     totalPoints: 0, fanCount: 0 },
  { code: "NL",     name: "Netherlands",             flag: getFlag("NL"),     totalPoints: 0, fanCount: 0 },
  { code: "BE",     name: "Belgium",                 flag: getFlag("BE"),     totalPoints: 0, fanCount: 0 },
  { code: "HR",     name: "Croatia",                 flag: getFlag("HR"),     totalPoints: 0, fanCount: 0 },
  { code: "CH",     name: "Switzerland",             flag: getFlag("CH"),     totalPoints: 0, fanCount: 0 },
  { code: "AT",     name: "Austria",                 flag: getFlag("AT"),     totalPoints: 0, fanCount: 0 },
  { code: "GB-SCT", name: "Scotland",                flag: getFlag("GB-SCT"), totalPoints: 0, fanCount: 0 },
  { code: "NO",     name: "Norway",                  flag: getFlag("NO"),     totalPoints: 0, fanCount: 0 },
  { code: "TR",     name: "Türkiye",                 flag: getFlag("TR"),     totalPoints: 0, fanCount: 0 },
  { code: "CZ",     name: "Czechia",                 flag: getFlag("CZ"),     totalPoints: 0, fanCount: 0 },
  { code: "BA",     name: "Bosnia and Herzegovina",  flag: getFlag("BA"),     totalPoints: 0, fanCount: 0 },
  { code: "SE",     name: "Sweden",                  flag: getFlag("SE"),     totalPoints: 0, fanCount: 0 },

  // CAF
  { code: "MA",     name: "Morocco",                 flag: getFlag("MA"),     totalPoints: 0, fanCount: 0 },
  { code: "SN",     name: "Senegal",                 flag: getFlag("SN"),     totalPoints: 0, fanCount: 0 },
  { code: "EG",     name: "Egypt",                   flag: getFlag("EG"),     totalPoints: 0, fanCount: 0 },
  { code: "CI",     name: "Ivory Coast",             flag: getFlag("CI"),     totalPoints: 0, fanCount: 0 },
  { code: "GH",     name: "Ghana",                   flag: getFlag("GH"),     totalPoints: 0, fanCount: 0 },
  { code: "DZ",     name: "Algeria",                 flag: getFlag("DZ"),     totalPoints: 0, fanCount: 0 },
  { code: "TN",     name: "Tunisia",                 flag: getFlag("TN"),     totalPoints: 0, fanCount: 0 },
  { code: "ZA",     name: "South Africa",            flag: getFlag("ZA"),     totalPoints: 0, fanCount: 0 },
  { code: "CV",     name: "Cape Verde",              flag: getFlag("CV"),     totalPoints: 0, fanCount: 0 },

  // AFC
  { code: "JP",     name: "Japan",                   flag: getFlag("JP"),     totalPoints: 0, fanCount: 0 },
  { code: "KR",     name: "South Korea",             flag: getFlag("KR"),     totalPoints: 0, fanCount: 0 },
  { code: "AU",     name: "Australia",               flag: getFlag("AU"),     totalPoints: 0, fanCount: 0 },
  { code: "IR",     name: "Iran",                    flag: getFlag("IR"),     totalPoints: 0, fanCount: 0 },
  { code: "SA",     name: "Saudi Arabia",            flag: getFlag("SA"),     totalPoints: 0, fanCount: 0 },
  { code: "QA",     name: "Qatar",                   flag: getFlag("QA"),     totalPoints: 0, fanCount: 0 },
  { code: "UZ",     name: "Uzbekistan",              flag: getFlag("UZ"),     totalPoints: 0, fanCount: 0 },
  { code: "JO",     name: "Jordan",                  flag: getFlag("JO"),     totalPoints: 0, fanCount: 0 },

  // CONMEBOL
  { code: "AR",     name: "Argentina",               flag: getFlag("AR"),     totalPoints: 0, fanCount: 0 },
  { code: "BR",     name: "Brazil",                  flag: getFlag("BR"),     totalPoints: 0, fanCount: 0 },
  { code: "CO",     name: "Colombia",                flag: getFlag("CO"),     totalPoints: 0, fanCount: 0 },
  { code: "UY",     name: "Uruguay",                 flag: getFlag("UY"),     totalPoints: 0, fanCount: 0 },
  { code: "EC",     name: "Ecuador",                 flag: getFlag("EC"),     totalPoints: 0, fanCount: 0 },
  { code: "PY",     name: "Paraguay",                flag: getFlag("PY"),     totalPoints: 0, fanCount: 0 },

  // CONCACAF
  { code: "PA",     name: "Panama",                  flag: getFlag("PA"),     totalPoints: 0, fanCount: 0 },
  { code: "CW",     name: "Curaçao",                 flag: getFlag("CW"),     totalPoints: 0, fanCount: 0 },
  { code: "HT",     name: "Haiti",                   flag: getFlag("HT"),     totalPoints: 0, fanCount: 0 },

  // OFC
  { code: "NZ",     name: "New Zealand",             flag: getFlag("NZ"),     totalPoints: 0, fanCount: 0 },
];

export const BADGE_DEFINITIONS: Record<string, Badge> = {
  first_whistle: {
    type: "first_checkin",
    name: "First Whistle",
    description: "First ever check-in. You showed up.",
    imageUrl: "/badges/first-whistle.svg",
  },
  ever_present: {
    type: "streak_3",
    name: "Ever Present",
    description: "5-game check-in streak. You don't miss.",
    imageUrl: "/badges/ever-present.svg",
  },
  undroppable: {
    type: "streak_7",
    name: "Undroppable",
    description: "10-game streak. Automatic selection.",
    imageUrl: "/badges/undroppable.svg",
  },
  called_it: {
    type: "correct_prediction",
    name: "Called It",
    description: "First correct answer. That's what fans know.",
    imageUrl: "/badges/called-it.svg",
  },
  tactician: {
    type: "correct_prediction",
    name: "Tactician",
    description: "5 correct answers. You read the game.",
    imageUrl: "/badges/tactician.svg",
  },
  the_gaffer: {
    type: "correct_prediction",
    name: "The Gaffer",
    description: "10 correct answers. Undeniable.",
    imageUrl: "/badges/the-gaffer.svg",
  },
  twelfth_man: {
    type: "first_checkin",
    name: "12th Man",
    description: "Joined a national squad. Your country just got stronger.",
    imageUrl: "/badges/twelfth-man.svg",
  },
  standard_bearer: {
    type: "top_fan",
    name: "Standard Bearer",
    description: "Top fan in your country this week.",
    imageUrl: "/badges/standard-bearer.svg",
  },
  the_wall: {
    type: "country_contributor",
    name: "The Wall",
    description: "Contributed to your country's top 10 ranking.",
    imageUrl: "/badges/the-wall.svg",
  },
  quest_complete: {
    type: "first_checkin",
    name: "Quest Complete",
    description: "First quest done. Points on the board.",
    imageUrl: "/badges/quest-complete.svg",
  },
  all_action: {
    type: "country_contributor",
    name: "All Action",
    description: "Every quest type completed. Nothing left undone.",
    imageUrl: "/badges/all-action.svg",
  },
};

export const BADGE_ICONS: Record<string, string> = {
  first_whistle:    "✅",
  ever_present:     "🔥",
  undroppable:      "⚡",
  called_it:        "🔮",
  tactician:        "🧠",
  the_gaffer:       "🎩",
  twelfth_man:      "🏳️",
  standard_bearer:  "⭐",
  the_wall:         "🧱",
  quest_complete:   "🎯",
  all_action:       "💥",
};
