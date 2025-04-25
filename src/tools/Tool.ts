import Anthropic from "@anthropic-ai/sdk";

export abstract class Tool implements Anthropic.Tool {
    public abstract readonly input_schema: Anthropic.Messages.Tool.InputSchema;
    public abstract readonly cache_control?: Anthropic.Messages.CacheControlEphemeral | null | undefined;
    public abstract readonly name: string;
    public abstract readonly description: string;
    public abstract call(input: any): Promise<string>;

    public get(): Anthropic.Tool {
        return {
            input_schema: this.input_schema,
            cache_control: this.cache_control,
            name: this.name,
            description: this.description,
        };
    }

}
