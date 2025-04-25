import fs from "fs";
import { sleep, setPathRestriction } from "./utils";
import Agent from "./agent";

const readline = require('node:readline').createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  
  process.on('SIGINT', () => {
    console.log('Exiting...');
    readline.close();
    process.exit(0);
  });
  
  async function mainLoop() {
    await sleep(1000);
    await readline.write("\nWelcome to the chat! Press Ctrl+C to exit\n\n");
    setPathRestriction();
    const systemPrompt = fs.readFileSync("./prompts/system/tool.md", "utf-8");
    const agent = new Agent(process.stdout, systemPrompt);
    while (true) {
      const prompt = await new Promise<string>(resolve => {
        readline.question('\n[You]: ', resolve);
      });
      readline.write(`[Agent]: `);
      await agent.sendMessage(prompt);
      readline.write(`\n`);
    }
  }
  
  mainLoop();