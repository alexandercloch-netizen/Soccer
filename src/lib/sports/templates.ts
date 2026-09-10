import { z } from "zod";

/**
 * SportTemplate is the single abstraction that makes the app sport-agnostic.
 * Every sport-specific behavior (game format, positions, gear, vocabulary,
 * rotation model, age-band coaching guidance) is data here, never code in
 * components. Add a sport = add a template + activities. No prompt edits.
 */
export const AgeBandSchema = z.object({
  id: z.string(),
  label: z.string(),
  minAge: z.number(),
  maxAge: z.number(),
  guidance: z.string(),
  maxBlockMinutes: z.number(),
});

export const GameFormatSchema = z.object({
  label: z.string(),
  playersOnField: z.number(),
  periods: z.number(),
  periodMinutes: z.number().nullable(),
  periodUnit: z.enum(["quarter", "half", "period", "inning"]),
  substitutionRule: z.enum(["anytime", "period", "inning"]),
  goalkeeper: z.boolean(),
  keepScore: z.boolean(),
});

export const SportTemplateSchema = z.object({
  id: z.string(),
  sportId: z.enum(["soccer", "baseball", "basketball", "flag_football"]),
  name: z.string(),
  ageBandId: z.string(),
  ageBands: z.array(AgeBandSchema),
  gameFormat: GameFormatSchema,
  positions: z.array(z.object({ id: z.string(), label: z.string(), onFieldCount: z.number().optional() })),
  rotationModel: z.enum(["time_based", "position_based", "inning_based", "possession_based"]),
  gear: z.object({ player: z.array(z.string()), coach: z.array(z.string()) }),
  vocabulary: z.object({
    session: z.string(),
    contest: z.string(),
    venue: z.string(),
    scoreUnit: z.string(),
    ball: z.string(),
  }),
  eventKinds: z.array(z.string()),
  activityTags: z.array(z.string()),
});

export type SportTemplate = z.infer<typeof SportTemplateSchema>;
export type AgeBand = z.infer<typeof AgeBandSchema>;

const soccerAgeBands: AgeBand[] = [
  { id: "U6", label: "U4–U6 (ages 3–6)", minAge: 3, maxAge: 6, maxBlockMinutes: 8,
    guidance: "Every kid a ball. No lines, no laps, no lectures. Games with a story (pirates, sharks). 4–6 minute activities. Coach plays with them. Water every 15 minutes. Always end with a scrimmage. Praise effort, not outcome." },
  { id: "U8", label: "U7–U8 (ages 7–8)", minAge: 7, maxAge: 8, maxBlockMinutes: 10,
    guidance: "8–10 minute activities. Add 1v1 and 2v1, passing in pairs, 4v4/5v5 scrimmage. Introduce goalkeeper rotation and the simple idea of spreading out." },
  { id: "U10", label: "U9–U10 (ages 9–10)", minAge: 9, maxAge: 10, maxBlockMinutes: 15,
    guidance: "12–15 minute activities. Small-sided games with constraints, 7v7. Basic positions rotated through every player. First tactical vocabulary." },
  { id: "U11+", label: "U11 and up", minAge: 11, maxAge: 18, maxBlockMinutes: 20,
    guidance: "15–20 minute activities. Positional roles, 9v9/11v11, functional practices, fitness inside games." },
];

