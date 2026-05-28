import { readJson, supabase } from "./seed-utils";

type TeamStrengthSeed = {
  country_code: string;
  country_name: string;
  attack: number;
  defence: number;
  midfield: number;
  form: number;
  fifa_rank: number;
};

async function main() {
  const teams = readJson<TeamStrengthSeed[]>("data/team-strength.json");

  const { error } = await supabase.from("team_strength").upsert(teams, {
    onConflict: "country_code",
  });

  if (error) throw error;

  console.log(`Seeded ${teams.length} team strength ratings.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
