
import { Anthropic } from "@anthropic-ai/sdk";
import { Tool } from "./Tool";

export class ReadFileTool extends Tool {
    public readonly input_schema: Anthropic.Messages.Tool.InputSchema = {
        type: "object",
        properties: {
            filename: {
                type: "string",
                description: "The relative or absolute path of the file to read",
            },
        },
    };
    public readonly name = "read_file";
    public readonly description = "Reads the contents of a file.";

    public call(input: any): Promise<string> {
        return new Promise((resolve, reject) => {
            const fs = require('fs');
            fs.readFile(input.filename, 'utf8', (err: any, data: any) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(data);
                }
            });
        });
    }
}