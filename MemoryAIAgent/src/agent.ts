import readline from "readline";
import client from "./openRouterClient";
import { MemoryManager, MemoryData } from "./memoryManager";
import { googleSearch } from "./googleSearch";

type Role = "system" | "user" | "assistant";

interface Message {
  role: Role;
  content: string;
}

/** Setting */
const MAX_HISTORY_MESSAGES = 10; // Take the last few messages to the prompt to reduce the token
const memory = new MemoryManager();

/** readline to interact with the user in the terminal */
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

/** Contributor: Creating a message array for OpenAI from memory and history */
function buildBaseConversation(userMessage?: string): Message[] {
  const mem = memory.getMemory(); // Assumption: { history: string[], facts: Record<string,string> }
  const factsText =
    Object.keys(mem.facts).length > 0
      ? `Long-term facts:\n${Object.entries(mem.facts)
        .map(([k, v]) => `- ${k}: ${v}`)
        .join("\n")}`
      : "Long-term facts: (none)";

  const recentHistory = mem.history.slice(-MAX_HISTORY_MESSAGES);

  const systemContent = `You are a helpful AI assistant with access to long-term memory and web search.
${factsText}
Recent conversation history (most recent ${MAX_HISTORY_MESSAGES} messages):
${recentHistory.join("\n")}`;

  const messages: Message[] = [{ role: "system", content: systemContent }];

  if (userMessage) {
    messages.push({ role: "user", content: userMessage });
  }

  return messages;
}

/** Step 1: Deciding if a search is needed (boolean return) */
async function decideSearch(userMessage: string): Promise<boolean> {
  const prompt = `
Decide whether the following user question REQUIRES a web search to answer accurately.
Answer with exactly "yes" or "no", nothing else.

User message:
"""${userMessage}"""
`;
  try {
    const res = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0,
      max_tokens: 16,
    });

    const text = (res.choices[0]?.message.content || "").trim().toLowerCase();
    return text === "yes";
  } catch (err) {
    console.error("decideSearch error:", err);
    // Be conservative when it's wrong: assume it's not needed
    return false;
  }
}

/** Step 2: Generate search query */
async function getSearchQuery(userMessage: string): Promise<string> {
  const prompt = `
Given the user's request below, produce a concise, focused search query (1 line) that would find the best information on the web.

User message:
"""${userMessage}"""

Search query:
`;
  try {
    const res = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0,
      max_tokens: 64,
    });

    return (res.choices[0]?.message.content || userMessage).trim();
  } catch (err) {
    console.error("getSearchQuery error:", err);
    return userMessage;
  }
}

/** Step 3: performSearch using googleSearch (separate module) */
async function performSearch(query: string): Promise<string> {
  try {
    const results = await googleSearch(query); // A function that returns snippets and links
    return results;
  } catch (err) {
    console.error("performSearch error:", err);
    return "Search error or no results.";
  }
}

/** Step 4: Generate the final answer by combining memory, search results, and queries */
async function generateResponse(userMessage: string, searchResult?: string): Promise<string> {
  // Basic message construction with memory
  const base = buildBaseConversation();

  // If the search is done, add it to the system context
  if (searchResult) {
    base.push({
      role: "system",
      content: `Web search results:\n${searchResult}\n\nUse these results when answering.`,
    });
  }

  // Then add the main user's message
  base.push({ role: "user", content: userMessage });

  // A request to the model to generate a response
  try {
    const res = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: base,
      temperature: 0.3,
      max_tokens: 800,
    });

    return res.choices[0]?.message.content || "(no response)";
  } catch (err) {
    console.error("generateResponse error:", err);
    return "Error while generating response.";
  }
}

/** The main function of the chat cycle */
async function handleUserInput(userInput: string) {
  // Save user input in .history memory
  memory.addHistory(`User: ${userInput}`);

  // Deciding whether a web search is needed
  const needSearch = await decideSearch(userInput);

  let searchResult: string | undefined;
  if (needSearch) {
    console.log("Decided to perform web search...");
    const query = await getSearchQuery(userInput);
    console.log("Search query:", query);
    searchResult = await performSearch(query);
    // Save a summary of results in memory (if desired)
    memory.addHistory(`Search: ${query} -> ${searchResult.split("\n")[0] ?? ""}`);
  }

  // Generate final answer
  const answer = await generateResponse(userInput, searchResult);

  // Save the answer in memory and simple facts (example)
  memory.addHistory(`Assistant: ${answer}`);

  // Here we can extract and store important facts with a model call.
  // But for simplicity, we save lastResponse for now:
  memory.addFact("lastResponse", answer);

  // Show answer
  console.log("\n Answer: \n", answer, "\n");
}

/** The main loop to take input from the user */
export default function startREPL() {
  rl.question("Your question: ", async (input: string) => {
    if (!input.trim()) {
      startREPL();
      return;
    }

    // Simple commands
    if (input.trim().toLowerCase() === "/memory") {
      console.log("=== Memory ===");
      console.log(JSON.stringify(memory.getMemory(), null, 2));
      startREPL();
      return;
    }

    if (input.trim().toLowerCase() === "/exit") {
      console.log("Goodbye!");
      rl.close();
      process.exit(0);
    }

    try {
      await handleUserInput(input);
    } catch (err) {
      console.error("Unhandled error:", err);
    }

    startREPL();
  });
}

/** Start */
console.log("Agent started. Type /memory to view memory, /exit to quit.");
startREPL();
