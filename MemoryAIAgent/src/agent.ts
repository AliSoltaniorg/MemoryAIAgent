import OpenAI from "openai";
import { MemoryManager } from "./memoryManager";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const memory = new MemoryManager();

export async function runAgent(userInput: string) {
  // Reading current memory
  const currentMemory = memory.getMemory();

  // Add user input to history
  memory.addHistory(`User: ${userInput}`);

  // Creating a prompt according to memory
  const prompt = `
You are a smart assistant.
By now you know these:
${JSON.stringify(currentMemory.facts, null, 2)}

Conversation history:
${currentMemory.history.join("\n")}

User said:
"${userInput}"

Give the correct answer: 
`;

  // Request to model
  const completion = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: "You are a smart assistant with a long-term memory." },
      { role: "user", content: prompt },
    ],
  });

  const response = completion.choices[0].message?.content || "";

  // Save answer in history
  memory.addHistory(`Agent: ${response}`);

  // Example of saving a new fact (if needed)
  memory.addFact("lastUserMessage", userInput);
  memory.addFact("lastAgentResponse", response);

  return response;
}
