export type GenerateTextInput = {
  prompt: string
}

export class AiService {
  async generateText(input: GenerateTextInput): Promise<string> {
    return `AI service is not configured yet. Prompt: ${input.prompt}`
  }
}
