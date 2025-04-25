
import * as fs from 'fs';
import { Anthropic } from "@anthropic-ai/sdk";
import { Tool } from "./Tool";
import { checkPath, getPathRestriction } from '../utils';

export class WriteFileTool extends Tool {    
    public readonly input_schema: Anthropic.Messages.Tool.InputSchema = {
        type: "object",
        properties: {
            filename: {
                type: "string",
                description: "The relative or absolute path of the file to write",
            },
            content: {
                type: "string",
                description: "The content to write to the file",
            },
            overwrite: {
                type: "boolean",
                description: "Whether to overwrite the file if it already exists",
            }
        },
    };
    public readonly cache_control: Anthropic.Messages.CacheControlEphemeral | null = null;
    public readonly name = "write_file";
    public readonly description = "Writes a new file. Can optionally overwrite an existing file, but you should confirm with the user before doing that";
    public async call(input: any): Promise<string> {
        return new Promise((resolve, reject) => {
            if (!checkPath(input.filename)) {
                reject(`Error: The provided filename is not within the restricted path ${getPathRestriction()}.`);
                return;
            }
            const options = { flag: 'wx' };
            if (input.overwrite) {
                options.flag = 'w';
            }
            fs.writeFile(input.filename, input.content, options, (err: any) => {
                if (err) {
                    reject(err);
                } else {
                    resolve("File written successfully");
                }
            });
        });
    }
}