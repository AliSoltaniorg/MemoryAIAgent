import readline from "readline";
import {
  needsSearch,
  getSearchQuery,
  googleSearch,
  askOpenAI,
  updateMemoryWithNewInfo,
} from "./agent";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const conversationHistory: { role: "system" | "user" | "assistant"; content: string }[] = [
  {
    role: "system",
    content: "You are a helpful AI agent with internet search capability.",
  },
];

function startChat(): void {
  rl.question("Your question: ", async (input: string) => {
    conversationHistory.push({ role: "user", content: input });

    const shouldSearch = await needsSearch(input);

    if (shouldSearch) {
      console.log("Model said I need to search...");
      const searchQuery = await getSearchQuery(input);
      console.log("Search for: ", searchQuery);
      const searchResult = await googleSearch(searchQuery);
      conversationHistory.push({ role: "system", content: `Search result: ${searchResult}` });
    }

    const answer = await ask(conversationHistory);
    conversationHistory.push({ role: "assistant", content: answer });

    console.log("Answer: ", answer);

    // Updating long-term memory
    const memorySummaryPrompt = `
    Extract any important facts or information from the assistant's last response that should be remembered long-term. If nothing important, answer "None".

    Assistant response: """${answer}"""
    Important facts:
    `;

    const memorySummaryResponse = await askOpenAI([
      { role: "user", content: memorySummaryPrompt },
    ]);

    if (memorySummaryResponse.toLowerCase() !== "none") {
      await updateMemoryWithNewInfo(memorySummaryResponse);
    }

    startChat();
  });
}

startChat();
