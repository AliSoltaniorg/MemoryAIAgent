import axios from "axios";

const BING_ENDPOINT = process.env.BING_ENDPOINT!;
const BING_API_KEY = process.env.BING_API_KEY!;

async function bingSearch(query: string): Promise<string> {
  try {
    const response = await axios.get(BING_ENDPOINT, {
      headers: { "Ocp-Apim-Subscription-Key": BING_API_KEY },
      params: { q: query, count: 3 }
    });

    const items = response.data.items || [];
    if (items.length === 0) return "No results found.";

    return items.map((item: any) => `${item.title}: ${item.snippet} (${item.link})`).join("\n");
  } catch (error: any) {
    console.error("Google Search Error: ", error.message);
    return "Error occurred during search.";
  }
}