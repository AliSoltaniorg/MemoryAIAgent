import fs from "fs";
import path from "path";

const memoryPath = path.join(__dirname, "../storage/memory.json");

export interface MemoryData {
  history: string[];
  facts: Record<string, string>;
}

export class MemoryManager {
  private memory: MemoryData;

  constructor() {
    this.memory = this.loadMemory();
  }

  private loadMemory(): MemoryData {
    if (fs.existsSync(memoryPath)) {
      const data = fs.readFileSync(memoryPath, "utf-8");
      return JSON.parse(data);
    } else {
      fs.writeFileSync(memoryPath, JSON.stringify({ history: [], facts: {} },null,2))
    }
    return { history: [], facts: {} };
  }

  public addHistory(message: string) {
    this.memory.history.push(message);
    this.saveMemory();
  }

  public addFact(key: string, value: string) {
    this.memory.facts[key] = value;
    this.saveMemory();
  }

  public getMemory(): MemoryData {
    return this.memory;
  }

  private saveMemory() {
    fs.writeFileSync(memoryPath, JSON.stringify(this.memory, null, 2), "utf-8");
  }
}
