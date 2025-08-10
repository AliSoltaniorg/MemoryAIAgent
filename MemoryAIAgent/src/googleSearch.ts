import axios from "axios";

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY!;
const GOOGLE_CX = process.env.GOOGLE_CX!;

export async function googleSearch(query: string): Promise<string> {
  try {
    const response = await axios.get("https://www.googleapis.com/customsearch/v1", {
      params: {
        key: GOOGLE_API_KEY,
        cx: GOOGLE_CX,
        q: query,
        num: 3
      }
    });

    const items = response.data.items || [];
    if (items.length === 0) return "No results found.";

    return items.map((item: any) => `${item.title}: ${item.snippet} (${item.link})`).join("\n");
  } catch (error: any) {
    console.error("Google Search Error: ", error.message);
    return "Error occurred during search.";
  }
}
