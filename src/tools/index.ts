import { Tool } from "./Tool";
import { WriteFileTool } from "./WriteFile"; 
import { ReadFileTool } from "./ReadFile";
import { FileExistsTool } from "./FileExists";
import { CreateFolderTool } from "./CreateFolder";
import { ListFilesTool } from "./ListFiles";
import { NpmTool } from "./Npm";

const tools: Map<string, Tool> = new Map();

const writeFile = new WriteFileTool();
tools.set(writeFile.name, writeFile);
const readFile = new ReadFileTool(); 
tools.set(readFile.name, readFile);
const fileExists = new FileExistsTool();
tools.set(fileExists.name, fileExists);
const createFolder = new CreateFolderTool();
tools.set(createFolder.name, createFolder);
const listFiles = new ListFilesTool();
tools.set(listFiles.name, listFiles);
const npm = new NpmTool();
tools.set(npm.name, npm);

export default tools;
export { Tool };