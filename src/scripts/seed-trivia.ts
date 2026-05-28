import { readJson, supabase } from "./seed-utils";

type TriviaSeed = {
  question: string;
  options: string[];
  correct_answer: string;
  difficulty: string;
  points: number;
};

async function main() {
  const questions = readJson<TriviaSeed[]>("data/trivia.json");

  for (const question of questions) {
    const { data: existing, error: lookupError } = await supabase
      .from("daily_trivia")
      .select("id")
      .eq("question", question.question)
      .maybeSingle();

    if (lookupError) throw lookupError;

    if (existing?.id) {
      const { error } = await supabase.from("daily_trivia").update(question).eq("id", existing.id);
      if (error) throw error;
    } else {
      const { error } = await supabase.from("daily_trivia").insert(question);
      if (error) throw error;
    }
  }

  console.log(`Seeded ${questions.length} trivia questions.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
