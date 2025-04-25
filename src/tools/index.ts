import { Tool } from "./Tool";
import { WriteFileTool } from "./WriteFile"; 
import { ReadFileTool } from "./ReadFile";

const tools: Map<string, Tool> = new Map();

const writeFile = new WriteFileTool();
tools.set(writeFile.name, writeFile);
const readFile = new ReadFileTool(); 
tools.set(readFile.name, readFile);

export default tools;
export { Tool };