# 🧠 Memory AI Agent

**Memory AI Agent** is an interactive AI assistant built with **TypeScript**, **OpenAI API**, and **Google Search** integration.  
It features **long-term memory** to store important facts from past conversations and use them in future responses.

---

## ✨ Features
- **Natural Language Processing** using ChatGPT (OpenAI)
- **Google Search** integration for real-time, up-to-date information
- **Long-Term Memory** to remember important user information
- **Multi-Turn Conversation** support
- Interactive **CLI interface**
- **Modular architecture** for easy expansion

---

## ⚙️ Installation
```bash
# Clone the repository
git clone https://github.com/alisoltaniorg/Memory-AI-Agent.git
cd Memory-AI-Agent

# Install dependencies
npm install

```

## 🔑 Environment Variables
```ini
OPENROUTER_API_KEY=your_openai_api_key_here
GOOGLE_API_KEY=your_google_api_key_here
GOOGLE_CX=your_google_custom_search_engine_id
```
---
## 🚀 Usage
```bash
npm run start
```
You can now chat with the AI agent directly in your terminal.
The agent will:
 - **Answer** using OpenAI's ChatGPT
 - **Search** the web when needed
 - **Store** important context in Memory.json

## 🧠 Long-Term Memory
The agent automatically stores:
 - Key facts you provide
 - Previous conversation summaries
 - Useful search results

All memory is stored in src/Storage/memory.json.
You can edit or clear this file to reset the memory.
