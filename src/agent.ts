import { Anthropic } from "@anthropic-ai/sdk";
import tools from "./tools";
import { ContentBlockParam, MessageParam, ToolResultBlockParam, ToolUseBlock, ToolUseBlockParam } from "@anthropic-ai/sdk/resources";
import { sleep } from "./utils";

export class Agent {
    private anthropic: Anthropic;
    private conversation: Anthropic.Messages.MessageParam[] = [];
    private tools: Anthropic.Tool[] = Array.from(tools.values()).map(tool => tool.get());

    public constructor(private out: NodeJS.WriteStream, private readonly systemPrompt?: string) {
        this.anthropic = new Anthropic({
            apiKey: process.env.ANTHROPIC_API_KEY,
        });
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
            this.conversation.push({ role: "user", content: prompt });
        }
        return new Promise<void>((resolve, reject) => {
            const toolResults: Promise<MessageParam>[] = [];
            const stream = this.anthropic.messages.stream({
                system: this.systemPrompt,
                messages: this.conversation,
                model: "claude-3-7-sonnet-20250219",
                max_tokens: 4096,
                tools: this.tools,
            });
            stream.on('contentBlock', (block: ContentBlockParam) => {
                if (block.type === 'tool_use') {
                    this.conversation.push({ role: "assistant", content: [block] as ContentBlockParam[] });
                    this.out.write(`Calling ${block.name} with ${JSON.stringify(block.input)}\n`);
                    toolResults.push(this.callTool(block as ToolUseBlockParam));
                } else if (block.type === 'text') {
                    this.out.write('\n');
                }
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
}
export default Agent;