export const SPORT_TEMPLATES: Record<string, SportTemplate> = {
  "soccer-u6": {
    id: "soccer-u6",
    sportId: "soccer",
    name: "Soccer · Pre-K / Kindergarten (4v4)",
    ageBandId: "U6",
    ageBands: soccerAgeBands,
    gameFormat: { label: "4v4, no goalkeepers", playersOnField: 4, periods: 4, periodMinutes: 8, periodUnit: "quarter", substitutionRule: "period", goalkeeper: false, keepScore: false },
    positions: [],
    rotationModel: "time_based",
    gear: {
      player: ["Shin guards (required)", "Cleats or gym shoes", "Size 3 ball, pumped and labeled", "Water bottle"],
      coach: ["Cones", "Pinnies", "Ball pump", "First-aid kit", "Printed game-day card"],
    },
    vocabulary: { session: "practice", contest: "game", venue: "field", scoreUnit: "goal", ball: "size 3 ball" },
    eventKinds: ["practice", "game", "rainDate", "pictureDay", "party", "other"],
    activityTags: ["dribbling", "shooting", "1v1", "listening", "turning", "scrimmage"],
  },
  "soccer-u8": {
    id: "soccer-u8",
    sportId: "soccer",
    name: "Soccer · 1st–2nd grade (5v5)",
    ageBandId: "U8",
    ageBands: soccerAgeBands,
    gameFormat: { label: "5v5 with goalkeeper", playersOnField: 5, periods: 4, periodMinutes: 10, periodUnit: "quarter", substitutionRule: "period", goalkeeper: true, keepScore: false },
    positions: [
      { id: "gk", label: "Goalkeeper", onFieldCount: 1 },
      { id: "def", label: "Defender", onFieldCount: 2 },
      { id: "fwd", label: "Forward", onFieldCount: 2 },
    ],
    rotationModel: "time_based",
    gear: {
      player: ["Shin guards (required)", "Cleats", "Size 3 ball", "Water bottle"],
      coach: ["Cones", "Pinnies", "Ball pump", "First-aid kit", "Pop-up goals"],
    },
    vocabulary: { session: "practice", contest: "game", venue: "field", scoreUnit: "goal", ball: "size 3 ball" },
    eventKinds: ["practice", "game", "rainDate", "pictureDay", "party", "other"],
    activityTags: ["dribbling", "shooting", "passing", "1v1", "2v1", "goalkeeping", "scrimmage"],
  },
  "tball": {
    id: "tball",
    sportId: "baseball",
    name: "T-Ball · ages 4–6",
    ageBandId: "TBALL",
    ageBands: [
      { id: "TBALL", label: "T-Ball (ages 4–6)", minAge: 4, maxAge: 6, maxBlockMinutes: 8,
        guidance: "Stations, not lines: 3–4 kids per station with a coach. Everyone bats every inning. Rotate infield and outfield each inning. No score. Big praise for throwing and catching attempts." },
    ],
    gameFormat: { label: "Everyone fields, continuous batting order", playersOnField: 9, periods: 3, periodMinutes: null, periodUnit: "inning", substitutionRule: "inning", goalkeeper: false, keepScore: false },
    positions: [
      { id: "p", label: "Pitcher" }, { id: "1b", label: "1st base" }, { id: "2b", label: "2nd base" },
      { id: "ss", label: "Shortstop" }, { id: "3b", label: "3rd base" }, { id: "lf", label: "Left field" },
      { id: "cf", label: "Center field" }, { id: "rf", label: "Right field" }, { id: "rover", label: "Rover" },
    ],
    rotationModel: "position_based",
    gear: {
      player: ["Glove", "Batting helmet", "Cleats or gym shoes", "Water bottle"],
      coach: ["Batting tee", "Bucket of soft balls", "Bases", "First-aid kit"],
    },
    vocabulary: { session: "practice", contest: "game", venue: "diamond", scoreUnit: "run", ball: "soft T-ball" },
    eventKinds: ["practice", "game", "rainDate", "pictureDay", "party", "other"],
    activityTags: ["throwing", "catching", "hitting", "base running", "fielding"],
  },
};

export function getTemplate(id: string): SportTemplate {
  const t = SPORT_TEMPLATES[id];
  if (!t) throw new Error(`Unknown sport template: ${id}`);
  return SportTemplateSchema.parse(t);
}

export function currentAgeBand(t: SportTemplate): AgeBand {
  return t.ageBands.find((b) => b.id === t.ageBandId) ?? t.ageBands[0];
}
