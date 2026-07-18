export class ModelRouter {
    static listModels(): string[] {
        return [
            'anthropic.claude-4-sonnet',
            'openai.gpt-5.5',
            'google.gemini-3.1',
            'deepseek.deepseek-v4',
            'alibaba.qwen3-max',
            'meta.llama-4-maverick',
            'stepfun.step-3.5-flash',
            'local.ollama',
        ];
    }

    static setActiveModel(model: string) {
        // TODO: Call SOV3 bridge to switch model
        console.log('Active model:', model);
    }
}
