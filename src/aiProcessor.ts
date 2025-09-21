class AIProcessor {
    private static readonly MODEL = "gemma3:4b";
    private static readonly API_URL = "http://localhost:11434/api/generate";

    static async processPrompt(prompt: string): Promise<string> {
        const response = await this.sendRequest(prompt);
        return await this.processStream(response);
    }

    private static async sendRequest(prompt: string): Promise<Response> {
        const data = {
            "prompt": `Respond to this user message. Be helpful, short, and direct.

${prompt}`,
            "model": this.MODEL,
            "stream": true
        };

        return await fetch(this.API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
    }

    private static async processStream(response: Response): Promise<string> {
        const reader = response.body?.getReader();
        if (!reader) {
            throw new Error('Failed to get response reader');
        }

        const decoder = new TextDecoder();
        let result = "";

        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                
                const chunk = JSON.parse(decoder.decode(value)).response;
                result += chunk;
            }
        } finally {
            reader.releaseLock();
        }

        return result.trim();
    }
}

export default AIProcessor;
