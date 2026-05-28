import { readJson, supabase } from "./seed-utils";

type QuestSeed = {
  id: string;
  title: string;
  description: string;
  points: number;
  quest_type: string;
  resets: string;
};

async function main() {
  const quests = readJson<QuestSeed[]>("data/quests.json");

  const { error } = await supabase.from("quests").upsert(quests, {
    onConflict: "id",
  });

  if (error) throw error;

  console.log(`Seeded ${quests.length} quests.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
