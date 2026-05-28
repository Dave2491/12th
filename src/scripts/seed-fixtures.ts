import { readJson, supabase } from "./seed-utils";

type TeamStrength = {
  country_code: string;
  attack: number;
  defence: number;
};

type FixtureSeed = {
  id: number;
  homeTeam: string;
  awayTeam: string;
  kickoffUtc: string;
  status: string;
  // group and label are metadata only — not stored in the fixtures table
};

function seededHash(seed: string): number {
  let value = 0;
  for (let i = 0; i < seed.length; i += 1) {
    value = (value * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return value;
}

function strengthSeededScore(
  seed: string,
  homeAttack: number,
  awayAttack: number,
  homeDefence: number,
  awayDefence: number,
): { home: number; away: number } {
  const hash = seededHash(seed);
  const homeVariance = (hash % 3) - 1;              // -1, 0, +1
  const awayVariance = (Math.floor(hash / 7) % 3) - 1;
  // Expected goals: attack vs opposition defence, centred around 1.5
  const homeExpected = Math.round((homeAttack - awayDefence) / 20 + 1.5);
  const awayExpected = Math.round((awayAttack - homeDefence) / 20 + 1.5);
  return {
    home: Math.max(0, Math.min(5, homeExpected + homeVariance)),
    away: Math.max(0, Math.min(5, awayExpected + awayVariance)),
  };
}

async function main() {
  const fixtures = readJson<FixtureSeed[]>("data/fixtures.json");
  const teams = readJson<TeamStrength[]>("data/team-strength.json");

  const strengthMap = new Map(teams.map((t) => [t.country_code, t]));

  const rows = fixtures.map((fixture) => {
    const kickoffDate = fixture.kickoffUtc.slice(0, 10);
    const seed = fixture.homeTeam + fixture.awayTeam + kickoffDate;

    const home = strengthMap.get(fixture.homeTeam);
    const away = strengthMap.get(fixture.awayTeam);

    const score =
      home && away
        ? strengthSeededScore(seed, home.attack, away.attack, home.defence, away.defence)
        : { home: seededHash(seed) % 4, away: Math.floor(seededHash(seed) / 7) % 4 };

    return {
      id: fixture.id,
      home_team: fixture.homeTeam,
      away_team: fixture.awayTeam,
      kickoff_utc: fixture.kickoffUtc,
      status: fixture.status,
      simulated_home_score: score.home,
      simulated_away_score: score.away,
      seed,
      is_demo: true,
    };
  });

  const { error } = await supabase.from("fixtures").upsert(rows, {
    onConflict: "id",
  });

  if (error) throw error;

  console.log(`Seeded ${rows.length} fixtures.`);
  rows
    .filter((r) => r.status !== "upcoming")
    .forEach((r) =>
      console.log(
        `  [${r.status}] ${r.home_team} ${r.simulated_home_score}–${r.simulated_away_score} ${r.away_team}  (${r.kickoff_utc.slice(0, 10)})`,
      ),
    );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
