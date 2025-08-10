// src/agent.ts
import OpenAI from "openai";
import { MemoryManager } from "./memoryManager";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const memory = new MemoryManager();

export async function runAgent(userInput: string) {
  // خواندن حافظه فعلی
  const currentMemory = memory.getMemory();

  // اضافه کردن ورودی کاربر به تاریخچه
  memory.addHistory(`User: ${userInput}`);

  // ساخت prompt با توجه به حافظه
  const prompt = `
تو یک دستیار هوشمند هستی.
تا الان این‌ها رو میدونی:
${JSON.stringify(currentMemory.facts, null, 2)}

تاریخچه مکالمه:
${currentMemory.history.join("\n")}

کاربر گفت:
"${userInput}"

پاسخ مناسب رو بده:
`;

  // درخواست به مدل
  const completion = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: "شما یک دستیار هوشمند با حافظه بلندمدت هستید." },
      { role: "user", content: prompt },
    ],
  });

  const response = completion.choices[0].message?.content || "";

  // ذخیره پاسخ در تاریخچه
  memory.addHistory(`Agent: ${response}`);

  // مثال ذخیره یک واقعیت جدید (در صورت نیاز)
  memory.addFact("lastUserMessage", userInput);
  memory.addFact("lastAgentResponse", response);

  return response;
}
