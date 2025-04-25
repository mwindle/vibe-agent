import { Anthropic } from "@anthropic-ai/sdk";
import { ContentBlockParam, MessageParam, TextBlockParam, ToolResultBlockParam, ToolUseBlock, ToolUseBlockParam } from "@anthropic-ai/sdk/resources";
import tools from "./tools";
import path from "path";
import * as fs from 'fs';
import crypto from 'node:crypto';
import { sleep } from "./utils";

export class Agent {
    private readonly anthropic: Anthropic;
    private readonly conversationId: string;
    private readonly conversation: Anthropic.Messages.MessageParam[] = [];
    private readonly tools: Anthropic.Tool[] = Array.from(tools.values()).map(tool => tool.get());

    public constructor(private out: NodeJS.WriteStream, private readonly systemPrompt?: string) {
        this.anthropic = new Anthropic({
            apiKey: process.env.ANTHROPIC_API_KEY,
        });
        this.conversationId = crypto.randomUUID();
        this.out.write(`Starting conversation ${this.conversationId}\n`);
    }

    public async sendMessage(message: string): Promise<void> {
        if (!message || message.trim() === "") {
            return;
        }
        return this.callModel(message);
    }

    private async callModel(prompt: string | MessageParam[] | undefined, retryAfter: number = 1000): Promise<void> {
        if (Array.isArray(prompt)) {
            this.conversation.push(...prompt);
        } else if (prompt !== undefined && prompt.trim() !== "") {
            this.conversation.push({
                role: "user",
                content: [{
                    type: "text",
                    text: prompt,
                }]
            });
        }
        await this.saveConversation();
        this.setConversationCaching();

        return new Promise<void>((resolve, reject) => {
            const toolResults: Promise<MessageParam>[] = [];
            const stream = this.anthropic.messages.stream({
                tools: this.tools,
                system: [
                    {
                        type: "text",
                        text: this.systemPrompt || "",
                        cache_control: { type: "ephemeral" }
                    },
                ],
                messages: this.conversation,
                model: "claude-3-7-sonnet-20250219",
                max_tokens: 4096,
            });
            stream.on('contentBlock', async (block: ContentBlockParam) => {
                if (block.type === 'tool_use') {
                    this.out.write(`Calling ${block.name} with ${JSON.stringify(block.input)}\n`);
                    toolResults.push(this.callTool(block as ToolUseBlockParam));
                } else if (block.type === 'text') {
                    this.out.write('\n');
                }
                this.conversation.push({ role: "assistant", content: [block] });
                await this.saveConversation();
            });
            stream.on('text', (text: string) => {
                this.out.write(text);
            });
            stream.on('error', async (error: any) => {
                if (error.status === 429) {
                    retryAfter = Number(error.headers["retry-after"]) * 1000 || retryAfter;
                    this.out.write(`Error: Rate limit exceeded. Retrying in ${retryAfter / 1000} seconds...`);
                    await sleep(retryAfter);
                    try {
                        await this.callModel(undefined);
                    } catch (error) {
                        reject(error);
                    }
                } else if (error.status === 529) {
                    this.out.write(`Error: System overloaded. Retrying in ${retryAfter / 1000} seconds...`);
                    await sleep(retryAfter);
                    try {
                        await this.callModel(undefined, retryAfter * 2);
                    } catch (error) {
                        reject(error);
                    }
                } else {
                    this.out.write(`Error: ${error}`);
                    reject(error);
                }
            });
            stream.on('end', async () => {
                if (toolResults.length > 0) {
                    await this.callModel(await Promise.all(toolResults));
                }
                resolve();
            });
        });
    }

    private async callTool(toolBlock: ToolUseBlock): Promise<MessageParam> {
        const result = {
            type: 'tool_result',
            tool_use_id: toolBlock.id,
        } as ToolResultBlockParam;

        try {
            if (!tools.has(toolBlock.name)) {
                throw new Error(`Tool ${toolBlock.name} not found`);
            }
            const tool = tools.get(toolBlock.name)!;
            result.content = await tool.call(toolBlock.input);
        } catch (error) {
            result.content = `${error}`;
            result.is_error = true;
        }
        return {
            role: 'user',
            content: [result]
        };
    }

    private async saveConversation(): Promise<void> {
        // Save conversation to a file named `./.conversations/${this.conversationId}.json`
        try {
            const dir = path.resolve('./conversations');
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir);
            }
            const file = path.join(dir, `${this.conversationId}.json`);
            const options = { flag: 'w' };
            fs.writeFileSync(file, JSON.stringify(this.conversation, null, 2), options);
        } catch (error) {
            console.log(`Error saving conversation: ${error}`);
        }
    }

    private setConversationCaching(): void {
        let last: TextBlockParam | ToolResultBlockParam | undefined;
        for (const message of this.conversation) {
            if (!Array.isArray(message.content)) {
                continue;
            }
            for (const content of message.content) {
                if (content.type === "text" || content.type === "tool_result") {
                    content.cache_control = undefined;
                    last = content;
                }
            }
        }
        if (last) {
            last.cache_control = { type: "ephemeral" };
        }
    }

}
export default Agent;